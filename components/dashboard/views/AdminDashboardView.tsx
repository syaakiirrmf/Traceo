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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

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
}: AdminDashboardViewProps) {
  const activeCount = fasilitiList.filter((f) => f.status_fasiliti === 'aktif').length

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
            Kawalan penuh pangkalan data, pengurusan pengguna, log audit sistem, dan kewangan JV.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/users"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-200 shadow-xs"
          >
            <Users size={14} className="text-[#0066FF]" />
            Manage Users ({usersCount})
          </Link>
          <Link
            href="/dashboard/audit"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-200 shadow-xs"
          >
            <FileText size={14} className="text-[#0066FF]" />
            Audit Log
          </Link>
          <Link
            href="/dashboard/fasiliti/tambah"
            transitionTypes={['nav-forward']}
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
          <p className="text-xs text-slate-500 mt-1">{fasilitiList.length} fasiliti didaftarkan</p>
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
          <p className="text-xs text-slate-500 mt-1">Tunggakan semasa keseluruhan</p>
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
          <p className="text-xs text-slate-500 mt-1">Nilai cagaran hartanah didaftarkan</p>
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
            Audit logs: <span className="font-bold text-slate-700">{auditCount} rekod</span>
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
            Tunggakan berbanding pembiayaan
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
            Bahagian pembiayaan terkumpul
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
            Purata setiap fasiliti
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
                    {f.count} fasiliti · Arrears {formatCurrency(f.tunggakan)}
                  </p>
                </div>
              )
            })}
            {topFinanciers.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Tiada data financier.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
