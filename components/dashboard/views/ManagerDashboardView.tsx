'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Landmark,
  UserRound,
  MapPin,
  Plus,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export interface ManagerDashboardViewProps {
  totalPembiayaan: number
  totalTunggakan: number
  totalCagaran: number
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

const STATUS_LABELS = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
} as const

const STATUS_STYLES = {
  aktif: 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/20',
  tertunggak: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  tindakan_guaman: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  selesai: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
} as const

export function ManagerDashboardView({
  totalPembiayaan,
  totalTunggakan,
  totalCagaran,
  fasilitiList,
  categoryData,
  statusData,
  overdueList,
}: ManagerDashboardViewProps) {
  const activeCount = fasilitiList.filter((f) => f.status_fasiliti === 'aktif').length
  const overdueCount = fasilitiList.filter(
    (f) => f.status_fasiliti === 'tertunggak' || f.status_fasiliti === 'tindakan_guaman'
  ).length

  return (
    <div className="space-y-6 max-w-[1600px] p-6 font-dm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border border-[#0066FF]/20 bg-[#EBF2FF] text-[#0066FF]">
              <Briefcase size={12} />
              JV Operations &bull; Management Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-fustat font-black tracking-tight text-slate-900">
            Management Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengurusan operasi fasiliti, penyeliaan pegawai, dan pemantauan akaun tertunggak.
          </p>
        </div>

        {/* Quick Manager Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/tanah-jv"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-200 shadow-xs"
          >
            <MapPin size={14} className="text-[#0066FF]" />
            MD Land (JV)
          </Link>
          <Link
            href="/dashboard/fasiliti/tambah"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-all duration-200 shadow-xs font-fustat"
          >
            <Plus size={14} />+ Add Facility
          </Link>
        </div>
      </div>

      {/* Manager Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Active Accounts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Facilities
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {activeCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Jumlah pembiayaan:{' '}
            <span className="font-semibold text-slate-700">{formatCurrency(totalPembiayaan)}</span>
          </p>
        </div>

        {/* Overdue Accounts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overdue Accounts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-amber-600 tracking-tight">
            {overdueCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Memerlukan penugasan &amp; tindak susulan</p>
        </div>

        {/* Total Arrears */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Arrears Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-rose-600 tracking-tight">
            {formatCurrency(totalTunggakan)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sasaran kutipan pengurus</p>
        </div>

        {/* Collateral Value */}
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
          <p className="text-xs text-slate-500 mt-1">Liputan cagaran hartanah</p>
        </div>
      </div>

      {/* Category Breakdown & Operations Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts
            categories={categoryData}
            statuses={statusData}
            totalCagaran={totalCagaran}
            overdueList={overdueList}
          />
        </div>

        {/* Actionable Overdue Accounts List */}
        <div className="space-y-4">
          <h2 className="text-base font-fustat font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            Tunggakan Perlu Tindakan ({overdueList.length})
          </h2>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            {overdueList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tiada akaun tertunggak setakat ini.
              </p>
            ) : (
              overdueList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#0066FF]">
                        {item.kod_rujukan}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[item.status_fasiliti as keyof typeof STATUS_STYLES]}`}
                      >
                        {STATUS_LABELS[item.status_fasiliti as keyof typeof STATUS_LABELS] ||
                          item.status_fasiliti}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{item.nama_peminjam}</p>
                    <p className="text-xs font-bold text-rose-600 mt-0.5">
                      {formatCurrency(item.jumlah_tunggakan_semasa)}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/fasiliti/${item.id}`}
                    transitionTypes={['nav-forward']}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-colors flex-shrink-0"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
