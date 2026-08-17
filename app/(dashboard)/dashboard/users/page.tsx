import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageAccessGuard } from '@/components/ui/PageAccessGuard'
import { TambahUserModal } from './TambahUserModal'
import { UsersTable } from './UsersTable'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile) redirect('/login')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('dicipta_pada', { ascending: false })

  return (
    <PageAccessGuard
      userId={userProfile.id}
      role={userProfile.peranan as UserRole}
      pagePath="/dashboard/users"
      featureName="Pengurusan Pengguna"
    >
      <div className="space-y-5 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Administrative Control
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                • {users?.length ?? 0} Accounts
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
              User Management
            </h1>
          </div>
          <TambahUserModal />
        </div>

        {/* Interactive Users Client Table */}
        <UsersTable users={users ?? []} />
      </div>
    </PageAccessGuard>
  )
}
