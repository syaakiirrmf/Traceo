'use client'

import { useState } from 'react'
import Link from 'next/link'
import { tambahFasiliti } from '@/lib/actions/fasiliti'

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

type Kategori = 'jv_syarikat' | 'jv_tanah' | 'pinjaman_individu'

interface PegawaiItem { id: string; nama: string }

export function TambahFasilitiForm({
  pegawaiList,
  defaultKategori = 'jv_syarikat',
}: {
  pegawaiList: PegawaiItem[]
  defaultKategori?: Kategori
}) {
  const [kategori, setKategori] = useState<Kategori>(defaultKategori)

  const isJV1 = kategori === 'jv_syarikat'
  const isJV2 = kategori === 'jv_tanah'
  const isJV3 = kategori === 'pinjaman_individu'

  return (
    <form action={tambahFasiliti} className="space-y-5">
      {/* ── Section 1: Basic ── */}
      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Category <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="kategori"
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value as Kategori)}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            >
              {KATEGORI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Status <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="status_fasiliti"
              required
              defaultValue="aktif"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Capital Funder"
            name="pembiaya_modal"
            required
            placeholder="e.g. MUAZ FORCE SDN BHD"
          />
          {/* JV2 shows Nama Kontraktor, JV1/JV3 shows Nama Peminjam */}
          {isJV2 ? (
            <Field
              label="Contractor Name"
              name="nama_peminjam"
              required
              placeholder="e.g. MF PROPERTIES"
            />
          ) : (
            <Field
              label="Borrower Name"
              name="nama_peminjam"
              required
              placeholder="e.g. VERTEX CENTRAL INDUSTRIES SDN BHD"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" name="tarikh_mula" type="date" required />
          <Field label="End Date" name="tarikh_tamat" type="date" />
        </div>
      </Section>

      {/* ── Section 2: Maklumat Pembiayaan Modal ── */}
      <Section title="Capital Financing Information">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Total Capital Financing (RM) — A"
            name="jumlah_pembiayaan"
            type="number"
            required
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {/* JV1 / JV3: text description of profit sharing */}
          {(isJV1 || isJV3) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {isJV1 ? 'Dividend Profit Sharing (RM)' : 'Profit Sharing (RM)'}
              </label>
              <input
                type="text"
                name="kadar_dividen"
                placeholder={isJV1 ? "e.g. AZRIN - 3,375/month · HAFIZ - 500/month" : "e.g. 3,000/month"}
                className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
              />
            </div>
          )}
          {/* JV2: Perkongsian Keuntungan is a numeric amount (B component) */}
          {isJV2 && (
            <Field
              label="Profit Sharing (RM) — B"
              name="perkongsian_keuntungan"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          )}
        </div>

        {/* JV3: also has Bayaran Tambahan as B */}
        {isJV3 && (
          <Field
            label="Additional Payment (RM) — B"
            name="bayaran_tambahan"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        )}
      </Section>

      {/* ── Section 3: Maklumat Tunggakan & Bayaran (JV1 and JV2 only) ── */}
      {(isJV1 || isJV2) && (
        <Section
          title="Arrears & Payments Information"
          subtitle="Leave Total (E) blank to auto-compute"
        >
          <div className="grid grid-cols-3 gap-4">
            {isJV1 && (
              <>
                <Field label="Dividend Arrears (RM) — B" name="tunggakan_dividen" type="number" placeholder="0.00" step="0.01" min="0" />
                <Field label="Late Charges (RM) — C" name="caj_lewat" type="number" placeholder="0.00" step="0.01" min="0" />
                <Field label="Additional Payment (RM) — D" name="bayaran_tambahan" type="number" placeholder="0.00" step="0.01" min="0" />
              </>
            )}
            {isJV2 && (
              <>
                <Field label="Profit Sharing Arrears (RM) — C" name="tunggakan_dividen" type="number" placeholder="0.00" step="0.01" min="0" />
                <Field label="Additional Payment (RM) — D" name="bayaran_tambahan" type="number" placeholder="0.00" step="0.01" min="0" />
                <Field label="Project Year" name="tahun_projek" type="number" placeholder="e.g. 2023" min="2000" />
              </>
            )}
          </div>
          <TotalArrears label={isJV3 ? 'Total Arrears (RM) — C (A + B)' : 'Total Arrears (RM) — E (A + B + C + D)'} />
        </Section>
      )}

      {/* JV3 total */}
      {isJV3 && (
        <Section title="Arrears Information" subtitle="Leave blank to auto-compute from A + B">
          <TotalArrears label="Total Arrears (RM) — C (A + B)" />
        </Section>
      )}

      {/* ── Section 4: Maklumat Cagaran / Hartanah ── */}
      <Section title={isJV2 ? 'Property Information' : 'Asset Collateral Information'}>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {isJV2 ? 'Type / Location' : 'Type / Location / Collateral Asset Valuation'}
          </label>
          <textarea
            name="ringkasan_cagaran"
            rows={3}
            placeholder={isJV2
              ? "e.g. GM 1837 LOT 1979 MUKIM TUK JAMAL"
              : "e.g. LAND N9 — VALUATION 1.5 MILLION"}
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimated Value (RM)" name="nilai_cagaran" type="number" placeholder="0.00" step="0.01" min="0" />
          <Field label="Asset Nominee" name="penama_aset" placeholder="e.g. MOHD AZRUL BIN ZAKARIA" />
        </div>

        <Field label="Asset Transfer / Sale Status" name="status_pindahmilik" placeholder="e.g. Sold to buyer — Completed" />

        {/* JV2 specific: Harga Jualan */}
        {isJV2 && (
          <Field label="Sale Price / Type" name="harga_jualan" placeholder="e.g. 400,000 - BUNGALOW" />
        )}
      </Section>

      {/* ── Section 5: Officer Assignment ── */}
      {pegawaiList.length > 0 && (
        <Section title="Follow-up Officer Assignment">
          <p className="text-xs text-[var(--color-text-tertiary)] -mt-1">
            Select officers assigned to handle this facility
          </p>
          <div className="space-y-2">
            {pegawaiList.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="pegawai_ids"
                  value={p.id}
                  className="w-4 h-4 rounded accent-[var(--color-brand)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">{p.nama}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* ── Section 6: Catatan ── */}
      <Section title="General Notes">
        <textarea
          name="catatan_am"
          rows={5}
          placeholder="Additional remarks, legal actions, pending matters..."
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors resize-none"
        />
      </Section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
        >
          Register Facility
        </button>
        <Link
          href="/dashboard/fasiliti"
          className="px-6 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

// ─── Reusable UI atoms ────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] space-y-4">
      <div className="border-b border-[var(--color-border)] pb-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</p>}
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
  placeholder,
  step,
  min,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  step?: string
  min?: string
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

function TotalArrears({ label }: { label: string }) {
  return (
    <div className="p-3 bg-[var(--color-brand-subtle)] rounded-[var(--radius-md)] border border-[var(--color-brand)]/20">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)] mb-2">
        {label}
      </label>
      <input
        type="number"
        name="jumlah_tunggakan_semasa"
        placeholder="Leave blank to auto-compute"
        step="0.01"
        min="0"
        className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-brand)]/30 bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors font-medium"
      />
    </div>
  )
}
