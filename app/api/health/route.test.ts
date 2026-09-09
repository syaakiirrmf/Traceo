import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET as healthGet } from '@/app/api/health/route'
import { createClient } from '@/lib/supabase/server'

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

function mockAuthedClient(chain: Chain) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
    from: vi.fn().mockReturnValue(chain),
  }
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    ;(createClient as Mock).mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    })
    const res = await healthGet()
    expect(res.status).toBe(401)
  })

  it('returns 200 ok when database is reachable', async () => {
    const chain = makeChain()
    chain.select.mockResolvedValue({ error: null })
    ;(createClient as Mock).mockResolvedValue(mockAuthedClient(chain))

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
  })

  it('returns 503 degraded when database returns an error', async () => {
    const chain = makeChain()
    chain.select.mockResolvedValue({ error: { message: 'connection refused' } })
    ;(createClient as Mock).mockResolvedValue(mockAuthedClient(chain))

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.db).toBe('degraded')
  })

  it('returns 503 down when database throws', async () => {
    const chain = makeChain()
    chain.select.mockRejectedValue(new Error('boom'))
    ;(createClient as Mock).mockResolvedValue(mockAuthedClient(chain))

    const res = await healthGet()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.db).toBe('down')
  })
})
