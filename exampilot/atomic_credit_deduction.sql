-- ------------------------------------------------------------------------------
-- Atomic credit deduction
-- ------------------------------------------------------------------------------
-- Deducts `p_cost` credits from a user's profile in a single atomic statement,
-- eliminating the read-check-write (TOCTOU) race where N concurrent requests
-- could each pass the same 1-credit balance and all succeed (double-spend).
--
-- The guard `credits >= p_cost` lives inside the UPDATE's WHERE clause, so the
-- row is locked and checked-and-decremented atomically. If the balance is
-- insufficient (or the row does not exist) zero rows update and the function
-- returns NULL — the caller treats NULL as "insufficient credits".
--
-- SECURITY DEFINER so it can run under RLS while callers use the service role;
-- keeps the write path centralized in one auditable statement.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_cost integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_cost < 0 THEN
    RAISE EXCEPTION 'cost must be non-negative';
  END IF;

  UPDATE user_profiles
  SET credits = credits - p_cost
  WHERE user_id = p_user_id
    AND credits >= p_cost
  RETURNING credits INTO v_remaining;

  -- NULL when the row was missing or the balance was insufficient.
  RETURN v_remaining;
END;
$$;

REVOKE ALL ON FUNCTION deduct_credits(uuid, integer) FROM public, anon, authenticated;

-- ------------------------------------------------------------------------------
-- Credit refund
-- ------------------------------------------------------------------------------
-- Adds `p_amount` credits back to a user's balance atomically. Used to reverse a
-- deduction when the paid operation (e.g. a Gemini call) fails AFTER the credit
-- was taken, so a user is never charged for a request that returned an error.
--
-- Kept as a separate, minimal statement (rather than a signed deduct) so the
-- refund path is auditable and cannot itself push a balance negative. Callable
-- only via the service role, same as deduct_credits.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refund_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'refund amount must be non-negative';
  END IF;

  UPDATE user_profiles
  SET credits = credits + p_amount
  WHERE user_id = p_user_id
  RETURNING credits INTO v_remaining;

  RETURN v_remaining;
END;
$$;

REVOKE ALL ON FUNCTION refund_credits(uuid, integer) FROM public, anon, authenticated;
