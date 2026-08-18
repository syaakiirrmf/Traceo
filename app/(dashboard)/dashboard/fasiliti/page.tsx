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
} as const

interface SearchParams {
  q?: string
  status?: string
  kategori?: string
  page?: string
  sort?: string
  dir?: string
}

const PAGE_SIZE = 10

const SORTABLE_COLUMNS = new Map([
  ['kod_rujukan', 'kod_rujukan'],
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

  // Server-side sorting
  const sortCol = SORTABLE_COLUMNS.get(params.sort ?? '') ?? 'kod_rujukan'
  const sortDir = params.dir === 'asc' ? 'asc' : 'desc'

  let query = supabase
    .from('fasiliti')
    .select(
      'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, status_fasiliti, tarikh_mula, jumlah_tunggakan_semasa',
      { count: 'exact' }
    )
    .order(sortCol, { ascending: sortDir === 'asc' })

  // Scope query to assigned facilities for pegawai
  if (assignedIds !== null) query = query.in('id', assignedIds)

  if (params.status) query = query.eq('status_fasiliti', params.status)
  if (params.kategori) query = query.eq('kategori', params.kategori)
  if (params.q) {
    query = query.or(
      `nama_peminjam.ilike.%${params.q}%,pembiaya_modal.ilike.%${params.q}%,kod_rujukan.ilike.%${params.q}%`
    )
  }

  const countQuery = supabase.from('fasiliti').select('id', { count: 'exact', head: true })
  if (assignedIds !== null) countQuery.in('id', assignedIds)
  if (params.status) countQuery.eq('status_fasiliti', params.status)
  if (params.kategori) countQuery.eq('kategori', params.kategori)
  if (params.q) {
    countQuery.or(
      `nama_peminjam.ilike.%${params.q}%,pembiaya_modal.ilike.%${params.q}%,kod_rujukan.ilike.%${params.q}%`
    )
  }
  const { count } = await countQuery
  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)

  const { data: fasiliti } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const canAdd = hasPermission(userProfile.peranan, 'tambah_fasiliti')

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
              {isPegawai ? 'My Facilities' : 'All Financing Facilities'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton href="/api/export/fasiliti" />
            {canAdd && (
              <Link
                href="/dashboard/fasiliti/tambah"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
              >
                <Plus size={14} />+ Add Facility
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
          />
        </Suspense>

        {/* High-End Clean Table */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
          {!fasiliti || fasiliti.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
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
                      label="Borrower / Contractor"
                      col="nama_peminjam"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                    />
                    <th className="px-4 py-3">Category</th>
                    <SortableTh
                      label="Total Financing"
                      col="jumlah_pembiayaan"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      params={params}
                      right
                    />
                    <SortableTh
                      label="Total Arrears"
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
                  {fasiliti.map((f) => {
                    const hasArrears = (f.jumlah_tunggakan_semasa ?? 0) > 0
                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-[var(--color-brand)]">
                            {f.kod_rujukan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--color-text-primary)] leading-snug">
                            {f.nama_peminjam}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                            {f.pembiaya_modal}
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
                          {formatCurrency(f.jumlah_tunggakan_semasa)}
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
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
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
          )}

          {fasiliti && fasiliti.length > 0 && (
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
