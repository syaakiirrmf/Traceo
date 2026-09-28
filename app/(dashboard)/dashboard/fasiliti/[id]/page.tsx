import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, FileText, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { hasPermission } from '@/lib/auth/permissions'
import { DeleteFasilitiButton } from '@/components/fasiliti/DeleteFasilitiButton'
import { SettleViaAssetButton } from '@/components/fasiliti/SettleViaAssetButton'
import { FinancingCalculator } from '@/components/fasiliti/FinancingCalculator'
import { DeleteSusulanButton } from '@/components/susulan/DeleteSusulanButton'
import { SusulanApprovalBadge, SusulanApprovalButtons } from '@/components/susulan/SusulanApproval'
import { AssignPegawaiModal } from '@/components/fasiliti/AssignPegawaiModal'
import { BayaranForm } from '@/components/bayaran/BayaranForm'
import { DeleteBayaranButton } from '@/components/bayaran/DeleteBayaranButton'
import { KadarDividen } from '@/components/table/KadarDividen'
import type { Lampiran, Bayaran } from '@/types'
import type { Metadata } from 'next'

const STATUS_LABELS = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
} as const

const STATUS_STYLES = {
  aktif: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
  tertunggak: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
  tindakan_guaman: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
  selesai: 'bg-[var(--color-border)] text-[var(--color-text-secondary)]',
} as const

const KATEGORI_LABELS = {
  jv_syarikat: 'Corporate JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
} as const

const BAYARAN_JENIS_LABELS = {
  modal: 'Modal',
  dividen: 'Dividen',
  caj_lewat: 'Caj lewat',
  lain: 'Lain-lain',
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('fasiliti')
    .select('kod_rujukan, nama_peminjam')
    .eq('id', id)
    .single()

  return {
    title: data ? `${data.kod_rujukan} — ${data.nama_peminjam}` : 'Facility',
  }
}

export default async function FasilitiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // ─── Role-based facility access guard ────────────────────────────────────────
  // Pegawai Susulan can ONLY access facilities assigned to them
  if (userProfile.peranan === 'pegawai_susulan') {
    const { data: assignment } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('fasiliti_id', id)
      .eq('user_id', userProfile.id)
      .maybeSingle()
    if (!assignment) redirect('/dashboard/fasiliti')
  }

  // Fetch fasiliti + susulan + bayaran + pegawai assigned in parallel.
  // Timeline dihadkan 200 rekod terkini (susulan lama kekal dalam kronologi penuh).
  // NOTA prestasi (No.3a/3b): tiada count:exact (jimat agregat COUNT penuh) dan
  // tiada join lampiran(*) dalam senarai 200 — lampiran diambil dalam query
  // kedua yang ringan (ikut susulan_id) dan dicantum dalam memori.
  const SUSULAN_LIMIT = 200
  const [{ data: fasiliti }, { data: susulanRows }, { data: assignedPegawaiRows }, { data: bayaranRows }] = await Promise.all([
    supabase.from('fasiliti').select('*').eq('id', id).single(),
    supabase
      .from('susulan')
      .select('*, dicatat_oleh_user:users!susulan_dicatat_oleh_fkey(nama)')
      .eq('fasiliti_id', id)
      .order('tarikh_susulan', { ascending: true })
      .limit(SUSULAN_LIMIT),
    supabase
      .from('fasiliti_pegawai')
      .select('user_id, user:users(id, nama, emel, peranan)')
      .eq('fasiliti_id', id),
    supabase
      .from('bayaran')
      .select('*, dicatat_oleh_user:users(nama)')
      .eq('fasiliti_id', id)
      .order('tarikh_bayar', { ascending: false }),
  ])

  if (!fasiliti) notFound()

  // Lampiran untuk susulan yang dipapar sahaja (query ringan tanpa join).
  const susulanIds = (susulanRows ?? []).map((s) => s.id as string)
  const { data: lampiranRows } = susulanIds.length
    ? await supabase
        .from('lampiran')
        .select('id, susulan_id, url_fail, jenis_fail, nama_asal')
        .in('susulan_id', susulanIds)
    : { data: [] as Lampiran[] | null }
  const lampiranMap = new Map<string, Lampiran[]>()
  for (const l of (lampiranRows ?? []) as (Lampiran & { susulan_id: string })[]) {
    const arr = lampiranMap.get(l.susulan_id) ?? []
    arr.push(l)
    lampiranMap.set(l.susulan_id, arr)
  }
  const susulan = (susulanRows ?? []).map((s) => ({
    ...s,
    lampiran: lampiranMap.get(s.id as string) ?? [],
  }))
  const susulanCapped = (susulanRows ?? []).length >= SUSULAN_LIMIT

  const canEdit = hasPermission(userProfile.peranan, 'edit_fasiliti')
  const canDelete = hasPermission(userProfile.peranan, 'padam_fasiliti')
  const canAddSusulan = hasPermission(userProfile.peranan, 'tambah_susulan')
  const canAddBayaran = hasPermission(userProfile.peranan, 'tambah_bayaran')
  const canPadamBayaran = hasPermission(userProfile.peranan, 'padam_bayaran')
  const canExport = hasPermission(userProfile.peranan, 'jana_kronologi')

  const bayaranList = (bayaranRows ?? []) as (Bayaran & { dicatat_oleh_user?: { nama: string } | null })[]
  const totalBayar = bayaranList.reduce((s, b) => s + (Number(b.jumlah) || 0), 0)
  const rawBaki = (Number(fasiliti.jumlah_tunggakan_semasa) || 0) - totalBayar
  // Kes selesai (cth. settle via asset): baki tidak boleh negatif walaupun
  // rekod bayaran lama masih ada.
  const bakiSemasa = fasiliti.status_fasiliti === 'selesai' ? Math.max(0, rawBaki) : rawBaki

  // NOTA prestasi (No.3c): senarai pegawai TIDAK difetch di sini lagi —
  // AssignPegawaiModal ambil sendiri bila dibuka. Jimat 1 query setiap
  // lawatan detail page (majoriti tidak buka modal).
  const assignedPegawaiIds = (assignedPegawaiRows ?? []).map((r) => r.user_id)
  const assignedPegawaiList = (assignedPegawaiRows ?? []).flatMap((r) => r.user).filter(Boolean)

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + title — tajuk sentiasa dapat lebar penuh supaya tidak tersepit
          sebaris-per-kata; barisan tindakan duduk di bawahnya dan wrap kemas. */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/fasiliti"
          className="mt-0.5 w-9 h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[13px] font-semibold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-1 rounded-lg">
              {fasiliti.kod_rujukan}
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[fasiliti.status_fasiliti as keyof typeof STATUS_STYLES]}`}
            >
              {STATUS_LABELS[fasiliti.status_fasiliti as keyof typeof STATUS_LABELS]}
            </span>
            {fasiliti.status_fasiliti === 'selesai' && fasiliti.cara_selesai === 'melalui_aset' && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                title="Settled because the collateral became an asset (transferred to nominee / sold)"
              >
                Settled via Asset
              </span>
            )}
            {fasiliti.status_fasiliti === 'selesai' && fasiliti.cara_selesai === 'bayaran_penuh' && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                title="Settled because the borrower paid everything"
              >
                Paid in Full
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] mt-2 text-balance break-words">
            {fasiliti.nama_peminjam}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {KATEGORI_LABELS[fasiliti.kategori as keyof typeof KATEGORI_LABELS]} ·{' '}
            {fasiliti.pembiaya_modal}
          </p>
          {assignedPegawaiList.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span>Assigned Officers:</span>
              {assignedPegawaiList.map((p) => (
                <span
                  key={p.id}
                  className="font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2 py-0.5 rounded-full text-[11px]"
                >
                  {p.nama}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      {/* Actions — baris sendiri: Edit utama, selebihnya ghost kemas */}
      <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <AssignPegawaiModal
              fasilitiId={id}
              assignedPegawaiIds={assignedPegawaiIds}
            />
          )}
          {canExport && (
            <Link
              href={`/dashboard/fasiliti/${id}/kronologi`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <FileText size={14} />
              Chronology
            </Link>
          )}
          <FinancingCalculator
            jumlahPembiayaan={fasiliti.jumlah_pembiayaan}
            kadarDividen={fasiliti.kadar_dividen}
            kategori={fasiliti.kategori}
          />
          {canEdit && fasiliti.status_fasiliti !== 'selesai' && (
            <SettleViaAssetButton
              fasilitiId={id}
              kodRujukan={fasiliti.kod_rujukan}
              defaultPenama={fasiliti.penama_aset}
              defaultPindahmilik={fasiliti.status_pindahmilik}
            />
          )}
          {canEdit && (
            <Link
              href={`/dashboard/fasiliti/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-hover)] active:scale-[0.98] transition-all shadow-sm shadow-[var(--color-brand)]/25"
            >
              <Edit size={14} />
              Edit
            </Link>
          )}
          {canDelete && <DeleteFasilitiButton fasilitiId={id} kodRujukan={fasiliti.kod_rujukan} />}
        </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Capital Financing (A)',
            value: formatCurrency(fasiliti.jumlah_pembiayaan),
          },
          {
            label:
              fasiliti.kategori === 'pinjaman_individu' ? 'Total Arrears (C)' : 'Total Arrears (E)',
            value: formatCurrency(fasiliti.jumlah_tunggakan_semasa),
            highlight: fasiliti.jumlah_tunggakan_semasa > 0,
          },
          { label: 'Start Date', value: formatDate(fasiliti.tarikh_mula) },
          {
            label: 'End Date',
            value: fasiliti.tarikh_tamat ? formatDate(fasiliti.tarikh_tamat) : '—',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 min-w-0 flex flex-col justify-between"
          >
            <p
              className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 leading-snug"
              title={item.label}
            >
              {item.label}
            </p>
            <p
              className={`text-sm sm:text-base font-semibold tabular-nums truncate min-w-0 ${item.highlight ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`}
              title={item.value}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Maklumat Pembiayaan Modal ── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] pb-2">
          Capital Financing Information
        </p>
        <InfoRow label="Capital Funder" value={fasiliti.pembiaya_modal} />
        {fasiliti.kategori === 'jv_tanah' ? (
          <InfoRow label="Contractor Name" value={fasiliti.nama_peminjam} />
        ) : (
          <InfoRow label="Borrower Name" value={fasiliti.nama_peminjam} />
        )}
        <InfoRow
          label="Total Capital Financing "
          value={formatCurrency(fasiliti.jumlah_pembiayaan)}
          highlight
        />

        {/* JV1 / JV3: text description of profit sharing */}
        {fasiliti.kategori !== 'jv_tanah' && fasiliti.kadar_dividen && (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 py-1.5 border-b border-slate-100/80 last:border-0">
            <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide min-w-0 shrink-0 sm:w-52">
              {fasiliti.kategori === 'jv_syarikat' ? 'Dividend Profit Sharing' : 'Profit Sharing'}
            </span>
            <span className="text-sm sm:text-right min-w-0 flex-1 sm:max-w-[60%]">
              <KadarDividen value={fasiliti.kadar_dividen} compact />
            </span>
          </div>
        )}
        {/* JV2: Perkongsian Keuntungan as numeric B */}
        {fasiliti.kategori === 'jv_tanah' && fasiliti.perkongsian_keuntungan > 0 && (
          <InfoRow
            label="Profit Sharing (RM) — B"
            value={formatCurrency(fasiliti.perkongsian_keuntungan)}
          />
        )}
        {/* JV3: Bayaran Tambahan as B */}
        {fasiliti.kategori === 'pinjaman_individu' && fasiliti.bayaran_tambahan > 0 && (
          <InfoRow
            label="Additional Payment (RM) — B"
            value={formatCurrency(fasiliti.bayaran_tambahan)}
          />
        )}
      </div>

      {/* ── Maklumat Tunggakan & Bayaran (JV1 / JV2 only) ── */}
      {fasiliti.kategori !== 'pinjaman_individu' && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] pb-2 mb-4">
            Arrears &amp; Payments Information
          </p>
          <div className="space-y-2">
            <BreakdownRow
              label="Total Capital Financing (A)"
              value={formatCurrency(fasiliti.jumlah_pembiayaan)}
            />
            {fasiliti.kategori === 'jv_syarikat' && (
              <>
                <BreakdownRow
                  label="Dividend Arrears (B)"
                  value={formatCurrency(fasiliti.tunggakan_dividen)}
                  warn={fasiliti.tunggakan_dividen > 0}
                />
                <BreakdownRow
                  label="Late Charges (C)"
                  value={formatCurrency(fasiliti.caj_lewat)}
                  warn={fasiliti.caj_lewat > 0}
                />
                <BreakdownRow
                  label="Additional Payment (D)"
                  value={formatCurrency(fasiliti.bayaran_tambahan)}
                />
              </>
            )}
            {fasiliti.kategori === 'jv_tanah' && (
              <>
                <BreakdownRow
                  label="Profit Sharing (B)"
                  value={formatCurrency(fasiliti.perkongsian_keuntungan)}
                  warn={fasiliti.perkongsian_keuntungan > 0}
                />
                <BreakdownRow
                  label="Profit Sharing Arrears (C)"
                  value={formatCurrency(fasiliti.tunggakan_dividen)}
                  warn={fasiliti.tunggakan_dividen > 0}
                />
                <BreakdownRow
                  label="Additional Payment (D)"
                  value={formatCurrency(fasiliti.bayaran_tambahan)}
                />
              </>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)] mt-1">
              <span className="font-semibold text-[var(--color-text-primary)]">
                Total Arrears (E)
              </span>
              <span className="font-bold tabular-nums text-lg text-[var(--color-danger)]">
                {formatCurrency(fasiliti.jumlah_tunggakan_semasa)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── JV3: Show total breakdown ── */}
      {fasiliti.kategori === 'pinjaman_individu' && fasiliti.bayaran_tambahan > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] pb-2 mb-4">
            Arrears Information
          </p>
          <div className="space-y-2">
            <BreakdownRow
              label="Total Capital Financing (A)"
              value={formatCurrency(fasiliti.jumlah_pembiayaan)}
            />
            <BreakdownRow
              label="Additional Payment (B)"
              value={formatCurrency(fasiliti.bayaran_tambahan)}
              warn={fasiliti.bayaran_tambahan > 0}
            />
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)] mt-1">
              <span className="font-semibold text-[var(--color-text-primary)]">
                Total Arrears (C = A + B)
              </span>
              <span className="font-bold tabular-nums text-lg text-[var(--color-danger)]">
                {formatCurrency(fasiliti.jumlah_tunggakan_semasa)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Maklumat Hartanah / Cagaran Aset ── */}
      {(fasiliti.ringkasan_cagaran ||
        fasiliti.penama_aset ||
        fasiliti.status_pindahmilik ||
        fasiliti.nilai_cagaran) && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border)] pb-2">
            {fasiliti.kategori === 'jv_tanah'
              ? 'Property Information'
              : 'Asset Collateral Information'}
          </p>
          {fasiliti.ringkasan_cagaran && (
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
              {fasiliti.ringkasan_cagaran}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {fasiliti.nilai_cagaran && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">
                  Estimated Value (RM)
                </p>
                <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(fasiliti.nilai_cagaran)}
                </p>
              </div>
            )}
            {fasiliti.penama_aset && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Asset Nominee</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {fasiliti.penama_aset}
                </p>
              </div>
            )}
            {fasiliti.status_pindahmilik && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">
                  Asset Transfer / Sale Status
                </p>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {fasiliti.status_pindahmilik}
                </p>
              </div>
            )}
          </div>
          {/* JV2 specific: sale price */}
          {fasiliti.kategori === 'jv_tanah' && fasiliti.harga_jualan && (
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Sale Price / Type</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {fasiliti.harga_jualan}
              </p>
            </div>
          )}
          {/* JV2 project year */}
          {fasiliti.kategori === 'jv_tanah' && fasiliti.tahun_projek && (
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Project Year</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {fasiliti.tahun_projek}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Catatan ── */}
      {fasiliti.catatan_am && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
            Notes
          </p>
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
            {fasiliti.catatan_am}
          </p>
        </div>
      )}

      {/* ── Bayaran & Baki ── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Bayaran &amp; Baki
            <span className="ml-2 font-normal normal-case tracking-normal">
              ({bayaranList.length} rekod)
            </span>
          </p>
          {canAddBayaran && <BayaranForm fasilitiId={id} />}
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 mb-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Tunggakan (E)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums leading-none break-words text-[var(--color-text-primary)]">
              {formatCurrency(fasiliti.jumlah_tunggakan_semasa)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-50/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Jumlah dibayar
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums leading-none break-words text-emerald-600">
              {formatCurrency(totalBayar)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-subtle)]/30 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-danger)]">
              Baki (E − dibayar)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums leading-none break-words text-[var(--color-danger)]">
              {formatCurrency(bakiSemasa)}
            </p>
          </div>
        </div>

        {bayaranList.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">
            Tiada rekod bayaran lagi.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {bayaranList.map((b) => (
              <li key={b.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-emerald-600">
                      {formatCurrency(b.jumlah)}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {BAYARAN_JENIS_LABELS[b.jenis] ?? b.jenis}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {formatDate(b.tarikh_bayar, 'dd/MM/yyyy')}
                    </span>
                  </div>
                  {b.catatan && (
                    <p className="mt-1 text-sm text-[var(--color-text-primary)] break-words">
                      {b.catatan}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                    Direkod oleh {b.dicatat_oleh_user?.nama ?? '—'}
                  </p>
                </div>
                {canPadamBayaran && (
                  <DeleteBayaranButton
                    bayaranId={b.id}
                    fasilitiId={id}
                    label={`${formatCurrency(b.jumlah)} (${formatDate(b.tarikh_bayar, 'dd/MM/yyyy')})`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Susulan section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Follow-up Chronology
            <span className="ml-2 text-sm font-normal text-[var(--color-text-tertiary)]">
              ({susulan.length}{susulanCapped ? '+' : ''} records{susulanCapped ? ' — full history in Chronology' : ''})
            </span>
          </h2>
          {canAddSusulan && (
            <Link
              href={`/dashboard/fasiliti/${id}/susulan/tambah`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <Plus size={14} />
              Add follow-up
            </Link>
          )}
        </div>

        {!susulan || susulan.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] border-dashed p-10 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">No follow-up records yet</p>
            {canAddSusulan && (
              <Link
                href={`/dashboard/fasiliti/${id}/susulan/tambah`}
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
                  <span className="text-[10px] font-semibold text-[var(--color-brand)]">
                    {i + 1}
                  </span>
                </div>

                <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--color-brand)] mb-1.5">
                        {formatDate(s.tarikh_susulan, 'dd MMMM yyyy')}
                      </p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <SusulanApprovalBadge status={s.status_kelulusan} />
                        {(userProfile.peranan === 'admin' || userProfile.peranan === 'pengurus') && (
                          <SusulanApprovalButtons
                            susulanId={s.id}
                            fasilitiId={id}
                            status={s.status_kelulusan}
                          />
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                        {s.catatan}
                      </p>
                    </div>
                    <div className="flex items-start gap-1 flex-shrink-0">
                      {/* edit permission check: admin/pengurus always, pegawai_susulan only own */}
                      {(userProfile.peranan === 'admin' ||
                        userProfile.peranan === 'pengurus' ||
                        (userProfile.peranan === 'pegawai_susulan' &&
                          s.dicatat_oleh === userProfile.id)) && (
                        <>
                          <Link
                            href={`/dashboard/fasiliti/${id}/susulan/${s.id}/edit`}
                            className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
                            title="Edit follow-up"
                          >
                            <Pencil size={13} />
                          </Link>
                          <DeleteSusulanButton
                            susulanId={s.id}
                            fasilitiId={id}
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

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 py-1.5 border-b border-slate-100/80 last:border-0">
      <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide min-w-0 shrink-0 sm:w-52">
        {label}
      </span>
      <span
        className={`text-sm sm:text-right min-w-0 break-words ${highlight ? 'font-semibold text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  )
}

function BreakdownRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span
        className={`font-medium tabular-nums ${warn ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  )
}
