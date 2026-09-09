import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { assertPageAccess } from '@/lib/auth/access-control'
import { editSusulanTanah } from '@/lib/actions/tanah_jv_susulan'
import { tambahLampiranSusulan, padamLampiran } from '@/lib/actions/susulan'
import { hasPermission } from '@/lib/auth/permissions'
import { LampiranInput } from '@/components/susulan/LampiranInput'
import { ActionForm } from '@/components/forms/ActionForm'
import { SubmitButton } from '@/components/ui/SubmitButton'
import Link from 'next/link'
import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Edit Follow-up' }

export default async function EditSusulanTanahPage({
  params,
}: {
  params: Promise<{ id: string; susulanId: string }>
}) {
  const { id, susulanId } = await params
  const supabase = await createClient()

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

  await assertPageAccess(userProfile.id, userProfile.peranan as UserRole, '/dashboard/tanah-jv')

  const { data: susulan } = await supabase
    .from('susulan')
    .select('*, tanah:tanah_jv(no_lot, negeri, daerah), lampiran(*)')
    .eq('id', susulanId)
    .eq('tanah_id', id)
    .single()

  if (!susulan) notFound()

  // Pegawai susulan only allowed to edit their own records
  if (userProfile.peranan === 'pegawai_susulan' && susulan.dicatat_oleh !== userProfile.id) {
    redirect(`/dashboard/tanah-jv/${id}`)
  }

  // Viewer cannot edit
  if (userProfile.peranan === 'viewer') {
    redirect(`/dashboard/tanah-jv/${id}`)
  }

  const action = editSusulanTanah.bind(null, susulanId, id)
  const tambahLampiran = tambahLampiranSusulan.bind(null, susulanId, `/dashboard/tanah-jv/${id}/susulan/${susulanId}/edit`)
  const canDeleteLampiran = hasPermission(userProfile.peranan, 'edit_susulan_orang_lain')
  const tanah = susulan.tanah

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/tanah-jv/${id}`}
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Edit Follow-up
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <span className="font-mono text-[var(--color-brand)]">Tanah MD</span>
            {' · '}
            {tanah?.no_lot}
          </p>
        </div>
      </div>

      <ActionForm action={action} className="space-y-5">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Follow-up Date <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="date"
              name="tarikh_susulan"
              required
              defaultValue={susulan.tarikh_susulan}
              max={new Date().toISOString().split('T')[0]}
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Notes / Description <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              name="catatan"
              required
              rows={7}
              defaultValue={susulan.catatan}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton>Save changes</SubmitButton>
          <Link
            href={`/dashboard/tanah-jv/${id}`}
            className="px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </ActionForm>

      {/* Lampiran sedia ada */}
      <div className="mt-5 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Attachments{' '}
          <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
            ({susulan.lampiran?.length ?? 0})
          </span>
        </h2>
        {(susulan.lampiran?.length ?? 0) === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">Tiada lampiran.</p>
        ) : (
          <ul className="space-y-2">
            {susulan.lampiran.map((l: { id: string; nama_asal: string; url_fail: string }) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2"
              >
                <a
                  href={l.url_fail}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--color-brand)] hover:underline truncate flex items-center gap-1.5 min-w-0"
                >
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">{l.nama_asal}</span>
                </a>
                {canDeleteLampiran && (
                  <form action={padamLampiran.bind(null, l.id, `/dashboard/tanah-jv/${id}/susulan/${susulanId}/edit`)}>
                    <button
                      type="submit"
                      aria-label={`Padam ${l.nama_asal}`}
                      className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={tambahLampiran} className="space-y-3 pt-1">
          <LampiranInput />
          <button
            type="submit"
            className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Tambah lampiran
          </button>
        </ActionForm>
      </div>
    </div>
  )
}
