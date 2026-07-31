-- ─────────────────────────────────────────────────────────────────────────────
-- Part 2 — Calendar sync (.ics feed, Option A)
--
-- Adds an unguessable per-user token used as the public path segment of the
-- user's personal calendar feed:  /api/calendar/<token>.ics
--
-- Design notes:
--   • gen_random_uuid() gives a 122-bit random value — not enumerable, so the
--     feed URL is a bearer credential (anyone with the link can subscribe, the
--     same trust model as Google/Apple "secret address" ICS feeds).
--   • DEFAULT means every NEW profile row gets a token automatically; the
--     backfill UPDATE covers every EXISTING user. No app code ever has to write
--     this column, so the feed keeps working without a write path.
--   • The column is READ by a service-role route handler (the calendar app that
--     fetches the feed is unauthenticated), and read by an authenticated server
--     action to show the user their own "Add to Calendar" link. It is never
--     written from the browser, so we REVOKE client writes to prevent a user
--     pinning a chosen (guessable) token or overwriting another concern.
--
-- Requires pgcrypto for gen_random_uuid() (enabled by default on Supabase).
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS calendar_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Backfill any pre-existing rows that somehow lack a token (the DEFAULT already
-- covers rows created after this migration; this is belt-and-suspenders for rows
-- inserted in a race before the default took effect).
UPDATE user_profiles
  SET calendar_token = gen_random_uuid()
  WHERE calendar_token IS NULL;

-- Fast lookup for the public feed route, which resolves a request by token.
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_calendar_token_idx
  ON user_profiles (calendar_token);

-- The token is set exclusively by the DB default / service role. Block the
-- browser (authenticated + anon) from writing it so a user can neither choose a
-- guessable value nor tamper with the column via the anon client.
REVOKE UPDATE (calendar_token) ON user_profiles FROM authenticated;
REVOKE UPDATE (calendar_token) ON user_profiles FROM anon;
REVOKE INSERT (calendar_token) ON user_profiles FROM authenticated;
REVOKE INSERT (calendar_token) ON user_profiles FROM anon;
