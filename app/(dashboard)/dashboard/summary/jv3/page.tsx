import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { formatRM } from '../_helpers'
import { JV3Table } from './JV3Table'
import { hasPermission } from '@/lib/auth/permissions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Personal Loan — Individual Loan' }

export default async function SummaryJV3Page() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')
  const { data: userProfile } = await supabase.from('users').select('id, peranan').eq('auth_id', authUser.id).single()
  if (!userProfile) redirect('/login')

  const { data: fasiliti } = await supabase
    .from('fasiliti')
    .select('id, kod_rujukan, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, kadar_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, ringkasan_cagaran, penama_aset, status_pindahmilik, status_fasiliti, catatan_am, dikemaskini_pada')
    .eq('kategori', 'pinjaman_individu')
    .order('dicipta_pada', { ascending: true })

  const rows = fasiliti ?? []

  const totalPembiayaan = rows.reduce((s, f) => s + (f.jumlah_pembiayaan ?? 0), 0)
  const totalTunggakan = rows.reduce((s, f) => s + (f.jumlah_tunggakan_semasa ?? 0), 0)
  const canAdd = hasPermission(userProfile.peranan, 'tambah_fasiliti')

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header: Title + Actions */}
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
                Individual Loan
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)]">• {rows.length} Records</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
              Personal Loan
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Summary Metric Band */}
          <div className="hidden md:flex items-center gap-5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-1.5 rounded-lg shadow-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Capital Financing</p>
              <p className="font-mono font-bold text-[var(--color-text-primary)]">{formatRM(totalPembiayaan)}</p>
            </div>
            <div className="h-6 w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Total Arrears</p>
              <p className={`font-mono font-bold ${totalTunggakan > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`}>
                {formatRM(totalTunggakan)}
              </p>
            </div>
          </div>

          {canAdd && (
            <Link
              href="/dashboard/fasiliti/tambah?kategori=pinjaman_individu"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus size={14} />
              + Add Record (Personal Loan)
            </Link>
          )}
        </div>
      </div>

      {/* Interactive JV3 Client Table */}
      <JV3Table rows={rows} />
    </div>
  )
}
