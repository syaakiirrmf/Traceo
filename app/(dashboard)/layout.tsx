import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { Toaster } from '@/components/ui/toast'
import { PageTransitionShell } from '@/components/dashboard/PageTransitionShell'
import type { User } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
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
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* viewTransitionName anchors the sidebar so it never animates */}
      <div style={{ viewTransitionName: 'traceo-sidebar' }}>
        <Sidebar user={currentUser} />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6">
          <PageTransitionShell>
            {children}
          </PageTransitionShell>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
