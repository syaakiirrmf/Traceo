'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Landmark,
  UserRound,
  MapPin,
  Eye,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export interface ViewerDashboardViewProps {
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
}

export function ViewerDashboardView({
  totalPembiayaan,
  totalTunggakan,
  totalCagaran,
  fasilitiList,
  categoryData,
  statusData,
}: ViewerDashboardViewProps) {
  const activeCount = fasilitiList.filter((f) => f.status_fasiliti === 'aktif').length
  const totalCount = fasilitiList.length
  const healthyRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100

  return (
    <div className="space-y-6 max-w-[1600px] p-6 font-dm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
              <Eye size={12} />
              Portfolio Overview &bull; Read-Only Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-fustat font-black tracking-tight text-slate-900">
            Portfolio Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Paparan analitik portfolio dan muat turun laporan untuk rujukan &amp; mesyuarat.
          </p>
        </div>

        {/* Quick Report Download Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/summary"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-all duration-200 shadow-xs font-fustat"
          >
            <FileSpreadsheet size={14} />
            Pusat Ringkasan &amp; Laporan
          </Link>
        </div>
      </div>

      {/* Viewer Analytical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Portfolio Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Portfolio Financed
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {formatCurrency(totalPembiayaan)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Nilai cagaran hartanah:{' '}
            <span className="font-bold text-slate-700">{formatCurrency(totalCagaran)}</span>
          </p>
        </div>

        {/* Active Accounts Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Portfolio Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-emerald-600 tracking-tight">
            {healthyRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeCount} daripada {totalCount} fasiliti berstatus aktif
          </p>
        </div>

        {/* Arrears Summary */}
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
          <p className="text-xs text-slate-500 mt-1">Tunggakan semasa keseluruhan akaun</p>
        </div>
      </div>

      {/* Category Summary Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categoryData.map((cat) => (
          <div
            key={cat.key}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-fustat font-bold text-sm text-slate-900">{cat.name}</h3>
              <span className="text-xs font-bold text-[#0066FF] bg-[#EBF2FF] px-2.5 py-0.5 rounded-full">
                {cat.count} akaun
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pembiayaan:{' '}
              <span className="font-semibold text-slate-800">{formatCurrency(cat.pembiayaan)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tunggakan:{' '}
              <span className="font-semibold text-rose-600">{formatCurrency(cat.tunggakan)}</span>
            </p>
            <Link
              href={cat.href}
              className="mt-3 text-xs font-bold text-[#0066FF] hover:underline inline-flex items-center gap-1"
            >
              Lihat Ringkasan Kategori <ExternalLink size={12} />
            </Link>
          </div>
        ))}
      </div>

      {/* Read-Only Charts & Read-Only Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts
            categories={categoryData}
            statuses={statusData}
            totalCagaran={totalCagaran}
            overdueList={[]}
          />
        </div>

        {/* Quick Report Download Center Card */}
        <div className="space-y-4">
          <h2 className="text-base font-fustat font-bold text-slate-900 flex items-center gap-2">
            <Download size={16} className="text-[#0066FF]" />
            Pusat Muat Turun Laporan
          </h2>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Jana dan muat turun laporan kronologi penuh berformat PDF dan Word (.docx) mengikut
              kategori:
            </p>

            <Link
              href="/dashboard/summary/jv1"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-[#EBF2FF] hover:border-[#0066FF]/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Building2 size={16} className="text-[#0066FF]" />
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0066FF]">
                  Laporan Summary JV 1
                </span>
              </div>
              <Download size={14} className="text-slate-400 group-hover:text-[#0066FF]" />
            </Link>

            <Link
              href="/dashboard/summary/jv2"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-[#EBF2FF] hover:border-[#0066FF]/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Landmark size={16} className="text-[#0066FF]" />
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0066FF]">
                  Laporan Land JV
                </span>
              </div>
              <Download size={14} className="text-slate-400 group-hover:text-[#0066FF]" />
            </Link>

            <Link
              href="/dashboard/summary/jv3"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-[#EBF2FF] hover:border-[#0066FF]/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <UserRound size={16} className="text-[#0066FF]" />
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0066FF]">
                  Laporan Personal Loan
                </span>
              </div>
              <Download size={14} className="text-slate-400 group-hover:text-[#0066FF]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
