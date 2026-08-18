'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { uploadFile, deleteFile, getFileType, validateFile } from '@/lib/storage/cloudinary'
import { rateLimitAction } from '@/lib/ratelimit'
import { sendNewSusulanEmail, getAdminEmails, sendApprovalEmail } from '@/lib/email'

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) throw new Error('User not found')
  return { supabase, userProfile }
}

async function notifyNewSusulan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fasilitiId: string,
  data: { tarikh_susulan: string }
) {
  try {
    const { data: fasiliti } = await supabase
      .from('fasiliti')
      .select('kod_rujukan, nama_peminjam')
      .eq('id', fasilitiId)
      .single()
    const emails = await getAdminEmails(supabase)
    if (!fasiliti || emails.length === 0) return
    await Promise.all(
      emails.map((to) =>
        sendNewSusulanEmail(to, {
          kod_rujukan: fasiliti.kod_rujukan,
          nama_peminjam: fasiliti.nama_peminjam,
          tarikh_susulan: data.tarikh_susulan,
        })
      )
    )
  } catch (err) {
    console.error('[notifyNewSusulan]', err)
  }
}

// ─── Tambah Susulan ──────────────────────────────────────────────────────────

export async function tambahSusulan(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_susulan')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const susulanId = crypto.randomUUID()

  // Upload files to Cloudinary first (external side-effect — cannot be part of
  // the DB transaction). If the DB transaction fails we compensate by deleting
  // the uploaded files.
  const files = formData.getAll('lampiran') as File[]
  const lampiran: { url_fail: string; jenis_fail: string; nama_asal: string }[] = []
  for (const file of files) {
    if (!file || file.size === 0) continue

    const validation = validateFile(file)
    if (!validation.valid) continue // skip invalid files

    const uploaded = await uploadFile(file, `susulan/${susulanId}`)
    if (uploaded) {
      lampiran.push({
        url_fail: uploaded.url,
        jenis_fail: getFileType(file),
        nama_asal: file.name,
      })
    }
  }

  // Atomic: susulan + lampiran + audit in a single transaction
  const { error } = await supabase.rpc('traceo_tambah_susulan', {
    p_id: susulanId,
    p_fasiliti_id: fasilitiId,
    p_tanah_id: null,
    p_tarikh_susulan: formData.get('tarikh_susulan') as string,
    p_catatan: formData.get('catatan') as string,
    p_lampiran: lampiran.length > 0 ? lampiran : [],
  })

  if (error) {
    // Compensate external side-effect: remove uploaded files
    await Promise.all(lampiran.map((l) => deleteFile(l.url_fail)))
    throw new Error(`Failed to save follow-up: ${error.message}`)
  }

  // Notify admin/manager team of the new follow-up (best-effort, non-blocking)
  notifyNewSusulan(supabase, fasilitiId, {
    tarikh_susulan: formData.get('tarikh_susulan') as string,
  })

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Edit Susulan ────────────────────────────────────────────────────────────

export async function editSusulan(susulanId: string, fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_sendiri')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_edit', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  // Ownership check for pegawai_susulan is enforced inside the transaction
  // function via RLS (susulan_update policy). Atomic: update + audit.
  const { error } = await supabase.rpc('traceo_edit_susulan', {
    p_id: susulanId,
    p_tarikh_susulan: formData.get('tarikh_susulan') as string,
    p_catatan: formData.get('catatan') as string,
  })

  if (error) throw new Error(`Failed to update: ${error.message}`)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  redirect(`/dashboard/fasiliti/${fasilitiId}`)
}

// ─── Lulus / Tolak Susulan (approval workflow) ─────────────────────────────
// Only admin/pengurus may approve. Enforced inside traceo_lulus_susulan.
export async function lulusSusulan(
  susulanId: string,
  fasilitiId: string,
  keputusan: 'diluluskan' | 'ditolak'
) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_orang_lain')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_lulus', 20, 60, userProfile.id)
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

  notifyApproval(supabase, susulanId, keputusan)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
}

async function notifyApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  susulanId: string,
  keputusan: 'diluluskan' | 'ditolak'
) {
  try {
    const { data: susulan } = await supabase
      .from('susulan')
      .select('dicatat_oleh, fasiliti:fasiliti!susulan_fasiliti_id_fkey(kod_rujukan, nama_peminjam)')
      .eq('id', susulanId)
      .single()
    if (!susulan?.dicatat_oleh) return
    const { data: user } = await supabase
      .from('users')
      .select('emel')
      .eq('id', susulan.dicatat_oleh)
      .single()
    const fasiliti = Array.isArray(susulan.fasiliti)
      ? susulan.fasiliti[0]
      : susulan.fasiliti
    if (!user?.emel || !fasiliti) return
    await sendApprovalEmail(user.emel, {
      kod_rujukan: fasiliti.kod_rujukan,
      nama_peminjam: fasiliti.nama_peminjam,
      keputusan,
    })
  } catch (err) {
    console.error('[notifyApproval]', err)
  }
}

// ─── Padam Susulan ───────────────────────────────────────────────────────────

export async function padamSusulan(susulanId: string, fasilitiId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_susulan')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('susulan_padam', 20, 60, userProfile.id)
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

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  return { ok: true as const }
}
