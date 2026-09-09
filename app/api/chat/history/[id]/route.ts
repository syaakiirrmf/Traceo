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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const profile = await getAuthedProfile(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimitFailOpen(`chat_history_id:${profile.id}`, 60, 60, 'chat_history_id')
  if (!rl.ok) {
    Sentry.captureMessage('chat_history_id_429', { level: 'warning', extra: { userId: profile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sesi')
    .select('id, tajuk, user_id')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
  }

  if (session.user_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages, error } = await supabase
    .from('chat_mesej')
    .select('id, peranan, kandungan, dicipta_pada')
    .eq('sesi_id', id)
    .order('dicipta_pada', { ascending: true })

  if (error) {
    console.error('[Chat History GET /id]', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }

  return NextResponse.json({
    session: { id: session.id, tajuk: session.tajuk },
    messages: messages ?? [],
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const profile = await getAuthedProfile(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sesi')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
  }

  if (session.user_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('chat_sesi').delete().eq('id', id)

  if (error) {
    console.error('[Chat History DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}