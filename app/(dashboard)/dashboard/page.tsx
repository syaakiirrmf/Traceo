import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/auth/get-user'
import { AdminDashboardView } from '@/components/dashboard/views/AdminDashboardView'
import { ManagerDashboardView } from '@/components/dashboard/views/ManagerDashboardView'
import { OfficerDashboardView } from '@/components/dashboard/views/OfficerDashboardView'
import { ViewerDashboardView } from '@/components/dashboard/views/ViewerDashboardView'

// Bentuk hasil fetch admin (users/audit) — dikongsi antara nilai kosong
// segera (bukan-admin) dan hasil sebenar (admin). Fetch kelulusan susulan
// dibuang bersama widget Follow-up Approval Pipeline (tidak relevan bila
// seorang saja memantau — data yang dimasukkan memang sudah diluluskan).
type AdminExtrasResult = [{ count: number | null }, { count: number | null }]

const EMPTY_ADMIN_EXTRAS: AdminExtrasResult = [{ count: 0 }, { count: 0 }]

const ROLE_DASHBOARD_CONFIG: Record<UserRole, { tabTitle: string }> = {
  superadmin: { tabTitle: 'Superadmin Command Center' },
  admin: { tabTitle: 'Executive Dashboard' },
  pengurus: { tabTitle: 'Management Dashboard' },
  pegawai_susulan: { tabTitle: 'Officer Workspace' },
  viewer: { tabTitle: 'Portfolio Overview' },
}

interface MonthlyTrendPoint {
  label: string
  count: number
  pembiayaan: number
  tunggakan: number
}

function buildMonthlyTrend(
  fasiliti: Array<{ dicipta_pada: string; jumlah_pembiayaan: number; jumlah_tunggakan_semasa: number }>
): MonthlyTrendPoint[] {
  const now = new Date()
  const buckets: MonthlyTrendPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      label: d.toLocaleString('ms-MY', { month: 'short', year: '2-digit' }),
      count: 0,
      pembiayaan: 0,
      tunggakan: 0,
    })
  }

  for (const f of fasiliti) {
    if (!f.dicipta_pada) continue
    const created = new Date(f.dicipta_pada)
    if (Number.isNaN(created.getTime())) continue
    const idx = (created.getFullYear() - now.getFullYear()) * 12 + (created.getMonth() - now.getMonth()) + 11
    if (idx >= 0 && idx < 12) {
      buckets[idx].count += 1
      buckets[idx].pembiayaan += f.jumlah_pembiayaan
      buckets[idx].tunggakan += f.jumlah_tunggakan_semasa
    }
  }
  return buckets
}

export async function generateMetadata(): Promise<Metadata> {
  // Q2: kongsi cache sesi dengan layout + page — tiada query tambahan.
  const session = await getSessionUser()
  if (!session) return { title: 'Dashboard' }

  const role = (session.userProfile.peranan as UserRole) || 'viewer'
  const config = ROLE_DASHBOARD_CONFIG[role] || ROLE_DASHBOARD_CONFIG.viewer
  return { title: config.tabTitle }
}

export default async function DashboardPage() {
  // Q2: sesi dikongsi cache dengan layout + metadata — 1x set query per request.
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const currentUser = session.userProfile
  const userRole = (currentUser.peranan as UserRole) || 'viewer'
  // Client supabase untuk query data (createClient tiada IO — cuma baca cookies).
  const supabase = await createClient()

  // Q4: SEMUA fetch bermula serentak. Fetch admin (users/audit/approval) tidak
  // lagi menunggu fetch utama + kiraan selesai — sebelum ini satu roundtrip
  // berasingan untuk admin. Bukan-admin dapat promise kosong segera.
  const needsAdminExtras = userRole === 'admin' || userRole === 'superadmin'
  const corePromise = Promise.all([
    supabase
      .from('fasiliti')
      .select(
        'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, dicipta_pada'
      ),
    supabase.from('tanah_jv').select('id, anggaran_nilaian'),
  ])
  const adminExtrasPromise: Promise<AdminExtrasResult> = needsAdminExtras
    ? Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('log_audit').select('*', { count: 'exact', head: true }),
      ])
    : Promise.resolve(EMPTY_ADMIN_EXTRAS)

  // Fetch all fasiliti + tanah_jv in parallel
  const [{ data: allFasiliti }, { data: allTanah }] = await corePromise

  const fasilitiList = (allFasiliti ?? []).map((f) => ({
    ...f,
    jumlah_pembiayaan: Number(f.jumlah_pembiayaan) || 0,
    jumlah_tunggakan_semasa: Number(f.jumlah_tunggakan_semasa) || 0,
  }))
  const tanahList = allTanah ?? []

  // Total metrics
  const totalPembiayaan = fasilitiList.reduce((s, f) => s + f.jumlah_pembiayaan, 0)
  const totalTunggakan = fasilitiList.reduce((s, f) => s + f.jumlah_tunggakan_semasa, 0)
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

  const categoryData = [
    {
      name: 'Summary JV 1 (Company)',
      key: 'jv1',
      href: '/dashboard/summary/jv1',
      count: jv1.length,
      pembiayaan: jv1.reduce((s, f) => s + f.jumlah_pembiayaan, 0),
      tunggakan: jv1.reduce((s, f) => s + f.jumlah_tunggakan_semasa, 0),
    },
    {
      name: 'Land JV',
      key: 'jv2',
      href: '/dashboard/summary/jv2',
      count: jv2.length,
      pembiayaan: jv2.reduce((s, f) => s + f.jumlah_pembiayaan, 0),
      tunggakan: jv2.reduce((s, f) => s + f.jumlah_tunggakan_semasa, 0),
    },
    {
      name: 'Personal Loan',
      key: 'jv3',
      href: '/dashboard/summary/jv3',
      count: jv3.length,
      pembiayaan: jv3.reduce((s, f) => s + f.jumlah_pembiayaan, 0),
      tunggakan: jv3.reduce((s, f) => s + f.jumlah_tunggakan_semasa, 0),
    },
  ]

  const statusData = [
    { label: 'Active', key: 'aktif', count: statusCounts.aktif, color: 'var(--color-brand)' },
    {
      label: 'Overdue',
      key: 'tertunggak',
      count: statusCounts.tertunggak,
      color: 'var(--color-warning)',
    },
    {
      label: 'Legal Action',
      key: 'tindakan_guaman',
      count: statusCounts.tindakan_guaman,
      color: 'var(--color-danger)',
    },
    {
      label: 'Completed',
      key: 'selesai',
      count: statusCounts.selesai,
      color: 'var(--color-text-tertiary)',
    },
  ]

  // Overdue list
  const overdueList = fasilitiList
    .filter((f) => f.jumlah_tunggakan_semasa > 0)
    .sort((a, b) => b.jumlah_tunggakan_semasa - a.jumlah_tunggakan_semasa)
    .slice(0, 5)

  // ─── KPI (derived metrics) ──────────────────────────────────────────────────
  const arrearsRatio = totalPembiayaan > 0 ? (totalTunggakan / totalPembiayaan) * 100 : 0
  const collectionRate = totalPembiayaan > 0 ? (1 - totalTunggakan / totalPembiayaan) * 100 : 0
  const activeCount = statusCounts.aktif
  const overdueCount = statusCounts.tertunggak
  const legalCount = statusCounts.tindakan_guaman
  const avgFinancing = fasilitiList.length > 0 ? totalPembiayaan / fasilitiList.length : 0

  // ─── Monthly trend (last 12 months, by dicipta_pada) ────────────────────────
  const monthlyTrend = buildMonthlyTrend(fasilitiList)

  const financierMap = new Map<
    string,
    { nama: string; count: number; pembiayaan: number; tunggakan: number }
  >()
  for (const f of fasilitiList) {
    const nama = f.pembiaya_modal?.trim() || 'Not Specified'
    const cur = financierMap.get(nama) ?? { nama, count: 0, pembiayaan: 0, tunggakan: 0 }
    cur.count += 1
    cur.pembiayaan += f.jumlah_pembiayaan
    cur.tunggakan += f.jumlah_tunggakan_semasa
    financierMap.set(nama, cur)
  }
  const topFinanciers = [...financierMap.values()]
    .sort((a, b) => b.pembiayaan - a.pembiayaan)
    .slice(0, 5)
  const maxFinancierExposure = topFinanciers[0]?.pembiayaan || 1

  // ─── 1. OFFICER DASHBOARD VIEW ──────────────────────────────────────────────
  if (userRole === 'pegawai_susulan') {
    const [{ data: assignedRows }, { data: officerSusulan }] = await Promise.all([
      supabase.from('fasiliti_pegawai').select('fasiliti_id').eq('user_id', currentUser.id),
      supabase
        .from('susulan')
        .select('id, fasiliti_id, tarikh_susulan, catatan, status_kelulusan')
        .eq('dicatat_oleh', currentUser.id)
        .order('tarikh_susulan', { ascending: false })
        .limit(6),
    ])

    const assignedIds = (assignedRows ?? []).map((r) => r.fasiliti_id)
    const assignedFasiliti = fasilitiList.filter((f) => assignedIds.includes(f.id))

    const recentSusulan = (officerSusulan ?? []).map((s) => {
      const matchF = fasilitiList.find((f) => f.id === s.fasiliti_id)
      return {
        ...s,
        kod_rujukan: matchF?.kod_rujukan,
        nama_peminjam: matchF?.nama_peminjam,
      }
    })

    return (
      <OfficerDashboardView
        user={currentUser}
        assignedFasiliti={assignedFasiliti}
        recentSusulan={recentSusulan}
      />
    )
  }

  // ─── 2. VIEWER DASHBOARD VIEW ────────────────────────────────────────────────
  if (userRole === 'viewer') {
    return (
      <ViewerDashboardView
        totalPembiayaan={totalPembiayaan}
        totalTunggakan={totalTunggakan}
        totalCagaran={totalCagaran}
        fasilitiList={fasilitiList}
        categoryData={categoryData}
        statusData={statusData}
        monthlyTrend={monthlyTrend}
      />
    )
  }

  // ─── 3. MANAGER DASHBOARD VIEW ───────────────────────────────────────────────
  if (userRole === 'pengurus') {
    return (
      <ManagerDashboardView
        totalPembiayaan={totalPembiayaan}
        totalTunggakan={totalTunggakan}
        totalCagaran={totalCagaran}
        fasilitiList={fasilitiList}
        categoryData={categoryData}
        statusData={statusData}
        overdueList={overdueList}
        monthlyTrend={monthlyTrend}
      />
    )
  }

  // ─── 4. ADMIN DASHBOARD VIEW (Default) ──────────────────────────────────────
  // Data sudah difetch selari dari awal (Q4) — await di sini hanya tuai hasil.
  const [{ count: usersCount }, { count: auditCount }] = await adminExtrasPromise

  return (
    <AdminDashboardView
      totalPembiayaan={totalPembiayaan}
      totalTunggakan={totalTunggakan}
      totalCagaran={totalCagaran}
      usersCount={usersCount ?? 0}
      auditCount={auditCount ?? 0}
      fasilitiList={fasilitiList}
      categoryData={categoryData}
      statusData={statusData}
      overdueList={overdueList}
      kpi={{
        arrearsRatio,
        collectionRate,
        activeCount,
        overdueCount,
        legalCount,
        avgFinancing,
      }}
      topFinanciers={topFinanciers}
      maxFinancierExposure={maxFinancierExposure}
      monthlyTrend={monthlyTrend}
    />
  )
}
