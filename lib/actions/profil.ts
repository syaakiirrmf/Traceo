'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function kemaskiniProfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

  const nama = formData.get('nama') as string
  if (!nama?.trim()) throw new Error('Name is required')

  const { error } = await supabase
    .from('users')
    .update({ nama: nama.trim() })
    .eq('auth_id', authUser.id)

  if (error) throw new Error(`Failed to update profile: ${error.message}`)

  revalidatePath('/dashboard/profil')
  redirect('/dashboard/profil?success=profil')
}

export async function tukarKataLaluan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new Error('Not logged in')

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
