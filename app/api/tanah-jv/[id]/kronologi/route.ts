import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import { generateTanahKronologiDocx } from '@/lib/actions/tanah_kronologi'
import { format } from 'date-fns'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authed = await requireApiUser('lihat_tanah_jv')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  const rl = await rateLimitFailOpen(`tanah_kronologi:${userProfile.id}`, 20, 60, 'tanah_kronologi')
  if (!rl.ok) {
    Sentry.captureMessage('tanah_kronologi_429', { level: 'warning', extra: { userId: userProfile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }
  if (userProfile.peranan === 'pegawai_susulan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {

    const buffer = await generateTanahKronologiDocx(id)

    // Get tanah no_lot for filename
    const { data: tanah } = await supabase.from('tanah_jv').select('no_lot').eq('id', id).single()

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (tanah?.no_lot ?? 'TANAH').replace(/[^a-zA-Z0-9]/g, '')
    const filename = `KRONOLOGI_${kod}_${today}.docx`

    // Audit log (best-effort via RPC)
    await tulisAudit(supabase, 'jana_kronologi', 'tanah_jv', id, { format: 'docx', filename })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Tanah Kronologi Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}
