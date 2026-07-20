-- ==============================================================================
-- PROJECT EXAMPILOT: SERVER-AUTHORITATIVE MOCK ATTEMPTS (Council finding #6)
-- ==============================================================================
-- Run in the Supabase SQL editor AFTER the phase8 / rls migrations.
--
-- ROOT PROBLEM
-- ------------
-- The attempt id and the question set were both minted on the client:
--   * PlanViewer called crypto.randomUUID() to create the attempt id.
--   * saveMockProgress graded against answers_state.questions — a client-supplied
--     array. The client therefore chose WHICH question ids were graded, so it
--     could drop hard questions, replay a favourable set, or submit ids that were
--     never served. Correct answers are stripped from the wire, but the *set*
--     being graded was still attacker-controlled.
--
-- FIX
-- ---
-- getMockTest / getMiniTest / getCurrentAffairsTest now INSERT a server-owned row
-- (server-generated id, started_at, and the exact served_question_ids) before the
-- client ever sees the questions. On submit the server grades ONLY the ids it
-- recorded here — the client-supplied question array is used for display only.
-- ------------------------------------------------------------------------------

ALTER TABLE mock_attempts
  ADD COLUMN IF NOT EXISTS served_question_ids TEXT[],
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();

-- Backfill started_at for legacy rows so ordering/analytics stay coherent.
UPDATE mock_attempts
  SET started_at = COALESCE(started_at, created_at)
  WHERE started_at IS NULL;
