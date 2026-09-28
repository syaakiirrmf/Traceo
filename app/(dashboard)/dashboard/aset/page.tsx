import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Landmark, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { assertPageAccess } from '@/lib/auth/access-control'
import { PageAccessGuard } from '@/components/ui/PageAccessGuard'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Assets — Settled via Asset' }

const KATEGORI_LABELS = {
  jv_syarikat: 'Company JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
} as const

interface SearchParams {
  q?: string
}

/**
 * Aset: semua fasiliti yang dah jadi aset — iaitu settle BUKAN sebab dibayar,
 * tetapi sebab cagaran diambil alih (pindah milik kepada penama / dijual).
 * Rekod masuk ke sini automatik sebaik butang "Settle via Asset" ditekan
 * (status selesai + cara melalui_aset). Rekod kekal juga dalam senarai
 * Facilities (status Completed) untuk audit penuh.
 */
export default async function AsetPage({
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

  await assertPageAccess(userProfile.id, userProfile.peranan as UserRole, '/dashboard/aset')

  const isPegawai = userProfile.peranan === 'pegawai_susulan'

  // Pegawai hanya nampak aset daripada fasiliti yang ditugaskan kepadanya
  // (selaras dengan skop senarai Facilities).
  let assignedIds: string[] | null = null
  if (isPegawai) {
    const { data: assigned } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('user_id', userProfile.id)
    assignedIds = (assigned ?? []).map((r) => r.fasiliti_id as string)
    if (assignedIds.length === 0) assignedIds = ['00000000-0000-0000-0000-000000000000']
  }

  const q = (params.q ?? '').trim()

  let query = supabase
    .from('fasiliti')
    .select(
      'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, nilai_cagaran, penama_aset, status_pindahmilik, dikemaskini_pada'
    )
    .eq('status_fasiliti', 'selesai')
    .eq('cara_selesai', 'melalui_aset')
    .order('dikemaskini_pada', { ascending: false })

  if (assignedIds !== null) query = query.in('id', assignedIds)
  if (q) {
    query = query.or(
      `kod_rujukan.ilike.%${q}%,nama_peminjam.ilike.%${q}%,pembiaya_modal.ilike.%${q}%,penama_aset.ilike.%${q}%`
    )
  }

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: string
    kod_rujukan: string
    kategori: string
    nama_peminjam: string
    pembiaya_modal: string
    jumlah_pembiayaan: number
    nilai_cagaran: number | null
    penama_aset: string | null
    status_pindahmilik: string | null
    dikemaskini_pada: string
  }>

  const totalFinancing = rows.reduce((s, r) => s + (Number(r.jumlah_pembiayaan) || 0), 0)
  const totalCollateral = rows.reduce((s, r) => s + (Number(r.nilai_cagaran) || 0), 0)

  return (
    <PageAccessGuard
      userId={userProfile.id}
      role={userProfile.peranan as UserRole}
      pagePath="/dashboard/aset"
      featureName="Assets"
    >
      <div className="space-y-5 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <ArrowLeft size={15} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Settled Collateral
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  • {rows.length} Assets
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5 flex items-center gap-2">
                <Landmark size={18} className="text-emerald-600" />
                Assets
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Facilities settled because their collateral became an asset — transferred
                to a nominee or sold. New assets appear here automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <form method="get" className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search ref, borrower, funder, nominee..."
              className="w-full h-11 sm:h-10 pl-8 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="h-11 sm:h-10 px-4 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href="/dashboard/aset"
              className="inline-flex items-center h-11 sm:h-10 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Summary band */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">
          <span>
            <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
              {rows.length}
            </span>{' '}
            assets{q ? ` matching “${q}”` : ''}
          </span>
          <span>
            Financing recovered{' '}
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {formatCurrency(totalFinancing)}
            </span>
          </span>
          <span>
            Collateral value{' '}
            <span className="font-mono font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalCollateral)}
            </span>
          </span>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Landmark size={18} className="text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                {q ? 'No assets match your search.' : 'No assets yet.'}
              </p>
              {!q && (
                <p className="text-xs text-[var(--color-text-tertiary)] max-w-sm">
                  When a facility is settled via asset (collateral transferred to a nominee
                  or sold), it will appear here automatically.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto" role="region" aria-label="Assets table" tabIndex={0}>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                      <th className="px-4 py-3">Reference Code</th>
                      <th className="px-4 py-3">Borrower / Contractor</th>
                      <th className="px-4 py-3">Capital Financier</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Asset Nominee</th>
                      <th className="px-4 py-3">Transfer / Sale Note</th>
                      <th className="px-4 py-3 text-right">Financing (A)</th>
                      <th className="px-4 py-3 text-right">Collateral Value</th>
                      <th className="px-4 py-3 text-center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-[var(--color-brand)]">
                            {r.kod_rujukan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--color-text-primary)] leading-snug">
                            {r.nama_peminjam}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text-secondary)] leading-snug">
                            {r.pembiaya_modal}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {KATEGORI_LABELS[r.kategori as keyof typeof KATEGORI_LABELS] ?? r.kategori}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text-primary)] leading-snug">
                            {r.penama_aset ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)] max-w-[220px] truncate" title={r.status_pindahmilik ?? ''}>
                          {r.status_pindahmilik || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-text-primary)] tabular-nums">
                          {formatCurrency(r.jumlah_pembiayaan)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {r.nilai_cagaran != null ? formatCurrency(r.nilai_cagaran) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/dashboard/fasiliti/${r.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline min-h-[44px] px-2"
                          >
                            Open
                            <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card list */}
              <ul className="md:hidden divide-y divide-[var(--color-border)]">
                {rows.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-[var(--color-brand)] truncate">
                        {r.kod_rujukan}
                      </span>
                      <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                        Asset
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)] leading-snug break-words">
                      {r.nama_peminjam}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] break-words mt-0.5">
                      Nominee: {r.penama_aset ?? '—'}
                    </p>
                    {r.status_pindahmilik && (
                      <p className="text-[11px] text-[var(--color-text-tertiary)] break-words mt-0.5">
                        {r.status_pindahmilik}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Financing
                        </p>
                        <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)] tabular-nums break-words">
                          {formatCurrency(r.jumlah_pembiayaan)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Collateral
                        </p>
                        <p className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums break-words">
                          {r.nilai_cagaran != null ? formatCurrency(r.nilai_cagaran) : '—'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/fasiliti/${r.id}`}
                      className="mt-2.5 inline-flex w-full min-h-[44px] items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Open
                      <ArrowUpRight size={12} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </PageAccessGuard>
  )
}
