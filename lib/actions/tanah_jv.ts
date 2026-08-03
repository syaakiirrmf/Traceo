'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User profile not found')
  return { supabase, userProfile }
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tindakan: string,
  entiti_id: string,
  butiran?: Record<string, unknown>
) {
  await supabase.from('log_audit').insert({
    user_id: userId,
    tindakan,
    entiti_jenis: 'tanah_jv',
    entiti_id,
    butiran: butiran ?? null,
  })
}

// ─── Tambah Tanah JV ─────────────────────────────────────────────────────────

export async function tambahTanahJV(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    throw new Error('Access denied')
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
    dicipta_oleh: userProfile.id,
  }

  const { data: tanah, error } = await supabase
    .from('tanah_jv')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save: ${error.message}`)

  await logAudit(supabase, userProfile.id, 'cipta_tanah_jv', tanah.id, { no_lot: payload.no_lot })

  revalidatePath('/dashboard/tanah-jv')
  redirect(`/dashboard/tanah-jv/${tanah.id}`)
}

// ─── Edit Tanah JV ───────────────────────────────────────────────────────────

export async function editTanahJV(tanahId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    throw new Error('Access denied')
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

  const { error } = await supabase
    .from('tanah_jv')
    .update(payload)
    .eq('id', tanahId)

  if (error) throw new Error(`Failed to update: ${error.message}`)

  await logAudit(supabase, userProfile.id, 'edit_tanah_jv', tanahId)

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

  const { error } = await supabase.from('tanah_jv').delete().eq('id', tanahId)
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  await logAudit(supabase, userProfile.id, 'padam_tanah_jv', tanahId)

  revalidatePath('/dashboard/tanah-jv')
  redirect('/dashboard/tanah-jv')
}
