'use client'

import { ActionForm } from '@/components/forms/ActionForm'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { useState } from 'react'
import { editFasiliti } from '@/lib/actions/fasiliti'
import {
  ArrowLeft,
  Building2,
  Wallet,
  AlertTriangle,
  ShieldCheck,
  StickyNote,
  Save,
  X,
  Check,
  Landmark,
  Banknote,
  Calculator,
} from 'lucide-react'

const KATEGORI_OPTIONS = [
  { value: 'jv_syarikat', label: 'Company JV' },
  { value: 'jv_tanah', label: 'Land JV' },
  { value: 'pinjaman_individu', label: 'Individual Loan' },
]

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Active' },
  { value: 'tertunggak', label: 'Overdue' },
  { value: 'tindakan_guaman', label: 'Legal Action' },
  { value: 'selesai', label: 'Completed' },
]

const STATUS_DOT: Record<string, string> = {
  aktif: 'bg-emerald-500',
  tertunggak: 'bg-amber-500',
  tindakan_guaman: 'bg-rose-500',
  selesai: 'bg-slate-400',
}

type Kategori = 'jv_syarikat' | 'jv_tanah' | 'pinjaman_individu'
type AnyFasiliti = Record<string, unknown>

const inputCls =
  'w-full h-11 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] shadow-xs transition-all duration-200 hover:border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10'

export function EditFasilitiForm({
  fasilitiId,
  fasiliti,
}: {
  fasilitiId: string
  fasiliti: AnyFasiliti
}) {
  const [kategori, setKategori] = useState<Kategori>(
    (fasiliti.kategori as Kategori) ?? 'jv_syarikat'
  )
  const [status, setStatus] = useState<string>(
    (fasiliti.status_fasiliti as string) ?? 'aktif'
  )
  const action = editFasiliti.bind(null, fasilitiId)

  const isJV1 = kategori === 'jv_syarikat'
  const isJV2 = kategori === 'jv_tanah'
  const isJV3 = kategori === 'pinjaman_individu'

  const s = (key: string) => (fasiliti[key] != null ? String(fasiliti[key]) : '')
  const n = (key: string) => (fasiliti[key] != null ? String(fasiliti[key]) : '0')

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  const kategoriLabel = KATEGORI_OPTIONS.find((o) => o.value === kategori)?.label ?? kategori

  return (
    <ActionForm action={action} className="space-y-5 pb-8">
      {/* ── Sticky action bar: sentiasa nampak walaupun borang panjang ── */}
      <div className="sticky top-0 z-20 py-3 bg-[var(--color-bg)]/85 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <a
            href={`/dashboard/fasiliti/${fasilitiId}`}
            aria-label="Back to facility"
            className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hidden sm:flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
          </a>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] truncate">
              Editing · <span className="font-mono text-[var(--color-brand)]">{s('kod_rujukan')}</span>
              {' · '}
              {kategoriLabel}
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-slate-300'}`} />
              {statusLabel}
            </p>
          </div>
          <a
            href={`/dashboard/fasiliti/${fasilitiId}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] active:scale-[0.98] transition-all"
          >
            <X size={14} />
            Cancel
          </a>
          <SubmitButton className="!px-5 shadow-md shadow-[var(--color-brand)]/20">
            <Save size={15} />
            Save Changes
          </SubmitButton>
        </div>
      </div>

      {/* ── Section 1: Basic ── */}
      <Section
        step="1"
        icon={<Building2 size={17} />}
        title="Basic information"
        subtitle="Who, what category, and the facility timeline"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
              Category <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="kategori"
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value as Kategori)}
              className={inputCls}
            >
              {KATEGORI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
              Status <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="status_fasiliti"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === 'selesai' && (
          <div className="space-y-2.5">
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              Settled how? <span className="text-[var(--color-danger)]">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  value: 'bayaran_penuh',
                  title: 'Paid in full',
                  desc: 'Borrower paid everything off.',
                  icon: <Banknote size={17} />,
                },
                {
                  value: 'melalui_aset',
                  title: 'Settled via asset',
                  desc: 'Collateral became an asset — transferred or sold.',
                  icon: <Landmark size={17} />,
                },
              ].map((o) => (
                <label key={o.value} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="cara_selesai"
                    value={o.value}
                    required
                    defaultChecked={(s('cara_selesai') || 'bayaran_penuh') === o.value}
                    className="peer sr-only"
                  />
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-sm peer-checked:border-[var(--color-brand)] peer-checked:bg-[var(--color-brand-subtle)] peer-checked:ring-4 peer-checked:ring-[var(--color-brand)]/10 peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--color-brand)]/20">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
                      {o.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                        {o.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {o.desc}
                      </span>
                    </span>
                  </div>
                  <span className="absolute right-3 top-3 hidden h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-white peer-checked:flex">
                    <Check size={12} strokeWidth={3} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <Field
            label="Capital funder"
            name="pembiaya_modal"
            required
            defaultValue={s('pembiaya_modal')}
            placeholder="e.g. MUAZ FORCE SDN BHD"
          />
          <Field
            label={isJV2 ? 'Contractor name' : 'Borrower name'}
            name="nama_peminjam"
            required
            defaultValue={s('nama_peminjam')}
            placeholder={isJV2 ? 'e.g. MF PROPERTIES' : 'e.g. VERTEX CENTRAL INDUSTRIES SDN BHD'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <Field
            label="Start date"
            name="tarikh_mula"
            type="date"
            required
            defaultValue={s('tarikh_mula')}
          />
          <Field
            label="End date"
            name="tarikh_tamat"
            type="date"
            defaultValue={s('tarikh_tamat')}
          />
        </div>
      </Section>

      {/* ── Section 2: Maklumat Pembiayaan Modal ── */}
      <Section
        step="2"
        icon={<Wallet size={17} />}
        title="Capital financing"
        subtitle="Committed capital and profit terms"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <Field
            label="Total capital financing (RM) — A"
            name="jumlah_pembiayaan"
            type="number"
            required
            defaultValue={n('jumlah_pembiayaan')}
            step="0.01"
            min="0"
            mono
          />
          {(isJV1 || isJV3) && (
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {isJV1 ? 'Dividend profit sharing (RM)' : 'Profit sharing (RM)'}
              </label>
              <input
                type="text"
                name="kadar_dividen"
                defaultValue={s('kadar_dividen')}
                placeholder={
                  isJV1 ? 'e.g. AZRIN - 3,375/month · 81,000/12 months' : 'e.g. 3,000/month'
                }
                className={inputCls}
              />
            </div>
          )}
          {isJV2 && (
            <Field
              label="Profit sharing (RM) — B"
              name="perkongsian_keuntungan"
              type="number"
              defaultValue={n('perkongsian_keuntungan')}
              step="0.01"
              min="0"
              mono
            />
          )}
        </div>

        {isJV3 && (
          <Field
            label="Additional payment (RM) — B"
            name="bayaran_tambahan"
            type="number"
            defaultValue={n('bayaran_tambahan')}
            step="0.01"
            min="0"
            mono
          />
        )}
      </Section>

      {/* ── Section 3: Tunggakan (JV1 / JV2) ── */}
      {(isJV1 || isJV2) && (
        <Section
          step="3"
          icon={<AlertTriangle size={17} />}
          title="Arrears & payments"
          subtitle="Leave Total (E) blank to auto-compute"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {isJV1 && (
              <>
                <Field
                  label="Dividend arrears (RM) — B"
                  name="tunggakan_dividen"
                  type="number"
                  defaultValue={n('tunggakan_dividen')}
                  step="0.01"
                  min="0"
                  mono
                />
                <Field
                  label="Late charges (RM) — C"
                  name="caj_lewat"
                  type="number"
                  defaultValue={n('caj_lewat')}
                  step="0.01"
                  min="0"
                  mono
                />
                <Field
                  label="Additional payment (RM) — D"
                  name="bayaran_tambahan"
                  type="number"
                  defaultValue={n('bayaran_tambahan')}
                  step="0.01"
                  min="0"
                  mono
                />
              </>
            )}
            {isJV2 && (
              <>
                <Field
                  label="Profit sharing arrears (RM) — C"
                  name="tunggakan_dividen"
                  type="number"
                  defaultValue={n('tunggakan_dividen')}
                  step="0.01"
                  min="0"
                  mono
                />
                <Field
                  label="Additional payment (RM) — D"
                  name="bayaran_tambahan"
                  type="number"
                  defaultValue={n('bayaran_tambahan')}
                  step="0.01"
                  min="0"
                  mono
                />
                <Field
                  label="Project year"
                  name="tahun_projek"
                  type="number"
                  defaultValue={s('tahun_projek')}
                  min="2000"
                  mono
                />
              </>
            )}
          </div>
          <TotalArrears
            label={isJV3 ? 'Total arrears (RM) — C (A + B)' : 'Total arrears (RM) — E (A+B+C+D)'}
            defaultValue={s('jumlah_tunggakan_semasa')}
          />
        </Section>
      )}

      {isJV3 && (
        <Section
          step="3"
          icon={<AlertTriangle size={17} />}
          title="Arrears"
          subtitle="Leave blank to auto-compute from A + B"
        >
          <TotalArrears
            label="Total arrears (RM) — C (A + B)"
            defaultValue={s('jumlah_tunggakan_semasa')}
          />
        </Section>
      )}

      {/* ── Section 4: Cagaran / Hartanah ── */}
      <Section
        step="4"
        icon={<ShieldCheck size={17} />}
        title={isJV2 ? 'Property information' : 'Asset collateral'}
        subtitle="What backs this facility"
      >
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
            {isJV2 ? 'Type / location' : 'Type / location / collateral asset valuation'}
          </label>
          <textarea
            name="ringkasan_cagaran"
            rows={3}
            defaultValue={s('ringkasan_cagaran')}
            placeholder={
              isJV2
                ? 'e.g. GM 1837 LOT 1979 MUKIM TUK JAMAL'
                : 'e.g. LAND N9, VALUATION 1.5 MILLION'
            }
            className={`${inputCls} h-auto py-3 resize-none leading-relaxed`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <Field
            label="Estimated value (RM)"
            name="nilai_cagaran"
            type="number"
            defaultValue={s('nilai_cagaran')}
            step="0.01"
            min="0"
            mono
          />
          <Field
            label="Asset nominee"
            name="penama_aset"
            defaultValue={s('penama_aset')}
            placeholder="e.g. MOHD AZRUL BIN ZAKARIA"
          />
        </div>

        <Field
          label="Asset transfer / sale status"
          name="status_pindahmilik"
          defaultValue={s('status_pindahmilik')}
          placeholder="e.g. Sold to buyer, completed"
        />

        {isJV2 && (
          <Field
            label="Sale price / type"
            name="harga_jualan"
            defaultValue={s('harga_jualan')}
            placeholder="e.g. 400,000 - BUNGALOW"
          />
        )}
      </Section>

      {/* ── Section 5: Catatan ── */}
      <Section
        step="5"
        icon={<StickyNote size={17} />}
        title="General notes"
        subtitle="Remarks, legal actions, pending matters"
      >
        <textarea
          name="catatan_am"
          rows={5}
          defaultValue={s('catatan_am')}
          placeholder="Additional remarks, legal actions, pending matters..."
          className={`${inputCls} h-auto py-3 resize-none leading-relaxed`}
        />
      </Section>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-end rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <p className="text-xs text-[var(--color-text-tertiary)] sm:mr-auto">
          Changes save to {s('kod_rujukan') || 'this facility'} immediately.
        </p>
        <a
          href={`/dashboard/fasiliti/${fasilitiId}`}
          className="inline-flex items-center justify-center gap-1.5 px-6 min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] active:scale-[0.98] transition-all"
        >
          <X size={14} />
          Cancel
        </a>
        <SubmitButton className="!px-7 shadow-md shadow-[var(--color-brand)]/20">
          <Save size={15} />
          Save Changes
        </SubmitButton>
      </div>
    </ActionForm>
  )
}

function Section({
  step,
  icon,
  title,
  subtitle,
  children,
}: {
  step: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--color-border)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
            Step {step}
          </p>
          <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  step,
  min,
  hint,
  mono,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  step?: string
  min?: string
  hint?: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
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
        className={`${inputCls}${mono ? ' font-mono tabular-nums' : ''}`}
      />
      {hint && <p className="text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  )
}

function TotalArrears({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-brand)]/25 bg-[var(--color-brand-subtle)] p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white shrink-0">
          <Calculator size={15} />
        </span>
        <label className="text-sm font-bold text-[var(--color-text-primary)]">{label}</label>
      </div>
      <input
        type="number"
        name="jumlah_tunggakan_semasa"
        defaultValue={defaultValue}
        placeholder="Leave blank to auto-compute"
        step="0.01"
        min="0"
        className="w-full h-12 px-4 rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-surface)] text-base font-semibold tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] placeholder:font-normal placeholder:text-sm shadow-xs transition-all duration-200 hover:border-[var(--color-brand)]/50 focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/15"
      />
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
        Leave empty and the system calculates it from the components above.
      </p>
    </div>
  )
}
