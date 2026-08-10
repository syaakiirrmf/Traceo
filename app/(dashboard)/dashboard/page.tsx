import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Landmark, UserRound, MapPin, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { hasPermission } from '@/lib/auth/permissions'
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

  const canAddFacility = hasPermission(userProfile.peranan, 'tambah_fasiliti')

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
    <div className="space-y-6 max-w-[1600px] p-6 font-dm">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border border-[#0066FF]/20 bg-[#EBF2FF] text-[#0066FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse"></span>
              Facility Management &amp; JV Portfolio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-fustat font-black tracking-tight text-slate-900">
            Main Dashboard
          </h1>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/summary/jv1"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 hover:shadow-xs transition-all duration-200 shadow-xs"
          >
            <Building2 size={14} className="text-[#0066FF]" />
            Summary JV 1
          </Link>
          <Link
            href="/dashboard/summary/jv2"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 hover:shadow-xs transition-all duration-200 shadow-xs"
          >
            <Landmark size={14} className="text-[#0066FF]" />
            Land JV
          </Link>
          <Link
            href="/dashboard/summary/jv3"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 hover:shadow-xs transition-all duration-200 shadow-xs"
          >
            <UserRound size={14} className="text-[#0066FF]" />
            Personal Loan
          </Link>
          <Link
            href="/dashboard/tanah-jv"
            transitionTypes={['nav-forward']}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF]/30 hover:shadow-xs transition-all duration-200 shadow-xs"
          >
            <MapPin size={14} className="text-[#0066FF]" />
            MD Land (JV)
          </Link>
          {canAddFacility && (
            <Link
              href="/dashboard/fasiliti/tambah"
              transitionTypes={['nav-forward']}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-all duration-200 shadow-xs hover:shadow-md font-fustat"
            >
              <Plus size={14} />
              + Add Facility
            </Link>
          )}
        </div>
      </div>

      {/* KPI Key Metric Bands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0066FF]/30 transition-all duration-200 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">Total Facilities</p>
          <p className="text-xl xl:text-2xl font-fustat font-black text-slate-900 mt-1 truncate" title={`${fasilitiList.length} Records`}>
            {fasilitiList.length} Records
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">{statusCounts.aktif} Active · {statusCounts.tertunggak + statusCounts.tindakan_guaman} At Risk</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0066FF]/30 transition-all duration-200 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">Total Capital Financing</p>
          <p className="text-xl xl:text-2xl font-fustat font-black text-[#0066FF] mt-1 truncate" title={formatCurrency(totalPembiayaan)}>
            {formatCurrency(totalPembiayaan)}
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">Across All JV Categories</p>
        </div>

        <div className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${totalTunggakan > 0 ? 'border-l-4 border-l-red-500 border-slate-200/80' : 'border-slate-200/80'}`}>
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">Total Current Arrears</p>
          <p className={`text-xl xl:text-2xl font-fustat font-black mt-1 truncate ${totalTunggakan > 0 ? 'text-red-600' : 'text-slate-900'}`} title={formatCurrency(totalTunggakan)}>
            {formatCurrency(totalTunggakan)}
          </p>
          <p className="text-[12px] text-slate-500 mt-1 truncate">{overdueList.length} Facilities Requiring Action</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0066FF]/30 transition-all duration-200 flex flex-col justify-between">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">Total Collateral Value</p>
          <p className="text-xl xl:text-2xl font-fustat font-black text-slate-900 mt-1 truncate" title={formatCurrency(totalCagaran)}>
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
