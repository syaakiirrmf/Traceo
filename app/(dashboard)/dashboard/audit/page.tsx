import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { AuditTable } from './AuditTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log System' }

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || !hasPermission(userProfile.peranan, 'lihat_audit_log')) redirect('/dashboard')

  const { data: logs } = await supabase
    .from('log_audit')
    .select('*, user:users(nama, emel)')
    .order('tarikh', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
Security &amp; Activity Trail
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">• {logs?.length ?? 0} Recent Logs</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            System Audit Log
          </h1>
        </div>
      </div>

      {/* Interactive Audit Client Table */}
      <AuditTable logs={logs ?? []} />
    </div>
  )
}
