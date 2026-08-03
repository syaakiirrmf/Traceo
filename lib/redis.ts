import { Redis } from '@upstash/redis'

// ─── Upstash Redis Client ─────────────────────────────────────────────────────

export const redis = Redis.fromEnv()
