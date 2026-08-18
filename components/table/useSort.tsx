'use client'

import { useCallback, useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState<T> {
  key: keyof T | null
  direction: SortDirection
}

export interface SortConfig<T> {
  valueGetter?: (item: T) => number | string | null | undefined
  numeric?: boolean
}

export function useSort<T extends object>(
  rows: T[],
  initialKey: keyof T | null = null,
  initialDirection: SortDirection = 'asc'
) {
  const [sort, setSort] = useState<SortState<T>>({
    key: initialKey,
    direction: initialDirection,
  })

  const toggle = useCallback((key: keyof T) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows
    const { key, direction } = sort
    const mul = direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * mul
      }
      return String(av).localeCompare(String(bv), 'ms-MY') * mul
    })
  }, [rows, sort])

  return { sortKey: sort.key, sortDirection: sort.direction, toggle, sortedRows }
}

export function SortIcon({
  colKey,
  sortKey,
  sortDir,
}: {
  colKey: string
  sortKey: string | null
  sortDir: SortDirection
}) {
  if (sortKey !== colKey)
    return <span className="ml-1 text-[var(--color-text-tertiary)] opacity-40">&harr;</span>
  return (
    <span className="ml-1 text-[var(--color-brand)]">
      {sortDir === 'asc' ? '\u2191' : '\u2193'}
    </span>
  )
}