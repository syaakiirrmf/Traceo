import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { hasPermission } from '@/lib/auth/permissions'
import type { Lampiran } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('tanah_jv')
    .select('no_lot')
    .eq('id', id)
    .single()
  return { title: data ? `Chronology ${data.no_lot}` : 'Chronology' }
}

function fmtArea(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 4 }).format(n) + ' m²'
}

function fmtCurrency(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

export default async function TanahKronologiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  if (!hasPermission(userProfile.peranan, 'jana_kronologi')) {
    redirect(`/dashboard/tanah-jv/${id}`)
  }

  const [{ data: tanah }, { data: susulan }] = await Promise.all([
    supabase.from('tanah_jv').select('*').eq('id', id).single(),
    supabase.from('susulan')
      .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
      .eq('tanah_id', id)
      .order('tarikh_susulan', { ascending: true }),
  ])

  if (!tanah) notFound()

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href={`/dashboard/tanah-jv/${id}`}
          className="mt-1 w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors flex-shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Chronology Preview
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <span className="font-mono text-[var(--color-brand)]">No. Lot {tanah.no_lot}</span>
            {' · '}{[tanah.bandar_mukim, tanah.daerah, tanah.negeri].filter(Boolean).join(' · ')}
          </p>
        </div>
        {/* Export buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/api/tanah-jv/${id}/kronologi-pdf`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <FileText size={14} />
            PDF
          </a>
          <a
            href={`/api/tanah-jv/${id}/kronologi`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            <Download size={14} />
            Export Word
          </a>
        </div>
      </div>

      {/* Preview document */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
        {/* Document header */}
        <div className="p-8 pb-6 text-center border-b border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">
            STRICTLY CONFIDENTIAL
          </p>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
            FOLLOW-UP CHRONOLOGY
          </h2>
          <p className="text-base font-medium text-[var(--color-text-secondary)] mt-1">
            No. Lot {tanah.no_lot} — {[tanah.bandar_mukim, tanah.daerah, tanah.negeri].filter(Boolean).join(', ')}
          </p>
        </div>

        {/* Info table */}
        <div className="px-8 py-6 border-b border-[var(--color-border)]">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--color-border)]">
              {[
                ['State', tanah.negeri],
                ['District', tanah.daerah],
                ['Town / Village / Mukim', tanah.bandar_mukim],
                ['Location', tanah.tempat],
                ['No. Lot', tanah.no_lot],
                ...(tanah.no_hak_milik ? [['Title No.', tanah.no_hak_milik]] : []),
                ...(tanah.tarikh_daftar ? [['Registered On', formatDate(tanah.tarikh_daftar)]] : []),
                ['Area (m²)', fmtArea(tanah.luas_meter_persegi)],
                ['Estimated Value (RM)', fmtCurrency(tanah.anggaran_nilaian)],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="py-2 pr-4 font-medium text-[var(--color-text-secondary)] w-[40%]">{label}</td>
                  <td className="py-2 text-[var(--color-text-primary)]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Catatan */}
        {tanah.catatan && (
          <div className="px-8 py-5 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{tanah.catatan}</p>
          </div>
        )}

        {/* Susulan entries */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-5">
            Follow-up Chronology ({susulan?.length ?? 0} records)
          </h3>

          {(!susulan || susulan.length === 0) ? (
            <p className="text-sm text-[var(--color-text-tertiary)] italic">No follow-up records.</p>
          ) : (
            <div className="space-y-5">
              {susulan.map((s, i) => (
                <div key={s.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-[var(--color-brand)]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-brand)] mb-1">
                      {formatDate(s.tarikh_susulan, 'dd MMMM yyyy')}
                    </p>
                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                      {s.catatan}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5 italic">
                      Recorded by: {s.dicatat_oleh_user?.nama ?? '—'}
                    </p>
                    {s.lampiran && s.lampiran.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.lampiran.map((l: Lampiran) => (
                          <a key={l.id} href={l.url_fail} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-full hover:underline">
                            📎 {l.nama_asal}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)] text-right">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Generated on: {formatDate(new Date())}
          </p>
        </div>
      </div>
    </div>
  )
}