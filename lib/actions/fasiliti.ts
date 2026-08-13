'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'

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

// ─── Tambah Fasiliti ─────────────────────────────────────────────────────────

export async function tambahFasiliti(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('fasiliti_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const kategori = formData.get('kategori') as string

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

  const rl = await rateLimitAction('fasiliti_edit', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
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

  const { error } = await supabase.rpc('traceo_edit_fasiliti', {
    p_id: fasilitiId,
    p_payload: payload,
  })

  if (error) throw new Error(`Failed to update: ${error.message}`)

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

  const rl = await rateLimitAction('fasiliti_padam', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const { error } = await supabase.rpc('traceo_padam_fasiliti', { p_id: fasilitiId })
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  revalidatePath('/dashboard/fasiliti')
  redirect('/dashboard/fasiliti')
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
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const { error } = await supabase.rpc('traceo_kemaskini_pegawai', {
    p_fasiliti_id: fasilitiId,
    p_pegawai_ids: pegawaiIds.length > 0 ? pegawaiIds : null,
  })
  if (error) throw new Error(`Failed to assign officer: ${error.message}`)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
}
