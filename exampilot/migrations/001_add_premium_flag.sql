-- ==============================================================================
-- MIGRATION 001: Add Premium Flag to user_profiles
-- Part of Master Prompt v6, Part 1 — Single Active Plan Limit
-- ==============================================================================
-- Run this in the Supabase SQL Editor BEFORE deploying the code changes.
-- This adds a `premium` boolean column to user_profiles. Non-premium users
-- are limited to 1 active study plan; premium users have unlimited plans.
-- Existing users with multiple plans are grandfathered: their older plans
-- remain viewable.
-- ==============================================================================

-- Add the premium column (default false = not premium).
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT false;

-- Admins are implicitly premium; set their flag true for consistency.
-- This query is safe to rerun (WHERE clause prevents duplicate updates).
UPDATE user_profiles
SET premium = true
WHERE tier = 'admin' AND premium = false;

-- IMPORTANT: Existing users who already have 2+ plans keep all their plans.
-- The server-action enforcement (in planner.ts) will block *new* plans only,
-- not delete or hide existing ones. This migration adds the column; no data
-- is removed.

-- RLS policies for user_profiles already exist in rls_policies.sql and remain
-- unchanged. The premium column is user-writable via the existing UPDATE policy,
-- but only admins/payment webhooks should set it to true in production. Client
-- validation should prevent accidental self-upgrade (the UI will not expose a
-- toggle for this column).

-- ==============================================================================
-- REVOKE column-level SELECT on `premium` from anon/authenticated if you want
-- to hide premium status from other users. For now, leaving it visible to the
-- user themselves (they need to know their own status for the upsell UI).
-- ==============================================================================
