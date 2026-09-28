import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from '@/components/ui/toast'
import { getSusulanNotifications } from '@/lib/notifications'
import { getSessionUser } from '@/lib/auth/get-user'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Q2: sesi dikongsi cache dengan page + metadata — 1x set query per request.
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const currentUser = session.userProfile
  if (currentUser.status === 'tidak_aktif') {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Q3: mula fetch notifikasi TANPA await — shell (sidebar/topbar/kandungan)
  // stream serta-merta; loceng menyusul melalui Suspense di TopBar.
  // Sebelum ini satu roundtrip penuh blok keseluruhan shell.
  const notificationsPromise = getSusulanNotifications(await createClient(), {
    id: currentUser.id,
    peranan: currentUser.peranan,
  })

  return (
    <>
      <DashboardShell user={currentUser} notificationsPromise={notificationsPromise}>
        {children}
      </DashboardShell>
      <Toaster />
    </>
  )
}
