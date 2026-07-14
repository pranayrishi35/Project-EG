-- ==============================================================================
-- PHASE 6: DATABASE INTEGRITY
-- ==============================================================================
-- Adds a composite unique constraint to enforce exactly one test_number per exam per user.
ALTER TABLE mock_attempts
ADD CONSTRAINT unique_user_exam_test_number UNIQUE (user_id, exam_target, test_number);

-- ==============================================================================
-- PHASE 6: ASSET CDN EDGE CACHING
-- ==============================================================================
-- Forces Vercel Edge network to perfectly cache the Next.js image pipelines
UPDATE storage.objects
SET metadata = jsonb_set(
  metadata,
  '{cacheControl}',
  '"public, max-age=31536000, immutable"',
  true
)
WHERE bucket_id = 'question_bank';

-- ==============================================================================
-- PHASE 6: ALL-INDIA RANKING LEADERBOARDS
-- ==============================================================================

-- 1. Create the Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mock_leaderboards AS
SELECT 
    user_id,
    exam_target,
    test_number,
    score,
    RANK() OVER (PARTITION BY exam_target, test_number ORDER BY score DESC) as rank_position
FROM mock_attempts
WHERE status = 'completed';

-- 2. Create Unique & Search Indexes for CONCURRENT refreshes and blazing fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mock_leaderboards_unique 
ON mock_leaderboards(user_id, exam_target, test_number);

CREATE INDEX IF NOT EXISTS idx_mock_leaderboards_lookup 
ON mock_leaderboards(exam_target, test_number, score);

-- 3. Create the RPC function for Instant Rank
CREATE OR REPLACE FUNCTION get_instant_rank(
    p_exam_target TEXT, 
    p_test_number INT, 
    p_score INT
) 
RETURNS TABLE (
    calculated_rank INT,
    percentile FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    total_participants INT;
    higher_scores INT;
BEGIN
    SELECT COUNT(*) 
    INTO total_participants 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number;
      
    SELECT COUNT(*) 
    INTO higher_scores 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number 
      AND score > p_score;
      
    calculated_rank := higher_scores + 1;
    
    IF total_participants = 0 THEN
        percentile := 100.0;
    ELSE
        percentile := ROUND(((total_participants - higher_scores)::NUMERIC / total_participants::NUMERIC) * 100.0, 2);
    END IF;
    
    RETURN QUERY SELECT calculated_rank, percentile;
END;
$$;

-- 4. Create the Refresh Function
CREATE OR REPLACE FUNCTION refresh_mock_leaderboards()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mock_leaderboards;
END;
$$;

-- ==============================================================================
-- PHASE 7: B-TREE COMPOSITE INDEXES (TARGETED FOR ORDERING & FILTERING)
-- ==============================================================================

-- Accelerates fetching a user's mock history ordered by date
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_created 
ON mock_attempts (user_id, created_at DESC);

-- Accelerates checking a user's attempt count for a specific exam
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_exam 
ON mock_attempts (user_id, exam_target);

-- Accelerates fetching a user's study plans ordered by date (Dashboard)
CREATE INDEX IF NOT EXISTS idx_study_plans_user_created 
ON study_plans (user_id, created_at DESC);

-- Accelerates the complex CBT Engine query
-- NOTE: Because 'exam_target' is first, this also automatically accelerates queries filtering ONLY by exam_target.
CREATE INDEX IF NOT EXISTS idx_question_bank_generation 
ON question_bank (exam_target, source_pool, is_pyq, subject);
