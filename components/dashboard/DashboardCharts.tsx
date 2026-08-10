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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Financing &amp; Arrears Distribution by Category
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of committed funds vs outstanding arrears
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              JV1 &bull; JV2 &bull; JV3
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
                  className="space-y-1.5 p-3 rounded-xl transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-200/60"
                  onMouseEnter={() => setActiveBar(cat.key)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs">
                    <Link href={cat.href} className="font-bold text-slate-900 hover:text-teal-700 flex items-center gap-1.5 min-w-0 truncate">
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0">({cat.count} records)</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs flex-wrap sm:flex-nowrap shrink-0">
                      <span className="text-slate-900 font-bold tabular-nums">{formatRM(cat.pembiayaan)}</span>
                      {cat.tunggakan > 0 && (
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[11px] border border-red-200 tabular-nums shrink-0">
                          Arrears: {formatRM(cat.tunggakan)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Group */}
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex relative">
                    <div
                      style={{ width: `${pembiayaanWidth}%` }}
                      className={`h-full bg-teal-700 transition-all duration-300 ${isHovered ? 'bg-teal-800' : ''}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-700" /> Total Financing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Arrears
              </span>
            </div>
            <span>Auto-updated</span>
          </div>
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Overall Facility Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of active records ({totalCount} Facilities)
            </p>
          </div>

          {/* Donut Progress Visual */}
          <div className="space-y-4 py-2">
            {/* Multi-segmented distribution bar */}
            <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              {statuses.map((st) => {
                const pct = totalCount > 0 ? (st.count / totalCount) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={st.key}
                    style={{ width: `${pct}%`, backgroundColor: st.color === 'var(--color-brand)' ? '#0f766e' : st.color }}
                    className="h-full border-r border-white last:border-0"
                    title={`${st.label}: ${st.count} (${pct.toFixed(0)}%)`}
                  />
                )
              })}
            </div>

            {/* Status Item Breakdown */}
            <div className="space-y-2.5 pt-2">
              {statuses.map((st) => {
                const pct = totalCount > 0 ? ((st.count / totalCount) * 100).toFixed(0) : '0'
                const displayColor = st.color === 'var(--color-brand)' ? '#0f766e' : st.color
                return (
                  <div key={st.key} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: displayColor }} />
                      <span className="text-slate-700 font-semibold">{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-extrabold text-slate-900">{st.count}</span>
                      <span className="text-[10px] text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Collateral Overview Strip */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs space-y-1">
            <p className="text-[10px] uppercase font-semibold text-teal-800 tracking-wider">Collateral Coverage (LTV Ratio)</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Land Collateral Value:</span>
              <span className="font-mono font-extrabold text-teal-900">{formatRM(totalCagaran)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Overdue Attention List ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Facilities Requiring Action &amp; Highest Arrears
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Priority follow-up list for high-risk records
            </p>
          </div>
          <Link href="/dashboard/fasiliti?status=tertunggak" className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1">
            View All Overdue
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {overdueList.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center italic">
            All facilities are on track with no critical arrears.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider bg-slate-50/80 text-[11px] font-semibold">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Borrower / Contractor</th>
                  <th className="px-4 py-3 font-semibold">Financier</th>
                  <th className="px-4 py-3 font-semibold text-right">Financing (RM)</th>
                  <th className="px-4 py-3 font-semibold text-right">Arrears (RM)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {overdueList.map((item) => (
                  <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">
                      {item.kod_rujukan}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {item.nama_peminjam}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.pembiaya_modal}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatRM(item.jumlah_pembiayaan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600 bg-red-50/50">
                      {formatRM(item.jumlah_tunggakan_semasa)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        {item.status_fasiliti === 'tindakan_guaman' ? 'Legal Action' : 'Overdue'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/dashboard/fasiliti/${item.id}`} className="text-[12px] font-bold text-teal-700 hover:underline">
                        Open &rarr;
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
