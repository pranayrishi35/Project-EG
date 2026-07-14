-- ==============================================================================
-- PROJECT EXAMPILOT: ROW LEVEL SECURITY (RLS) POLICIES
-- This file version-controls the critical security policies governing the database.
-- Run this in the Supabase SQL Editor to enforce strict RBAC and data isolation.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_flashcards ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. admin_whitelist
-- ------------------------------------------------------------------------------
-- Admins can only SELECT their own email to verify their status. 
-- NO client can insert, update, or delete. Modifications require Service Role key or Dashboard.
CREATE POLICY "Admins can view their own whitelist entry" 
ON admin_whitelist FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' = email);

-- ------------------------------------------------------------------------------
-- 2. user_profiles
-- ------------------------------------------------------------------------------
-- Users can only read and update their own profile.
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. mock_attempts
-- ------------------------------------------------------------------------------
-- Users can only read, insert, update, and delete their own mock attempts.
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
-- 4. study_plans
-- ------------------------------------------------------------------------------
-- Users can only read, insert, update, and delete their own study plans.
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

-- ------------------------------------------------------------------------------
-- 5. cheat_sheets & daily_flashcards
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own cheat sheets" 
ON cheat_sheets FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM study_plans WHERE id = plan_id AND user_id = auth.uid()));

CREATE POLICY "Users can view own daily flashcards" 
ON daily_flashcards FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. PUBLIC READ-ONLY TABLES (question_bank, news_cache, app_config)
-- ------------------------------------------------------------------------------
-- Any authenticated user can read questions, news, and config to use the app.
-- NO client can insert, update, or delete. Server-Side cron/admin scripts bypass RLS to write.
CREATE POLICY "Authenticated users can read question bank" 
ON question_bank FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can read news cache" 
ON news_cache FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can read app config" 
ON app_config FOR SELECT 
TO authenticated 
USING (true);

-- ==============================================================================
-- NOTE ON MATERIALIZED VIEWS:
-- Materialized views (e.g., mock_leaderboards) DO NOT inherit RLS policies.
-- Access to `mock_leaderboards` is secured implicitly because the frontend only accesses 
-- it via the `get_instant_rank` RPC function, which has been audited. Do not expose 
-- the materialized view directly via PostgREST.
-- ==============================================================================
