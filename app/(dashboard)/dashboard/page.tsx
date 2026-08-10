import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Landmark, UserRound, MapPin, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Executive Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  // Fetch all fasiliti + tanah_jv in parallel
  const [{ data: allFasiliti }, { data: allTanah }] = await Promise.all([
    supabase
      .from('fasiliti')
      .select('id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, dicipta_pada'),
    supabase
      .from('tanah_jv')
      .select('id, anggaran_nilaian'),
  ])

  const fasilitiList = allFasiliti ?? []
  const tanahList = allTanah ?? []

  // Total metrics
  const totalPembiayaan = fasilitiList.reduce((s, f) => s + (Number(f.jumlah_pembiayaan) || 0), 0)
  const totalTunggakan = fasilitiList.reduce((s, f) => s + (Number(f.jumlah_tunggakan_semasa) || 0), 0)
  const totalCagaran = tanahList.reduce((s, t) => s + (Number(t.anggaran_nilaian) || 0), 0)

  // Status counts
  const statusCounts = {
    aktif: 0,
    tertunggak: 0,
    tindakan_guaman: 0,
    selesai: 0,
  }

  for (const f of fasilitiList) {
    if (f.status_fasiliti in statusCounts) {
      statusCounts[f.status_fasiliti as keyof typeof statusCounts] += 1
    }
  }

  // Category breakdown
  const jv1 = fasilitiList.filter((f) => f.kategori === 'jv_syarikat')
  const jv2 = fasilitiList.filter((f) => f.kategori === 'jv_tanah')
  const jv3 = fasilitiList.filter((f) => f.kategori === 'pinjaman_individu')

  const sumKey = (arr: Array<Record<string, unknown>>, key: string) => arr.reduce((s, r) => s + (Number(r[key]) || 0), 0)

  const categoryData = [
    {
      name: 'Summary JV 1 (Company)',
      key: 'jv1',
      href: '/dashboard/summary/jv1',
      count: jv1.length,
      pembiayaan: sumKey(jv1, 'jumlah_pembiayaan'),
      tunggakan: sumKey(jv1, 'jumlah_tunggakan_semasa'),
    },
    {
      name: 'Land JV',
      key: 'jv2',
      href: '/dashboard/summary/jv2',
      count: jv2.length,
      pembiayaan: sumKey(jv2, 'jumlah_pembiayaan'),
      tunggakan: sumKey(jv2, 'jumlah_tunggakan_semasa'),
    },
    {
      name: 'Personal Loan',
      key: 'jv3',
      href: '/dashboard/summary/jv3',
      count: jv3.length,
      pembiayaan: sumKey(jv3, 'jumlah_pembiayaan'),
      tunggakan: sumKey(jv3, 'jumlah_tunggakan_semasa'),
    },
  ]

  const statusData = [
    { label: 'Active', key: 'aktif', count: statusCounts.aktif, color: 'var(--color-brand)' },
    { label: 'Overdue', key: 'tertunggak', count: statusCounts.tertunggak, color: 'var(--color-warning)' },
    { label: 'Legal Action', key: 'tindakan_guaman', count: statusCounts.tindakan_guaman, color: 'var(--color-danger)' },
    { label: 'Completed', key: 'selesai', count: statusCounts.selesai, color: 'var(--color-text-tertiary)' },
  ]

  // Top overdue list (sorted by highest arrears)
  const overdueList = fasilitiList
    .filter((f) => Number(f.jumlah_tunggakan_semasa) > 0)
    .sort((a, b) => Number(b.jumlah_tunggakan_semasa) - Number(a.jumlah_tunggakan_semasa))
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-[1600px] p-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-teal-200/80 bg-teal-50/80 text-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
              Facility Management &amp; JV Portfolio
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Main Dashboard
          </h1>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/summary/jv1"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-teal-300 hover:shadow-xs transition-all duration-200 shadow-2xs"
          >
            <Building2 size={14} className="text-teal-700" />
            Summary JV 1
          </Link>
          <Link
            href="/dashboard/summary/jv2"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-teal-300 hover:shadow-xs transition-all duration-200 shadow-2xs"
          >
            <Landmark size={14} className="text-teal-700" />
            Land JV
          </Link>
          <Link
            href="/dashboard/summary/jv3"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-teal-300 hover:shadow-xs transition-all duration-200 shadow-2xs"
          >
            <UserRound size={14} className="text-teal-700" />
            Personal Loan
          </Link>
          <Link
            href="/dashboard/tanah-jv"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-teal-300 hover:shadow-xs transition-all duration-200 shadow-2xs"
          >
            <MapPin size={14} className="text-teal-700" />
            MD Land (JV)
          </Link>
          <Link
            href="/dashboard/fasiliti/tambah"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            <Plus size={14} />
            + Add Facility
          </Link>
        </div>
      </div>

      {/* KPI Key Metric Bands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-teal-200 transition-all duration-200 min-w-0 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider truncate">Total Facilities</p>
          <p className="text-lg sm:text-xl xl:text-2xl font-extrabold font-mono text-slate-900 mt-1 truncate min-w-0" title={`${fasilitiList.length} Records`}>
            {fasilitiList.length} Records
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">{statusCounts.aktif} Active · {statusCounts.tertunggak + statusCounts.tindakan_guaman} At Risk</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-teal-200 transition-all duration-200 min-w-0 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider truncate">Total Capital Financing</p>
          <p className="text-lg sm:text-xl xl:text-2xl font-extrabold font-mono text-teal-700 mt-1 truncate min-w-0" title={formatCurrency(totalPembiayaan)}>
            {formatCurrency(totalPembiayaan)}
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">Across All JV Categories</p>
        </div>

        <div className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all duration-200 min-w-0 flex flex-col justify-between ${totalTunggakan > 0 ? 'border-l-4 border-l-red-500 border-slate-200/80' : 'border-slate-200/80'}`}>
          <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider truncate">Total Current Arrears</p>
          <p className={`text-lg sm:text-xl xl:text-2xl font-extrabold font-mono mt-1 truncate min-w-0 ${totalTunggakan > 0 ? 'text-red-600' : 'text-slate-900'}`} title={formatCurrency(totalTunggakan)}>
            {formatCurrency(totalTunggakan)}
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">{overdueList.length} Facilities Requiring Action</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-teal-200 transition-all duration-200 min-w-0 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider truncate">Total Collateral Value</p>
          <p className="text-lg sm:text-xl xl:text-2xl font-extrabold font-mono text-slate-900 mt-1 truncate min-w-0" title={formatCurrency(totalCagaran)}>
            {formatCurrency(totalCagaran)}
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">{tanahList.length} MD Land Lots (JV)</p>
        </div>
      </div>

      {/* Interactive Charts & Overdue Table */}
      <DashboardCharts
        categories={categoryData}
        statuses={statusData}
        totalCagaran={totalCagaran}
        overdueList={overdueList}
      />
    </div>
  )
}
