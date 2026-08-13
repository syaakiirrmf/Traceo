'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'

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

// ─── Tambah User ─────────────────────────────────────────────────────────────

export async function tambahUser(formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Access denied')

  const rl = await rateLimitAction('users_tambah', 10, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const emel = formData.get('emel') as string
  const nama = formData.get('nama') as string
  const peranan = formData.get('peranan') as string
  const kataLaluan = formData.get('kata_laluan') as string

  const adminClient = createAdminClient()

  // Create auth user via admin API (external to the DB transaction)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: emel,
    password: kataLaluan,
    email_confirm: true,
  })

  if (authError) throw new Error(`Failed to create account: ${authError.message}`)

  // Atomic: users row + audit in a single transaction
  const { error } = await supabase.rpc('traceo_cipta_pengguna', {
    p_auth_id: authData.user.id,
    p_nama: nama,
    p_emel: emel,
    p_peranan: peranan,
  })

  if (error) {
    // Compensate external side-effect: remove the orphaned auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Failed to save user: ${error.message}`)
  }

  revalidatePath('/dashboard/users')
  return { ok: true as const, id: authData.user.id }
}

// ─── Toggle Status User ───────────────────────────────────────────────────────

export async function toggleUserStatus(userId: string, statusSemasa: string) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Access denied')

  const rl = await rateLimitAction('users_status', 30, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  const statusBaharu = statusSemasa === 'aktif' ? 'tidak_aktif' : 'aktif'

  // Atomic: update status + audit in a single transaction
  const { error } = await supabase.rpc('traceo_kemaskini_status_pengguna', {
    p_id: userId,
    p_status: statusBaharu,
  })

  if (error) throw new Error(`Failed to update status: ${error.message}`)

  revalidatePath('/dashboard/users')
}

// ─── Kemaskini Peranan ────────────────────────────────────────────────────────

export async function kemaskiniPeranan(userId: string, perananBaharu: string) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Access denied')

  const rl = await rateLimitAction('users_peranan', 30, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Terlalu banyak permintaan. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`
    )
  }

  // Atomic: update role + audit in a single transaction
  const { error } = await supabase.rpc('traceo_kemaskini_peranan', {
    p_id: userId,
    p_peranan: perananBaharu,
  })

  if (error) throw new Error(`Failed to update role: ${error.message}`)

  revalidatePath('/dashboard/users')
}
