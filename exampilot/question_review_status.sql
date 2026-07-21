-- ==============================================================================
-- PROJECT EXAMPILOT: QUESTION REVIEW GATE
-- ==============================================================================
-- Run in the Supabase SQL editor.
--
-- PURPOSE
-- -------
-- Introduces a moderation gate on question_bank so AI-generated questions
-- (from the admin "Seed"/"Full Mock" buttons and the auto-generation cron) are
-- NOT served to students until a human approves them. This is the safety valve
-- for automated generation: bad AI output can never reach a live test.
--
-- MODEL
-- -----
--   review_status = 'approved' -> eligible to be served in live mocks/tests
--   review_status = 'pending'  -> visible only in the admin review queue
--   review_status = 'rejected' -> hidden everywhere except an admin audit view
--
-- Existing rows are backfilled to 'approved' so nothing that already works
-- breaks. New AI inserts set 'pending' explicitly in application code.
-- ------------------------------------------------------------------------------

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved';

-- Backfill: everything that predates the gate is trusted/approved.
UPDATE question_bank
  SET review_status = 'approved'
  WHERE review_status IS NULL;

-- Constrain to the known set of states.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_review_status_chk'
  ) THEN
    ALTER TABLE question_bank
      ADD CONSTRAINT question_bank_review_status_chk
      CHECK (review_status IN ('approved', 'pending', 'rejected'));
  END IF;
END $$;

-- Partial index: the live-test serving path always filters review_status='approved',
-- so this keeps that hot query fast as the pending/rejected backlog grows.
CREATE INDEX IF NOT EXISTS idx_question_bank_serve
  ON question_bank (exam_target, source_pool, is_pyq)
  WHERE review_status = 'approved';

-- Index for the admin review queue (pending first, newest first).
CREATE INDEX IF NOT EXISTS idx_question_bank_review
  ON question_bank (review_status, created_at DESC);
