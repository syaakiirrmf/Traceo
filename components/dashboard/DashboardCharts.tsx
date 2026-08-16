'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

function formatRM(val: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

function formatRMShort(val: number): string {
  if (val >= 1_000_000) return `RM ${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `RM ${(val / 1_000).toFixed(0)}K`
  return formatRM(val)
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

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-bold text-slate-900 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-bold text-slate-900">{formatRM(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-slate-900">{item.name}</span>
        <span className="font-mono font-bold text-slate-700">{item.value}</span>
      </div>
    </div>
  )
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
  const totalCount = statuses.reduce((s, c) => s + c.count, 0)

  const barData = categories.map((c) => ({
    name: c.name,
    href: c.href,
    Financing: c.pembiayaan,
    Arrears: c.tunggakan,
  }))

  const pieData = statuses
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      value: s.count,
      color: s.color === 'var(--color-brand)' ? '#0066FF' : s.color,
    }))

  return (
    <div className="space-y-6">
      {/* â”€â”€ Section 1: Financial & Status Charts Grid â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: BarChart â€” Financing vs Arrears */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-fustat font-black text-slate-900">
                Financing &amp; Arrears by Category
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Committed funds vs outstanding arrears
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              JV1 &bull; JV2 &bull; JV3
            </span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatRMShort}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="Financing" fill="#0066FF" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="Arrears" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={cat.href}
                transitionTypes={['nav-forward']}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-[#0066FF] transition-colors"
              >
                <span>{cat.name}</span>
                <span className="text-slate-400 font-normal">({cat.count})</span>
                <ArrowUpRight size={11} />
              </Link>
            ))}
            <span className="ml-auto text-[10px] text-slate-400 italic self-center">
              Auto-updated
            </span>
          </div>
        </div>

        {/* Chart 2: PieChart Donut â€” Facility Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Overall Facility Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of active records ({totalCount} Facilities)
            </p>
          </div>

          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {statuses.map((st) => {
              const pct = totalCount > 0 ? ((st.count / totalCount) * 100).toFixed(0) : '0'
              const displayColor = st.color === 'var(--color-brand)' ? '#0066FF' : st.color
              return (
                <div
                  key={st.key}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: displayColor }}
                    />
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

          <div className="p-3.5 rounded-xl bg-[#EBF2FF]/80 border border-[#0066FF]/20 text-xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#0066FF] tracking-wider">
              Collateral Coverage (LTV Ratio)
            </p>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Land Collateral Value:</span>
              <span className="font-mono font-extrabold text-[#0066FF]">
                {formatRM(totalCagaran)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Section 2: Overdue Attention List â”€â”€ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-fustat font-black text-slate-900">
              Facilities Requiring Action &amp; Highest Arrears
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Priority follow-up list for high-risk records
            </p>
          </div>
          <Link
            href="/dashboard/fasiliti?status=tertunggak"
            transitionTypes={['nav-forward']}
            className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
          >
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
                  <tr key={item.id} className="hover:bg-[#EBF2FF]/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0066FF]">
                      {item.kod_rujukan}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.nama_peminjam}</td>
                    <td className="px-4 py-3 text-slate-600">{item.pembiaya_modal}</td>
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
                      <Link
                        href={`/dashboard/fasiliti/${item.id}`}
                        transitionTypes={['nav-forward']}
                        className="text-[12px] font-bold text-[#0066FF] hover:underline"
                      >
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
