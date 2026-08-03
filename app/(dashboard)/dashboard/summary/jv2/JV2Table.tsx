'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { dash, formatRM } from '../_helpers'
import { FormulaTooltip, ToggleColumnsButton, StatusBadge } from '../_components'
import type { Fasiliti } from '@/types'

export function JV2Table({ rows }: { rows: Partial<Fasiliti>[] }) {
  const [showExtra, setShowExtra] = useState(false)

  const totalPembiayaan = rows.reduce((s, f) => s + (f.jumlah_pembiayaan ?? 0), 0)
  const totalPerkongsian = rows.reduce((s, f) => s + (f.perkongsian_keuntungan ?? 0), 0)
  const totalTunggakanPkgs = rows.reduce((s, f) => s + (f.tunggakan_dividen ?? 0), 0)
  const totalBayaranTambahan = rows.reduce((s, f) => s + (f.bayaran_tambahan ?? 0), 0)
  const totalTunggakan = rows.reduce((s, f) => s + (f.jumlah_tunggakan_semasa ?? 0), 0)

  return (
    <div className="space-y-3">
      {/* Table toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Nota: <strong>(E) Jumlah Tunggakan Pembiayaan</strong> merangkumi tunggakan perkongsian &amp; kos pembiayaan komited.
        </p>
        <ToggleColumnsButton
          showExtra={showExtra}
          onToggle={() => setShowExtra(!showExtra)}
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh] scrollbar-thin">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-30 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] shadow-xs">
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <th rowSpan={2} className="w-12 px-3 py-3 text-center font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                  Bil
                </th>
                <th rowSpan={2} className="px-4 py-3 font-bold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px] sticky left-12 z-40 bg-[var(--color-surface-raised)]">
                  Nama Kontraktor &amp; Kod
                </th>
                <th colSpan={3} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-primary)]">
                  Maklumat Pembiayaan Modal
                </th>
                <th colSpan={3} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-danger)]">
                  Maklumat Tunggakan &amp; Bayaran
                </th>
                <th colSpan={showExtra ? 4 : 2} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-tertiary)]">
                  Maklumat Hartanah
                </th>
                <th rowSpan={2} className="px-4 py-3 font-semibold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px]">
                  Catatan
                </th>
                <th rowSpan={2} className="w-16 px-3 py-3 text-center font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider" />
              </tr>

              <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)]">
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Pembiaya Modal</th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Jumlah Pembiayaan (RM) <span className="font-semibold text-[var(--color-text-primary)]">(A)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Perkongsian Keuntungan (RM) <span className="font-semibold text-[var(--color-text-primary)]">(B)</span></th>

                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Tunggakan Perkongsian (RM) <span>(C)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)]">Bayaran Tambahan (RM) <span>(D)</span></th>
                <th className="px-3.5 py-2 font-medium text-right border-r border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <div className="flex items-center justify-end">
                    <span>Jumlah Tunggakan (RM)</span>
                    <span className="font-semibold text-[var(--color-text-primary)] ml-1">(E)</span>
                    <FormulaTooltip content="Jumlah Tunggakan Pembiayaan (E) merangkumi tunggakan perkongsian & kos pembiayaan tertunggak." />
                  </div>
                </th>

                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Jenis / Lokasi</th>
                {showExtra && <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Penama Aset</th>}
                {showExtra && <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Status PindahMilik / Jualan</th>}
                <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Harga Jualan / Jenis</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    Tiada rekod fasiliti JV 2 dijumpai.
                  </td>
                </tr>
              ) : (
                rows.map((f, index) => {
                  const hasArrears = (f.jumlah_tunggakan_semasa ?? 0) > 0

                  return (
                    <tr key={f.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                      <td className="px-3 py-3 text-center font-medium text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] sticky left-0 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                        {index + 1}
                      </td>

                      <td className="px-3.5 py-3 border-r border-[var(--color-border)] sticky left-12 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)] leading-snug">{dash(f.nama_peminjam)}</span>
                          <StatusBadge status={f.status_fasiliti || (hasArrears ? 'tertunggak' : 'aktif')} />
                        </div>
                        <span className="inline-block mt-1 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                          {f.kod_rujukan}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                        {dash(f.pembiaya_modal)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border)] tabular-nums">
                        {formatRM(f.jumlah_pembiayaan)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-secondary)] border-r border-[var(--color-border)] tabular-nums">
                        {formatRM(f.perkongsian_keuntungan)}
                      </td>

                      <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] tabular-nums ${(f.tunggakan_dividen ?? 0) > 0 ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'}`}>
                        {formatRM(f.tunggakan_dividen)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] tabular-nums">
                        {formatRM(f.bayaran_tambahan)}
                      </td>
                      <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] tabular-nums ${hasArrears ? 'text-[var(--color-danger)] font-bold bg-[var(--color-danger-subtle)]/30' : 'text-[var(--color-text-tertiary)]'}`}>
                        {formatRM(f.jumlah_tunggakan_semasa)}
                      </td>

                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] leading-relaxed whitespace-pre-line">
                        {dash(f.ringkasan_cagaran)}
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
                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                        {dash(f.harga_jualan)}
                      </td>

                      <td className="px-3.5 py-3 text-[var(--color-text-secondary)] border-r border-[var(--color-border)] whitespace-pre-line leading-relaxed">
                        {dash(f.catatan_am)}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/dashboard/fasiliti/${f.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
                        >
                          Lihat
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {/* Sticky Footer Summary */}
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-30 bg-[var(--color-surface-raised)] font-semibold text-xs border-t-2 border-[var(--color-border-strong)] shadow-xs">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                    Jumlah Keseluruhan ({rows.length} Rekod)
                  </td>
                  <td className="border-r border-[var(--color-border)]" />
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-primary)] border-r border-[var(--color-border)]">
                    {formatRM(totalPembiayaan)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
                    {formatRM(totalPerkongsian)}
                  </td>
                  <td className={`px-3.5 py-3 text-right font-mono border-r border-[var(--color-border)] ${totalTunggakanPkgs > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}`}>
                    {formatRM(totalTunggakanPkgs)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-[var(--color-text-tertiary)] border-r border-[var(--color-border)]">
                    {formatRM(totalBayaranTambahan)}
                  </td>
                  <td className={`px-3.5 py-3 text-right font-mono font-bold border-r border-[var(--color-border)] ${totalTunggakan > 0 ? 'text-[var(--color-danger)] bg-[var(--color-danger-subtle)]/40' : 'text-[var(--color-text-primary)]'}`}>
                    {formatRM(totalTunggakan)}
                  </td>
                  <td colSpan={showExtra ? 6 : 4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
