import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import { formatRM, formatArea } from '../summary/_helpers'
import { TanahMDTable } from '../summary/tanah-md/TanahMDTable'
import { hasPermission } from '@/lib/auth/permissions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tanah MD (JV)' }

export default async function TanahJVPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  const { data: tanahList } = await supabase
    .from('tanah_jv')
    .select('id, negeri, daerah, bandar_mukim, tempat, no_lot, tarikh_daftar, no_hak_milik, luas_meter_persegi, anggaran_nilaian, catatan, dikemaskini_pada')
    .order('dicipta_pada', { ascending: true })

  const rows = tanahList ?? []

  const totalLuas = rows.reduce((s, t) => s + (t.luas_meter_persegi ?? 0), 0)
  const totalNilaian = rows.reduce((s, t) => s + (t.anggaran_nilaian ?? 0), 0)
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
                Pendaftaran Tanah
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">• {rows.length} Lot Tanah</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
              Tanah MD (JV)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Minimalist Summary Metric Band */}
          <div className="hidden md:flex items-center gap-5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-1.5 rounded-lg shadow-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Jumlah Keluasan</p>
              <p className="font-mono font-bold text-[var(--color-text-primary)]">{formatArea(totalLuas)}</p>
            </div>
            <div className="h-6 w-px bg-[var(--color-border)]" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Cagaran Nilaian</p>
              <p className="font-mono font-bold text-[var(--color-text-primary)]">{formatRM(totalNilaian)}</p>
            </div>
          </div>

          {canAdd && (
            <Link
              href="/dashboard/tanah-jv/tambah"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus size={14} />
              + Tambah Tanah (JV)
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Tanah MD Client Table */}
      <TanahMDTable rows={rows} />
    </div>
  )
}
