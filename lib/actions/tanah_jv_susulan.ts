'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { uploadFile, deleteFile, getFileType, validateFileBatch, verifyFileSignature, sanitizeFileName, mapLimit } from '@/lib/storage/cloudinary'
import { rateLimitAction } from '@/lib/ratelimit'
import { susulanSchema, fd, parseOrThrow } from '@/lib/validation'

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

// ─── Tambah Susulan Tanah ────────────────────────────────────────────────────

export async function tambahSusulanTanah(tanahId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_susulan')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_tanah_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const susulanId = crypto.randomUUID()

  const susulan = parseOrThrow(susulanSchema, {
    tarikh_susulan: fd(formData, 'tarikh_susulan'),
    catatan: fd(formData, 'catatan'),
  })

  // Upload fail ke Cloudinary dahulu (side-effect luar). Selari concurrency 3.
  const files = formData.getAll('lampiran') as File[]
  const batch = validateFileBatch(files)
  if (batch.errors.length > 0) {
    throw new Error(batch.errors.join(' '))
  }
  const lampiran: { url_fail: string; jenis_fail: string; nama_asal: string }[] = []
  const failed: string[] = []
  await mapLimit(batch.valid, 3, async (file) => {
    if (!(await verifyFileSignature(file))) {
      failed.push(`'${file.name}': kandungan fail tidak sepadan dengan jenisnya.`)
      return
    }
    const uploaded = await uploadFile(file, `susulan/${susulanId}`)
    if (uploaded) {
      lampiran.push({
        url_fail: uploaded.url,
        jenis_fail: getFileType(file),
        nama_asal: sanitizeFileName(file.name),
      })
    } else {
      failed.push(`'${file.name}': muat naik gagal. Cuba lagi.`)
    }
  })
  if (failed.length > 0) {
    await Promise.all(lampiran.map((l) => deleteFile(l.url_fail)))
    throw new Error(failed.join(' '))
  }

  // Atomic: susulan + lampiran + audit in a single transaction
  const { error } = await supabase.rpc('traceo_tambah_susulan', {
    p_id: susulanId,
    p_fasiliti_id: null,
    p_tanah_id: tanahId,
    p_tarikh_susulan: susulan.tarikh_susulan,
    p_catatan: susulan.catatan,
    p_lampiran: lampiran.length > 0 ? lampiran : [],
  })

  if (error) {
    // Compensate external side-effect: remove uploaded files
    await Promise.all(lampiran.map((l) => deleteFile(l.url_fail)))
    throw new Error(`Failed to save follow-up: ${error.message}`)
  }

  revalidatePath(`/dashboard/tanah-jv/${tanahId}`)
  redirect(`/dashboard/tanah-jv/${tanahId}`)
}

// ─── Edit Susulan Tanah ──────────────────────────────────────────────────────

export async function editSusulanTanah(susulanId: string, tanahId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_sendiri')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_tanah_edit', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  // Ownership check for pegawai_susulan is enforced inside the transaction
  // function via RLS (susulan_update policy). Atomic: update + audit.
  const validated = parseOrThrow(susulanSchema, {
    tarikh_susulan: fd(formData, 'tarikh_susulan'),
    catatan: fd(formData, 'catatan'),
  })
  const { error } = await supabase.rpc('traceo_edit_susulan', {
    p_id: susulanId,
    p_tarikh_susulan: validated.tarikh_susulan,
    p_catatan: validated.catatan,
  })

  if (error) throw new Error(`Failed to update: ${error.message}`)

  revalidatePath(`/dashboard/tanah-jv/${tanahId}`)
  redirect(`/dashboard/tanah-jv/${tanahId}`)
}

// ─── Lulus / Tolak Susulan Tanah (approval workflow) ────────────────────────
// Only admin/pengurus may approve. Enforced inside traceo_lulus_susulan.
export async function lulusSusulanTanah(
  susulanId: string,
  tanahId: string,
  keputusan: 'diluluskan' | 'ditolak'
) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_orang_lain')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_tanah_lulus', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { error } = await supabase.rpc('traceo_lulus_susulan', {
    p_id: susulanId,
    p_kelulusan: keputusan,
  })
  if (error) throw new Error(`Failed to update approval: ${error.message}`)

  revalidatePath(`/dashboard/tanah-jv/${tanahId}`)
}

// ─── Padam Susulan Tanah ─────────────────────────────────────────────────────

export async function padamSusulanTanah(susulanId: string, tanahId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_susulan')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_tanah_padam', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  // Atomic: delete susulan (cascades lampiran) + audit in one transaction.
  // Ownership for pegawai_susulan enforced via RLS inside the function.
  const { data: lampiranUrls, error } = await supabase.rpc('traceo_padam_susulan', {
    p_id: susulanId,
  })
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  // Compensate external side-effect: remove Cloudinary files after commit
  const urls: string[] = Array.isArray(lampiranUrls) ? lampiranUrls : []
  await Promise.all(urls.map((u) => deleteFile(u)))

  revalidatePath(`/dashboard/tanah-jv/${tanahId}`)
  return { ok: true as const }
}
