import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/permissions'
import { rateLimitFailOpen } from '@/lib/ratelimit'

export const runtime = 'nodejs'

async function getAuthedProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) return null
  if (profile.status === 'tidak_aktif') return null
  if (!hasPermission(profile.peranan, 'lihat_assistant')) return null
  return profile
}

export async function GET() {
  const supabase = await createClient()

  const profile = await getAuthedProfile(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimitFailOpen(`chat_history:${profile.id}`, 60, 60, 'chat_history')
  if (!rl.ok) {
    Sentry.captureMessage('chat_history_429', { level: 'warning', extra: { userId: profile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  const { data: sessions, error } = await supabase
    .from('chat_sesi')
    .select('id, tajuk, dikemaskini_pada')
    .eq('user_id', profile.id)
    .order('dikemaskini_pada', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Chat History GET]', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }

  return NextResponse.json({ sessions: sessions ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const profile = await getAuthedProfile(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { tajuk?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const tajuk = (body.tajuk ?? 'New conversation').slice(0, 120)

  const { data: session, error } = await supabase
    .from('chat_sesi')
    .insert({ user_id: profile.id, tajuk })
    .select('id, tajuk, dikemaskini_pada')
    .single()

  if (error) {
    console.error('[Chat History POST]', error)
    return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
  }

  return NextResponse.json({ session }, { status: 201 })
}