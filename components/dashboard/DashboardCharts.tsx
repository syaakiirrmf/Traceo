'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

function formatRM(val: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

interface CategoryData {
  name: string
  key: string
  href: string
  count: number
  pembiayaan: number
  tunggakan: number
}

interface OverdueItem {
  id: string
  kod_rujukan: string
  nama_peminjam: string
  pembiaya_modal: string
  jumlah_pembiayaan: number
  jumlah_tunggakan_semasa: number
  status_fasiliti: string
}

interface StatusData {
  label: string
  key: string
  count: number
  color: string
}

export function DashboardCharts({
  categories,
  statuses,
  totalCagaran,
  overdueList,
}: {
  categories: CategoryData[]
  statuses: StatusData[]
  totalCagaran: number
  overdueList: OverdueItem[]
}) {
  const [activeBar, setActiveBar] = useState<string | null>(null)

  const maxPembiayaan = Math.max(...categories.map((c) => c.pembiayaan), 1)
  const totalCount = statuses.reduce((s, c) => s + c.count, 0)

  return (
    <div className="space-y-6">
      {/* ── Section 1: Financial & Status Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Category Financial Breakdown (Bar Chart) */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Taburan Pembiayaan &amp; Tunggakan Mengikut Kategori
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Perbandingan jumlah dana komited vs baki tunggakan
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-wider">
              JV1 · JV2 · JV3
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="space-y-4 pt-2">
            {categories.map((cat) => {
              const pembiayaanWidth = Math.round((cat.pembiayaan / maxPembiayaan) * 100)
              const isHovered = activeBar === cat.key

              return (
                <div
                  key={cat.key}
                  className="space-y-1.5 p-2 rounded-lg transition-colors hover:bg-[var(--color-surface-raised)]"
                  onMouseEnter={() => setActiveBar(cat.key)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <Link href={cat.href} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-normal">({cat.count} rekod)</span>
                    </Link>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[var(--color-text-primary)] font-semibold">{formatRM(cat.pembiayaan)}</span>
                      {cat.tunggakan > 0 && (
                        <span className="text-[var(--color-danger)] font-bold bg-[var(--color-danger-subtle)]/40 px-1.5 py-0.2 rounded text-[11px]">
                          Tunggakan: {formatRM(cat.tunggakan)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Group */}
                  <div className="w-full h-3.5 bg-[var(--color-surface-raised)] rounded-full overflow-hidden flex relative">
                    <div
                      style={{ width: `${pembiayaanWidth}%` }}
                      className={`h-full bg-[var(--color-brand)] transition-all duration-300 ${isHovered ? 'brightness-110' : ''}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-brand)]" /> Jumlah Pembiayaan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-danger)]" /> Tunggakan
              </span>
            </div>
            <span>Kemaskini Automatik</span>
          </div>
        </div>

        {/* Chart 2: Status Distribution (Progress Rings / Bars) */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              Status Keseluruhan Fasiliti
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              Pecahan kedudukan rekod aktif ({totalCount} Fasiliti)
            </p>
          </div>

          {/* Donut Progress Visual */}
          <div className="space-y-3 py-2">
            {/* Multi-segmented distribution bar */}
            <div className="h-3 w-full rounded-full bg-[var(--color-surface-raised)] overflow-hidden flex">
              {statuses.map((st) => {
                const pct = totalCount > 0 ? (st.count / totalCount) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={st.key}
                    style={{ width: `${pct}%`, backgroundColor: st.color }}
                    className="h-full border-r border-[var(--color-surface)] last:border-0"
                    title={`${st.label}: ${st.count} (${pct.toFixed(0)}%)`}
                  />
                )
              })}
            </div>

            {/* Status Item Breakdown */}
            <div className="space-y-2 pt-2">
              {statuses.map((st) => {
                const pct = totalCount > 0 ? ((st.count / totalCount) * 100).toFixed(0) : '0'
                return (
                  <div key={st.key} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)]/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className="text-[var(--color-text-secondary)] font-medium">{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[var(--color-text-primary)]">{st.count}</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* LTV & Collateral Overview Strip */}
          <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs space-y-1">
            <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Perlindungan Cagaran (LTV Ratio)</p>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Cagaran Nilaian Tanah:</span>
              <span className="font-mono font-bold text-[var(--color-text-primary)]">{formatRM(totalCagaran)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Overdue Attention List & Action Required ── */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              Fasiliti Memerlukan Tindakan &amp; Tunggakan Paling Tinggi
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              Senarai keutamaan susulan untuk rekod berisiko tinggi
            </p>
          </div>
          <Link href="/dashboard/fasiliti?status=tertunggak" className="text-xs font-semibold text-[var(--color-brand)] hover:underline flex items-center gap-1">
            Lihat Semua Tertunggak
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {overdueList.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">
            Semua fasiliti dalam keadaan lancar tanpa tunggakan kritikal.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)]">
                  <th className="px-3 py-2 font-medium">Kod</th>
                  <th className="px-3 py-2 font-medium">Peminjam / Kontraktor</th>
                  <th className="px-3 py-2 font-medium">Pembiaya</th>
                  <th className="px-3 py-2 font-medium text-right">Pembiayaan (RM)</th>
                  <th className="px-3 py-2 font-medium text-right">Tunggakan (RM)</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {overdueList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-raised)]/60 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-[var(--color-brand)]">
                      {item.kod_rujukan}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[var(--color-text-primary)]">
                      {item.nama_peminjam}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">
                      {item.pembiaya_modal}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-[var(--color-text-primary)]">
                      {formatRM(item.jumlah_pembiayaan)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[var(--color-danger)] bg-[var(--color-danger-subtle)]/30">
                      {formatRM(item.jumlah_tunggakan_semasa)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)]/30">
                        {item.status_fasiliti === 'tindakan_guaman' ? 'Guaman' : 'Tertunggak'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Link href={`/dashboard/fasiliti/${item.id}`} className="text-[11px] font-medium text-[var(--color-brand)] hover:underline">
                        Buka →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
