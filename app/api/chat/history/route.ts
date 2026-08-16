import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 401 })
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

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 401 })
  }

  let body: { tajuk?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const tajuk = (body.tajuk ?? 'Perbualan baharu').slice(0, 120)

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