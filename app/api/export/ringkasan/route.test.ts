import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/pdf/ringkasanPdfme', () => ({
  generateRingkasanPdf: vi.fn(async () => new Uint8Array([1, 2, 3])),
}))

import { GET as ringkasanGet } from '@/app/api/export/ringkasan/route'
import { createClient } from '@/lib/supabase/server'

interface FromChain {
  select: Mock
  eq: Mock
  in: Mock
  order: Mock
  insert: Mock
  single: Mock
  maybeSingle: Mock
}

function makeFrom() {
  const chain: Record<string, FromChain> = {}
  const fromFn = vi.fn((table: string) => {
    if (!chain[table]) {
      chain[table] = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn(),
        insert: vi.fn(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      }
      for (const key of Object.keys(chain[table]) as Array<keyof FromChain>) {
        if (key !== 'select') {
          chain[table][key] = vi.fn(function (this: unknown) {
            return this
          })
        }
      }
    }
    return chain[table]
  })
  return { fromFn, chain }
}

describe('GET /api/export/ringkasan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const fasilitiRow = {
    kod_rujukan: 'JV-001',
    kategori: 'jv_syarikat',
    nama_peminjam: 'Acme Sdn Bhd',
    status_fasiliti: 'tertunggak',
    jumlah_pembiayaan: 1000000,
    jumlah_tunggakan_semasa: 50000,
  }

  it('returns 401 when unauthenticated', async () => {
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    }
    ;(createClient as Mock).mockResolvedValue(supabase)
    const res = await ringkasanGet(new NextRequest('http://localhost/api/export/ringkasan'))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('returns 403 for pegawai_susulan with no assigned facilities', async () => {
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(async () => ({
              data: { id: 'u1', peranan: 'pegawai_susulan' },
            })),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockReturnThis(),
        }
      }),
    }
    ;(createClient as Mock).mockResolvedValue(supabase)
    const res = await ringkasanGet(new NextRequest('http://localhost/api/export/ringkasan'))
    expect(res.status).toBe(403)
  })

  it('generates a pdf summary for an admin user', async () => {
    const { fromFn, chain } = makeFrom()
    chain.users = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: { id: 'u1', peranan: 'admin' } })),
      maybeSingle: vi.fn().mockReturnThis(),
    }
    chain.fasiliti = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    }
    chain.fasiliti.order.mockResolvedValue({ data: [fasilitiRow] })
    chain.log_audit = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn(async () => ({ error: null })),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    }

    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
      from: fromFn,
    }
    ;(createClient as Mock).mockResolvedValue(supabase)

    const res = await ringkasanGet(new NextRequest('http://localhost/api/export/ringkasan'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/pdf')
    expect(res.headers.get('content-disposition')).toContain('RINGKASAN_PORTFOLIO_')
    expect(chain.log_audit.insert).toHaveBeenCalled()
  })

  it('returns 404 when no data', async () => {
    const { fromFn, chain } = makeFrom()
    chain.users = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: { id: 'u1', peranan: 'admin' } })),
      maybeSingle: vi.fn().mockReturnThis(),
    }
    chain.fasiliti = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    }
    chain.fasiliti.order.mockResolvedValue({ data: null })
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
      from: fromFn,
    }
    ;(createClient as Mock).mockResolvedValue(supabase)

    const res = await ringkasanGet(new NextRequest('http://localhost/api/export/ringkasan'))
    expect(res.status).toBe(404)
  })
})