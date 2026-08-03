'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/auth/permissions'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Tidak log masuk')
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) throw new Error('Pengguna tidak dijumpai')
  return { supabase, userProfile }
}

// ─── Tambah User ─────────────────────────────────────────────────────────────

export async function tambahUser(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Akses ditolak')

  const emel = formData.get('emel') as string
  const nama = formData.get('nama') as string
  const peranan = formData.get('peranan') as string
  const kataLaluan = formData.get('kata_laluan') as string

  const adminClient = createAdminClient()

  // Create auth user via admin API (requires service_role key)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: emel,
    password: kataLaluan,
    email_confirm: true,
  })

  if (authError) throw new Error(`Gagal cipta akaun: ${authError.message}`)

  // Insert into users table
  const { error } = await supabase.from('users').insert({
    auth_id: authData.user.id,
    nama,
    emel,
    peranan,
    status: 'aktif',
  })

  if (error) throw new Error(`Gagal simpan pengguna: ${error.message}`)

  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'cipta_pengguna',
    entiti_jenis: 'user',
    entiti_id: authData.user.id,
    butiran: { nama, emel, peranan },
  })

  revalidatePath('/dashboard/users')
  return { ok: true as const, id: authData.user.id }
}

// ─── Toggle Status User ───────────────────────────────────────────────────────

export async function toggleUserStatus(userId: string, statusSemasa: string) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Akses ditolak')

  const statusBaharu = statusSemasa === 'aktif' ? 'tidak_aktif' : 'aktif'

  const { error } = await supabase
    .from('users')
    .update({ status: statusBaharu })
    .eq('id', userId)

  if (error) throw new Error(`Gagal kemaskini status: ${error.message}`)

  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'kemaskini_status_pengguna',
    entiti_jenis: 'user',
    entiti_id: userId,
    butiran: { status_baharu: statusBaharu },
  })

  revalidatePath('/dashboard/users')
}

// ─── Kemaskini Peranan ────────────────────────────────────────────────────────

export async function kemaskiniPeranan(userId: string, perananBaharu: string) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Akses ditolak')

  const { error } = await supabase
    .from('users')
    .update({ peranan: perananBaharu })
    .eq('id', userId)

  if (error) throw new Error(`Gagal kemaskini peranan: ${error.message}`)

  await supabase.from('log_audit').insert({
    user_id: userProfile.id,
    tindakan: 'kemaskini_peranan',
    entiti_jenis: 'user',
    entiti_id: userId,
    butiran: { peranan_baharu: perananBaharu },
  })

  revalidatePath('/dashboard/users')
}
