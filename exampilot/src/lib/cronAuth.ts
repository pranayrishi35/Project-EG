import { timingSafeEqual } from "crypto";

/**
 * Authorizes a cron/admin-triggered request.
 *
 * Fails CLOSED: if CRON_SECRET is not configured on the server, no request is
 * ever authorized. The secret is only accepted via the `Authorization: Bearer`
 * header — never via a query string — so it cannot leak through logs, browser
 * history, or the Referer header. Comparison is constant-time.
 */
export function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const expected = `Bearer ${cronSecret}`;

  // Constant-time compare; bail early only on length mismatch (which timingSafeEqual requires).
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
