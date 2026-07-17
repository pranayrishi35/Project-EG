-- ==============================================================================
-- PHASE 8: COHORT LEADERBOARDS (OPTION 2: POINT-IN-TIME STAMPING)
-- ==============================================================================

-- 1. Add cohort_key to mock_attempts
ALTER TABLE mock_attempts
ADD COLUMN IF NOT EXISTS cohort_key VARCHAR(50) DEFAULT 'GLOBAL';

-- 2. Drop the existing materialized view and its dependent RPC
DROP FUNCTION IF EXISTS get_instant_rank(TEXT, INT, INT);
DROP MATERIALIZED VIEW IF EXISTS mock_leaderboards CASCADE;

-- 3. Create the LEAN Materialized View (Single Table Scan)
CREATE MATERIALIZED VIEW mock_leaderboards AS
SELECT 
    user_id,
    exam_target,
    test_number,
    score,
    cohort_key,
    -- Global Rank Position (across all time/dates for this exam_target and test_number)
    RANK() OVER (PARTITION BY exam_target, test_number ORDER BY score DESC) as global_rank,
    -- Cohort Rank Position (peer group only)
    RANK() OVER (PARTITION BY cohort_key, exam_target, test_number ORDER BY score DESC) as cohort_rank
FROM mock_attempts
WHERE status = 'completed' AND test_number > 0;

-- 4. Re-create Indexes for blazing fast lookups and concurrent refreshes
-- Note: We must include cohort_key in the unique index to allow CONCURRENT refreshes
CREATE UNIQUE INDEX idx_mock_leaderboards_unique 
ON mock_leaderboards(user_id, exam_target, test_number, cohort_key);

CREATE INDEX idx_mock_leaderboards_lookup 
ON mock_leaderboards(cohort_key, exam_target, test_number, score);

-- 5. Create the unified RPC function
-- This single function calculates both global and cohort rank and percentiles
CREATE OR REPLACE FUNCTION get_instant_rank(
    p_exam_target TEXT, 
    p_test_number INT, 
    p_score INT,
    p_cohort_key TEXT DEFAULT 'GLOBAL'
) 
RETURNS TABLE (
    global_rank INT,
    global_percentile FLOAT,
    cohort_rank INT,
    cohort_percentile FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    g_total_participants INT;
    g_higher_scores INT;
    c_total_participants INT;
    c_higher_scores INT;
BEGIN
    -- Global Stats
    SELECT COUNT(*) 
    INTO g_total_participants 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number;
      
    SELECT COUNT(*) 
    INTO g_higher_scores 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number 
      AND score > p_score;
      
    -- Cohort Stats
    SELECT COUNT(*) 
    INTO c_total_participants 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number
      AND cohort_key = p_cohort_key;
      
    SELECT COUNT(*) 
    INTO c_higher_scores 
    FROM mock_leaderboards 
    WHERE exam_target = p_exam_target 
      AND test_number = p_test_number 
      AND cohort_key = p_cohort_key
      AND score > p_score;
      
    global_rank := g_higher_scores + 1;
    cohort_rank := c_higher_scores + 1;
    
    -- Global Percentile
    IF g_total_participants = 0 THEN
        global_percentile := 100.0;
    ELSE
        global_percentile := ROUND(((g_total_participants - g_higher_scores)::NUMERIC / g_total_participants::NUMERIC) * 100.0, 2);
    END IF;

    -- Cohort Percentile
    IF c_total_participants = 0 THEN
        cohort_percentile := 100.0;
    ELSE
        cohort_percentile := ROUND(((c_total_participants - c_higher_scores)::NUMERIC / c_total_participants::NUMERIC) * 100.0, 2);
    END IF;
    
    RETURN QUERY SELECT global_rank, global_percentile, cohort_rank, cohort_percentile;
END;
$$;
