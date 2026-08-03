import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export interface AiUserContext {
  userId: string
  role: UserRole
}

export interface AiToolArgs {
  search?: string
  kategori?: string
  status?: string
  limit?: number
  fasiliti_id?: string
}

// ─── Permissions ──────────────────────────────────────────────────────────────

function canViewAll(role: UserRole): boolean {
  return ['admin', 'pengurus', 'viewer'].includes(role)
}

async function resolveVisibleFasilitiIds(
  supabase: SupabaseClient,
  ctx: AiUserContext
): Promise<string[] | null> {
  if (canViewAll(ctx.role)) return null
  const { data } = await supabase
    .from('fasiliti_pegawai')
    .select('fasiliti_id')
    .eq('user_id', ctx.userId)
  return (data ?? []).map((r) => r.fasiliti_id as string)
}

async function assertFasilitiAccess(
  supabase: SupabaseClient,
  ctx: AiUserContext,
  fasilitiId: string
): Promise<boolean> {
  if (canViewAll(ctx.role)) return true
  const { data } = await supabase
    .from('fasiliti_pegawai')
    .select('fasiliti_id')
    .eq('user_id', ctx.userId)
    .eq('fasiliti_id', fasilitiId)
    .maybeSingle()
  return !!data
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Terima sama ada UUID atau kod rujukan (cth "JV-007") dan pulangkan UUID.
 * Jika input bukan UUID, cari dalam jadual fasiliti melalui kod_rujukan.
 */
async function resolveFasilitiId(
  supabase: SupabaseClient,
  input: string
): Promise<string | null> {
  if (UUID_RE.test(input)) return input

  const { data } = await supabase
    .from('fasiliti')
    .select('id')
    .eq('kod_rujukan', input)
    .maybeSingle()

  return data?.id ?? null
}

// ─── Tools ────────────────────────────────────────────────────────────────────

/**
 * Ringkasan fasiliti pembiayaan — status, tunggakan, kategori.
 * Ditapis mengikut peranan pengguna (pegawai_susulan hanya melihat tugasan sendiri).
 */
export async function getFasilitiSummary(
  supabase: SupabaseClient,
  ctx: AiUserContext,
  args: AiToolArgs
): Promise<object> {
  const visibleIds = await resolveVisibleFasilitiIds(supabase, ctx)
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 50)

  let query = supabase
    .from('fasiliti')
    .select(
      'id, kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, tarikh_mula, tarikh_tamat'
    )

  if (visibleIds !== null) {
    if (visibleIds.length === 0) {
      return { fasiliti: [], jumlah: 0, mesej: 'Tiada fasiliti ditugaskan kepada anda.' }
    }
    query = query.in('id', visibleIds)
  }

  if (args.kategori) query = query.eq('kategori', args.kategori)
  if (args.status) query = query.eq('status_fasiliti', args.status)
  if (args.search) {
    query = query.or(
      `nama_peminjam.ilike.%${args.search}%,pembiaya_modal.ilike.%${args.search}%,kod_rujukan.ilike.%${args.search}%`
    )
  }

  const { data, error } = await query
    .order('dicipta_pada', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  const fasiliti = (data ?? []).map((f) => ({
    id: f.id,
    kod_rujukan: f.kod_rujukan,
    kategori: f.kategori,
    nama_peminjam: f.nama_peminjam,
    pembiaya_modal: f.pembiaya_modal,
    jumlah_pembiayaan: safeNumber(f.jumlah_pembiayaan),
    jumlah_tunggakan_semasa: safeNumber(f.jumlah_tunggakan_semasa),
    status: f.status_fasiliti,
    tarikh_mula: f.tarikh_mula,
    tarikh_tamat: f.tarikh_tamat,
  }))

  return { fasiliti, jumlah: fasiliti.length }
}

/**
 * Senarai susulan terbaru untuk sebuah fasiliti.
 */
export async function getSusulanTerkini(
  supabase: SupabaseClient,
  ctx: AiUserContext,
  args: AiToolArgs
): Promise<object> {
  if (!args.fasiliti_id) return { error: 'Parameter fasiliti_id diperlukan.' }

  const fasilitiId = await resolveFasilitiId(supabase, args.fasiliti_id)
  if (!fasilitiId) return { error: 'Fasiliti tidak dijumpai.' }

  const allowed = await assertFasilitiAccess(supabase, ctx, fasilitiId)
  if (!allowed) {
    return { error: 'Akses ditolak — anda tiada kebenaran melihat fasiliti ini.' }
  }

  const limit = Math.min(Math.max(args.limit ?? 10, 1), 50)

  const { data: fasiliti } = await supabase
    .from('fasiliti')
    .select('kod_rujukan, nama_peminjam, status_fasiliti')
    .eq('id', fasilitiId)
    .single()

  const { data, error } = await supabase
    .from('susulan')
    .select('id, tarikh_susulan, catatan, dicatat_oleh_user:users(nama)')
    .eq('fasiliti_id', fasilitiId)
    .order('tarikh_susulan', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }

  const susulan = (data ?? []).map((s) => ({
    id: s.id,
    tarikh_susulan: s.tarikh_susulan,
    catatan: s.catatan,
    dicatat_oleh: (s.dicatat_oleh_user as { nama?: string } | null)?.nama ?? '—',
  }))

  return {
    fasiliti: fasiliti
      ? { kod_rujukan: fasiliti.kod_rujukan, nama_peminjam: fasiliti.nama_peminjam, status: fasiliti.status_fasiliti }
      : null,
    susulan,
    jumlah: susulan.length,
  }
}

/**
 * Jana PDF kronologi — mengembalikan URL pautan muat turun.
 * Menggunakan generator PDF sedia ada (react-pdf) yang dikemas kini mengikut masa nyata.
 */
export async function generateKronologiPdf(
  supabase: SupabaseClient,
  ctx: AiUserContext,
  args: AiToolArgs
): Promise<object> {
  if (!args.fasiliti_id) return { error: 'Parameter fasiliti_id diperlukan.' }

  const fasilitiId = await resolveFasilitiId(supabase, args.fasiliti_id)
  if (!fasilitiId) return { error: 'Fasiliti tidak dijumpai.' }

  const allowed = await assertFasilitiAccess(supabase, ctx, fasilitiId)
  if (!allowed) {
    return { error: 'Akses ditolak — anda tiada kebenaran melihat fasiliti ini.' }
  }

  const { data: fasiliti } = await supabase
    .from('fasiliti')
    .select('kod_rujukan')
    .eq('id', fasilitiId)
    .single()

  if (!fasiliti) return { error: 'Fasiliti tidak dijumpai.' }

  return {
    fasiliti_id: fasilitiId,
    kod_rujukan: fasiliti.kod_rujukan,
    url: `/api/fasiliti/${fasilitiId}/kronologi-pdf`,
    catatan: 'Buka pautan ini dalam tab baharu untuk memuat turun PDF kronologi.',
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function dispatchAiTool(
  name: string,
  args: AiToolArgs,
  supabase: SupabaseClient,
  ctx: AiUserContext
): Promise<object> {
  switch (name) {
    case 'get_fasiliti_summary':
      return await getFasilitiSummary(supabase, ctx, args)
    case 'get_susulan_terkini':
      return await getSusulanTerkini(supabase, ctx, args)
    case 'generate_kronologi_pdf':
      return await generateKronologiPdf(supabase, ctx, args)
    default:
      return { error: `Fungsi '${name}' tidak dikenali.` }
  }
}
