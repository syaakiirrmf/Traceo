'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'
import { bayaranSchema, fd, parseOrThrow } from '@/lib/validation'

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

// ─── Tambah Bayaran ──────────────────────────────────────────────────────────

export async function tambahBayaran(fasilitiId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'tambah_bayaran')) {
    throw new Error('Access denied')
  }

  const rl = await rateLimitAction('bayaran_tambah', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const bayaran = parseOrThrow(bayaranSchema, {
    tarikh_bayar: fd(formData, 'tarikh_bayar'),
    jumlah: fd(formData, 'jumlah'),
    jenis: fd(formData, 'jenis'),
    catatan: fd(formData, 'catatan') || null,
  })

  const { error } = await supabase.from('bayaran').insert({
    id: crypto.randomUUID(),
    fasiliti_id: fasilitiId,
    tarikh_bayar: bayaran.tarikh_bayar,
    jumlah: bayaran.jumlah,
    jenis: bayaran.jenis,
    catatan: bayaran.catatan,
    dicatat_oleh: userProfile.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  revalidatePath('/dashboard/fasiliti')
}

// ─── Padam Bayaran ───────────────────────────────────────────────────────────

export async function padamBayaran(bayaranId: string, fasilitiId: string) {
  const { supabase, userProfile } = await getCurrentUser()

  if (!hasPermission(userProfile.peranan, 'padam_bayaran')) {
    throw new Error('Access denied')
  }

  const { error } = await supabase
    .from('bayaran')
    .delete()
    .eq('id', bayaranId)
    .eq('fasiliti_id', fasilitiId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/fasiliti/${fasilitiId}`)
  revalidatePath('/dashboard/fasiliti')
}
