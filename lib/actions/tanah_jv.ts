'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User profile not found')
  return { supabase, userProfile }
}

// ─── Tambah Tanah JV ─────────────────────────────────────────────────────────

export async function tambahTanahJV(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('tanah_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const payload = {
    negeri: formData.get('negeri') as string,
    daerah: formData.get('daerah') as string,
    bandar_mukim: formData.get('bandar_mukim') as string,
    tempat: formData.get('tempat') as string,
    no_lot: formData.get('no_lot') as string,
    tarikh_daftar: (formData.get('tarikh_daftar') as string) || null,
    no_hak_milik: (formData.get('no_hak_milik') as string) || null,
    luas_meter_persegi: parseFloat(formData.get('luas_meter_persegi') as string) || null,
    anggaran_nilaian: parseFloat(formData.get('anggaran_nilaian') as string) || null,
    catatan: (formData.get('catatan') as string) || null,
  }

  const { data: id, error } = await supabase.rpc('traceo_tambah_tanah_jv', {
    p_payload: payload,
  })

  if (error) throw new Error(`Failed to save: ${error.message}`)

  revalidatePath('/dashboard/tanah-jv')
  redirect(`/dashboard/tanah-jv/${id}`)
}

// ─── Edit Tanah JV ───────────────────────────────────────────────────────────

export async function editTanahJV(tanahId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('tanah_edit', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const payload = {
    negeri: formData.get('negeri') as string,
    daerah: formData.get('daerah') as string,
    bandar_mukim: formData.get('bandar_mukim') as string,
    tempat: formData.get('tempat') as string,
    no_lot: formData.get('no_lot') as string,
    tarikh_daftar: (formData.get('tarikh_daftar') as string) || null,
    no_hak_milik: (formData.get('no_hak_milik') as string) || null,
    luas_meter_persegi: parseFloat(formData.get('luas_meter_persegi') as string) || null,
    anggaran_nilaian: parseFloat(formData.get('anggaran_nilaian') as string) || null,
    catatan: (formData.get('catatan') as string) || null,
  }

  const { error } = await supabase.rpc('traceo_edit_tanah_jv', {
    p_id: tanahId,
    p_payload: payload,
  })

  if (error) throw new Error(`Failed to update: ${error.message}`)

  revalidatePath(`/dashboard/tanah-jv/${tanahId}`)
  revalidatePath('/dashboard/tanah-jv')
  redirect(`/dashboard/tanah-jv/${tanahId}`)
}

// ─── Padam Tanah JV ──────────────────────────────────────────────────────────

export async function padamTanahJV(tanahId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_fasiliti')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('tanah_padam', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const { error } = await supabase.rpc('traceo_padam_tanah_jv', { p_id: tanahId })
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  revalidatePath('/dashboard/tanah-jv')
  redirect('/dashboard/tanah-jv')
}
