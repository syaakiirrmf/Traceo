import 'server-only'

import { Redis } from '@upstash/redis'

// ─── Upstash Redis Client (lazy + null-safe) ─────────────────────────────────
// `Redis.fromEnv()` throw jika env tiada — sebelum ini semua import
// `lib/ratelimit` ikut crash (dev tanpa Upstash mati). Kini lazy: hanya
// dibina bila pertama kali digunakan, dan `null` jika env tiada supaya
// caller boleh decide fail-closed (auth) vs fail-open+log (eksport/chat).

let cached: Redis | null | undefined

export function getRedis(): Redis | null {
  if (cached !== undefined) return cached
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cached = null
    return cached
  }
  try {
    cached = Redis.fromEnv()
  } catch {
    cached = null
  }
  return cached
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null
}

// Kekal untuk backward-compat: akses `.redis` masih berfungsi bila configured,
// tetapi kod baharu patut guna getRedis() + null-check.
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis()
    if (!client) throw new Error('Upstash Redis is not configured')
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop]
    return typeof value === 'function'
      ? (value as (...a: unknown[]) => unknown).bind(client)
      : value
  },
})
