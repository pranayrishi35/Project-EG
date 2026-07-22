-- Migration for account deletion lifecycle
-- Idempotent + re-run-safe: the columns and the legacy RLS policy already exist
-- in environments where the deletion feature shipped previously, so every
-- statement here must tolerate being run again against a live database.

-- 1. Lifecycle flags (no-op if already present).
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deletion_deadline TIMESTAMPTZ;

-- 2. Remove the legacy policy that let clients update their own deletion flags.
--    The lifecycle is now driven exclusively by the service role (see
--    deleteAccount.ts / recoverAccount.ts), so no client-facing UPDATE path
--    should remain. Dropping this is REQUIRED for the REVOKE below to actually
--    close the write surface — otherwise the policy keeps granting access.
DROP POLICY IF EXISTS "Users can update their own deletion flags" ON user_profiles;

-- 3. Defense in depth: ensure clients cannot tamper with these flags directly.
--    REVOKE is idempotent (revoking an already-absent grant is a no-op).
REVOKE UPDATE (is_deleted, deletion_deadline) ON user_profiles FROM authenticated;
REVOKE UPDATE (is_deleted, deletion_deadline) ON user_profiles FROM anon;
