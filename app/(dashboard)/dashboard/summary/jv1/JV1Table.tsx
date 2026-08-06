'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { dash, formatRM, calculateLTV, STATUS_CONFIG } from '../_helpers'
import { FormulaTooltip, ToggleColumnsButton, StatusBadge } from '../_components'
import { TableSearch, TableSelect, matchesQuery } from '@/components/table/TableSearch'
import type { Fasiliti } from '@/types'

export function JV1Table({ rows }: { rows: Partial<Fasiliti>[] }) {
  const [showExtra, setShowExtra] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const STATUS_FILTER_OPTIONS = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_CONFIG).map(([value, c]) => ({ value, label: c.label })),
  ]

  const q = query.trim().toLowerCase()
  const visibleRows = useMemo(() => {
    return rows.filter((f) => {
      if (statusFilter) {
        const effective = f.status_fasiliti || ((f.jumlah_tunggakan_semasa ?? 0) > 0 ? 'tertunggak' : 'aktif')
        if (effective !== statusFilter) return false
      }
      if (!q) return true
      return [f.nama_peminjam, f.kod_rujukan, f.pembiaya_modal, f.ringkasan_cagaran].some((v) =>
        matchesQuery(v, q)
      )
    })
  }, [rows, q, statusFilter])

  const totalPembiayaan = visibleRows.reduce((s, f) => s + (f.jumlah_pembiayaan ?? 0), 0)
  const totalTunggakanDiv = visibleRows.reduce((s, f) => s + (f.tunggakan_dividen ?? 0), 0)
  const totalCajLewat = visibleRows.reduce((s, f) => s + (f.caj_lewat ?? 0), 0)
  const totalBayaranTambahan = visibleRows.reduce((s, f) => s + (f.bayaran_tambahan ?? 0), 0)
  const totalTunggakan = visibleRows.reduce((s, f) => s + (f.jumlah_tunggakan_semasa ?? 0), 0)

  return (
    <div className="space-y-3">
      {/* Table toolbar / options */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-0.5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <TableSearch
            value={query}
            onChange={setQuery}
            placeholder="Search name, code, financier..."
            className="w-full sm:w-64"
          />
          <TableSelect
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
          />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Note: <strong>(E) Total Arrears</strong> contains the outstanding capital balance &amp; committed current claims.
          </p>
        </div>
        <ToggleColumnsButton
          showExtra={showExtra}
          onToggle={() => setShowExtra(!showExtra)}
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh] scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse">
            {/* Clean Grouped Header (No Pelangi Bullet Dots) */}
            <thead className="sticky top-0 z-30 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] shadow-xs">
              {/* Level 1: Main Topics */}
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <th rowSpan={2} className="w-12 px-3 py-3 text-center font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                  No.
                </th>
                <th rowSpan={2} className="px-4 py-3 font-bold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px] sticky left-12 z-40 bg-[var(--color-surface-raised)]">
                  Borrower Name &amp; Code
                </th>
                <th colSpan={3} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-primary)]">
                  Capital Financing Details
                </th>
                <th colSpan={4} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-danger)]">
                  Arrears &amp; Payment Details
                </th>
                <th colSpan={showExtra ? 3 : 1} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-tertiary)]">
                  Asset Collateral Details
                </th>
                <th rowSpan={2} className="px-4 py-3 font-semibold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px]">
                  Notes
                </th>
                <th rowSpan={2} className="w-16 px-3 py-3 text-center font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider" />
              </tr>

              {/* Level 2: Sub-fields */}
              <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)]">
                {/* Pembiayaan Sub-fields */}
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Capital Financier</th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Total Financing (RM) <span className="font-semibold text-[var(--color-text-primary)]">(A)</span></th>
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Dividend Sharing</th>

                {/* Tunggakan Sub-fields */}
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Dividend Arrears (RM) <span>(B)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Late Charges (RM) <span>(C)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Additional Payments (RM) <span>(D)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <div className="flex items-center justify-end">
                    <span>Total Arrears (RM)</span>
                    <span className="font-semibold text-[var(--color-text-primary)] ml-1">(E)</span>
                    <FormulaTooltip content="Total Arrears (E) includes the outstanding capital balance & approved current claims." />
                  </div>
                </th>

                {/* Cagaran Sub-fields */}
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Type / Location / Value</th>
                {showExtra && <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Asset Nominee</th>}
                {showExtra && <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Transfer of Title / Sale Status</th>}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No JV 1 facility records found.
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No records match your search.
                  </td>
                </tr>
              ) : (
                visibleRows.map((f, index) => {
                  const hasArrears = (f.jumlah_tunggakan_semasa ?? 0) > 0
                  const ltv = calculateLTV(f.jumlah_pembiayaan, f.nilai_cagaran)

                  return (
                    <tr key={f.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                      {/* Bil — Sticky Left 0 */}
                      <td className="px-3 py-3 text-center font-medium text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] sticky left-0 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                        {index + 1}
                      </td>

                      {/* Nama Peminjam & Kod & Status Badge — Sticky Left 12 */}
                      <td className="px-3.5 py-3 border-r border-[var(--color-border)] sticky left-12 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)] leading-snug">{dash(f.nama_peminjam)}</span>
                          <StatusBadge status={f.status_fasiliti || (hasArrears ? 'tertunggak' : 'aktif')} />
                        </div>
                        <span className="inline-block mt-1 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                          {f.kod_rujukan}
                        </span>
                      </td>

                      {/* Pembiayaan Modal Group */}
                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                        {dash(f.pembiaya_modal)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border)] tabular-nums">
                        {formatRM(f.jumlah_pembiayaan)}
                      </td>
                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] whitespace-pre-line leading-relaxed">
                        {dash(f.kadar_dividen)}
                      </td>

                      {/* Tunggakan & Bayaran Group (Strict color discipline: Red ONLY if > 0) */}
                      <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] tabular-nums ${(f.tunggakan_dividen ?? 0) > 0 ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'}`}>
                        {formatRM(f.tunggakan_dividen)}
                      </td>
                      <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] tabular-nums ${(f.caj_lewat ?? 0) > 0 ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'}`}>
                        {formatRM(f.caj_lewat)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] tabular-nums">
                        {formatRM(f.bayaran_tambahan)}
                      </td>

                      {/* E Column: Highlight ONLY IF tungsten > 0 */}
                      <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] tabular-nums ${hasArrears ? 'text-[var(--color-danger)] font-bold bg-[var(--color-danger-subtle)]/30' : 'text-[var(--color-text-tertiary)]'}`}>
                        {formatRM(f.jumlah_tunggakan_semasa)}
                      </td>

                      {/* Cagaran Aset Group */}
                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] leading-relaxed whitespace-pre-line">
                        {dash(f.ringkasan_cagaran)}
                        <div className="flex items-center gap-2 mt-1">
                          {f.nilai_cagaran ? (
                            <span className="text-[10px] text-[var(--color-text-tertiary)]">
                              Value: <strong className="text-[var(--color-text-secondary)]">{formatRM(f.nilai_cagaran)}</strong>
                            </span>
                          ) : null}
                          {ltv && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                              LTV: {ltv}
                            </span>
                          )}
                        </div>
                      </td>
                      {showExtra && (
                        <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                          {dash(f.penama_aset)}
                        </td>
                      )}
                      {showExtra && (
                        <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                          {dash(f.status_pindahmilik)}
                        </td>
                      )}

                      {/* Catatan */}
                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] whitespace-pre-line leading-relaxed">
                        {dash(f.catatan_am)}
                      </td>

                      {/* Link Action */}
                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/dashboard/fasiliti/${f.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
                        >
                          View
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {/* Sticky Footer Summary */}
            {visibleRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-30 bg-[var(--color-surface-raised)] font-semibold text-xs border-t-2 border-[var(--color-border-strong)] shadow-xs">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                    Total ({visibleRows.length} Records)
                  </td>
                  <td className="border-r border-[var(--color-border)]" />
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-primary)] border-r border-[var(--color-border)]">
                    {formatRM(totalPembiayaan)}
                  </td>
                  <td className="border-r border-[var(--color-border)]" />
                  <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] ${totalTunggakanDiv > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}`}>
                    {formatRM(totalTunggakanDiv)}
                  </td>
                  <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] ${totalCajLewat > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}`}>
                    {formatRM(totalCajLewat)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-tertiary)] border-r border-[var(--color-border)]">
                    {formatRM(totalBayaranTambahan)}
                  </td>
                  <td className={`px-3.5 py-3 text-right font-mono font-bold border-r border-[var(--color-border)] ${totalTunggakan > 0 ? 'text-[var(--color-danger)] bg-[var(--color-danger-subtle)]/40' : 'text-[var(--color-text-primary)]'}`}>
                    {formatRM(totalTunggakan)}
                  </td>
                  <td colSpan={showExtra ? 5 : 3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
