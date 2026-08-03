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
      name: 'Summary JV 1 (Syarikat)',
      key: 'jv1',
      href: '/dashboard/summary/jv1',
      count: jv1.length,
      pembiayaan: sumKey(jv1, 'jumlah_pembiayaan'),
      tunggakan: sumKey(jv1, 'jumlah_tunggakan_semasa'),
    },
    {
      name: 'JV Tanah',
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
    { label: 'Lancar', key: 'aktif', count: statusCounts.aktif, color: 'var(--color-brand)' },
    { label: 'Tertunggak', key: 'tertunggak', count: statusCounts.tertunggak, color: 'var(--color-warning)' },
    { label: 'Tindakan Guaman', key: 'tindakan_guaman', count: statusCounts.tindakan_guaman, color: 'var(--color-danger)' },
    { label: 'Selesai', key: 'selesai', count: statusCounts.selesai, color: 'var(--color-text-tertiary)' },
  ]

  // Top overdue list (sorted by highest arrears)
  const overdueList = fasilitiList
    .filter((f) => Number(f.jumlah_tunggakan_semasa) > 0)
    .sort((a, b) => Number(b.jumlah_tunggakan_semasa) - Number(a.jumlah_tunggakan_semasa))
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Pengurusan Fasiliti &amp; Portfoli JV
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            Dashboard Utama
          </h1>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/summary/jv1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all shadow-xs"
          >
            <Building2 size={14} />
            Summary JV 1
          </Link>
          <Link
            href="/dashboard/summary/jv2"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all shadow-xs"
          >
            <Landmark size={14} />
            JV Tanah
          </Link>
          <Link
            href="/dashboard/summary/jv3"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all shadow-xs"
          >
            <UserRound size={14} />
            Personal Loan
          </Link>
          <Link
            href="/dashboard/tanah-jv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all shadow-xs"
          >
            <MapPin size={14} />
            Tanah MD (JV)
          </Link>
          <Link
            href="/dashboard/fasiliti/tambah"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
          >
            <Plus size={14} />
            + Tambah Fasiliti
          </Link>
        </div>
      </div>

      {/* KPI Key Metric Bands (Typography-First, Restrained Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-xs">
          <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Jumlah Fasiliti</p>
          <p className="text-xl font-bold font-mono text-[var(--color-text-primary)] mt-1">{fasilitiList.length} Rekod</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{statusCounts.aktif} Lancar · {statusCounts.tertunggak + statusCounts.tindakan_guaman} Risiko</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-xs">
          <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Jumlah Pembiayaan Modal</p>
          <p className="text-xl font-bold font-mono text-[var(--color-brand)] mt-1">{formatCurrency(totalPembiayaan)}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Seluruh Kategori JV</p>
        </div>

        <div className={`bg-[var(--color-surface)] rounded-xl border p-4 shadow-xs ${totalTunggakan > 0 ? 'border-l-4 border-l-[var(--color-danger)] border-[var(--color-border)]' : 'border-[var(--color-border)]'}`}>
          <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Jumlah Tunggakan Semasa</p>
          <p className={`text-xl font-extrabold font-mono mt-1 ${totalTunggakan > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`}>
            {formatCurrency(totalTunggakan)}
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{overdueList.length} Fasiliti Memerlukan Tindakan</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-xs">
          <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Jumlah Cagaran Nilaian</p>
          <p className="text-xl font-bold font-mono text-[var(--color-text-primary)] mt-1">{formatCurrency(totalCagaran)}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{tanahList.length} Lot Tanah MD (JV)</p>
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
