'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ShieldAlert,
  Landmark,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
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
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
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
  return `RM ${val}`
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

// â”€â”€ Custom Tooltip for BarChart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const financing = payload.find((p) => p.dataKey === 'Financing')?.value ?? 0
  const arrears = payload.find((p) => p.dataKey === 'Arrears')?.value ?? 0
  const arrearsRatio = financing > 0 ? ((arrears / financing) * 100).toFixed(1) : '0'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-3.5 text-xs min-w-[200px] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-2.5">
        <span className="font-bold text-[var(--color-text-primary)] font-fustat text-sm">
          {label}
        </span>
        {Number(arrearsRatio) > 0 ? (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {arrearsRatio}% Arrears
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Healthy
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-500" />
            Total Financing:
          </span>
          <span className="font-mono font-bold text-[var(--color-text-primary)]">
            {formatRM(financing)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-rose-500 to-red-600" />
            Total Arrears:
          </span>
          <span
            className={`font-mono font-bold ${
              arrears > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-text-primary)]'
            }`}
          >
            {formatRM(arrears)}
          </span>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Custom Tooltip for PieChart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl px-3 py-2 text-xs backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-[var(--color-text-primary)]">{item.name}:</span>
        <span className="font-mono font-bold text-[var(--color-text-primary)]">{item.value} records</span>
        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">({pct}%)</span>
      </div>
    </div>
  )
}

type ChartViewMode = 'all' | 'financing' | 'arrears'

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
  const [viewMode, setViewMode] = useState<ChartViewMode>('all')

  const totalCount = statuses.reduce((s, c) => s + c.count, 0)
  const activeCount = statuses.find((s) => s.key === 'aktif')?.count ?? 0
  const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0

  const barData = categories.map((c) => ({
    name: c.name,
    key: c.key,
    href: c.href,
    count: c.count,
    Financing: c.pembiayaan,
    Arrears: c.tunggakan,
  }))

  const STATUS_COLORS: Record<string, string> = {
    aktif: '#10B981', // Emerald
    tertunggak: '#F59E0B', // Amber
    tindakan_guaman: '#EF4444', // Rose
    selesai: '#6366F1', // Indigo
  }

  const pieData = statuses
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      key: s.key,
      value: s.count,
      color: STATUS_COLORS[s.key] ?? s.color,
    }))

  return (
    <div className="space-y-6 font-dm">
      {/* â”€â”€ Section 1: Financial & Status Charts Grid â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: BarChart â€” Financing & Arrears */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          {/* Header & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
                <h2 className="text-base font-fustat font-bold text-[var(--color-text-primary)]">
                  Portfolio Capital &amp; Risk Distribution
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Comparison of committed capital financing vs outstanding arrears
              </p>
            </div>

            {/* View Mode Toggle Pills */}
            <div className="flex items-center bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-1 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === 'all'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs border border-[var(--color-border)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Comparison
              </button>
              <button
                type="button"
                onClick={() => setViewMode('financing')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === 'financing'
                    ? 'bg-[var(--color-brand)] text-white shadow-xs'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Financing
              </button>
              <button
                type="button"
                onClick={() => setViewMode('arrears')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === 'arrears'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Arrears
              </button>
            </div>
          </div>

          {/* Main Bar Chart Container */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                barGap={8}
                margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="financingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="arrearsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                    <stop offset="100%" stopColor="#BE123C" stopOpacity={0.85} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                  opacity={0.6}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontWeight: 600 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                  dy={6}
                />

                <YAxis
                  tickFormatter={formatRMShort}
                  tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />

                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: 'var(--color-surface-raised)', opacity: 0.4 }}
                />

                {(viewMode === 'all' || viewMode === 'financing') && (
                  <Bar
                    dataKey="Financing"
                    name="Capital Financing"
                    fill="url(#financingGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={viewMode === 'all' ? 36 : 54}
                    animationDuration={600}
                  />
                )}

                {(viewMode === 'all' || viewMode === 'arrears') && (
                  <Bar
                    dataKey="Arrears"
                    name="Outstanding Arrears"
                    fill="url(#arrearsGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={viewMode === 'all' ? 36 : 54}
                    animationDuration={600}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Category Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[var(--color-border)]">
            {categories.map((cat) => {
              const hasArrears = cat.tunggakan > 0
              return (
                <Link
                  key={cat.key}
                  href={cat.href}
                  className="group flex flex-col justify-between p-3 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)]/80 border border-[var(--color-border)] hover:border-[var(--color-brand)]/40 transition-all shadow-2xs no-underline"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-colors truncate">
                      {cat.name}
                    </span>
                    <ArrowUpRight
                      size={13}
                      className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-text-tertiary)]">Financing:</span>
                      <span className="font-mono font-bold text-[var(--color-text-primary)]">
                        {formatRM(cat.pembiayaan)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-text-tertiary)]">Arrears:</span>
                      {hasArrears ? (
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatRM(cat.tunggakan)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} /> 0.00
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Chart 2: Donut Chart â€” Overall Status Health */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-fustat font-bold text-[var(--color-text-primary)]">
                Portfolio Status
              </h2>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-brand)]/20">
                {activePct}% Active
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Current operational state across {totalCount} facilities
            </p>
          </div>

          {/* Donut with Center Stats Label */}
          <div className="relative flex items-center justify-center my-1">
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip total={totalCount} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Centered Stat Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-fustat text-[var(--color-text-primary)] leading-none">
                {totalCount}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-tertiary)] mt-1">
                Facilities
              </span>
            </div>
          </div>

          {/* Status Breakdown Legend Rows */}
          <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
            {statuses.map((st) => {
              const pct = totalCount > 0 ? ((st.count / totalCount) * 100).toFixed(0) : '0'
              const displayColor = STATUS_COLORS[st.key] ?? st.color
              return (
                <div
                  key={st.key}
                  className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: displayColor }}
                    />
                    <span className="text-[var(--color-text-secondary)] font-semibold">
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[var(--color-text-primary)]">{st.count}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">({pct}%)</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Collateral Coverage Card */}
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Landmark size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider truncate">
                  Land Collateral (LTV)
                </p>
                <p className="font-mono font-bold text-[var(--color-text-primary)] text-sm truncate">
                  {formatRM(totalCagaran)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Section 2: Overdue Attention List â”€â”€ */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert size={17} />
            </div>
            <div>
              <h2 className="text-base font-fustat font-bold text-[var(--color-text-primary)]">
                Action-Required &amp; Priority Overdue Facilities
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Immediate follow-up priority list for high-risk accounts
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/fasiliti?status=tertunggak"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand)] hover:underline"
          >
            <span>View All Overdue</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {overdueList.length === 0 ? (
          <div className="p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-bold text-[var(--color-text-primary)]">
              Clean Portfolio Status
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] max-w-sm mx-auto">
              All facilities are currently on schedule with no critical overdue arrears.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] text-[10px] font-bold">
                  <th className="px-4 py-3.5">Ref Code</th>
                  <th className="px-4 py-3.5">Borrower / Contractor</th>
                  <th className="px-4 py-3.5">Capital Financier</th>
                  <th className="px-4 py-3.5 text-right">Committed Capital</th>
                  <th className="px-4 py-3.5 text-right">Current Arrears</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {overdueList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-raised)]/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[var(--color-brand)]">
                      {item.kod_rujukan}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[var(--color-text-primary)]">
                      {item.nama_peminjam}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">
                      {item.pembiaya_modal}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-[var(--color-text-primary)]">
                      {formatRM(item.jumlah_pembiayaan)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/5">
                      {formatRM(item.jumlah_tunggakan_semasa)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertTriangle size={10} />
                        {item.status_fasiliti === 'tindakan_guaman' ? 'Legal Action' : 'Overdue'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        href={`/dashboard/fasiliti/${item.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-brand)] hover:underline"
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

export interface MonthlyTrendPoint {
  label: string
  count: number
  pembiayaan: number
  tunggakan: number
}

// ─── Monthly Trend Area Chart ───────────────────────────────────────────────
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const financing = payload.find((p) => p.dataKey === 'pembiayaan')?.value ?? 0
  const arrears = payload.find((p) => p.dataKey === 'tunggakan')?.value ?? 0
  const count = payload.find((p) => p.dataKey === 'count')?.value ?? 0
  const ratio = financing > 0 ? ((arrears / financing) * 100).toFixed(1) : '0'
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-3.5 text-xs min-w-[200px] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-2.5">
        <span className="font-bold text-[var(--color-text-primary)] font-fustat text-sm">
          {label}
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
          {count} new
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-text-secondary)]">Financing:</span>
          <span className="font-mono font-bold text-[var(--color-text-primary)]">
            {formatRM(financing)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-text-secondary)]">Arrears:</span>
          <span
            className={`font-mono font-bold ${arrears > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-text-primary)]'}`}
          >
            {formatRM(arrears)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-text-secondary)]">Arrears ratio:</span>
          <span className="font-mono font-bold text-[var(--color-text-primary)]">{ratio}%</span>
        </div>
      </div>
    </div>
  )
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  if (!data || data.length === 0) return null
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <h2 className="text-base font-fustat font-bold text-[var(--color-text-primary)]">
          Monthly Portfolio Growth Trend
        </h2>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">
        Financing and arrears added over the last 12 months
      </p>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFinancing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trendArrears" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
              dy={6}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatRMShort}
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="pembiayaan"
              name="Financing"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#trendFinancing)"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="tunggakan"
              name="Arrears"
              stroke="#F43F5E"
              strokeWidth={2}
              fill="url(#trendArrears)"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
