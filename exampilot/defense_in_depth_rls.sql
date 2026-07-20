-- ==============================================================================
-- PROJECT EXAMPILOT: ROW LEVEL SECURITY (RLS) POLICIES - DEFENSE IN DEPTH
-- ==============================================================================

-- Enable RLS on all core tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. user_profiles (STRICT MATHEMATICAL ISOLATION)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 2. mock_attempts (STRICT MATHEMATICAL ISOLATION)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own mock attempts" ON mock_attempts;
DROP POLICY IF EXISTS "Users can insert own mock attempts" ON mock_attempts;
DROP POLICY IF EXISTS "Users can update own mock attempts" ON mock_attempts;
DROP POLICY IF EXISTS "Users can delete own mock attempts" ON mock_attempts;

CREATE POLICY "Users can view own mock attempts" 
ON mock_attempts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock attempts" 
ON mock_attempts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock attempts" 
ON mock_attempts FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mock attempts" 
ON mock_attempts FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. study_plans (STRICT MATHEMATICAL ISOLATION)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can insert own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can update own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can delete own study plans" ON study_plans;

CREATE POLICY "Users can view own study plans" 
ON study_plans FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans" 
ON study_plans FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans" 
ON study_plans FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans" 
ON study_plans FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
