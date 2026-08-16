import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  const supabase = createAdminClient()

  let db = 'ok'
  try {
    const { error } = await supabase.from('fasiliti').select('id', { count: 'exact', head: true })
    if (error) db = 'degraded'
  } catch {
    db = 'down'
  }

  const status = db === 'ok' ? 200 : 503
  return NextResponse.json(
    {
      status: status === 200 ? 'ok' : 'degraded',
      db,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}
