'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { dash, formatRM, formatArea } from '../_helpers'
import type { TanahJV } from '@/types'

export function TanahMDTable({ rows }: { rows: Partial<TanahJV>[] }) {
  const totalLuas = rows.reduce((s, t) => s + (t.luas_meter_persegi ?? 0), 0)
  const totalNilaian = rows.reduce((s, t) => s + (t.anggaran_nilaian ?? 0), 0)

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden relative">
      <div className="overflow-x-auto max-h-[70vh] scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 z-30 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] shadow-xs">
            <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
              <th rowSpan={2} className="w-12 px-3 py-3 text-center font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                Bil
              </th>
              <th rowSpan={2} className="px-4 py-3 font-bold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[140px] sticky left-12 z-40 bg-[var(--color-surface-raised)]">
                No. Lot
              </th>
              <th colSpan={6} className="px-4 py-2 font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] border-b-2 border-b-[var(--color-text-primary)]">
                Tajuk (Maklumat Pendaftaran &amp; Lokasi Tanah)
              </th>
              <th rowSpan={2} className="px-4 py-3 font-semibold text-right border-r border-[var(--color-border)] text-[var(--color-text-primary)] min-w-[130px]">
                Luas (m²)
              </th>
              <th rowSpan={2} className="px-4 py-3 font-semibold text-right border-r border-[var(--color-border)] text-[var(--color-text-primary)] min-w-[150px]">
                Cagaran Nilaian (RM)
              </th>
              <th rowSpan={2} className="px-4 py-3 font-semibold text-[var(--color-text-primary)] uppercase tracking-wider border-r border-[var(--color-border)] min-w-[220px]">
                Catatan
              </th>
              <th rowSpan={2} className="w-16 px-3 py-3 text-center font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider" />
            </tr>

            <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)]">
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Negeri</th>
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Daerah</th>
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Bandar / Pekan / Mukim</th>
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Tempat</th>
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">Daftar Pada</th>
              <th className="px-3.5 py-2 font-medium border-r border-[var(--color-border)]">No. Hak Milik</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-16 text-[var(--color-text-tertiary)]">
                  Tiada rekod pendaftaran tanah dijumpai.
                </td>
              </tr>
            ) : (
              rows.map((t, index) => (
                <tr key={t.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                  <td className="px-3 py-3 text-center font-medium text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] sticky left-0 z-20 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-raised)]">
                    {index + 1}
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
                    {t.luas_meter_persegi ? new Intl.NumberFormat('en-MY', { maximumFractionDigits: 4 }).format(t.luas_meter_persegi) : '—'}
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
                      Lihat
                      <ArrowUpRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Sticky Footer Summary */}
          {rows.length > 0 && (
            <tfoot className="sticky bottom-0 z-30 bg-[var(--color-surface-raised)] font-semibold text-xs border-t-2 border-[var(--color-border-strong)] shadow-xs">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-[var(--color-text-primary)] border-r border-[var(--color-border)] sticky left-0 z-40 bg-[var(--color-surface-raised)]">
                  Jumlah Keseluruhan ({rows.length} Lot)
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
  )
}
