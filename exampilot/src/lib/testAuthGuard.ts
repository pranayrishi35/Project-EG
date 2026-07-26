/**
 * CATEGORICAL SECURITY GUARD FOR TEST AUTHENTICATION BYPASSES
 * 
 * Guarantees that automated testing bypasses (ALLOW_MOCK_AUTH) can ONLY execute
 * during development or CI test environments. Under NO CIRCUMSTANCES will this
 * return true if NODE_ENV === 'production', even if ALLOW_MOCK_AUTH='true' is
 * accidentally misconfigured or leaked into production deploy variables.
 */
export function isMockAuthAllowed(): boolean {
  return (
    process.env.ALLOW_MOCK_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
