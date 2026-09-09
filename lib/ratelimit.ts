import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { headers } from 'next/headers'
import { getRedis } from '@/lib/redis'

// ─── Rate limiter (Upstash Redis) ────────────────────────────────────────────
// Atomic via Lua (INCR + EXPIRE sekali gus — tiada race burst seperti
// incr+expire berasingan sebelum ini). Retry-after guna TTL sebenar (PTTL),
// bukan full window. Redis down: throw RedisUnavailableError supaya caller
// decide fail-closed (auth) vs fail-open+log (eksport/chat).

export class RedisUnavailableError extends Error {
  constructor() {
    super('Rate-limit store unavailable')
    this.name = 'RedisUnavailableError'
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

// INCR key; jika baru (count==1) set PEXPIRE; return [count, pttl]
const LUA =
  `local c = redis.call('INCR', KEYS[1]) ` +
  `if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end ` +
  `return {c, redis.call('PTTL', KEYS[1])}`

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = getRedis()
  if (!client) throw new RedisUnavailableError()
  const bucketKey = `rl:${key}`
  let count: number
  let pttl: number
  try {
    const res = (await client.eval(LUA, [bucketKey], [windowSeconds * 1000])) as [number, number]
    count = Number(res[0])
    pttl = Number(res[1])
  } catch (err) {
    Sentry.captureMessage('ratelimit_redis_error', {
      level: 'warning',
      extra: { key, message: err instanceof Error ? err.message : String(err) },
    })
    throw new RedisUnavailableError()
  }
  const retryAfterSeconds =
    count > limit ? Math.max(1, Math.ceil((Number.isFinite(pttl) && pttl > 0 ? pttl : windowSeconds * 1000) / 1000)) : 0
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  }
}

// ─── Fail-policy helpers ─────────────────────────────────────────────────────
// Auth mesti fail-CLOSED (lebih selamat: tolak bila store down).
// Eksport/chat fail-OPEN + Sentry log (elak 500 massal bila Upstash down).

export async function rateLimitFailClosed(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    return await rateLimit(key, limit, windowSeconds)
  } catch (err) {
    if (err instanceof RedisUnavailableError) {
      return { ok: false, remaining: 0, retryAfterSeconds: windowSeconds }
    }
    throw err
  }
}

export async function rateLimitFailOpen(
  key: string,
  limit: number,
  windowSeconds: number,
  scope = 'ratelimit'
): Promise<RateLimitResult> {
  try {
    return await rateLimit(key, limit, windowSeconds)
  } catch (err) {
    if (err instanceof RedisUnavailableError) {
      Sentry.captureMessage(`${scope}_ratelimit_fail_open`, { level: 'warning' })
      return { ok: true, remaining: limit, retryAfterSeconds: 0 }
    }
    throw err
  }
}

// ─── IP extraction (spoof-resistant) ─────────────────────────────────────────
// Ambil IP pertama dari x-forwarded-for dan validate format; header tidak
// dijamin (boleh spoof) — ia hanya bucket key, bukan auth. Fallback 'unknown'
// dikekalkan tetapi caller auth guna fail-closed jadi tiada bypass.

export function parseClientIp(
  forwardedFor: string | null,
  realIp: string | null
): string {
  const first = forwardedFor?.split(',')[0]?.trim() ?? ''
  const candidate = first || realIp?.trim() || 'unknown'
  if (candidate === 'unknown') return candidate
  // IPv4 / IPv6 ringkas — tolak nilai pelik (cth. spoof "unknown,x")
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(candidate)) return candidate
  if (/^[0-9a-fA-F:]{2,45}$/.test(candidate) && candidate.includes(':')) return candidate
  return 'unknown'
}

export async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return parseClientIp(hdrs.get('x-forwarded-for'), hdrs.get('x-real-ip'))
}

// ─── Rate limit helper for Server Actions ─────────────────────────────────────
// Server actions dipanggil via POST ke page route, jadi proxy tidak boleh
// rate-limit individu. Bucket `scope:ip:userId`.

export async function rateLimitAction(
  scope: string,
  limit: number,
  windowSeconds: number,
  userId?: string
): Promise<RateLimitResult> {
  const ip = await getClientIp()
  const bucket = userId ? `${scope}:${ip}:${userId}` : `${scope}:${ip}`
  // Server Actions fail-OPEN + log (jangan 500kan form bila Redis down),
  // KECUALI auth/password flows yang memanggil rateLimitFailClosed sendiri.
  return rateLimitFailOpen(bucket, limit, windowSeconds, scope)
}
