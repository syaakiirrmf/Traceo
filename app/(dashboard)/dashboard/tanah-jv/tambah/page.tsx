import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { tambahTanahJV } from '@/lib/actions/tanah_jv'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Land Parcel' }

export default async function TambahTanahJVPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || !hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    redirect('/dashboard/tanah-jv')
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/tanah-jv"
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Add Land Parcel
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Register a new Tanah MD (JV) land parcel
          </p>
        </div>
      </div>

      <form action={tambahTanahJV} className="space-y-5">
        {/* Tajuk / Title */}
        <Section title="Title — Land Title Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" name="negeri" required placeholder="e.g. Negeri Sembilan" />
            <Field label="District" name="daerah" required placeholder="e.g. Seremban" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Town / Village / Mukim" name="bandar_mukim" required placeholder="e.g. Mukim Tuk Jamal" />
            <Field label="Location" name="tempat" required placeholder="e.g. Gemencheh" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="No. Lot" name="no_lot" required placeholder="e.g. LOT 1979" />
            <Field label="Title No." name="no_hak_milik" placeholder="e.g. GM 1837" />
          </div>
          <Field label="Registration Date" name="tarikh_daftar" type="date" />
        </Section>

        {/* Luas & Nilaian */}
        <Section title="Area &amp; Valuation">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Area (m²)" name="luas_meter_persegi" type="number" placeholder="0.0000" step="0.0001" min="0" />
            <Field label="Collateral Value (RM)" name="anggaran_nilaian" type="number" placeholder="0.00" step="0.01" min="0" />
          </div>
        </Section>

        {/* Catatan */}
        <Section title="Notes">
          <textarea
            name="catatan"
            rows={4}
            placeholder="Additional notes, legal status, encumbrances..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
          />
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            Register Parcel
          </button>
          <Link
            href="/dashboard/tanah-jv"
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

function Field({ label, name, type = 'text', required, placeholder, step, min }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; step?: string; min?: string
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
        placeholder={placeholder}
        step={step}
        min={min}
        className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
      />
    </div>
  )
}
