import { redis } from '@/lib/redis'

// ─── Fixed-window rate limiter (Upstash Redis) ────────────────────────────────
// Uses a single counter key per bucket. First request sets the TTL; subsequent
// requests increment. No extra dependency beyond the existing @upstash/redis.

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const bucketKey = `rl:${key}`
  const current = await redis.incr(bucketKey)
  if (current === 1) {
    await redis.expire(bucketKey, windowSeconds)
  }
  return {
    ok: current <= limit,
    remaining: Math.max(0, limit - current),
    retryAfterSeconds: current > limit ? windowSeconds : 0,
  }
}
