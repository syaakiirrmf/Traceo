import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import Link from 'next/link'
import { ArrowLeft, Edit, Plus, Pencil, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DeleteTanahSusulanButton } from '@/components/susulan/DeleteTanahSusulanButton'
import type { Lampiran } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Land Parcel Details' }

function formatArea(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 4 }).format(n) + ' m²'
}

function formatCurrency(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

export default async function TanahJVDetailPage({
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

  const [{data:tanah}, {data:susulan}] = await Promise.all ([
    supabase
    .from('tanah_jv')
    .select('*')
    .eq ('id',id)
    .single(),
    supabase
    .from ('susulan')
    .select ('*,lampiran(*),dicatat_oleh_user:users(nama)')
    .eq('tanah_id',id)
    .order('tarikh_susulan', {ascending: true}),
  ])

  if (!tanah) notFound()

  const canEdit = hasPermission(userProfile.peranan, 'edit_fasiliti')
  const canAddSusulan = hasPermission(userProfile.peranan, 'tambah_susulan')
  const canExport = hasPermission(userProfile.peranan, 'jana_kronologi')

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/tanah-jv"
          className="mt-1 w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
            Tanah MD (JV) — Land Registry
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {tanah.no_lot}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {[tanah.tempat, tanah.bandar_mukim, tanah.daerah, tanah.negeri].filter(Boolean).join(' · ')}
          </p>
        </div>
        {canExport && (
          <Link
            href={`/dashboard/tanah-jv/${id}/kronologi`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <FileText size={14} />
            Chronology
          </Link>
        )}
        {canEdit && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/dashboard/tanah-jv/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <Edit size={14} />
              Edit
            </Link>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Luas</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text-primary)]">{formatArea(tanah.luas_meter_persegi)}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Cagaran Nilaian</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-brand)]">{formatCurrency(tanah.anggaran_nilaian)}</p>
        </div>
      </div>

      {/* Tajuk details */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] pb-2">
          Tajuk — Land Title Information
        </p>
        <InfoRow label="Negeri" value={tanah.negeri} />
        <InfoRow label="Daerah" value={tanah.daerah} />
        <InfoRow label="Bandar / Pekan / Mukim" value={tanah.bandar_mukim} />
        <InfoRow label="Tempat" value={tanah.tempat} />
        <InfoRow label="No. Lot" value={tanah.no_lot} />
        {tanah.no_hak_milik && <InfoRow label="No. Hak Milik" value={tanah.no_hak_milik} />}
        {tanah.tarikh_daftar && <InfoRow label="Daftar Pada" value={formatDate(tanah.tarikh_daftar)} />}
      </div>

      {/* Catatan */}
      {tanah.catatan && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">Catatan</p>
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{tanah.catatan}</p>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Registered {formatDate(tanah.dicipta_pada, 'dd/MM/yyyy HH:mm')}
        {tanah.dikemaskini_pada !== tanah.dicipta_pada && ` · Updated ${formatDate(tanah.dikemaskini_pada, 'dd/MM/yyyy HH:mm')}`}
      </p>

   {/* Susulan section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Follow-up Chronology
            <span className="ml-2 text-sm font-normal text-[var(--color-text-tertiary)]">
              ({susulan?.length ?? 0} records)
            </span>
          </h2>
          {canAddSusulan && (
            <Link
              href={`/dashboard/tanah-jv/${id}/susulan/tambah`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <Plus size={14} />
              Add follow-up
            </Link>
          )}
        </div>

        {(!susulan || susulan.length === 0) ? (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] border-dashed p-10 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">No follow-up records yet</p>
            {canAddSusulan && (
              <Link
                href={`/dashboard/tanah-jv/${id}/susulan/tambah`}
                className="mt-2 inline-block text-sm text-[var(--color-brand)] hover:underline"
              >
                Add first follow-up
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-0 relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-6 bottom-6 w-px bg-[var(--color-border)]" />

            {susulan.map((s, i) => (
              <div key={s.id} className="relative pl-10 pb-6 last:pb-0">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-[30px] h-[30px] rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-brand-muted)] flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-[var(--color-brand)]">{i + 1}</span>
                </div>

                <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--color-brand)] mb-1.5">
                        {formatDate(s.tarikh_susulan, 'dd MMMM yyyy')}
                      </p>
                      <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                        {s.catatan}
                      </p>
                    </div>
                    <div className="flex items-start gap-1 flex-shrink-0">
                      {(userProfile.peranan === 'admin' ||
                        userProfile.peranan === 'pengurus' ||
                        (userProfile.peranan === 'pegawai_susulan' &&
                          s.dicatat_oleh === userProfile.id)) && (
                        <>
                          <Link
                            href={`/dashboard/tanah-jv/${id}/susulan/${s.id}/edit`}
                            className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
                            title="Edit susulan"
                          >
                            <Pencil size={13} />
                          </Link>
                          <DeleteTanahSusulanButton
                            susulanId={s.id}
                            tanahId={id}
                            tarikh={formatDate(s.tarikh_susulan, 'dd/MM/yyyy')}
                          />
                        </>
                      )}
                      <p className="text-xs text-[var(--color-text-tertiary)] pt-1 ml-2">
                        {s.dicatat_oleh_user?.nama ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Attachments */}
                  {s.lampiran && s.lampiran.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.lampiran.map((l: Lampiran) => (
                        <a
                          key={l.id}
                          href={l.url_fail}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-brand)] hover:underline bg-[var(--color-brand-subtle)] px-2 py-1 rounded-full"
                        >
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
    </div>

    
    
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide flex-shrink-0 w-48">{label}</span>
      <span className="text-sm text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  )
}
