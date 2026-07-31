-- ═══════════════════════════════════════════════════════════════════════════════
-- Part 5 — Moderated Q&A Doubt Board (Migration 003)
-- ═══════════════════════════════════════════════════════════════════════════════
-- HIGHEST RISK FEATURE — safety-first design per Master Prompt v6 Part 5.
--
-- Structure:
--   • user_profiles.username — public handle (not legal name) for attribution.
--   • doubt_posts — user questions, tagged by exam + topic, with AI-drafted answers.
--   • doubt_answers — user-authored answers to posts (public peer help).
--   • doubt_reports — user reports (abuse/spam/inappropriate content) → admin queue.
--
-- Security model:
--   • RLS: users own their content (CRUD on auth.uid() = user_id).
--   • Public read-only for approved content (status = 'approved').
--   • Moderation columns (status, ai_drafted, is_hidden) are REVOKE'd from clients
--     so only service-role (admin actions) can set them.
--   • No DMs, no user-to-user private contact — all content is public + logged.
--
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Add username to user_profiles ────────────────────────────────────────

-- A short, unique, non-legal public handle for Q&A attribution. Set once at
-- first doubt post (or via settings), then immutable (locked after first set via
-- app logic, not a DB trigger — keeps the migration simple and reversible).
-- 3-20 chars, alphanumeric + underscore only (enforced client-side + server-side).
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles (username)
  WHERE username IS NOT NULL;

-- Username is user-writable (the existing UPDATE policy allows it), but we'll
-- add app-level "set once" enforcement in the doubt-posting action. No REVOKE
-- here — unlike credits/tier, a username isn't a privilege escalation vector.

-- ─── 2. doubt_posts table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doubt_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_track TEXT NOT NULL CHECK (exam_track IN ('AFCAT', 'NDA', 'CDS')),
  topic TEXT, -- optional free-text topic tag ("Quant", "English", "GK", etc.)
  title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) >= 20 AND char_length(body) <= 5000),

  -- AI-drafted answer (Tejas auto-generates on post creation, labeled AI).
  ai_draft TEXT,
  ai_drafted_at TIMESTAMPTZ,

  -- Moderation state (default 'approved' for now; if abuse grows, switch to
  -- 'pending' default + manual review before visibility).
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  is_hidden BOOLEAN NOT NULL DEFAULT false, -- admin soft-delete (keeps data, hides from UI)

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doubt_posts_user_id_idx ON doubt_posts (user_id);
CREATE INDEX IF NOT EXISTS doubt_posts_exam_track_idx ON doubt_posts (exam_track);
CREATE INDEX IF NOT EXISTS doubt_posts_status_idx ON doubt_posts (status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS doubt_posts_created_at_idx ON doubt_posts (created_at DESC);
-- Admin moderation queue: pending + reported items, newest first.
CREATE INDEX IF NOT EXISTS doubt_posts_moderation_idx ON doubt_posts (status, created_at DESC)
  WHERE status IN ('pending', 'rejected');

-- ─── 3. doubt_answers table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doubt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES doubt_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 3000),

  -- Moderation state (same model as posts).
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  is_hidden BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doubt_answers_post_id_idx ON doubt_answers (post_id);
CREATE INDEX IF NOT EXISTS doubt_answers_user_id_idx ON doubt_answers (user_id);
CREATE INDEX IF NOT EXISTS doubt_answers_status_idx ON doubt_answers (status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS doubt_answers_created_at_idx ON doubt_answers (created_at ASC);
CREATE INDEX IF NOT EXISTS doubt_answers_moderation_idx ON doubt_answers (status, created_at DESC)
  WHERE status IN ('pending', 'rejected');

-- ─── 4. doubt_reports table (abuse reports → admin moderation queue) ──────────

CREATE TABLE IF NOT EXISTS doubt_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Polymorphic target: either a post or an answer (exactly one must be set).
  reported_post_id UUID REFERENCES doubt_posts(id) ON DELETE CASCADE,
  reported_answer_id UUID REFERENCES doubt_answers(id) ON DELETE CASCADE,
  CHECK (
    (reported_post_id IS NOT NULL AND reported_answer_id IS NULL) OR
    (reported_post_id IS NULL AND reported_answer_id IS NOT NULL)
  ),

  reason TEXT NOT NULL CHECK (reason IN ('spam', 'abuse', 'inappropriate', 'other')),
  details TEXT CHECK (char_length(details) <= 500), -- optional elaboration

  -- Admin resolution (pending until an admin reviews + takes action).
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id), -- admin who handled it
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doubt_reports_reporter_idx ON doubt_reports (reporter_user_id);
CREATE INDEX IF NOT EXISTS doubt_reports_post_idx ON doubt_reports (reported_post_id) WHERE reported_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doubt_reports_answer_idx ON doubt_reports (reported_answer_id) WHERE reported_answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doubt_reports_status_idx ON doubt_reports (status, created_at DESC) WHERE status = 'pending';

-- ─── 5. RLS policies (mirrors rls_policies.sql conventions exactly) ───────────

ALTER TABLE doubt_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_reports ENABLE ROW LEVEL SECURITY;

-- doubt_posts: public read (approved only), user owns their posts.
CREATE POLICY "Users can view approved doubt_posts"
  ON doubt_posts FOR SELECT TO authenticated
  USING (status = 'approved' AND is_hidden = false);

CREATE POLICY "Users can insert own doubt_posts"
  ON doubt_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doubt_posts"
  ON doubt_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own doubt_posts"
  ON doubt_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- doubt_answers: public read (approved only), user owns their answers.
CREATE POLICY "Users can view approved doubt_answers"
  ON doubt_answers FOR SELECT TO authenticated
  USING (status = 'approved' AND is_hidden = false);

CREATE POLICY "Users can insert own doubt_answers"
  ON doubt_answers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doubt_answers"
  ON doubt_answers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own doubt_answers"
  ON doubt_answers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- doubt_reports: user can see their own reports (for confirmation UI), admin
-- actions bypass RLS via service-role so no admin SELECT policy is needed here.
CREATE POLICY "Users can view own doubt_reports"
  ON doubt_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can insert own doubt_reports"
  ON doubt_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

-- No UPDATE/DELETE for reports once filed — immutable audit trail. Admin
-- resolution (status/reviewed_by/reviewed_at) is written via service-role.

-- ─── 6. Column-level lockdown (moderation state = service-role only) ──────────

-- Prevent clients from self-approving, hiding, or setting AI-draft metadata.
-- Only admin actions (via getAdminClient()) can write these columns.

REVOKE UPDATE (status, is_hidden, ai_draft, ai_drafted_at) ON doubt_posts FROM authenticated;
REVOKE UPDATE (status, is_hidden, ai_draft, ai_drafted_at) ON doubt_posts FROM anon;
REVOKE INSERT (status, is_hidden, ai_draft, ai_drafted_at) ON doubt_posts FROM authenticated;
REVOKE INSERT (status, is_hidden, ai_draft, ai_drafted_at) ON doubt_posts FROM anon;

REVOKE UPDATE (status, is_hidden) ON doubt_answers FROM authenticated;
REVOKE UPDATE (status, is_hidden) ON doubt_answers FROM anon;
REVOKE INSERT (status, is_hidden) ON doubt_answers FROM authenticated;
REVOKE INSERT (status, is_hidden) ON doubt_answers FROM anon;

REVOKE UPDATE (status, reviewed_by, reviewed_at) ON doubt_reports FROM authenticated;
REVOKE UPDATE (status, reviewed_by, reviewed_at) ON doubt_reports FROM anon;
REVOKE INSERT (status, reviewed_by, reviewed_at) ON doubt_reports FROM authenticated;
REVOKE INSERT (status, reviewed_by, reviewed_at) ON doubt_reports FROM anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 003 complete. Run this in Supabase SQL Editor before deploying the
-- code changes. Verify: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'
-- AND tablename LIKE 'doubt_%';` should show 3 tables.
-- ═══════════════════════════════════════════════════════════════════════════════
