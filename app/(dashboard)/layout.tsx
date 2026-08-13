import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from '@/components/ui/toast'
import type { User } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, nama, emel, peranan, status')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || userProfile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    redirect('/login')
  }

  const currentUser = userProfile as User

  return (
    <>
      <DashboardShell user={currentUser}>{children}</DashboardShell>
      <Toaster />
    </>
  )
}
