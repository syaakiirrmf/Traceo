'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { uploadFile, deleteFile, getFileType, validateFileBatch, verifyFileSignature, sanitizeFileName, mapLimit } from '@/lib/storage/cloudinary'
import { rateLimitAction } from '@/lib/ratelimit'
import { susulanSchema, fd, parseOrThrow } from '@/lib/validation'
import { sendNewSusulanEmail, getAdminEmails, sendApprovalEmail } from '@/lib/email'

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

  // Validate dahulu sebelum upload (jangan bazir bandwidth bila input rosak).
  const susulan = parseOrThrow(susulanSchema, {
    tarikh_susulan: fd(formData, 'tarikh_susulan'),
    catatan: fd(formData, 'catatan'),
  })

  // Upload fail ke Cloudinary dahulu (side-effect luar — tidak boleh masuk
  // transaksi DB). Gagal DB → fail yang dimuat naik dipadam (compensation).
  // Muat naik selari (concurrency 3) — bukan sequential seperti sebelum ini.
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
    p_fasiliti_id: fasilitiId,
    p_tanah_id: null,
    p_tarikh_susulan: susulan.tarikh_susulan,
    p_catatan: susulan.catatan,
    p_lampiran: lampiran.length > 0 ? lampiran : [],
  })

  if (error) {
    // Compensate external side-effect: remove uploaded files
    await Promise.all(lampiran.map((l) => deleteFile(l.url_fail)))
    throw new Error(`Failed to save follow-up: ${error.message}`)
  }

  // Notify admin/manager team of the new follow-up (best-effort, non-blocking)
  notifyNewSusulan(supabase, fasilitiId, {
    tarikh_susulan: susulan.tarikh_susulan,
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

// ─── Tambah Lampiran ke Susulan sedia ada ────────────────────────────────────
// returnPath: laluan untuk revalidate (fasiliti atau tanah-jv).

export async function tambahLampiranSusulan(susulanId: string, returnPath: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_susulan')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('lampiran_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { data: parent } = await supabase
    .from('susulan')
    .select('id, fasiliti_id, tanah_id, dicatat_oleh')
    .eq('id', susulanId)
    .single()
  if (!parent) throw new Error('Follow-up not found')

  // Pegawai: hanya susulan fasiliti yang di-assign (tanah bukan skop mereka).
  if (userProfile.peranan === 'pegawai_susulan') {
    if (!parent.fasiliti_id) throw new Error('Access denied')
    const { data: assignment } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('fasiliti_id', parent.fasiliti_id)
      .eq('user_id', userProfile.id)
      .maybeSingle()
    if (!assignment && parent.dicatat_oleh !== userProfile.id) throw new Error('Access denied')
  }

  const files = formData.getAll('lampiran') as File[]
  const batch = validateFileBatch(files)
  if (batch.errors.length > 0) throw new Error(batch.errors.join(' '))
  if (batch.valid.length === 0) throw new Error('Tiada fail dipilih.')

  const rows: { susulan_id: string; url_fail: string; jenis_fail: string; nama_asal: string }[] = []
  const failed: string[] = []
  await mapLimit(batch.valid, 3, async (file) => {
    if (!(await verifyFileSignature(file))) {
      failed.push(`'${file.name}': kandungan fail tidak sepadan dengan jenisnya.`)
      return
    }
    const uploaded = await uploadFile(file, `susulan/${susulanId}`)
    if (uploaded) {
      rows.push({
        susulan_id: susulanId,
        url_fail: uploaded.url,
        jenis_fail: getFileType(file),
        nama_asal: sanitizeFileName(file.name),
      })
    } else {
      failed.push(`'${file.name}': muat naik gagal. Cuba lagi.`)
    }
  })
  if (failed.length > 0) {
    await Promise.all(rows.map((r) => deleteFile(r.url_fail)))
    throw new Error(failed.join(' '))
  }

  const { error } = await supabase.from('lampiran').insert(rows)
  if (error) {
    await Promise.all(rows.map((r) => deleteFile(r.url_fail)))
    throw new Error(`Failed to save attachments: ${error.message}`)
  }

  revalidatePath(returnPath)
}

// ─── Padam Lampiran (admin/pengurus sahaja, selaras RLS lampiran_delete) ─────

export async function padamLampiran(lampiranId: string, returnPath: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'edit_susulan_orang_lain')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('lampiran_padam', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const { data: row } = await supabase
    .from('lampiran')
    .select('url_fail')
    .eq('id', lampiranId)
    .single()
  if (!row) throw new Error('Attachment not found')

  const { error } = await supabase.from('lampiran').delete().eq('id', lampiranId)
  if (error) throw new Error(`Failed to delete: ${error.message}`)

  await deleteFile(row.url_fail)
  revalidatePath(returnPath)
}
