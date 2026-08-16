import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('chat_sesi')
    .select('id, tajuk')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
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

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.from('chat_sesi').delete().eq('id', id)

  if (error) {
    console.error('[Chat History DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}