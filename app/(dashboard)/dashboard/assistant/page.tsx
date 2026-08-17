import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageAccessGuard } from '@/components/ui/PageAccessGuard'
import { ChatBox } from '@/components/ChatBox'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: '@syaakiirr' }

export default async function AssistantPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, nama, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <PageAccessGuard
      userId={profile.id}
      role={profile.peranan as UserRole}
      pagePath="/dashboard/assistant"
      featureName="Pembantu Pintar AI (@syaakiirr)"
    >
      <div className="space-y-5 h-full">
        <div className="border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Smart Assistant
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            @syaakiirr
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Ask about facilities, arrears and follow-up activity, answers are generated from real
            data.
          </p>
        </div>

        <div className="h-[calc(100dvh-220px)] min-h-[400px]">
          <ChatBox userName={profile?.nama} />
        </div>
      </div>
    </PageAccessGuard>
  )
}
