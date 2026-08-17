'use client'

import React, { useState, useTransition } from 'react'
import {
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Sliders,
  Sparkles,
  LayoutGrid,
  MapPin,
  Building2,
  HelpCircle,
  Eye,
  Check,
  X,
  RefreshCw,
  Crown,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { getRoleLabel, hasPermission } from '@/lib/auth/permissions'
import type { User, UserRole, FeatureKey, PageKey, FeatureAccess, PageAccess } from '@/types'

// Page Registry definition with metadata
const PAGE_REGISTRY: { path: PageKey; title: string; desc: string; icon: React.ElementType }[] = [
  {
    path: '/dashboard',
    title: 'Dashboard Utama',
    desc: 'Paparan ringkasan eksekutif, metrik KPI dan carta analisis.',
    icon: LayoutGrid,
  },
  {
    path: '/dashboard/summary/jv1',
    title: 'Ringkasan JV 1 (Syarikat)',
    desc: 'Pengurusan dan portfolio perkongsian keuntungan syarikat.',
    icon: Building2,
  },
  {
    path: '/dashboard/summary/jv2',
    title: 'Ringkasan JV 2 (Tanah)',
    desc: 'Maklumat lot hartanah dan usahasama pembangunan tanah.',
    icon: MapPin,
  },
  {
    path: '/dashboard/summary/jv3',
    title: 'Ringkasan JV 3 (Pinjaman)',
    desc: 'Rekod pinjaman individu dan jadual pembayaran.',
    icon: Building2,
  },
  {
    path: '/dashboard/tanah-jv',
    title: 'Tanah MD (JV Registry)',
    desc: 'Daftar rasmi lot tanah usahasama dan penilaian aset.',
    icon: MapPin,
  },
  {
    path: '/dashboard/fasiliti',
    title: 'Fasiliti (Semua Rekod)',
    desc: 'Senarai penuh kemudahan pembiayaan dan tindakan susulan.',
    icon: Building2,
  },
  {
    path: '/dashboard/assistant',
    title: 'Pembantu Pintar AI (@syaakiirr)',
    desc: 'Antaramuka sembang kecerdasan buatan berasaskan data sebenar.',
    icon: Sparkles,
  },
  {
    path: '/dashboard/users',
    title: 'Pengurusan Pengguna',
    desc: 'Pendaftaran akaun, penetapan peranan dan status aktiviti.',
    icon: Users,
  },
  {
    path: '/dashboard/audit',
    title: 'Log Jejak Audit',
    desc: 'Rekod aktiviti forensik sistem, pengubahsuaian data dan eksport.',
    icon: FileText,
  },
]

// Feature Registry definition with metadata
const FEATURE_REGISTRY: { key: FeatureKey; title: string; desc: string; category: string }[] = [
  {
    key: 'tambah_fasiliti',
    title: 'Cipta Fasiliti Baru',
    desc: 'Boleh mendaftar akaun kemudahan dan pembiayaan baharu.',
    category: 'Fasiliti & Tanah',
  },
  {
    key: 'edit_fasiliti',
    title: 'Kemaskini Maklumat Fasiliti',
    desc: 'Mengubah amaun, status, penama aset dan cagaran.',
    category: 'Fasiliti & Tanah',
  },
  {
    key: 'padam_fasiliti',
    title: 'Padam Rekod Fasiliti',
    desc: 'Membuang fasiliti daripada pangkalan data (Kritikal).',
    category: 'Fasiliti & Tanah',
  },
  {
    key: 'lihat_fasiliti',
    title: 'Lihat Butiran Penuh Fasiliti',
    desc: 'Melihat ringkasan kewangan, cagaran dan baki semasa.',
    category: 'Fasiliti & Tanah',
  },
  {
    key: 'tambah_susulan',
    title: 'Catat Tindakan Susulan',
    desc: 'Menambah log pertemuan, panggilan dan lampiran fail.',
    category: 'Susulan & Kronologi',
  },
  {
    key: 'edit_susulan',
    title: 'Kemaskini Catatan Susulan',
    desc: 'Menyunting semula nota aktiviti susulan.',
    category: 'Susulan & Kronologi',
  },
  {
    key: 'padam_susulan',
    title: 'Padam Catatan Susulan',
    desc: 'Menghapuskan entri susulan dan lampiran berkait.',
    category: 'Susulan & Kronologi',
  },
  {
    key: 'jana_kronologi',
    title: 'Jana Laporan Kronologi PDF',
    desc: 'Mengeksport dokumen formal kronologi PDF @pdfme.',
    category: 'Eksport & Dokumen',
  },
  {
    key: 'eksport_excel',
    title: 'Muat Turun Data Excel/CSV',
    desc: 'Mengeksport rekod keseluruhan ke format hamparan kerja.',
    category: 'Eksport & Dokumen',
  },
  {
    key: 'lihat_assistant',
    title: 'Akses Pembantu AI Gemini',
    desc: 'Berinteraksi dengan model AI untuk analisis fasiliti.',
    category: 'Kecerdasan Buatan',
  },
  {
    key: 'lihat_audit_log',
    title: 'Semak Log Audit Forensik',
    desc: 'Melihat jejak aktiviti keselamatan semua pengguna.',
    category: 'Pentadbiran',
  },
  {
    key: 'urus_pengguna',
    title: 'Urus Akaun & Peranan Pengguna',
    desc: 'Mencipta dan mengemas kini peranan pengguna lain.',
    category: 'Pentadbiran',
  },
]

interface SuperadminPanelProps {
  currentUser: User
  initialUsers: User[]
  initialFeatureOverrides: FeatureAccess[]
  initialPageOverrides: PageAccess[]
}

export function SuperadminPanel({
  currentUser,
  initialUsers,
  initialFeatureOverrides,
  initialPageOverrides,
}: SuperadminPanelProps) {
  const [users] = useState<User[]>(initialUsers)
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialUsers.find((u) => u.peranan !== 'superadmin')?.id || initialUsers[0]?.id || ''
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'pages' | 'features'>('pages')

  const [featureOverrides, setFeatureOverrides] = useState<FeatureAccess[]>(initialFeatureOverrides)
  const [pageOverrides, setPageOverrides] = useState<PageAccess[]>(initialPageOverrides)

  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const selectedUser = users.find((u) => u.id === selectedUserId)

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.emel.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.peranan === roleFilter
    return matchesSearch && matchesRole
  })

  // Helper to show temporary toast
  function showStatus(text: string, type: 'success' | 'error' = 'success') {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3500)
  }

  // Check state of a page for the selected user
  function getPageStatus(pagePath: PageKey): { isAllowed: boolean; isOverridden: boolean } {
    if (!selectedUser) return { isAllowed: true, isOverridden: false }
    if (selectedUser.peranan === 'superadmin') return { isAllowed: true, isOverridden: false }

    const override = pageOverrides.find(
      (o) => o.user_id === selectedUser.id && o.page_path === pagePath
    )

    if (override !== undefined) {
      return { isAllowed: override.is_allowed, isOverridden: true }
    }

    // Default: pages allowed by role
    return { isAllowed: true, isOverridden: false }
  }

  // Check state of a feature for the selected user
  function getFeatureStatus(featureKey: FeatureKey): { isAllowed: boolean; isOverridden: boolean } {
    if (!selectedUser) return { isAllowed: true, isOverridden: false }
    if (selectedUser.peranan === 'superadmin') return { isAllowed: true, isOverridden: false }

    const override = featureOverrides.find(
      (o) => o.user_id === selectedUser.id && o.feature_key === featureKey
    )

    if (override !== undefined) {
      return { isAllowed: override.is_allowed, isOverridden: true }
    }

    // Default from static matrix
    const defaultAllowed = hasPermission(selectedUser.peranan, featureKey)
    return { isAllowed: defaultAllowed, isOverridden: false }
  }

  // Toggle Page Access
  async function handleTogglePage(pagePath: PageKey, currentAllowed: boolean) {
    if (!selectedUser) return

    const newAllowed = !currentAllowed

    // Optimistic state update
    setPageOverrides((prev) => {
      const filtered = prev.filter(
        (p) => !(p.user_id === selectedUser.id && p.page_path === pagePath)
      )
      return [
        ...filtered,
        {
          id: 'temp-' + Date.now(),
          user_id: selectedUser.id,
          page_path: pagePath,
          is_allowed: newAllowed,
          dicipta_pada: new Date().toISOString(),
          dikemaskini_pada: new Date().toISOString(),
        },
      ]
    })

    try {
      const res = await fetch('/api/superadmin/page-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          page_path: pagePath,
          is_allowed: newAllowed,
        }),
      })

      if (!res.ok) throw new Error('Gagal mengemas kini capaian halaman')
      showStatus(`Akses halaman ${pagePath} ditukar kepada ${newAllowed ? 'DIBENARKAN' : 'DISEKAT (Under Dev)'}`)
    } catch (err: any) {
      showStatus(err.message || 'Ralat berlaku', 'error')
    }
  }

  // Reset page override to default
  async function handleResetPage(pagePath: PageKey) {
    if (!selectedUser) return

    setPageOverrides((prev) =>
      prev.filter((p) => !(p.user_id === selectedUser.id && p.page_path === pagePath))
    )

    try {
      await fetch(
        `/api/superadmin/page-access?user_id=${selectedUser.id}&page_path=${encodeURIComponent(
          pagePath
        )}`,
        { method: 'DELETE' }
      )
      showStatus(`Akses ${pagePath} dikembalikan ke tetapan peranan asal`)
    } catch (err: any) {
      showStatus(err.message || 'Ralat reset', 'error')
    }
  }

  // Toggle Feature Access
  async function handleToggleFeature(featureKey: FeatureKey, currentAllowed: boolean) {
    if (!selectedUser) return

    const newAllowed = !currentAllowed

    // Optimistic update
    setFeatureOverrides((prev) => {
      const filtered = prev.filter(
        (f) => !(f.user_id === selectedUser.id && f.feature_key === featureKey)
      )
      return [
        ...filtered,
        {
          id: 'temp-' + Date.now(),
          user_id: selectedUser.id,
          feature_key: featureKey,
          is_allowed: newAllowed,
          dicipta_pada: new Date().toISOString(),
          dikemaskini_pada: new Date().toISOString(),
        },
      ]
    })

    try {
      const res = await fetch('/api/superadmin/feature-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          feature_key: featureKey,
          is_allowed: newAllowed,
        }),
      })

      if (!res.ok) throw new Error('Gagal mengemas kini capaian ciri')
      showStatus(`Ciri ${featureKey} ditukar kepada ${newAllowed ? 'DIBENARKAN' : 'DISEKAT'}`)
    } catch (err: any) {
      showStatus(err.message || 'Ralat berlaku', 'error')
    }
  }

  // Reset feature override to default
  async function handleResetFeature(featureKey: FeatureKey) {
    if (!selectedUser) return

    setFeatureOverrides((prev) =>
      prev.filter((f) => !(f.user_id === selectedUser.id && f.feature_key === featureKey))
    )

    try {
      await fetch(
        `/api/superadmin/feature-access?user_id=${selectedUser.id}&feature_key=${encodeURIComponent(
          featureKey
        )}`,
        { method: 'DELETE' }
      )
      showStatus(`Ciri ${featureKey} dikembalikan ke tetapan peranan asal`)
    } catch (err: any) {
      showStatus(err.message || 'Ralat reset', 'error')
    }
  }

  // Quick Preset: Block All Pages Except Dashboard
  async function handlePresetStrictLock() {
    if (!selectedUser || selectedUser.peranan === 'superadmin') return

    const pagesToLock = PAGE_REGISTRY.filter((p) => p.path !== '/dashboard')

    for (const p of pagesToLock) {
      await handleTogglePage(p.path, true) // set to false
    }

    showStatus(`Mod Kunci Ketat: Semua halaman disekat kecuali Dashboard untuk ${selectedUser.nama}`)
  }

  // Quick Preset: Reset All Overrides for Selected User
  async function handleResetAll() {
    if (!selectedUser) return

    setPageOverrides((prev) => prev.filter((p) => p.user_id !== selectedUser.id))
    setFeatureOverrides((prev) => prev.filter((f) => f.user_id !== selectedUser.id))

    try {
      await Promise.all([
        ...PAGE_REGISTRY.map((p) =>
          fetch(`/api/superadmin/page-access?user_id=${selectedUser.id}&page_path=${encodeURIComponent(p.path)}`, {
            method: 'DELETE',
          })
        ),
        ...FEATURE_REGISTRY.map((f) =>
          fetch(`/api/superadmin/feature-access?user_id=${selectedUser.id}&feature_key=${encodeURIComponent(f.key)}`, {
            method: 'DELETE',
          })
        ),
      ])
      showStatus(`Semua kawalan khas untuk ${selectedUser.nama} telah direset ke asal.`)
    } catch (e) {
      showStatus('Ralat semasa mereset semua kawalan', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#0066FF]/30 bg-gradient-to-br from-[#060618] via-[#0b1437] to-[#040924] p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-[#0066FF]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Crown size={14} className="text-amber-400" />
              <span>Superadmin Supreme Privilege</span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight font-fustat text-white">
              Pusat Kawalan Had Capaian &amp; Pembangunan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kawal hak akses bagi setiap pengguna secara individu. Sekiranya halaman atau ciri
              disekat, pengguna akan dipaparkan skrin <strong>&quot;Modul Dalam Pembangunan&quot;</strong> secara elegan tanpa menimbulkan keraguan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Pengguna Sistem
              </p>
              <p className="text-lg font-black font-fustat text-white">
                {users.length} Akaun
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4',
            statusMessage.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-950/90 text-emerald-200 backdrop-blur-md'
              : 'border border-red-500/30 bg-red-950/90 text-red-200 backdrop-blur-md'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: User Selector (Left) + Access Control Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: User Directory & Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold font-fustat text-[var(--color-text-primary)]">
                Pilih Pengguna Sasaran
              </h2>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {filteredUsers.length} dijumpai
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
              />
              <input
                type="text"
                placeholder="Cari nama atau emel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#0066FF] focus:outline-none"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-[var(--color-border)]">
              {(['all', 'admin', 'pengurus', 'pegawai_susulan', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                    roleFilter === r
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                  )}
                >
                  {r === 'all' ? 'Semua' : getRoleLabel(r as UserRole)}
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredUsers.map((u) => {
                const isSelected = u.id === selectedUserId
                const isSuper = u.peranan === 'superadmin'
                const userPageOverridesCount = pageOverrides.filter(
                  (p) => p.user_id === u.id && !p.is_allowed
                ).length
                const userFeatureOverridesCount = featureOverrides.filter(
                  (f) => f.user_id === u.id && !f.is_allowed
                ).length
                const hasRestrictedGates = userPageOverridesCount > 0 || userFeatureOverridesCount > 0

                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                      isSelected
                        ? 'border-[#0066FF] bg-[#0066FF]/10 shadow-xs'
                        : 'border-transparent hover:bg-[var(--color-bg)] hover:border-[var(--color-border)]'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                        isSuper
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20'
                      )}
                    >
                      {isSuper ? <Crown size={15} /> : getInitials(u.nama)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                          {u.nama}
                        </p>
                        {isSuper && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            Supreme
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                        {u.emel}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-block text-[10px] font-semibold text-[var(--color-text-secondary)]">
                          {getRoleLabel(u.peranan)}
                        </span>
                        {hasRestrictedGates && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            <Lock size={9} />
                            {userPageOverridesCount + userFeatureOverridesCount} Disekat
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Access Control Configuration Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedUser ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-xs">
              {/* Selected User Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs',
                      selectedUser.peranan === 'superadmin'
                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                        : 'bg-[#0066FF] text-white shadow-[#0066FF]/20'
                    )}
                  >
                    {selectedUser.peranan === 'superadmin' ? (
                      <Crown size={22} />
                    ) : (
                      getInitials(selectedUser.nama)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black font-fustat text-[var(--color-text-primary)]">
                        {selectedUser.nama}
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
                        {getRoleLabel(selectedUser.peranan)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {selectedUser.emel} &bull; ID: <code className="text-[10px] bg-[var(--color-bg)] px-1 rounded">{selectedUser.id.substring(0, 8)}...</code>
                    </p>
                  </div>
                </div>

                {/* Preset Actions */}
                {selectedUser.peranan !== 'superadmin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePresetStrictLock}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all active:scale-95"
                      title="Kunci semua halaman kecuali Dashboard utama"
                    >
                      <Lock size={13} />
                      Kunci Semua Halaman
                    </button>
                    <button
                      onClick={handleResetAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-all active:scale-95"
                      title="Pulihkan semua tetapan mengikut peranan asal"
                    >
                      <RotateCcw size={13} />
                      Reset Asal
                    </button>
                  </div>
                )}
              </div>

              {/* Superadmin Notice */}
              {selectedUser.peranan === 'superadmin' ? (
                <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                  <Crown size={28} className="mx-auto text-amber-500 mb-2" />
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 font-fustat">
                    Akaun Superadmin Memiliki Imuniti Penuh
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 max-w-md mx-auto">
                    Akaun Superadmin tidak tertakluk kepada sekatan had capaian dan sentiasa
                    memiliki akses tanpa batasan ke seluruh halaman dan ciri sistem.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tab Selector */}
                  <div className="flex items-center gap-2 mt-5 mb-4 border-b border-[var(--color-border)] pb-3">
                    <button
                      onClick={() => setActiveTab('pages')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                        activeTab === 'pages'
                          ? 'bg-[#0066FF] text-white shadow-xs'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      )}
                    >
                      <Layers size={14} />
                      <span>Sekatan Halaman (Page Gates)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('features')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                        activeTab === 'features'
                          ? 'bg-[#0066FF] text-white shadow-xs'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      )}
                    >
                      <Sliders size={14} />
                      <span>Sekatan Ciri (Feature Controls)</span>
                    </button>
                  </div>

                  {/* TAB 1: PAGES ACCESS LIST */}
                  {activeTab === 'pages' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] px-1">
                        <span>Halaman &amp; Laluan URL</span>
                        <span>Status Akses Pengguna</span>
                      </div>

                      {PAGE_REGISTRY.map((p) => {
                        const Icon = p.icon
                        const { isAllowed, isOverridden } = getPageStatus(p.path)

                        return (
                          <div
                            key={p.path}
                            className={cn(
                              'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all',
                              !isAllowed
                                ? 'border-amber-500/30 bg-amber-500/[0.04]'
                                : isOverridden
                                ? 'border-[#0066FF]/30 bg-[#0066FF]/[0.03]'
                                : 'border-[var(--color-border)] bg-[var(--color-bg)]'
                            )}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                  !isAllowed
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-[#0066FF]/10 text-[#0066FF]'
                                )}
                              >
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                                    {p.title}
                                  </h4>
                                  <code className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                                    {p.path}
                                  </code>
                                </div>
                                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                                  {p.desc}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {isOverridden && (
                                <button
                                  onClick={() => handleResetPage(p.path)}
                                  className="p-1.5 text-[10px] rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
                                  title="Pulihkan ke tetapan asal"
                                >
                                  <RefreshCw size={13} />
                                </button>
                              )}

                              <button
                                onClick={() => handleTogglePage(p.path, isAllowed)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95',
                                  isAllowed
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                )}
                              >
                                {isAllowed ? (
                                  <>
                                    <Unlock size={13} />
                                    <span>Boleh Akses</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={13} />
                                    <span>Under Development 🚧</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* TAB 2: FEATURES ACCESS LIST */}
                  {activeTab === 'features' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] px-1">
                        <span>Ciri &amp; Operasi Sistem</span>
                        <span>Had Kebenaran</span>
                      </div>

                      {FEATURE_REGISTRY.map((f) => {
                        const { isAllowed, isOverridden } = getFeatureStatus(f.key)

                        return (
                          <div
                            key={f.key}
                            className={cn(
                              'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all',
                              !isAllowed
                                ? 'border-amber-500/30 bg-amber-500/[0.04]'
                                : isOverridden
                                ? 'border-[#0066FF]/30 bg-[#0066FF]/[0.03]'
                                : 'border-[var(--color-border)] bg-[var(--color-bg)]'
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]">
                                  {f.category}
                                </span>
                                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                                  {f.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                                {f.desc}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {isOverridden && (
                                <button
                                  onClick={() => handleResetFeature(f.key)}
                                  className="p-1.5 text-[10px] rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
                                  title="Pulihkan ke tetapan asal"
                                >
                                  <RefreshCw size={13} />
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleFeature(f.key, isAllowed)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95',
                                  isAllowed
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                )}
                              >
                                {isAllowed ? (
                                  <>
                                    <Check size={13} />
                                    <span>Aktif (Allowed)</span>
                                  </>
                                ) : (
                                  <>
                                    <X size={13} />
                                    <span>Disekat (Disabled)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-tertiary)]">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Sila pilih pengguna daripada senarai sebelah kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
