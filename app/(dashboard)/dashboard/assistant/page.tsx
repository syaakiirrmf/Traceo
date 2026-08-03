import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatBox } from '@/components/ChatBox'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '@syaakiirr' }

export default async function AssistantPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nama')
    .eq('auth_id', authUser.id)
    .single()

  return (
    <div className="space-y-5 h-full">
      <div className="border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Setiausaha Pintar
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
          @syaakiirr
        </h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Tanya soalan tentang fasiliti, tunggakan dan aktiviti susulan, jawapan dijana dari data
          sebenar.
        </p>
      </div>

      <div className="h-[calc(100dvh-220px)] min-h-[400px]">
        <ChatBox userName={profile?.nama} />
      </div>
    </div>
  )
}
