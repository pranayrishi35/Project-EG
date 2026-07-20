import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

/**
 * Per-user sliding-window limiter for the AI endpoints (chat + coach).
 *
 * This is a second line of defense on top of the credit meter: it caps burst
 * abuse (e.g. scripted request floods) before any Gemini call is made, and it
 * is keyed per authenticated user rather than per IP.
 *
 * Fails OPEN only when Vercel KV is not configured (local dev), so the app is
 * still usable without KV. In production KV is present and the limit applies.
 */
const limiter =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "airl",
      })
    : null;

export interface AiRateLimitResult {
  success: boolean;
  /** Unix epoch ms at which the window resets (used for Retry-After). */
  reset: number;
}

/**
 * Enforces the per-user AI rate limit.
 * When KV is not configured (local dev), always allows the request.
 */
export async function checkAiRateLimit(userId: string): Promise<AiRateLimitResult> {
  if (!limiter) return { success: true, reset: 0 };
  const { success, reset } = await limiter.limit(`ai_${userId}`);
  return { success, reset };
}
