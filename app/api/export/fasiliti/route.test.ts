import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET as exportGet } from '@/app/api/export/fasiliti/route'
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

describe('GET /api/export/fasiliti', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const fasilitiRow = {
    kod_rujukan: 'JV-001',
    kategori: 'jv_syarikat',
    nama_peminjam: 'Acme Sdn Bhd',
    pembiaya_modal: 'Bank Test',
    jumlah_pembiayaan: 1000000,
    jumlah_tunggakan_semasa: 50000,
    status_fasiliti: 'tertunggak',
    tarikh_mula: '2024-01-01',
    tarikh_tamat: '2026-01-01',
    ringkasan_cagaran: 'Land',
    catatan_am: 'Note',
  }

  it('returns 401 when unauthenticated', async () => {
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    }
    ;(createClient as Mock).mockResolvedValue(supabase)
    const res = await exportGet(new NextRequest('http://localhost/api/export/fasiliti'))
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
        if (table === 'fasiliti_pegawai') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
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
    const res = await exportGet(new NextRequest('http://localhost/api/export/fasiliti'))
    expect(res.status).toBe(403)
  })

  it('generates an xlsx file for an admin user', async () => {
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

    const res = await exportGet(new NextRequest('http://localhost/api/export/fasiliti'))
    expect(res.status).toBe(200)
    const contentType = res.headers.get('content-type')
    expect(contentType).toContain('spreadsheetml')

    const buffer = Buffer.from(await res.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    expect(json).toHaveLength(1)
    expect(json[0]).toMatchObject({
      'Reference Code': 'JV-001',
      Category: 'Company JV',
      Status: 'Overdue',
      'Financing (RM)': 1000000,
      'Arrears (RM)': 50000,
    })
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

    const res = await exportGet(new NextRequest('http://localhost/api/export/fasiliti'))
    expect(res.status).toBe(404)
  })
})
