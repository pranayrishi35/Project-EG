-- ==============================================================================
-- PROJECT EXAMPILOT: CREDIT & PRIVILEGE COLUMN LOCKDOWN (Council finding #1)
-- ==============================================================================
-- Run this in the Supabase SQL Editor AFTER rls_policies.sql / defense_in_depth_rls.sql.
--
-- ROOT PROBLEM
-- ------------
-- The user_profiles UPDATE policy is row-scoped (auth.uid() = user_id) but has
-- NO column-level restriction. The browser talks to Supabase with the anon key
-- under the `authenticated` role, so any signed-in user could run:
--
--     supabase.from('user_profiles')
--             .update({ credits: 999999, tier: 'admin' })
--             .eq('user_id', myId)
--
-- ...on their OWN row and it passed RLS. Because creditManager treats
-- tier === 'admin' as a hard bypass, self-promotion granted unlimited AI spend,
-- and the atomic deduct_credits RPC guarded a balance the user could rewrite.
--
-- FIX
-- ---
-- Revoke UPDATE on the monetized / privilege / lifecycle columns from the
-- client-facing roles. Row ownership is unchanged; users can still edit benign
-- profile fields (e.g. full_name, avatar_url). All writes to the locked columns
-- now MUST go through the service role:
--   * credits / tier ....... creditManager.ts + deduct_credits() RPC
--   * is_deleted / deadline  deleteAccount.ts / recoverAccount.ts (admin client)
-- ------------------------------------------------------------------------------

REVOKE UPDATE (credits, tier, is_deleted, deletion_deadline)
  ON user_profiles FROM authenticated;
REVOKE UPDATE (credits, tier, is_deleted, deletion_deadline)
  ON user_profiles FROM anon;

-- Also block INSERT of these columns from the client: a fresh row must never be
-- self-seeded with an elevated tier or an arbitrary balance.
REVOKE INSERT (credits, tier, is_deleted, deletion_deadline)
  ON user_profiles FROM authenticated;
REVOKE INSERT (credits, tier, is_deleted, deletion_deadline)
  ON user_profiles FROM anon;

-- ------------------------------------------------------------------------------
-- Drop the redundant, incoherent id-keyed UPDATE policy.
-- account_deletion_migration.sql added a SECOND permissive UPDATE policy keyed on
-- auth.uid() = id, while every authoritative path keys on user_id. Two UPDATE
-- policies on one table keyed on different columns is a latent bug (and the
-- consent action even documents working around its failure). Deletion flags are
-- now written via the service role, so this policy is no longer needed.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own deletion flags" ON user_profiles;

-- ------------------------------------------------------------------------------
-- Verification (optional): after running, this should show NO update grant on
-- the locked columns for `authenticated` / `anon`.
--   SELECT grantee, column_name, privilege_type
--   FROM information_schema.column_privileges
--   WHERE table_name = 'user_profiles'
--     AND column_name IN ('credits','tier','is_deleted','deletion_deadline')
--     AND grantee IN ('authenticated','anon');
-- ==============================================================================
