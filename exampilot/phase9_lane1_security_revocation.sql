-- ============================================================================
-- EXAMPILOT PHASE 9 — LANE 1 SECURITY REVOCATION & IMMUTABILITY MIGRATION
-- ============================================================================
-- Purpose: 
-- 1. Permanently extinguish public/authenticated REST read access to the 
--    mock_leaderboards materialized view (Fix #1 - Leaderboard Data Leak).
--    All frontend evaluations must traverse server-authoritative RPCs or Service Role actions.
-- 2. Prevent AI Prompt Injection attacks against server actions via direct PostgREST 
--    client-side modification of study_plans.exam_name (Fix #4). 
--    In PostgreSQL, table-level grants override column-level revocations; therefore,
--    general table-level UPDATE is revoked, and UPDATE is re-granted strictly 
--    on generated_plan (which powers toggleTopic and logMockTest functionality).
-- ============================================================================

-- [Fix #1] Terminate anonymous and general authenticated read access to leaderboard data
REVOKE SELECT ON mock_leaderboards FROM anon, authenticated, public;

-- [Fix #4] Enforce column-level immutability on study_plans (exam_name, user_id, exam_date)
REVOKE UPDATE ON study_plans FROM anon, authenticated, public;
GRANT UPDATE (generated_plan) ON study_plans TO authenticated;
