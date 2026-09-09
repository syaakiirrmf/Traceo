import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Health dalaman — memerlukan auth (proxy). Guna anon client (head+count)
// bukan service_role supaya tidak jadi oracle DB awam.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let db = 'ok'
  try {
    const { error } = await supabase.from('fasiliti').select('id', { count: 'exact', head: true })
    if (error) db = 'degraded'
  } catch {
    db = 'down'
  }

  const status = db === 'ok' ? 200 : 503
  return NextResponse.json({ status: status === 200 ? 'ok' : 'degraded', db }, { status })
}
