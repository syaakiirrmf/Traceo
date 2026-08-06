'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User not found')
  return { supabase, userProfile }
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tindakan: string,
  entiti_jenis: string,
  entiti_id: string,
  butiran?: Record<string, unknown>
) {
  await supabase.from('log_audit').insert({
    user_id: userId,
    tindakan,
    entiti_jenis,
    entiti_id,
    butiran: butiran ?? null,
  })
}

// ─── Generate kod rujukan ────────────────────────────────────────────────────

async function generateKodRujukan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kategori: string
): Promise<string> {
  const prefix = kategori === 'pinjaman_individu' ? 'PI' : 'JV'

  const { count } = await supabase
    .from('fasiliti')
    .select('*', { count: 'exact', head: true })
    .like('kod_rujukan', `${prefix}-%`)

  const seq = (count ?? 0) + 1
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

// ─── Tambah Fasiliti ─────────────────────────────────────────────────────────

export async function tambahFasiliti(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    throw new Error('Access denied')
  }

  const kategori = formData.get('kategori') as string
  const kod_rujukan = await generateKodRujukan(supabase, kategori)

  const pegawaiIds = formData.getAll('pegawai_ids') as string[]

  // ─── Category-aware arrears computation ──────────────────────────────────────
  const jumlah_pembiayaan = parseFloat(formData.get('jumlah_pembiayaan') as string) || 0
  const perkongsian_keuntungan = parseFloat(formData.get('perkongsian_keuntungan') as string) || 0
  const tunggakan_dividen = parseFloat(formData.get('tunggakan_dividen') as string) || 0
  const caj_lewat = parseFloat(formData.get('caj_lewat') as string) || 0
  const bayaran_tambahan = parseFloat(formData.get('bayaran_tambahan') as string) || 0
  const manualTunggakan = formData.get('jumlah_tunggakan_semasa') as string

  let jumlah_tunggakan_semasa: number
  if (manualTunggakan && manualTunggakan.trim() !== '') {
    jumlah_tunggakan_semasa = parseFloat(manualTunggakan)
  } else if (kategori === 'pinjaman_individu') {
    // JV3: C = A + B (jumlah_pembiayaan + bayaran_tambahan)
    jumlah_tunggakan_semasa = jumlah_pembiayaan + bayaran_tambahan
  } else if (kategori === 'jv_tanah') {
    // JV2: E = A + B + C + D (A=modal, B=perkongsian_keuntungan, C=tunggakan_dividen, D=bayaran_tambahan)
    jumlah_tunggakan_semasa = jumlah_pembiayaan + perkongsian_keuntungan + tunggakan_dividen + bayaran_tambahan
  } else {
    // JV1: E = A + B + C + D (A=modal, B=tunggakan_dividen, C=caj_lewat, D=bayaran_tambahan)
    jumlah_tunggakan_semasa = jumlah_pembiayaan + tunggakan_dividen + caj_lewat + bayaran_tambahan
  }

  const payload = {
    kod_rujukan,
    kategori,
    pembiaya_modal: formData.get('pembiaya_modal') as string,
    nama_peminjam: formData.get('nama_peminjam') as string,
    jumlah_pembiayaan,
    tarikh_mula: formData.get('tarikh_mula') as string,
    tarikh_tamat: (formData.get('tarikh_tamat') as string) || null,
    ringkasan_cagaran: (formData.get('ringkasan_cagaran') as string) || '',
    nilai_cagaran: parseFloat(formData.get('nilai_cagaran') as string) || null,
    jumlah_tunggakan_semasa,
    status_fasiliti: formData.get('status_fasiliti') as string,
    catatan_am: (formData.get('catatan_am') as string) || null,
    dicipta_oleh: userProfile.id,
    // Financial fields
    kadar_dividen: (formData.get('kadar_dividen') as string) || null,
    perkongsian_keuntungan,
    tunggakan_dividen,
    caj_lewat,
    bayaran_tambahan,
    // Collateral & asset
    penama_aset: (formData.get('penama_aset') as string) || null,
    status_pindahmilik: (formData.get('status_pindahmilik') as string) || null,
    // JV Tanah specific
    nama_kontraktor: (formData.get('nama_kontraktor') as string) || null,
    harga_jualan: (formData.get('harga_jualan') as string) || null,
    tahun_projek: parseInt(formData.get('tahun_projek') as string) || null,
  }

  const { data: fasiliti, error } = await supabase
    .from('fasiliti')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save: ${error.message}`)

  // Assign pegawai susulan jika ada
  if (pegawaiIds.length > 0) {
    await supabase.from('fasiliti_pegawai').insert(
      pegawaiIds.map((uid) => ({ fasiliti_id: fasiliti.id, user_id: uid }))
    )
  }

  await logAudit(supabase, userProfile.id, 'cipta_fasiliti', 'fasiliti', fasiliti.id, { kod_rujukan })

  revalidatePath('/dashboard/fasiliti')
  redirect(`/dashboard/fasiliti/${fasiliti.id}`)
}

// ─── Edit Fasiliti ───────────────────────────────────────────────────────────

export async function editFasiliti(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  const kategori = formData.get('kategori') as string
  const jumlah_pembiayaan = parseFloat(formData.get('jumlah_pembiayaan') as string) || 0
  const perkongsian_keuntungan = parseFloat(formData.get('perkongsian_keuntungan') as string) || 0
  const tunggakan_dividen = parseFloat(formData.get('tunggakan_dividen') as string) || 0
  const caj_lewat = parseFloat(formData.get('caj_lewat') as string) || 0
  const bayaran_tambahan = parseFloat(formData.get('bayaran_tambahan') as string) || 0
  const manualTunggakan = formData.get('jumlah_tunggakan_semasa') as string

  let jumlah_tunggakan_semasa: number
  if (manualTunggakan && manualTunggakan.trim() !== '') {
    jumlah_tunggakan_semasa = parseFloat(manualTunggakan)
  } else if (kategori === 'pinjaman_individu') {
    jumlah_tunggakan_semasa = jumlah_pembiayaan + bayaran_tambahan
  } else if (kategori === 'jv_tanah') {
    jumlah_tunggakan_semasa = jumlah_pembiayaan + perkongsian_keuntungan + tunggakan_dividen + bayaran_tambahan
  } else {
    jumlah_tunggakan_semasa = jumlah_pembiayaan + tunggakan_dividen + caj_lewat + bayaran_tambahan
  }

  const payload = {
    kategori,
    pembiaya_modal: formData.get('pembiaya_modal') as string,
    nama_peminjam: formData.get('nama_peminjam') as string,
    jumlah_pembiayaan,
    tarikh_mula: formData.get('tarikh_mula') as string,
    tarikh_tamat: (formData.get('tarikh_tamat') as string) || null,
    ringkasan_cagaran: (formData.get('ringkasan_cagaran') as string) || '',
    nilai_cagaran: parseFloat(formData.get('nilai_cagaran') as string) || null,
    jumlah_tunggakan_semasa,
    status_fasiliti: formData.get('status_fasiliti') as string,
    catatan_am: (formData.get('catatan_am') as string) || null,
    // Financial fields
    kadar_dividen: (formData.get('kadar_dividen') as string) || null,
    perkongsian_keuntungan,
    tunggakan_dividen,
    caj_lewat,
    bayaran_tambahan,
    // Collateral & asset
    penama_aset: (formData.get('penama_aset') as string) || null,
    status_pindahmilik: (formData.get('status_pindahmilik') as string) || null,
    // JV Tanah specific
    nama_kontraktor: (formData.get('nama_kontraktor') as string) || null,
    harga_jualan: (formData.get('harga_jualan') as string) || null,
    tahun_projek: parseInt(formData.get('tahun_projek') as string) || null,
  }

  const { error } = await supabase
    .from('fasiliti')
    .update(payload)
    .eq('id', fasilitiId)

  if (error) throw new Error(`Failed to update: ${error.message}`)

  await logAudit(supabase, userProfile.id, 'edit_fasiliti', 'fasiliti', fasilitiId)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  revalidatePath('/dashboard/fasiliti')
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Padam Fasiliti ──────────────────────────────────────────────────────────

export async function padamFasiliti(fasilitiId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_fasiliti')) {
    throw new Error('Access denied')
  }

  const { error } = await supabase.from('fasiliti').delete().eq('id', fasilitiId)
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  await logAudit(supabase, userProfile.id, 'padam_fasiliti', 'fasiliti', fasilitiId)

  revalidatePath('/dashboard/fasiliti')
  redirect('/dashboard/fasiliti')
}

// ─── Kemaskini Penugasan Pegawai ─────────────────────────────────────────────

export async function kemaskiniPegawaiFasiliti(fasilitiId: string, pegawaiIds: string[]) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  // Delete existing assignments for this fasiliti
  await supabase.from('fasiliti_pegawai').delete().eq('fasiliti_id', fasilitiId)

  // Insert new ones if any
  if (pegawaiIds.length > 0) {
    const rows = pegawaiIds.map((userId) => ({
      fasiliti_id: fasilitiId,
      user_id: userId,
    }))
    const { error } = await supabase.from('fasiliti_pegawai').insert(rows)
    if (error) throw new Error(`Failed to assign officer: ${error.message}`)
  }

  await logAudit(supabase, userProfile.id, 'kemaskini_pegawai', 'fasiliti', fasilitiId, {
    pegawai_ids: pegawaiIds,
  })

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
}
