-- Migration for account deletion lifecycle
ALTER TABLE user_profiles
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deletion_deadline TIMESTAMPTZ;

-- Allow users to update their own deletion flags
CREATE POLICY "Users can update their own deletion flags"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
