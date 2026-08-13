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

      {/* Admin Charts Section */}
      <DashboardCharts
        categories={categoryData}
        statuses={statusData}
        totalCagaran={totalCagaran}
        overdueList={overdueList}
      />
    </div>
  )
}
