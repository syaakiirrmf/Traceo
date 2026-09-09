'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'
import { tanahSchema, fd, parseOrThrow } from '@/lib/validation'

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User profile not found')
  if (userProfile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    throw new Error('Account is disabled.')
  }
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
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const payload = parseOrThrow(tanahSchema, {
    negeri: fd(formData, 'negeri'),
    daerah: fd(formData, 'daerah'),
    bandar_mukim: fd(formData, 'bandar_mukim'),
    tempat: fd(formData, 'tempat'),
    no_lot: fd(formData, 'no_lot'),
    tarikh_daftar: fd(formData, 'tarikh_daftar'),
    no_hak_milik: fd(formData, 'no_hak_milik'),
    luas_meter_persegi: fd(formData, 'luas_meter_persegi'),
    anggaran_nilaian: fd(formData, 'anggaran_nilaian'),
    catatan: fd(formData, 'catatan'),
  })

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
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const payload = parseOrThrow(tanahSchema, {
    negeri: fd(formData, 'negeri'),
    daerah: fd(formData, 'daerah'),
    bandar_mukim: fd(formData, 'bandar_mukim'),
    tempat: fd(formData, 'tempat'),
    no_lot: fd(formData, 'no_lot'),
    tarikh_daftar: fd(formData, 'tarikh_daftar'),
    no_hak_milik: fd(formData, 'no_hak_milik'),
    luas_meter_persegi: fd(formData, 'luas_meter_persegi'),
    anggaran_nilaian: fd(formData, 'anggaran_nilaian'),
    catatan: fd(formData, 'catatan'),
  })

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
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { error } = await supabase.rpc('traceo_padam_tanah_jv', { p_id: tanahId })
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  revalidatePath('/dashboard/tanah-jv')
  redirect('/dashboard/tanah-jv')
}
