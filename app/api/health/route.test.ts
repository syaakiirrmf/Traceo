import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { GET as healthGet } from '@/app/api/health/route'
import { createAdminClient } from '@/lib/supabase/admin'

type Chain = Record<string, Mock>

function makeChain(): Chain {
  const chain: Chain = {}
  for (const key of ['select', 'eq', 'in', 'order', 'limit', 'range', 'single', 'maybeSingle', 'insert', 'update', 'delete']) {
    chain[key] = vi.fn(function (this: unknown) {
      return this
    })
  }
  return chain
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 ok when database is reachable', async () => {
    const chain = makeChain()
    chain.select.mockResolvedValue({ error: null })
    const supabase = { from: vi.fn().mockReturnValue(chain) }
    ;(createAdminClient as Mock).mockReturnValue(supabase)

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
    expect(typeof body.uptime).toBe('number')
  })

  it('returns 503 degraded when database returns an error', async () => {
    const chain = makeChain()
    chain.select.mockResolvedValue({ error: { message: 'connection refused' } })
    const supabase = { from: vi.fn().mockReturnValue(chain) }
    ;(createAdminClient as Mock).mockReturnValue(supabase)

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.db).toBe('degraded')
  })

  it('returns 503 down when database throws', async () => {
    const chain = makeChain()
    chain.select.mockRejectedValue(new Error('boom'))
    const supabase = { from: vi.fn().mockReturnValue(chain) }
    ;(createAdminClient as Mock).mockReturnValue(supabase)

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.db).toBe('down')
  })
})