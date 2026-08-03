import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { tambahSusulanTanah } from '@/lib/actions/tanah_jv_susulan'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Follow-up' }

export default async function TambahSusulanTanahPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: tanah } = await supabase
    .from('tanah_jv')
    .select('no_lot, negeri, daerah')
    .eq('id', id)
    .single()

  if (!tanah) redirect('/dashboard/tanah-jv')

  const today = new Date().toISOString().split('T')[0]

  const action = tambahSusulanTanah.bind(null, id)

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/tanah-jv/${id}`}
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Add Follow-up
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <span className="font-mono text-[var(--color-brand)]">Tanah MD</span>
            {' · '}{tanah.no_lot}
          </p>
        </div>
      </div>

      <form action={action} className="space-y-5">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-4">
          {/* Tarikh */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Follow-up Date <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="date"
              name="tarikh_susulan"
              required
              defaultValue={today}
              max={today}
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Date the event occurred (not entry date)
            </p>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Notes / Description <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              name="catatan"
              required
              rows={6}
              placeholder="Full description of the follow-up, discussions, decisions, or actions taken..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Lampiran */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Attachments <span className="text-xs font-normal text-[var(--color-text-tertiary)]">(optional)</span>
          </h2>

          <label
            htmlFor="lampiran"
            className="flex flex-col items-center justify-center gap-2 h-28 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-muted)] hover:bg-[var(--color-brand-subtle)] transition-colors cursor-pointer"
          >
            <Upload size={20} className="text-[var(--color-text-tertiary)]" />
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Click to upload files</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Images (JPG, PNG) or documents (PDF, DOCX) · Max 10MB per file
              </p>
            </div>
            <input
              id="lampiran"
              type="file"
              name="lampiran"
              multiple
              accept="image/*,.pdf,.docx,.doc"
              className="sr-only"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            Save follow-up
          </button>
          <Link
            href={`/dashboard/tanah-jv/${id}`}
            className="px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}