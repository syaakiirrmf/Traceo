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
import type { Metadata } from 'next'

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
}

const PAGE_SIZE = 10

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

  let query = supabase
    .from('fasiliti')
    .select(
      'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, status_fasiliti, tarikh_mula, jumlah_tunggakan_semasa',
      { count: 'exact' }
    )
    .order('dicipta_pada', { ascending: false })

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
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Facility Management
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              • {fasiliti?.length ?? 0} Records
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            All Financing Facilities
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
                  <th className="px-4 py-3">Reference Code</th>
                  <th className="px-4 py-3">Borrower / Contractor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Total Financing</th>
                  <th className="px-4 py-3 text-right">Total Arrears</th>
                  <th className="px-4 py-3">Status</th>
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
                        {KATEGORI_LABELS[f.kategori as keyof typeof KATEGORI_LABELS]}
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
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[f.status_fasiliti as keyof typeof STATUS_STYLES]}`}
                        >
                          {STATUS_LABELS[f.status_fasiliti as keyof typeof STATUS_LABELS]}
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
  )
}
