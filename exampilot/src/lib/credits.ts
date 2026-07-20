/**
 * Single source of truth for credit-system constants.
 *
 * Previously the beta starting grant was duplicated as three divergent
 * literals (500 in creditManager/Header, 50 in the credits action), which
 * meant a new user's balance depended on which code path seeded their row.
 * Everything now references BETA_STARTING_CREDITS so the grant is deterministic
 * and matches the `user_profiles.credits` column default (500).
 */
export const BETA_STARTING_CREDITS = 500;

/** Balance at or below which the UI surfaces a low-credit warning. */
export const LOW_CREDIT_THRESHOLD = 5;
