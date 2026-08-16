'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'aktif', label: 'Active' },
  { value: 'tertunggak', label: 'Overdue' },
  { value: 'tindakan_guaman', label: 'Legal Action' },
  { value: 'selesai', label: 'Completed' },
]

const KATEGORI_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'jv_syarikat', label: 'Corporate JV' },
  { value: 'jv_tanah', label: 'Land JV' },
  { value: 'pinjaman_individu', label: 'Individual Loan' },
]

export function FasilitiFilter({
  defaultQ,
  defaultStatus,
  defaultKategori,
}: {
  defaultQ?: string
  defaultStatus?: string
  defaultKategori?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
        />
        <input
          type="search"
          defaultValue={defaultQ}
          placeholder="Search name, funder, code..."
          className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
          onChange={(e) => {
            const val = e.target.value
            // Debounce: only update after user stops typing
            const timer = setTimeout(() => updateParam('q', val), 400)
            return () => clearTimeout(timer)
          }}
        />
      </div>

      {/* Status filter */}
      <select
        defaultValue={defaultStatus ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className="h-9 px-3 pr-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors appearance-none"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Kategori filter */}
      <select
        defaultValue={defaultKategori ?? ''}
        onChange={(e) => updateParam('kategori', e.target.value)}
        className="h-9 px-3 pr-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors appearance-none"
      >
        {KATEGORI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
