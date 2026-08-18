'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { dash, formatRM, formatArea } from '../_helpers'
import { TableSearch, TableSelect, matchesQuery } from '@/components/table/TableSearch'
import { Pagination } from '@/components/table/Pagination'
import { useSort, SortIcon } from '@/components/table/useSort'
import type { TanahJV } from '@/types'

const PAGE_SIZE = 8

export function TanahMDTable({ rows }: { rows: Partial<TanahJV>[] }) {
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [page, setPage] = useState(1)

  const states = useMemo(
    () => [...new Set(rows.map((t) => t.negeri).filter(Boolean))].sort() as string[],
    [rows]
  )
  const districts = useMemo(
    () =>
      [
        ...new Set(
          rows
            .filter((t) => !stateFilter || t.negeri === stateFilter)
            .map((t) => t.daerah)
            .filter(Boolean)
        ),
      ].sort() as string[],
    [rows, stateFilter]
  )

  const q = query.trim().toLowerCase()
  const visibleRows = useMemo(() => {
    return rows.filter((t) => {
      if (stateFilter && t.negeri !== stateFilter) return false
      if (districtFilter && t.daerah !== districtFilter) return false
      if (!q) return true
      return [
        t.no_lot,
        t.negeri,
        t.daerah,
        t.bandar_mukim,
        t.tempat,
        t.no_hak_milik,
        t.catatan,
      ].some((v) => matchesQuery(v, q))
    })
  }, [rows, q, stateFilter, districtFilter])

  const { sortKey, sortDirection, toggle, sortedRows } = useSort<Partial<TanahJV>>(
    visibleRows,
    'no_lot'
  )

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalLuas = visibleRows.reduce((s, t) => s + (t.luas_meter_persegi ?? 0), 0)
  const totalNilaian = visibleRows.reduce((s, t) => s + (t.anggaran_nilaian ?? 0), 0)

  return (
    <div className="space-y-3">
      {/* Table toolbar / options */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-0.5">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <TableSearch
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder="Search lot, town, title..."
            className="w-full md:w-64"
          />
          <TableSelect
            label="Filter by state"
            value={stateFilter}
            onChange={(v) => {
              setStateFilter(v)
              setDistrictFilter('')
              setPage(1)
            }}
            options={[
              { value: '', label: 'All States' },
              ...states.map((s) => ({ value: s, label: s })),
            ]}
          />
          <TableSelect
            label="Filter by district"
            value={districtFilter}
            onChange={(v) => {
              setDistrictFilter(v)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Districts' },
              ...districts.map((d) => ({ value: d, label: d })),
            ]}
          />
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {visibleRows.length} of {rows.length} land parcels
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh] scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-30 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] shadow-xs">
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <th
                  rowSpan={2}
                  className="w-12 px-3 py-3 text-center font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]"
                >
                  No.
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 font-bold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[140px] sticky left-12 z-40 bg-[var(--color-surface-raised)] cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggle('no_lot')}
                >
                  <span className="inline-flex items-center">
                    Lot No. <SortIcon colKey="no_lot" sortKey={String(sortKey)} sortDir={sortDirection} />
                  </span>
                </th>
                <th
                  colSpan={6}
                  className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-primary)]"
                >
                  Title (Registration Details &amp; Land Location)
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 font-semibold text-right border-r border-[var(--color-border)] text-[var(--color-text-primary)] min-w-[130px] cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggle('luas_meter_persegi')}
                >
                  <span className="inline-flex items-center justify-end">
                    Area (m²) <SortIcon colKey="luas_meter_persegi" sortKey={String(sortKey)} sortDir={sortDirection} />
                  </span>
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 font-semibold text-right border-r border-[var(--color-border)] text-[var(--color-text-primary)] min-w-[150px] cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggle('anggaran_nilaian')}
                >
                  <span className="inline-flex items-center justify-end">
                    Collateral Value (RM) <SortIcon colKey="anggaran_nilaian" sortKey={String(sortKey)} sortDir={sortDirection} />
                  </span>
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 font-semibold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px]"
                >
                  Notes
                </th>
                <th
                  rowSpan={2}
                  className="w-16 px-3 py-3 text-center font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider"
                />
              </tr>

              <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)]">
                <th
                  className="px-3.5 py-2 font-medium border-r border-[var(--color-border)] cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggle('negeri')}
                >
                  <span className="inline-flex items-center">
                    State <SortIcon colKey="negeri" sortKey={String(sortKey)} sortDir={sortDirection} />
                  </span>
                </th>
                <th
                  className="px-3.5 py-2 font-medium border-r border-[var(--color-border)] cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggle('daerah')}
                >
                  <span className="inline-flex items-center">
                    District <SortIcon colKey="daerah" sortKey={String(sortKey)} sortDir={sortDirection} />
                  </span>
                </th>
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">
                  Town / Village / Mukim
                </th>
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">
                  Place
                </th>
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">
                  Registered On
                </th>
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">
                  Title Number
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No land registration records found.
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No land parcels match your search.
                  </td>
                </tr>
              ) : (
                pageRows.map((t, index) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                  >
                    <td className="px-3 py-3 text-center font-medium text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] sticky left-0 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                      {(safePage - 1) * PAGE_SIZE + index + 1}
                    </td>

                    <td className="px-3.5 py-3 font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border)] sticky left-12 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                      {dash(t.no_lot)}
                    </td>

                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                      {dash(t.negeri)}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                      {dash(t.daerah)}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                      {dash(t.bandar_mukim)}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                      {dash(t.tempat)}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-text-tertiary)] font-mono border-r border-[var(--color-border)]">
                      {t.tarikh_daftar ? t.tarikh_daftar : '—'}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                      {dash(t.no_hak_milik)}
                    </td>

                    <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-primary)] border-r border-[var(--color-border)] tabular-nums">
                      {t.luas_meter_persegi
                        ? new Intl.NumberFormat('en-MY', { maximumFractionDigits: 4 }).format(
                            t.luas_meter_persegi
                          )
                        : '—'}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border)] tabular-nums">
                      {t.anggaran_nilaian ? formatRM(t.anggaran_nilaian) : '—'}
                    </td>

                    <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] whitespace-pre-line leading-relaxed">
                      {dash(t.catatan)}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/dashboard/tanah-jv/${t.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
                      >
                        View
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Sticky Footer Summary */}
            {visibleRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-30 bg-[var(--color-surface-raised)] font-semibold text-xs border-t-2 border-[var(--color-border-strong)] shadow-xs">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]"
                  >
                    Total ({visibleRows.length} Lots)
                  </td>
                  <td colSpan={6} className="border-r border-[var(--color-border)]" />
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-primary)] border-r border-[var(--color-border)]">
                    {formatArea(totalLuas)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-primary)] border-r border-[var(--color-border)]">
                    {formatRM(totalNilaian)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={sortedRows.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
