import { kv } from '@vercel/kv';

export async function checkRateLimit(userId: string, action: string, limit: number, windowSeconds: number) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    // Fail open if KV isn't configured yet
    console.warn("Vercel KV is not configured. Skipping rate limit check.");
    return { success: true };
  }

  // Fixed window strategy
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:${action}:${userId}:${window}`;

  try {
    const current = await kv.incr(key);
    
    // Set expiration only on the first increment of this window
    if (current === 1) {
      await kv.expire(key, windowSeconds);
    }
    
    if (current > limit) {
      return { success: false, error: 'RATE_LIMIT_EXCEEDED' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Fail open to avoid blocking legitimate users if KV is temporarily down
    return { success: true };
  }
}
