-- ==============================================================================
-- FIX: Column-Level Security on question_bank.correct_index (P0 answer-leak gap)
-- ==============================================================================
-- WHY THIS EXISTS
--   rls_policies.sql:138-139 already REVOKEs SELECT on the `correct_index`
--   column from anon/authenticated. But in PostgreSQL a *table-level* GRANT
--   SELECT overrides a *column-level* REVOKE — and Supabase grants anon and
--   authenticated table-level SELECT on public tables by default. So the
--   column REVOKE alone is a no-op: the anon key can still read correct_index
--   and extract every answer. (This is exactly what the audit observed.)
--
-- WHAT THIS DOES
--   1. Strips the table-level SELECT grant from anon + authenticated.
--   2. Re-grants SELECT on EVERY column EXCEPT correct_index, read live from
--      the catalog so it can never drift out of sync with the real schema.
--   service_role is intentionally untouched — the server-side grader
--   (getAdminClient) must keep reading correct_index.
--
-- SAFETY
--   * Reads column NAMES from information_schema (metadata only — never row data).
--   * Idempotent: re-running produces the same grant state.
--   * Does NOT touch RLS row policies; column privileges layer on top of them.
--
-- RUN THIS in the Supabase SQL editor of the CONFIRMED-PRODUCTION project only,
-- after verifying the project ref via the dashboard. Then run the verification
-- block at the bottom and confirm BOTH columns come back FALSE.
-- ==============================================================================

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'question_bank'
     AND column_name <> 'correct_index';

  IF cols IS NULL THEN
    RAISE EXCEPTION 'question_bank not found in public schema — aborting so no grants change.';
  END IF;

  -- 1. Remove the table-level SELECT that silently overrides the column REVOKE.
  EXECUTE 'REVOKE SELECT ON public.question_bank FROM anon, authenticated';

  -- 2. Restore read access to everything except the answer key.
  EXECUTE format(
    'GRANT SELECT (%s) ON public.question_bank TO anon, authenticated',
    cols
  );
END $$;

-- ==============================================================================
-- VERIFICATION — run separately; BOTH results MUST be false.
-- ==============================================================================
-- SELECT
--   has_column_privilege('anon',          'public.question_bank', 'correct_index', 'SELECT') AS anon_can_read_answer,
--   has_column_privilege('authenticated', 'public.question_bank', 'correct_index', 'SELECT') AS auth_can_read_answer;
--
-- Sanity check that normal reads still work (should be true):
-- SELECT
--   has_column_privilege('authenticated', 'public.question_bank', 'question', 'SELECT') AS auth_can_read_question;
