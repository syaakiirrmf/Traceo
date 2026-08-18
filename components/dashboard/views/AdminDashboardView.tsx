'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Landmark,
  UserRound,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  FileText,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts, MonthlyTrendChart, type MonthlyTrendPoint } from '@/components/dashboard/DashboardCharts'

export interface AdminDashboardViewProps {
  totalPembiayaan: number
  totalTunggakan: number
  totalCagaran: number
  usersCount: number
  auditCount: number
  fasilitiList: Array<{
    id: string
    kod_rujukan: string
    kategori: string
    nama_peminjam: string
    pembiaya_modal: string
    jumlah_pembiayaan: number
    jumlah_tunggakan_semasa: number
    status_fasiliti: string
  }>
  categoryData: Array<{
    name: string
    key: string
    href: string
    count: number
    pembiayaan: number
    tunggakan: number
  }>
  statusData: Array<{
    label: string
    key: string
    count: number
    color: string
  }>
  overdueList: Array<{
    id: string
    kod_rujukan: string
    nama_peminjam: string
    pembiaya_modal: string
    jumlah_pembiayaan: number
    kategori: string
    jumlah_tunggakan_semasa: number
    status_fasiliti: string
  }>
  kpi: {
    arrearsRatio: number
    collectionRate: number
    activeCount: number
    overdueCount: number
    legalCount: number
    avgFinancing: number
  }
  topFinanciers: Array<{
    nama: string
    count: number
    pembiayaan: number
    tunggakan: number
  }>
  maxFinancierExposure: number
  monthlyTrend: MonthlyTrendPoint[]
  approvalStats: { menunggu: number; diluluskan: number; ditolak: number }
}

export function AdminDashboardView({
  totalPembiayaan,
  totalTunggakan,
  totalCagaran,
  usersCount,
  auditCount,
  fasilitiList,
  categoryData,
  statusData,
  overdueList,
  kpi,
  topFinanciers,
  maxFinancierExposure,
  monthlyTrend,
  approvalStats,
}: AdminDashboardViewProps) {
  const activeCount = fasilitiList.filter((f) => f.status_fasiliti === 'aktif').length
  const approvalTotal =
    approvalStats.menunggu + approvalStats.diluluskan + approvalStats.ditolak
  const approvalPendingPct =
    approvalTotal > 0 ? (approvalStats.menunggu / approvalTotal) * 100 : 0

  return (
    <div className="space-y-6 max-w-[1600px] p-6 font-dm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border border-[#0066FF]/20 bg-[#EBF2FF] text-[#0066FF]">
              <ShieldCheck size={12} />
              Executive Management &bull; Admin Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-fustat font-black tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Full control of the database, user management, system audit logs, and JV finances.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-200 shadow-xs"
          >
            <Users size={14} className="text-[#0066FF]" />
            Manage Users ({usersCount})
          </Link>
          <Link
            href="/dashboard/audit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-200 shadow-xs"
          >
            <FileText size={14} className="text-[#0066FF]" />
            Audit Log
          </Link>
          <Link
            href="/dashboard/fasiliti/tambah"
            className="inline-flex items-center gap-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-all duration-200 shadow-xs font-fustat px-4"
          >
            <Plus size={14} />+ Add Facility
          </Link>
        </div>
      </div>

      {/* Admin Executive KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Capital */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Financed Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {formatCurrency(totalPembiayaan)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{fasilitiList.length} facilities registered</p>
        </div>

        {/* Total Arrears */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Arrears Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-rose-600 tracking-tight">
            {formatCurrency(totalTunggakan)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total current arrears</p>
        </div>

        {/* Land Collateral */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Land Collateral Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Landmark size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {formatCurrency(totalCagaran)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Registered property collateral value</p>
        </div>

        {/* System & Users Status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              System &amp; Users Status
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {usersCount} Users
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Audit logs: <span className="font-bold text-slate-700">{auditCount} records</span>
          </p>
        </div>
      </div>

      {/* Admin KPI Ratio Band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0066FF]/[0.06] to-transparent border border-[#0066FF]/15">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Arrears Ratio
          </p>
          <p className="mt-1.5 text-2xl font-fustat font-black text-slate-900 tabular-nums">
            {kpi.arrearsRatio.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arrears versus financing
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] to-transparent border border-emerald-500/15">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Collection Rate
          </p>
          <p className="mt-1.5 text-2xl font-fustat font-black text-emerald-600 tabular-nums">
            {kpi.collectionRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Portion of financing collected
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/[0.06] to-transparent border border-rose-500/15">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            At-Risk Portfolio
          </p>
          <p className="mt-1.5 text-2xl font-fustat font-black text-rose-600 tabular-nums">
            {kpi.overdueCount + kpi.legalCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {kpi.overdueCount} overdue · {kpi.legalCount} legal action
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/[0.06] to-transparent border border-purple-500/15">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Avg Financing
          </p>
          <p className="mt-1.5 text-2xl font-fustat font-black text-slate-900 tabular-nums">
            {formatCurrency(kpi.avgFinancing)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Average per facility
          </p>
        </div>
      </div>

      {/* Admin Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DashboardCharts
            categories={categoryData}
            statuses={statusData}
            totalCagaran={totalCagaran}
            overdueList={overdueList}
          />
          <div className="mt-4">
            <MonthlyTrendChart data={monthlyTrend} />
          </div>
        </div>

        {/* Top Financiers by Exposure */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top Financiers by Exposure
            </span>
            <Landmark size={16} className="text-[#0066FF]" />
          </div>
          <div className="space-y-4">
            {topFinanciers.map((f) => {
              const pct = (f.pembiayaan / maxFinancierExposure) * 100
              return (
                <div key={f.nama}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{f.nama}</p>
                    <p className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(f.pembiayaan)}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.tunggakan > 0 ? 'bg-rose-500/70' : 'bg-[#0066FF]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    {f.count} facilities · Arrears {formatCurrency(f.tunggakan)}
                  </p>
                </div>
              )
            })}
            {topFinanciers.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No financier data.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Approval Pipeline */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Follow-up Approval Pipeline
          </span>
          <ClipboardCheck size={16} className="text-[#0066FF]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Pending Approval
            </p>
            <p className="mt-1.5 text-2xl font-fustat font-black text-amber-600 tabular-nums">
              {approvalStats.menunggu}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              {approvalPendingPct.toFixed(0)}% of all follow-ups
            </p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Approved
            </p>
            <p className="mt-1.5 text-2xl font-fustat font-black text-emerald-600 tabular-nums">
              {approvalStats.diluluskan}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">Follow-ups approved</p>
          </div>
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Rejected
            </p>
            <p className="mt-1.5 text-2xl font-fustat font-black text-rose-600 tabular-nums">
              {approvalStats.ditolak}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">Follow-ups rejected</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden flex">
          {approvalTotal > 0 && (
            <>
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(approvalStats.menunggu / approvalTotal) * 100}%` }}
              />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(approvalStats.diluluskan / approvalTotal) * 100}%` }}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${(approvalStats.ditolak / approvalTotal) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
