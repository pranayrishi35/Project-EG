-- Migration: Add Legal Consent Tracking to user_profiles

-- 1. Add the columns to track the version of the ToS accepted, and the exact timestamp.
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS legal_consent_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS legal_consent_timestamp TIMESTAMP WITH TIME ZONE;

-- Note: The auth.users trigger that creates user_profiles remains the same.
-- The new `/consent` interstitial route will UPDATE these columns after auth.
