import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

export interface SessionUser {
  authUserId: string
  userProfile: User
}

/**
 * Sesi request-semasa: auth.getUser() + profil users, di-cache dengan React
 * cache() supaya layout + page + generateMetadata yang berkongsi satu request
 * hanya mencetus 1x set query (sebelum ini setiap satunya query sendiri).
 *
 * Pulangkan null bila tiada sesi/profil — caller yang putuskan redirect
 * (jangan redirect di sini: cache() akan cache lentingan redirect).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, nama, emel, peranan, status')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) return null

  return { authUserId: authUser.id, userProfile: userProfile as User }
})
