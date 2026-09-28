'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'aktif', label: 'Active' },
  { value: 'tertunggak', label: 'Overdue' },
  { value: 'tindakan_guaman', label: 'Legal Action' },
  { value: 'selesai', label: 'Completed' },
]

export interface KategoriCounts {
  semua: number
  jv_syarikat: number
  jv_tanah: number
  pinjaman_individu: number
  tanah_lot: number
}

const KATEGORI_CHIPS = [
  { value: '', label: 'All' },
  { value: 'jv_syarikat', label: 'Company JV' },
  { value: 'jv_tanah', label: 'Land JV' },
  { value: 'pinjaman_individu', label: 'Personal Loan' },
  { value: 'tanah_lot', label: 'Tanah Lot' },
] as const

export function FasilitiFilter({
  defaultQ,
  defaultStatus,
  defaultKategori,
  counts,
  showTanah,
}: {
  defaultQ?: string
  defaultStatus?: string
  defaultKategori?: string
  counts?: KategoriCounts
  showTanah?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramQ = searchParams.get('q') ?? ''
  const activeKategori = searchParams.get('kategori') ?? defaultKategori ?? ''
  const isTanahLot = activeKategori === 'tanah_lot'
  const [q, setQ] = useState(defaultQ ?? paramQ)
  const [prevParamQ, setPrevParamQ] = useState(paramQ)
  // Selaras bila navigasi luar (back/forward) ubah query — adjust semasa render.
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ)
    setQ(paramQ)
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const selectKategori = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('kategori', value)
      } else {
        params.delete('kategori')
      }
      // Lot tanah tiada status — buang filter status bila tukar ke tanah_lot
      if (value === 'tanah_lot') params.delete('status')
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const visibleChips = showTanah ? KATEGORI_CHIPS : KATEGORI_CHIPS.filter((c) => c.value !== 'tanah_lot')

  return (
    <div className="space-y-3">
      {/* Chips kategori */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {visibleChips.map((c) => {
          const active = activeKategori === c.value
          const count =
            counts?.[c.value === '' ? 'semua' : (c.value as keyof KategoriCounts)]
          return (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectKategori(c.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors min-h-[36px] ${
                active
                  ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-xs'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {c.label}
              {counts && (
                <span
                  className={`font-mono text-[11px] tabular-nums ${active ? 'opacity-80' : 'text-[var(--color-text-tertiary)]'}`}
                >
                  {count ?? 0}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
        />
        <input
          type="search"
          value={q}
          placeholder="Search name, funder, code..."
          className="w-full h-11 sm:h-10 pl-8 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
          onChange={(e) => {
            const val = e.target.value
            setQ(val)
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => updateParam('q', val), 400)
          }}
        />
      </div>

      {/* Status filter (tidak terpakai untuk Tanah Lot — lot tiada status) */}
      <div className="relative">
      <select
        defaultValue={isTanahLot ? '' : (defaultStatus ?? '')}
        onChange={(e) => updateParam('status', e.target.value)}
        disabled={isTanahLot}
        title={isTanahLot ? 'Status filter does not apply to Tanah Lot' : undefined}
        className="h-11 sm:h-10 pl-3 pr-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors appearance-none disabled:opacity-40"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
      </div>
      </div>
    </div>
  )
}
