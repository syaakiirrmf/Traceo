import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { editSusulan } from '@/lib/actions/susulan'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Follow-up' }

export default async function EditSusulanPage({
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

  const { data: susulan } = await supabase
    .from('susulan')
    .select('*, fasiliti:fasiliti(kod_rujukan, nama_peminjam)')
    .eq('id', susulanId)
    .eq('fasiliti_id', id)
    .single()

  if (!susulan) notFound()

  // Pegawai susulan only allowed to edit their own records
  if (userProfile.peranan === 'pegawai_susulan' && susulan.dicatat_oleh !== userProfile.id) {
    redirect(`/dashboard/fasiliti/${id}`)
  }

  // Viewer cannot edit
  if (userProfile.peranan === 'viewer') {
    redirect(`/dashboard/fasiliti/${id}`)
  }

  const action = editSusulan.bind(null, susulanId, id)
  const fasiliti = susulan.fasiliti

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/fasiliti/${id}`}
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Edit Follow-up
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <span className="font-mono text-[var(--color-brand)]">{fasiliti?.kod_rujukan}</span>
            {' · '}
            {fasiliti?.nama_peminjam}
          </p>
        </div>
      </div>

      <form action={action} className="space-y-5">
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
          <button
            type="submit"
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            Save changes
          </button>
          <Link
            href={`/dashboard/fasiliti/${id}`}
            className="px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
