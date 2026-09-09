import 'server-only'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, type Permission } from '@/lib/auth/permissions'

export interface ApiProfile {
  id: string
  peranan: string
  status: string
}

/**
 * Auth standard untuk API routes: 401 bila tiada sesi/profil,
 * 403 bila tidak_aktif atau tiada permission. Mengembalikan supabase client
 * yang sama supaya tiada double createClient.
 */
export async function requireApiUser(
  permission?: Permission
): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; profile: ApiProfile; error?: never }
  | { supabase?: never; profile?: never; error: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: profile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 401 }) }
  }
  if (profile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    return { error: NextResponse.json({ error: 'Account is disabled.' }, { status: 403 }) }
  }
  if (permission && !hasPermission(profile.peranan, permission)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { supabase, profile: profile as ApiProfile }
}
