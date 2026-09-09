import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import { generateKronologiDocx } from '@/lib/actions/kronologi'
import { format } from 'date-fns'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authed = await requireApiUser('jana_kronologi')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  const rl = await rateLimitFailOpen(`kronologi:${userProfile.id}`, 20, 60, 'kronologi')
  if (!rl.ok) {
    Sentry.captureMessage('kronologi_429', { level: 'warning', extra: { userId: userProfile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  try {
    // Pegawai Susulan assignment check
    if (userProfile.peranan === 'pegawai_susulan') {
      const { data: assignment } = await supabase
        .from('fasiliti_pegawai')
        .select('fasiliti_id')
        .eq('fasiliti_id', id)
        .eq('user_id', userProfile.id)
        .maybeSingle()
      if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = await generateKronologiDocx(id)

    // Get fasiliti kod for filename
    const { data: fasiliti } = await supabase
      .from('fasiliti')
      .select('kod_rujukan')
      .eq('id', id)
      .single()

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (fasiliti?.kod_rujukan ?? 'JV').replace('-', '')
    const filename = `KRONOLOGI_${kod}_${today}.docx`

    // Audit log (best-effort via RPC; tidak gagaskan eksport)
    await tulisAudit(supabase, 'jana_kronologi', 'fasiliti', id, { format: 'docx', filename })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Kronologi Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}
