import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole, User } from '@/types'
import type { Metadata } from 'next'
import { AdminDashboardView } from '@/components/dashboard/views/AdminDashboardView'
import { ManagerDashboardView } from '@/components/dashboard/views/ManagerDashboardView'
import { OfficerDashboardView } from '@/components/dashboard/views/OfficerDashboardView'
import { ViewerDashboardView } from '@/components/dashboard/views/ViewerDashboardView'

const ROLE_DASHBOARD_CONFIG: Record<UserRole, { tabTitle: string }> = {
  admin: { tabTitle: 'Executive Dashboard' },
  pengurus: { tabTitle: 'Management Dashboard' },
  pegawai_susulan: { tabTitle: 'Officer Workspace' },
  viewer: { tabTitle: 'Portfolio Overview' },
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { title: 'Dashboard' }

  const { data: userProfile } = await supabase
    .from('users')
    .select('peranan')
    .eq('auth_id', authUser.id)
    .single()

  const role = (userProfile?.peranan as UserRole) || 'viewer'
  const config = ROLE_DASHBOARD_CONFIG[role] || ROLE_DASHBOARD_CONFIG.viewer
  return { title: config.tabTitle }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, nama, emel, peranan, status')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  const currentUser = userProfile as User
  const userRole = (userProfile.peranan as UserRole) || 'viewer'

  // Fetch all fasiliti + tanah_jv in parallel
  const [{ data: allFasiliti }, { data: allTanah }] = await Promise.all([
    supabase
      .from('fasiliti')
      .select('id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, dicipta_pada'),
    supabase
      .from('tanah_jv')
      .select('id, anggaran_nilaian'),
  ])

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
    { label: 'Overdue', key: 'tertunggak', count: statusCounts.tertunggak, color: 'var(--color-warning)' },
    { label: 'Legal Action', key: 'tindakan_guaman', count: statusCounts.tindakan_guaman, color: 'var(--color-danger)' },
    { label: 'Completed', key: 'selesai', count: statusCounts.selesai, color: 'var(--color-text-tertiary)' },
  ]

  // Overdue list
  const overdueList = fasilitiList
    .filter((f) => f.jumlah_tunggakan_semasa > 0)
    .sort((a, b) => b.jumlah_tunggakan_semasa - a.jumlah_tunggakan_semasa)
    .slice(0, 5)

  // ─── 1. OFFICER DASHBOARD VIEW ──────────────────────────────────────────────
  if (userRole === 'pegawai_susulan') {
    const [{ data: assignedRows }, { data: officerSusulan }] = await Promise.all([
      supabase
        .from('fasiliti_pegawai')
        .select('fasiliti_id')
        .eq('user_id', currentUser.id),
      supabase
        .from('susulan')
        .select('id, fasiliti_id, tarikh_susulan, catatan')
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
      />
    )
  }

  // ─── 4. ADMIN DASHBOARD VIEW (Default) ──────────────────────────────────────
  const [{ count: usersCount }, { count: auditCount }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('log_audit').select('*', { count: 'exact', head: true }),
  ])

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
    />
  )
}
