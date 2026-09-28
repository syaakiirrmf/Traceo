import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, ArrowUpRight } from 'lucide-react'
import { Suspense } from 'react'
import { FasilitiFilter } from './FasilitiFilter'
import { FasilitiPagination } from './FasilitiPagination'
import { ExportButton } from '@/components/ExportButton'
import { formatCurrency } from '@/lib/utils'
import { hasPermission } from '@/lib/auth/permissions'
import { assertPageAccess, checkPageAccess } from '@/lib/auth/access-control'
import { PageAccessGuard } from '@/components/ui/PageAccessGuard'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Facilities — All Records' }

const STATUS_LABELS = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
} as const

const STATUS_STYLES = {
  aktif:
    'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  tertunggak:
    'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  tindakan_guaman:
    'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  selesai:
    'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] border-[var(--color-border)]',
} as const

const KATEGORI_LABELS = {
  jv_syarikat: 'Company JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
  tanah_lot: 'Tanah Lot',
} as const

const FASILITI_KATEGORI = ['jv_syarikat', 'jv_tanah', 'pinjaman_individu'] as const

// Cap untuk fetch senarai penuh dalam mod gabungan (selaras dengan EXPORT_LIMIT).
const UNIFIED_FETCH_LIMIT = 2000

interface FasilitiRow {
  id: string
  kod_rujukan: string
  kategori: string
  nama_peminjam: string
  pembiaya_modal: string
  jumlah_pembiayaan: number
  status_fasiliti: string
  tarikh_mula: string
  jumlah_tunggakan_semasa: number
  dicipta_pada: string
}

interface TanahRow {
  id: string
  no_lot: string
  tempat: string
  bandar_mukim: string
  daerah: string
  negeri: string
  no_hak_milik: string | null
  luas_meter_persegi: number | null
  anggaran_nilaian: number | null
  dicipta_pada: string
}

type UnifiedRow =
  | { kind: 'fasiliti'; ref: string; name: string; financier: string; value: number; statusKey: string; dicipta_pada: string; fasiliti: FasilitiRow }
  | { kind: 'tanah'; ref: string; name: string; financier: string; value: number; statusKey: string; dicipta_pada: string; tanah: TanahRow }

interface SearchParams {
  q?: string
  status?: string
  kategori?: string
  // Tapisan exact-match untuk drill-down Top Financiers di dashboard.
  // Bezakan dengan q (substring): dashboard himpun ikut string tepat,
  // jadi drill-down mesti eq — jika tidak varian nama (cth. "... (PBB ...)")
  // termasuk dan jumlah tidak sama dengan angka dashboard.
  financier?: string
  page?: string
  sort?: string
  dir?: string
}

const PAGE_SIZE = 10

const SORTABLE_COLUMNS = new Map([
  ['kod_rujukan', 'kod_rujukan'],
  ['pembiaya_modal', 'pembiaya_modal'],
  ['nama_peminjam', 'nama_peminjam'],
  ['jumlah_pembiayaan', 'jumlah_pembiayaan'],
  ['jumlah_tunggakan_semasa', 'jumlah_tunggakan_semasa'],
  ['status_fasiliti', 'status_fasiliti'],
])

function buildSortHref(
  params: SearchParams,
  col: string,
  currentCol: string,
  currentDir: string
) {
  const nextDir =
    currentCol === col ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc'
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.status) sp.set('status', params.status)
  if (params.kategori) sp.set('kategori', params.kategori)
  if (params.financier) sp.set('financier', params.financier)
  if (params.page) sp.set('page', params.page)
  sp.set('sort', col)
  sp.set('dir', nextDir)
  const qs = sp.toString()
  return `/dashboard/fasiliti${qs ? `?${qs}` : ''}`
}

function SortableTh({
  label,
  col,
  sortCol,
  sortDir,
  params,
  right,
}: {
  label: string
  col: string
  sortCol: string
  sortDir: string
  params: SearchParams
  right?: boolean
}) {
  const active = sortCol === col
  const arrow = active ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'
  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none hover:bg-slate-100/60 transition-colors ${right ? 'text-right' : ''}`}
    >
      <Link
        href={buildSortHref(params, col, sortCol, sortDir)}
        className={`inline-flex items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <span className={active ? 'text-[var(--color-brand)]' : 'opacity-40'}>
          {arrow}
        </span>
      </Link>
    </th>
  )
}

export default async function FasilitiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) redirect('/login')

  await assertPageAccess(userProfile.id, userProfile.peranan as UserRole, '/dashboard/fasiliti')

  const isPegawai = userProfile.peranan === 'pegawai_susulan'

  // For pegawai_susulan: scope to only assigned facilities
  let assignedIds: string[] | null = null
  if (isPegawai) {
    const { data: assigned } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('user_id', userProfile.id)
    assignedIds = (assigned ?? []).map((r) => r.fasiliti_id as string)
    // If pegawai has no assigned facilities, return empty
    if (assignedIds.length === 0) assignedIds = ['00000000-0000-0000-0000-000000000000']
  }

  // ─── Unified Facilities + Tanah Lot ──────────────────────────────────────────
  // Satu senarai untuk semua: 3 kategori fasiliti + lot tanah (table tanah_jv).
  // Lot tanah tiada status/pembiayaan — kolum berkaitan papar '—'.
  const q = (params.q ?? '').trim()
  const statusFilter = (params.status ?? '').trim()
  const kategoriFilter = (params.kategori ?? '').trim()
  const financierFilter = (params.financier ?? '').trim()
  const isTanahOnly = kategoriFilter === 'tanah_lot'
  const isSingleFasilitiKategori = (FASILITI_KATEGORI as readonly string[]).includes(kategoriFilter)
  const showFasiliti = !isTanahOnly
  // Lot tanah hanya untuk peranan dengan akses page tanah-jv (admin/pengurus/superadmin + override).
  // Lot tanah tiada pembiaya_modal dan tiada status — sembunyikan bila drill-down
  // financier atau tapisan status aktif (jika tidak senarai "Overdue" penuh dengan
  // lot tanpa status dan tapisan nampak macam tidak berfungsi).
  const canSeeTanah = await checkPageAccess(userProfile.id, userProfile.peranan as UserRole, '/dashboard/tanah-jv')
  const showTanah =
    canSeeTanah && !financierFilter && !statusFilter && (!kategoriFilter || isTanahOnly)
  const isMerged = showFasiliti && showTanah

  // Server-side sorting (dalam mod gabungan, sortCol dipetakan ke row unify; default ikut tarikh daftar)
  const requestedSort = SORTABLE_COLUMNS.get(params.sort ?? '')
  const sortCol = requestedSort ?? (isMerged ? 'dicipta_pada' : 'kod_rujukan')
  const sortDir = params.dir === 'asc' ? 'asc' : 'desc'

  const fasilitiOr = q
    ? `nama_peminjam.ilike.%${q}%,pembiaya_modal.ilike.%${q}%,kod_rujukan.ilike.%${q}%`
    : undefined
  const tanahOr = q
    ? `no_lot.ilike.%${q}%,tempat.ilike.%${q}%,bandar_mukim.ilike.%${q}%,daerah.ilike.%${q}%,negeri.ilike.%${q}%,no_hak_milik.ilike.%${q}%`
    : undefined

  // Counts untuk chips kategori (hormati carian q + status; skop pegawai untuk fasiliti)
  const [countJvSyarikat, countJvTanah, countPinjaman] = await Promise.all(
    FASILITI_KATEGORI.map(async (kat) => {
      const qb = supabase.from('fasiliti').select('id', { count: 'exact', head: true })
      if (assignedIds !== null) qb.in('id', assignedIds)
      if (statusFilter) qb.eq('status_fasiliti', statusFilter)
      if (financierFilter) qb.eq('pembiaya_modal', financierFilter)
      if (fasilitiOr) qb.or(fasilitiOr)
      qb.eq('kategori', kat)
      const { count } = await qb
      return count ?? 0
    })
  )
  let tanahCount = 0
  if (canSeeTanah) {
    const tq = supabase.from('tanah_jv').select('id', { count: 'exact', head: true })
    if (tanahOr) tq.or(tanahOr)
    const { count } = await tq
    tanahCount = count ?? 0
  }
  const counts = {
    semua: countJvSyarikat + countJvTanah + countPinjaman + tanahCount,
    jv_syarikat: countJvSyarikat,
    jv_tanah: countJvTanah,
    pinjaman_individu: countPinjaman,
    tanah_lot: tanahCount,
  }

  const FASILITI_COLS =
    'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, status_fasiliti, tarikh_mula, jumlah_tunggakan_semasa, dicipta_pada'
  const TANAH_COLS =
    'id, no_lot, tempat, bandar_mukim, daerah, negeri, no_hak_milik, luas_meter_persegi, anggaran_nilaian, dicipta_pada'

  function toFasilitiRow(f: FasilitiRow): UnifiedRow {
    return {
      kind: 'fasiliti',
      ref: f.kod_rujukan,
      name: f.nama_peminjam,
      financier: f.pembiaya_modal,
      value: Number(f.jumlah_pembiayaan) || 0,
      statusKey: f.status_fasiliti,
      dicipta_pada: f.dicipta_pada,
      fasiliti: f,
    }
  }

  function toTanahRow(t: TanahRow): UnifiedRow {
    return {
      kind: 'tanah',
      ref: t.no_lot,
      name: t.tempat,
      financier: [t.negeri, t.daerah].filter(Boolean).join(' · '),
      value: Number(t.anggaran_nilaian) || 0,
      statusKey: '',
      dicipta_pada: t.dicipta_pada,
      tanah: t,
    }
  }

  let rows: UnifiedRow[] = []
  let totalItems = 0
  // Jumlah ringkasan set tapisan semasa — untuk sahkan angka dashboard (Top Financiers dsb.)
  let sumPembiayaan = 0
  let sumTunggakan = 0
  let sumNilaiTanah = 0

  if (isMerged) {
    // ── Mod gabungan: fetch kedua-dua set (cap 2000), gabung + sort dalam memori ──
    totalItems = counts.semua
    const fq = supabase.from('fasiliti').select(FASILITI_COLS).limit(UNIFIED_FETCH_LIMIT)
    if (assignedIds !== null) fq.in('id', assignedIds)
    if (statusFilter) fq.eq('status_fasiliti', statusFilter)
    if (fasilitiOr) fq.or(fasilitiOr)
    const tq = supabase.from('tanah_jv').select(TANAH_COLS).limit(UNIFIED_FETCH_LIMIT)
    if (tanahOr) tq.or(tanahOr)
    const [{ data: fData }, { data: tData }] = await Promise.all([fq, tq])
    const fList = (fData ?? []) as FasilitiRow[]
    const tList = (tData ?? []) as TanahRow[]
    sumPembiayaan = fList.reduce((s, f) => s + (Number(f.jumlah_pembiayaan) || 0), 0)
    sumTunggakan = fList.reduce((s, f) => s + (Number(f.jumlah_tunggakan_semasa) || 0), 0)
    sumNilaiTanah = tList.reduce((s, t) => s + (Number(t.anggaran_nilaian) || 0), 0)
    const merged: UnifiedRow[] = [
      ...fList.map(toFasilitiRow),
      ...tList.map(toTanahRow),
    ]
    const dirMul = sortDir === 'asc' ? 1 : -1
    merged.sort((a, b) => {
      switch (sortCol) {
        case 'pembiaya_modal':
          return a.financier.localeCompare(b.financier, 'ms') * dirMul
        case 'nama_peminjam':
          return a.name.localeCompare(b.name, 'ms') * dirMul
        case 'jumlah_pembiayaan':
          return (a.value - b.value) * dirMul
        case 'jumlah_tunggakan_semasa': {
          const av = a.kind === 'fasiliti' ? Number(a.fasiliti.jumlah_tunggakan_semasa) || 0 : -1
          const bv = b.kind === 'fasiliti' ? Number(b.fasiliti.jumlah_tunggakan_semasa) || 0 : -1
          return (av - bv) * dirMul
        }
        case 'status_fasiliti':
          return a.statusKey.localeCompare(b.statusKey) * dirMul
        case 'kod_rujukan':
          return a.ref.localeCompare(b.ref, 'ms') * dirMul
        default:
          return (new Date(a.dicipta_pada).getTime() - new Date(b.dicipta_pada).getTime()) * dirMul
      }
    })
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
    rows = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  } else if (isTanahOnly && showTanah) {
    // ── Mod lot tanah sahaja ──
    totalItems = tanahCount
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
    const tq = supabase
      .from('tanah_jv')
      .select(TANAH_COLS)
      .order('dicipta_pada', { ascending: false })
    if (tanahOr) tq.or(tanahOr)
    const sumQ = supabase.from('tanah_jv').select('anggaran_nilaian').limit(UNIFIED_FETCH_LIMIT)
    if (tanahOr) sumQ.or(tanahOr)
    const [{ data }, { data: sumData }] = await Promise.all([
      tq.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      sumQ,
    ])
    rows = ((data ?? []) as TanahRow[]).map(toTanahRow)
    sumNilaiTanah = ((sumData ?? []) as { anggaran_nilaian: number | null }[]).reduce(
      (s, t) => s + (Number(t.anggaran_nilaian) || 0),
      0
    )
  } else {
    // ── Mod kategori fasiliti tunggal (input kategori tidak sah → 0 hasil, behaviour lama).
    // Tanpa kategori (cth. drill-down financier sahaja, atau role tanpa akses tanah):
    // jumlahkan ketiga-tiga count fasiliti (chips counts sudah hormati semua tapisan). ──
    totalItems = isSingleFasilitiKategori
      ? counts[kategoriFilter as 'jv_syarikat' | 'jv_tanah' | 'pinjaman_individu']
      : kategoriFilter
        ? 0
        : countJvSyarikat + countJvTanah + countPinjaman
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
    const dq = supabase
      .from('fasiliti')
      .select(FASILITI_COLS)
      .order(SORTABLE_COLUMNS.get(params.sort ?? '') ?? 'kod_rujukan', {
        ascending: sortDir === 'asc',
      })
    // Scope query to assigned facilities for pegawai
    if (assignedIds !== null) dq.in('id', assignedIds)
    if (statusFilter) dq.eq('status_fasiliti', statusFilter)
    if (financierFilter) dq.eq('pembiaya_modal', financierFilter)
    if (kategoriFilter) dq.eq('kategori', kategoriFilter)
    if (fasilitiOr) dq.or(fasilitiOr)
    const sumQ = supabase
      .from('fasiliti')
      .select('jumlah_pembiayaan, jumlah_tunggakan_semasa')
      .limit(UNIFIED_FETCH_LIMIT)
    if (assignedIds !== null) sumQ.in('id', assignedIds)
    if (statusFilter) sumQ.eq('status_fasiliti', statusFilter)
    if (financierFilter) sumQ.eq('pembiaya_modal', financierFilter)
    if (kategoriFilter) sumQ.eq('kategori', kategoriFilter)
    if (fasilitiOr) sumQ.or(fasilitiOr)
    const [{ data }, { data: sumData }] = await Promise.all([
      dq.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      sumQ,
    ])
    rows = ((data ?? []) as FasilitiRow[]).map(toFasilitiRow)
    const sumList = (sumData ?? []) as {
      jumlah_pembiayaan: number
      jumlah_tunggakan_semasa: number
    }[]
    sumPembiayaan = sumList.reduce((s, f) => s + (Number(f.jumlah_pembiayaan) || 0), 0)
    sumTunggakan = sumList.reduce((s, f) => s + (Number(f.jumlah_tunggakan_semasa) || 0), 0)
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)

  const canAdd = hasPermission(userProfile.peranan, 'tambah_fasiliti')
  const canAddTanah = canAdd && canSeeTanah
  const canExport = hasPermission(userProfile.peranan, 'eksport_excel')

  // Baki = E − jumlah bayaran (satu query agregat untuk row fasiliti dalam halaman ini)
  const ids = rows.flatMap((r) => (r.kind === 'fasiliti' ? [r.fasiliti.id] : []))
  const { data: bakiRows } = ids.length
    ? await supabase.from('fasiliti_baki').select('fasiliti_id, total_bayar, baki').in('fasiliti_id', ids)
    : { data: [] as { fasiliti_id: string; total_bayar: number; baki: number }[] | null }
  const bakiMap = new Map(
    (bakiRows ?? []).map((r) => [r.fasiliti_id as string, { totalBayar: Number(r.total_bayar) || 0, baki: Number(r.baki) || 0 }])
  )

  const exportParams = new URLSearchParams()
  if (params.q) exportParams.set('q', params.q)
  if (params.status) exportParams.set('status', params.status)
  if (params.kategori) exportParams.set('kategori', params.kategori)
  if (params.financier) exportParams.set('financier', params.financier)
  // Link buang tapisan financier (kekalkan tapisan lain)
  const clearFinancierParams = new URLSearchParams()
  if (params.q) clearFinancierParams.set('q', params.q)
  if (params.status) clearFinancierParams.set('status', params.status)
  if (params.kategori) clearFinancierParams.set('kategori', params.kategori)
  const clearFinancierQs = clearFinancierParams.toString()
  const clearFinancierHref = `/dashboard/fasiliti${clearFinancierQs ? `?${clearFinancierQs}` : ''}`
  const exportQs = exportParams.toString()
  const exportHref = `/api/export/fasiliti${exportQs ? `?${exportQs}` : ''}`

  return (
    <PageAccessGuard
      userId={userProfile.id}
      role={userProfile.peranan as UserRole}
      pagePath="/dashboard/fasiliti"
      featureName="Facility (All Records)"
    >
      <div className="space-y-5 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Facility Management
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                • {totalItems} Records
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
              {isPegawai ? 'My Facilities' : isTanahOnly ? 'Land Parcels' : 'All Facilities & Land'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canExport && <ExportButton href={exportHref} />}
            {canAddTanah && (
              <Link
                href="/dashboard/tanah-jv/tambah"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Land
              </Link>
            )}
            {canAdd && (
              <Link
                href="/dashboard/fasiliti/tambah"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Facility
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Suspense
          fallback={
            <div className="flex gap-3">
              <div className="h-9 w-72 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
              <div className="h-9 w-36 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
            </div>
          }
        >
          <FasilitiFilter
            defaultQ={params.q}
            defaultStatus={params.status}
            defaultKategori={params.kategori}
            counts={counts}
            showTanah={canSeeTanah}
          />
        </Suspense>

        {/* Ringkasan hasil tapis — sahkan angka dashboard (cth. Top Financiers).
            Financing = jumlah jumlah_pembiayaan set tapisan; klik financier di
            dashboard bawa ke sini dengan q=pembiaya_modal. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">
          <span>
            <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
              {totalItems}
            </span>{' '}
            records
          </span>
          {showFasiliti && (
            <span>
              Financing{' '}
              <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(sumPembiayaan)}
              </span>
            </span>
          )}
          {showFasiliti && (
            <span>
              Arrears (E){' '}
              <span className="font-mono font-bold text-[var(--color-danger)] tabular-nums">
                {formatCurrency(sumTunggakan)}
              </span>
            </span>
          )}
          {showTanah && (
            <span>
              Land value{' '}
              <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(sumNilaiTanah)}
              </span>
            </span>
          )}
          {(q || statusFilter || kategoriFilter) && (
            <span className="text-[var(--color-text-tertiary)]">
              Filtered
              {q ? ` by “${q}”` : ''}
              {kategoriFilter
                ? ` · ${(KATEGORI_LABELS as Record<string, string>)[kategoriFilter] ?? kategoriFilter}`
                : ''}
              {statusFilter
                ? ` · ${(STATUS_LABELS as Record<string, string>)[statusFilter] ?? statusFilter}`
                : ''}
            </span>
          )}
        </div>

        {financierFilter && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)] px-4 py-2.5 text-xs">
            <span className="text-[var(--color-text-secondary)]">
              Capital Financier (exact match):{' '}
              <strong className="text-[var(--color-text-primary)]">“{financierFilter}”</strong>
              {' · '}
              <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(sumPembiayaan)}
              </span>{' '}
              across{' '}
              <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
                {totalItems}
              </span>{' '}
              facilities — sama seperti angka Top Financiers di dashboard.
            </span>
            <Link
              href={clearFinancierHref}
              className="ml-auto inline-flex items-center gap-1 font-semibold text-[var(--color-brand)] hover:underline min-h-[32px] px-2"
            >
              ✕ Clear financier filter
            </Link>
          </div>
        )}

        {/* High-End Clean Table */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-raised)] flex items-center justify-center">
                <Search size={18} className="text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                No facility records found
              </p>
              {canAdd && (
                <Link
                  href="/dashboard/fasiliti/tambah"
                  className="text-xs text-[var(--color-brand)] hover:underline"
                >
                  Add first facility
                </Link>
              )}
            </div>
          ) : (
            <>
            <div className="hidden md:block overflow-x-auto" role="region" aria-label="Facility records table" tabIndex={0}>              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                    <SortableTh
                      label="Reference Code"
                      col="kod_rujukan"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                    />
                    <SortableTh
                      label="Capital Financier"
                      col="pembiaya_modal"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                    />
                    <SortableTh
                      label="Borrower / Contractor"
                      col="nama_peminjam"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                    />
                    <th className="px-4 py-3">Category</th>
                    <SortableTh
                      label="Financing / Value"
                      col="jumlah_pembiayaan"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                      right
                    />
                    <SortableTh
                      label="Baki"
                      col="jumlah_tunggakan_semasa"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                      right
                    />
                    <SortableTh
                      label="Status"
                      col="status_fasiliti"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                    />
                    <th className="px-4 py-3 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                  {rows.map((r) => {
                    if (r.kind === 'tanah') {
                      const t = r.tanah
                      return (
                        <tr
                          key={`tanah-${t.id}`}
                          className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              {t.no_lot}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--color-text-secondary)] leading-snug">
                              {r.financier || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[var(--color-text-primary)] leading-snug">
                              {t.tempat}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-tertiary)]">
                              {[t.bandar_mukim, t.daerah, t.negeri].filter(Boolean).join(', ')}
                              {t.no_hak_milik ? ` · ${t.no_hak_milik}` : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                              Tanah Lot
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] tabular-nums">
                            {t.anggaran_nilaian != null ? formatCurrency(t.anggaran_nilaian) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--color-text-tertiary)]">
                            —
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] border-[var(--color-border)]">
                              —
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/dashboard/tanah-jv/${t.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline min-h-[44px] px-2"
                            >
                              Open
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      )
                    }
                    const f = r.fasiliti
                    const paid = bakiMap.get(f.id)
                    const totalBayar = paid?.totalBayar ?? 0
                    const rawBaki = paid ? paid.baki : (f.jumlah_tunggakan_semasa ?? 0)
                    // Row selesai (cth. settle via asset kosongkan tunggakan): baki
                    // tidak boleh negatif walaupun rekod bayaran lama masih ada.
                    const baki =
                      f.status_fasiliti === 'selesai' ? Math.max(0, rawBaki) : rawBaki
                    const hasArrears = baki > 0
                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-[var(--color-brand)]">
                            {f.kod_rujukan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text-secondary)] leading-snug">
                            {f.pembiaya_modal}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--color-text-primary)] leading-snug">
                            {f.nama_peminjam}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {KATEGORI_LABELS[f.kategori as keyof typeof KATEGORI_LABELS] ?? f.kategori}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] tabular-nums">
                          {formatCurrency(f.jumlah_pembiayaan)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono tabular-nums ${hasArrears ? 'text-[var(--color-danger)] font-bold bg-[var(--color-danger-subtle)]/30' : 'text-[var(--color-text-tertiary)]'}`}
                        >
                          {formatCurrency(baki)}
                          {totalBayar > 0 && (
                            <span className="block text-[10px] font-sans font-normal text-emerald-600">
                              dibayar {formatCurrency(totalBayar)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[f.status_fasiliti as keyof typeof STATUS_STYLES] ?? ''}`}
                          >
                            {STATUS_LABELS[f.status_fasiliti as keyof typeof STATUS_LABELS] ?? f.status_fasiliti}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/dashboard/fasiliti/${f.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline min-h-[44px] px-2"
                          >
                            Open
                            <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile card list */}
            <ul className="md:hidden divide-y divide-[var(--color-border)]">
              {rows.map((r) => {
                if (r.kind === 'tanah') {
                  const t = r.tanah
                  return (
                    <li key={`tanah-${t.id}`} className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate">
                          {t.no_lot}
                        </span>
                        <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          Tanah Lot
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)] leading-snug break-words">
                        {t.tempat}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] break-words mt-0.5">
                        {[t.bandar_mukim, t.daerah, t.negeri].filter(Boolean).join(', ')}
                        {t.no_hak_milik ? ` · ${t.no_hak_milik}` : ''}
                      </p>
                      <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            Value
                          </p>
                          <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)] tabular-nums break-words">
                            {t.anggaran_nilaian != null ? formatCurrency(t.anggaran_nilaian) : '—'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/tanah-jv/${t.id}`}
                        className="mt-2.5 inline-flex w-full min-h-[44px] items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)]"
                      >
                        Open
                        <ArrowUpRight size={12} />
                      </Link>
                    </li>
                  )
                }
                const f = r.fasiliti
                const paid = bakiMap.get(f.id)
                const totalBayar = paid?.totalBayar ?? 0
                const rawBaki = paid ? paid.baki : (f.jumlah_tunggakan_semasa ?? 0)
                const baki =
                  f.status_fasiliti === 'selesai' ? Math.max(0, rawBaki) : rawBaki
                const hasArrears = baki > 0
                return (
                  <li key={f.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-[var(--color-brand)] truncate">
                        {f.kod_rujukan}
                      </span>
                      <span
                        className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[f.status_fasiliti as keyof typeof STATUS_STYLES] ?? ''}`}
                      >
                        {STATUS_LABELS[f.status_fasiliti as keyof typeof STATUS_LABELS] ?? f.status_fasiliti}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)] leading-snug break-words">
                      {f.pembiaya_modal}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] break-words mt-0.5">
                      {f.nama_peminjam}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                      {KATEGORI_LABELS[f.kategori as keyof typeof KATEGORI_LABELS] ?? f.kategori}
                    </p>
                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Financing
                        </p>
                        <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)] tabular-nums break-words">
                          {formatCurrency(f.jumlah_pembiayaan)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Baki
                        </p>
                        <p className={`text-sm font-mono tabular-nums break-words ${hasArrears ? 'text-[var(--color-danger)] font-bold' : 'text-[var(--color-text-tertiary)]'}`}>
                          {formatCurrency(baki)}
                        </p>
                        {totalBayar > 0 && (
                          <p className="text-[10px] font-sans text-emerald-600">
                            dibayar {formatCurrency(totalBayar)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/fasiliti/${f.id}`}
                      className="mt-2.5 inline-flex w-full min-h-[44px] items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Open
                      <ArrowUpRight size={12} />
                    </Link>
                  </li>
                )
              })}
            </ul>
            </>
          )}

          {rows.length > 0 && (
            <FasilitiPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
      </div>
    </PageAccessGuard>
  )
}
