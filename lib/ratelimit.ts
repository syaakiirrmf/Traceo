import { redis } from '@/lib/redis'
import { headers } from 'next/headers'

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

// ─── Rate limit helper for Server Actions ─────────────────────────────────────
// Server actions are invoked via POST to the page route, so the middleware
// proxy cannot rate-limit them individually. Resolve the caller's IP from
// request headers and bucket by `scope:ip:userId`.

export async function rateLimitAction(
  scope: string,
  limit: number,
  windowSeconds: number,
  userId?: string
): Promise<RateLimitResult> {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown'
  const bucket = userId ? `${scope}:${ip}:${userId}` : `${scope}:${ip}`
  return rateLimit(bucket, limit, windowSeconds)
}
