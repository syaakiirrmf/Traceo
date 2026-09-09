import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Sesi aktif untuk Server Actions: auth + profil + block tidak_aktif.
 * Menutup lubang "layout-only check" — semua action mesti guna ini.
 */
export async function requireActiveUser() {
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
  return { supabase, userProfile, authUser }
}
