'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { uploadFile, deleteFile, getFileType, validateFile } from '@/lib/storage/cloudinary'

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

// ─── Tambah Susulan ──────────────────────────────────────────────────────────

export async function tambahSusulan(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_susulan')) {
    throw new Error('Access denied')
  }

  const { data: susulan, error } = await supabase
    .from('susulan')
    .insert({
      fasiliti_id: fasilitiId,
      tarikh_susulan: formData.get('tarikh_susulan') as string,
      catatan: formData.get('catatan') as string,
      dicatat_oleh: userProfile.id,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save follow-up: ${error.message}`)

  // Handle file uploads → Cloudinary
  const files = formData.getAll('lampiran') as File[]
  for (const file of files) {
    if (!file || file.size === 0) continue

    const validation = validateFile(file)
    if (!validation.valid) continue // skip invalid files

    const uploaded = await uploadFile(file, `susulan/${susulan.id}`)
    if (!uploaded) continue // skip failed uploads, don't abort susulan

    await supabase.from('lampiran').insert({
      susulan_id: susulan.id,
      url_fail: uploaded.url,
      jenis_fail: getFileType(file),
      nama_asal: file.name,
    })
  }

  // Audit log
  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'cipta_susulan',
    entiti_jenis: 'susulan',
    entiti_id: susulan.id,
  })

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Edit Susulan ────────────────────────────────────────────────────────────

export async function editSusulan(
  susulanId: string,
  fasilitiId: string,
  formData: FormData
) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_sendiri')) {
    throw new Error('Access denied')
  }

  // Pegawai susulan only allowed to edit their own records
  if (userProfile.peranan === 'pegawai_susulan') {
    const { data: existing } = await supabase
      .from('susulan')
      .select('dicatat_oleh')
      .eq('id', susulanId)
      .single()

    if (existing?.dicatat_oleh !== userProfile.id) {
      throw new Error('Access denied: not your record')
    }
  }

  const { error } = await supabase
    .from('susulan')
    .update({
      tarikh_susulan: formData.get('tarikh_susulan') as string,
      catatan: formData.get('catatan') as string,
    })
    .eq('id', susulanId)

  if (error) throw new Error(`Failed to update: ${error.message}`)

  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'edit_susulan',
    entiti_jenis: 'susulan',
    entiti_id: susulanId,
  })

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Padam Susulan ───────────────────────────────────────────────────────────

export async function padamSusulan(susulanId: string, fasilitiId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_susulan')) {
    throw new Error('Access denied')
  }

  // Pegawai susulan only allowed to delete their own records
  if (userProfile.peranan === 'pegawai_susulan') {
    const { data: existing } = await supabase
      .from('susulan')
      .select('dicatat_oleh')
      .eq('id', susulanId)
      .single()

    if (existing?.dicatat_oleh !== userProfile.id) {
      throw new Error('Access denied: not your record')
    }
  }

  // Delete associated lampiran from Cloudinary first
  const { data: lampiranList } = await supabase
    .from('lampiran')
    .select('url_fail')
    .eq('susulan_id', susulanId)

  if (lampiranList?.length) {
    await Promise.all(lampiranList.map((l) => deleteFile(l.url_fail)))
  }

  const { error } = await supabase.from('susulan').delete().eq('id', susulanId)
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'padam_susulan',
    entiti_jenis: 'susulan',
    entiti_id: susulanId,
  })

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  return { ok: true as const }
}
