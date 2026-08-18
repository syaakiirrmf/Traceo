import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperadminPanel } from './SuperadminPanel'
import type { User, FeatureAccess, PageAccess } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Superadmin Command Center — Traceo',
  description: 'Comprehensive control of module, page and system feature access rights for every user.',
}

export default async function SuperadminPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, nama, emel, peranan')
    .eq('auth_id', authUser.id)
    .single()

  // STRICT CHECK: ONLY SUPERADMIN IS ALLOWED HERE
  if (!userProfile || userProfile.peranan !== 'superadmin') {
    redirect('/dashboard')
  }

  // Fetch all users and existing overrides in parallel
  const [{ data: usersData }, { data: featureAccessData }, { data: pageAccessData }] =
    await Promise.all([
      supabase.from('users').select('*').order('dicipta_pada', { ascending: true }),
      supabase.from('feature_access').select('*'),
      supabase.from('page_access').select('*'),
    ])

  const users = (usersData ?? []) as User[]
  const featureOverrides = (featureAccessData ?? []) as FeatureAccess[]
  const pageOverrides = (pageAccessData ?? []) as PageAccess[]

  return (
    <div className="space-y-6 max-w-[1600px] font-dm">
      <SuperadminPanel
        currentUser={userProfile as User}
        initialUsers={users}
        initialFeatureOverrides={featureOverrides}
        initialPageOverrides={pageOverrides}
      />
    </div>
  )
}
