'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { rateLimitAction } from '@/lib/ratelimit'

export async function kemaskiniProfil(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const rl = await rateLimitAction('profil_kemaskini', 10, 60, authUser.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const nama = formData.get('nama') as string
  if (!nama?.trim()) throw new Error('Name is required')

  // Route through SECURITY DEFINER function scoped to auth.uid().
  // The plain users table only allows admin updates via RLS, so this
  // dedicated function lets a user update their own profile safely.
  const { error } = await supabase.rpc('traceo_kemaskini_profil', {
    p_nama: nama,
  })

  if (error) throw new Error(`Failed to update profile: ${error.message}`)

  revalidatePath('/dashboard/profil')
  redirect('/dashboard/profil?success=profil')
}

export async function tukarKataLaluan(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const rl = await rateLimitAction('profil_kata_laluan', 5, 60, authUser.id)
  if (!rl.ok) {
    throw new Error(
      `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`
    )
  }

  const kataLalauan = formData.get('kata_laluan') as string
  const sahkan = formData.get('sahkan_kata_laluan') as string

  if (!kataLalauan || kataLalauan.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (kataLalauan !== sahkan) {
    throw new Error('Passwords do not match')
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(authUser.id, {
    password: kataLalauan,
  })

  if (error) throw new Error(`Failed to change password: ${error.message}`)

  redirect('/dashboard/profil?success=kata_laluan')
}
