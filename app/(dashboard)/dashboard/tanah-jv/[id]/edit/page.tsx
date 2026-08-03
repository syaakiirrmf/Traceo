import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { editTanahJV } from '@/lib/actions/tanah_jv'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Land Parcel' }

export default async function EditTanahJVPage({
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

  if (!userProfile || !hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    redirect('/dashboard/tanah-jv')
  }

  const { data: tanah } = await supabase
    .from('tanah_jv')
    .select('*')
    .eq('id', id)
    .single()

  if (!tanah) notFound()

  const action = editTanahJV.bind(null, id)

  const s = (key: string) => (tanah[key] != null ? String(tanah[key]) : '')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/tanah-jv/${id}`}
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Edit Land Parcel</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <span className="font-mono text-[var(--color-brand)]">{tanah.no_lot}</span>
            {' · '}{tanah.tempat}
          </p>
        </div>
      </div>

      <form action={action} className="space-y-5">
        {/* Tajuk */}
        <Section title="Tajuk — Land Title Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Negeri (State)" name="negeri" required defaultValue={s('negeri')} placeholder="e.g. Negeri Sembilan" />
            <Field label="Daerah (District)" name="daerah" required defaultValue={s('daerah')} placeholder="e.g. Seremban" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bandar / Pekan / Mukim" name="bandar_mukim" required defaultValue={s('bandar_mukim')} placeholder="e.g. Mukim Tuk Jamal" />
            <Field label="Tempat (Location)" name="tempat" required defaultValue={s('tempat')} placeholder="e.g. Gemencheh" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="No. Lot" name="no_lot" required defaultValue={s('no_lot')} placeholder="e.g. LOT 1979" />
            <Field label="No. Hak Milik (Title No.)" name="no_hak_milik" defaultValue={s('no_hak_milik')} placeholder="e.g. GM 1837" />
          </div>
          <Field label="Daftar Pada (Registration Date)" name="tarikh_daftar" type="date" defaultValue={s('tarikh_daftar')} />
        </Section>

        {/* Luas & Nilaian */}
        <Section title="Luas &amp; Penilaian">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Luas (m²)" name="luas_meter_persegi" type="number" defaultValue={s('luas_meter_persegi')} placeholder="0.0000" step="0.0001" min="0" />
            <Field label="Cagaran Nilaian (RM)" name="anggaran_nilaian" type="number" defaultValue={s('anggaran_nilaian')} placeholder="0.00" step="0.01" min="0" />
          </div>
        </Section>

        {/* Catatan */}
        <Section title="Catatan">
          <textarea
            name="catatan"
            rows={4}
            defaultValue={s('catatan')}
            placeholder="Additional notes, legal status, encumbrances..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
          />
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/tanah-jv/${id}`}
            className="px-6 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-4">
      <h2
        className="text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {children}
    </section>
  )
}

function Field({ label, name, type = 'text', required, defaultValue, placeholder, step, min }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string; placeholder?: string; step?: string; min?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        min={min}
        className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
      />
    </div>
  )
}
