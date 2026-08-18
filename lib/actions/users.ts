'use server'

import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitAction } from '@/lib/ratelimit'

const PASSWORD_MIN_LENGTH = 8

function validatePasswordStrength(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain uppercase letters, lowercase letters and numbers.'
  }
  return null
}

async function isPasswordCompromised(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return false
    const body = await res.text()
    return body.split('\n').some((line) => line.trim().startsWith(suffix + ':'))
  } catch {
    return false
  }
}

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
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const emel = formData.get('emel') as string
  const nama = formData.get('nama') as string
  const peranan = formData.get('peranan') as string
  const kataLaluan = formData.get('kata_laluan') as string

  const passwordError = validatePasswordStrength(kataLaluan)
  if (passwordError) throw new Error(passwordError)
  if (await isPasswordCompromised(kataLaluan)) {
    throw new Error(
      'This password has been exposed in a public data breach. Please choose another password.'
    )
  }

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

// ─── Kemaskini Pengguna (nama, emel, peranan, optional password) ─────────────
// The users row is updated atomically via traceo_kemaskini_pengguna.
// Supabase Auth (email + optional password) is updated via the admin API;
// if the DB call fails, the auth email is reverted (compensation).

export async function kemaskiniUser(userId: string, formData: FormData) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Access denied')

  const rl = await rateLimitAction('users_kemaskini', 20, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const nama = formData.get('nama') as string
  const emel = formData.get('emel') as string
  const peranan = formData.get('peranan') as string
  const kataLaluan = (formData.get('kata_laluan') as string) || ''
  const sahkan = (formData.get('sahkan_kata_laluan') as string) || ''

  if (!nama?.trim()) throw new Error('Name is required')
  if (!emel?.trim()) throw new Error('Email is required')

  // Fetch target user row (auth_id + current emel) for auth-side sync
  const { data: target } = await supabase
    .from('users')
    .select('auth_id, emel')
    .eq('id', userId)
    .single()
  if (!target) throw new Error('User not found')

  const adminClient = createAdminClient()
  let emelDiubah = false

  // 1. Optional password reset (external, must not be skipped if provided)
  if (kataLaluan) {
    if (kataLaluan !== sahkan) throw new Error('Passwords do not match')
    const passwordError = validatePasswordStrength(kataLaluan)
    if (passwordError) throw new Error(passwordError)
    if (await isPasswordCompromised(kataLaluan)) {
      throw new Error(
        'This password has been exposed in a public data breach. Please choose another password.'
      )
    }
    const { error: pwdError } = await adminClient.auth.admin.updateUserById(target.auth_id, {
      password: kataLaluan,
    })
    if (pwdError) throw new Error(`Failed to update password: ${pwdError.message}`)
  }

  // 2. Sync auth email if changed (external)
  if (emel !== target.emel) {
    const { error: emailError } = await adminClient.auth.admin.updateUserById(target.auth_id, {
      email: emel,
      email_confirm: true,
    })
    if (emailError) throw new Error(`Failed to update email: ${emailError.message}`)
    emelDiubah = true
  }

  // 3. Atomic: users row + audit
  const { error } = await supabase.rpc('traceo_kemaskini_pengguna', {
    p_id: userId,
    p_nama: nama.trim(),
    p_emel: emel.trim(),
    p_peranan: peranan,
  })

  if (error) {
    // Compensate external side-effect: revert auth email
    if (emelDiubah) {
      await adminClient.auth.admin.updateUserById(target.auth_id, { email: target.emel })
    }
    throw new Error(`Failed to update user: ${error.message}`)
  }

  revalidatePath('/dashboard/users')
}

// ─── Toggle Status User ───────────────────────────────────────────────────────

export async function toggleUserStatus(userId: string, statusSemasa: string) {
  const { supabase, userProfile } = await getCurrentUser()
  if (!hasPermission(userProfile.peranan, 'urus_pengguna')) throw new Error('Access denied')

  const rl = await rateLimitAction('users_status', 30, 60, userProfile.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
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
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
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
