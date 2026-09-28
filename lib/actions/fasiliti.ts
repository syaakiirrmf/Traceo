'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'
import { fasilitiSchema, fd, parseOrThrow, pegawaiIdsSchema, type FasilitiInput } from '@/lib/validation'
import { sendOverdueEmail, getAdminEmails } from '@/lib/email'

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User not found')
  if (userProfile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    throw new Error('Account is disabled.')
  }
  return { supabase, userProfile }
}

function buildFasilitiPayload(formData: FormData) {
  const raw = {
    kategori: fd(formData, 'kategori'),
    pembiaya_modal: fd(formData, 'pembiaya_modal'),
    nama_peminjam: fd(formData, 'nama_peminjam'),
    jumlah_pembiayaan: fd(formData, 'jumlah_pembiayaan'),
    tarikh_mula: fd(formData, 'tarikh_mula'),
    tarikh_tamat: fd(formData, 'tarikh_tamat'),
    ringkasan_cagaran: fd(formData, 'ringkasan_cagaran') ?? '',
    nilai_cagaran: fd(formData, 'nilai_cagaran'),
    jumlah_tunggakan_semasa: fd(formData, 'jumlah_tunggakan_semasa') ?? '',
    status_fasiliti: fd(formData, 'status_fasiliti'),
    cara_selesai: fd(formData, 'cara_selesai'),
    catatan_am: fd(formData, 'catatan_am'),
    kadar_dividen: fd(formData, 'kadar_dividen'),
    perkongsian_keuntungan: fd(formData, 'perkongsian_keuntungan'),
    tunggakan_dividen: fd(formData, 'tunggakan_dividen'),
    caj_lewat: fd(formData, 'caj_lewat'),
    bayaran_tambahan: fd(formData, 'bayaran_tambahan'),
    penama_aset: fd(formData, 'penama_aset'),
    status_pindahmilik: fd(formData, 'status_pindahmilik'),
    nama_kontraktor: fd(formData, 'nama_kontraktor'),
    harga_jualan: fd(formData, 'harga_jualan'),
    tahun_projek: fd(formData, 'tahun_projek'),
    pegawai_ids: formData.getAll('pegawai_ids').filter((v): v is string => typeof v === 'string'),
  }
  const v: FasilitiInput = parseOrThrow(fasilitiSchema, raw)

  // ─── Category-aware arrears computation (manual override wins) ─────────────
  // JV3: C = A + B | JV Tanah: E = A+B+C+D | JV1: E = A+B+C+D
  const jumlah_tunggakan_semasa =
    v.jumlah_tunggakan_semasa ??
    (v.kategori === 'pinjaman_individu'
      ? v.jumlah_pembiayaan + v.bayaran_tambahan
      : v.kategori === 'jv_tanah'
        ? v.jumlah_pembiayaan + v.perkongsian_keuntungan + v.tunggakan_dividen + v.bayaran_tambahan
        : v.jumlah_pembiayaan + v.tunggakan_dividen + v.caj_lewat + v.bayaran_tambahan)

  const { pegawai_ids, ...rest } = v
  void pegawai_ids
  // Peraturan cara selesai (server-side, bukan bergantung pada form):
  // status selesai mesti ada cara (default bayaran_penuh); status lain mesti null.
  const cara_selesai =
    v.status_fasiliti === 'selesai' ? (v.cara_selesai ?? 'bayaran_penuh') : null
  return { payload: { ...rest, jumlah_tunggakan_semasa, cara_selesai }, pegawaiIds: v.pegawai_ids }
}

async function notifyOverdue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fasilitiId: string
) {
  try {
    const { data: fasiliti } = await supabase
      .from('fasiliti')
      .select('kod_rujukan, nama_peminjam, jumlah_tunggakan_semasa')
      .eq('id', fasilitiId)
      .single()
    const emails = await getAdminEmails(supabase)
    if (!fasiliti || emails.length === 0) return
    await Promise.all(
      emails.map((to) =>
        sendOverdueEmail(to, {
          kod_rujukan: fasiliti.kod_rujukan,
          nama_peminjam: fasiliti.nama_peminjam,
          jumlah_tunggakan: Number(fasiliti.jumlah_tunggakan_semasa) || 0,
        })
      )
    )
  } catch (err) {
    console.error('[notifyOverdue]', err)
  }
}

// ─── Tambah Fasiliti ─────────────────────────────────────────────────────────

export async function tambahFasiliti(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('fasiliti_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { payload, pegawaiIds } = buildFasilitiPayload(formData)

  const { data: id, error } = await supabase.rpc('traceo_tambah_fasiliti', {
    p_payload: payload,
    p_pegawai_ids: pegawaiIds.length > 0 ? pegawaiIds : null,
  })

  if (error) throw new Error(`Failed to save: ${error.message}`)

  revalidatePath('/dashboard/fasiliti')
  redirect(`/dashboard/fasiliti/${id}`)
}

// ─── Edit Fasiliti ───────────────────────────────────────────────────────────

export async function editFasiliti(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  // NOTA prestasi (No.1): tiada Redis rate-limit di laluan edit. Borang dalaman
  // yang sudah melepasi auth + RBAC tidak perlu bayar ~200ms ke Upstash setiap
  // save. Rate-limit KEKAL untuk login/eksport (permukaan awam / berat).
  const { payload } = buildFasilitiPayload(formData)

  const { error } = await supabase.rpc('traceo_edit_fasiliti', {
    p_id: fasilitiId,
    p_payload: payload,
  })

  if (error) throw new Error(`Failed to update: ${error.message}`)

  // Notify the admin/manager team when a facility becomes overdue
  if (payload.status_fasiliti === 'tertunggak') {
    notifyOverdue(supabase, fasilitiId)
  }

  // NOTA prestasi (No.2): revalidate detail sahaja — redirect pergi ke sini.
  // Senarai dibiarkan stale-while-revalidate (segar sendiri selewat 120s atau
  // pada mutasi seterusnya yang menyentuhnya).
  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Padam Fasiliti ──────────────────────────────────────────────────────────

export async function padamFasiliti(fasilitiId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('fasiliti_padam', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { error } = await supabase.rpc('traceo_padam_fasiliti', { p_id: fasilitiId })
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  revalidatePath('/dashboard/fasiliti')
  redirect('/dashboard/fasiliti')
}

// ─── Settle via Asset ────────────────────────────────────────────────────────
// Kes settle bila cagaran dah jadi aset (pindah milik kepada penama / dijual).
// Tindakan satu-klik: status → selesai, cara → melalui_aset, tunggakan → 0
// (settle = cleared; dashboard berhenti kira kes ini sebagai tertunggak).
// Komponen amaun (A/B/C/D) dikekalkan untuk audit; penama + nota pindahmilik
// direkod.

export async function settleViaAsset(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('fasiliti_settle', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const penama_aset = (fd(formData, 'penama_aset') ?? '').trim()
  if (!penama_aset) throw new Error('Penama aset diperlukan untuk settle melalui aset')
  if (penama_aset.length > 200) throw new Error('Penama aset maksimum 200 aksara')
  const status_pindahmilik = (fd(formData, 'status_pindahmilik') ?? '').trim().slice(0, 200)

  const { data: current, error: fetchError } = await supabase
    .from('fasiliti')
    .select(
      'kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, tarikh_tamat, ringkasan_cagaran, nilai_cagaran, status_fasiliti, status_pindahmilik, catatan_am, kadar_dividen, perkongsian_keuntungan, tunggakan_dividen, caj_lewat, bayaran_tambahan, nama_kontraktor, harga_jualan, tahun_projek'
    )
    .eq('id', fasilitiId)
    .single()
  if (fetchError || !current) throw new Error('Facility not found')
  if (current.status_fasiliti === 'selesai') throw new Error('Facility is already settled')

  const { error } = await supabase.rpc('traceo_edit_fasiliti', {
    p_id: fasilitiId,
    p_payload: {
      ...current,
      penama_aset,
      status_pindahmilik: status_pindahmilik || current.status_pindahmilik,
      status_fasiliti: 'selesai',
      cara_selesai: 'melalui_aset',
      jumlah_tunggakan_semasa: 0,
    },
  })
  if (error) throw new Error(`Failed to settle: ${error.message}`)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  revalidatePath('/dashboard/fasiliti')
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Kemaskini Penugasan Pegawai ─────────────────────────────────────────────

export async function kemaskiniPegawaiFasiliti(fasilitiId: string, pegawaiIds: string[]) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('fasiliti_pegawai', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const validatedIds = parseOrThrow(pegawaiIdsSchema, pegawaiIds)

  const { error } = await supabase.rpc('traceo_kemaskini_pegawai', {
    p_fasiliti_id: fasilitiId,
    p_pegawai_ids: validatedIds.length > 0 ? validatedIds : null,
  })
  if (error) throw new Error(`Failed to assign officer: ${error.message}`)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Senarai Pegawai (untuk modal tugasan) ───────────────────────────────────
// Bacaan ringan yang dipanggil client HANYA bila modal dibuka (No.3c) —
// detail page tidak lagi fetch senarai ini server-side untuk semua pelawat.
export async function senaraiPegawai(): Promise<
  { id: string; nama: string; emel: string; peranan: string }[]
> {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, nama, emel, peranan')
    .eq('status', 'aktif')
    .in('peranan', ['pegawai_susulan', 'pengurus', 'admin'])
    .order('nama', { ascending: true })
  if (error) throw new Error(`Failed to load officers: ${error.message}`)
  return (data ?? []) as { id: string; nama: string; emel: string; peranan: string }[]
}
