import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import { generateTanahKronologiPdf } from '@/lib/pdf/tanahKronologiPdfme'
import { format } from 'date-fns'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authed = await requireApiUser('lihat_tanah_jv')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  const rl = await rateLimitFailOpen(`tanah_kronologi_pdf:${userProfile.id}`, 20, 60, 'tanah_kronologi_pdf')
  if (!rl.ok) {
    Sentry.captureMessage('tanah_kronologi_pdf_429', { level: 'warning', extra: { userId: userProfile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }
  if (userProfile.peranan === 'pegawai_susulan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {

    const [{ data: tanah }, { data: susulan }] = await Promise.all([
      supabase.from('tanah_jv').select('*').eq('id', id).single(),
      supabase
        .from('susulan')
        .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
        .eq('tanah_id', id)
        .order('tarikh_susulan', { ascending: true }),
    ])

    if (!tanah) return NextResponse.json({ error: 'Land not found' }, { status: 404 })

    const buffer = await generateTanahKronologiPdf(tanah, susulan ?? [])

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (tanah.no_lot ?? 'TANAH').replace(/[^a-zA-Z0-9]/g, '')
    const filename = `KRONOLOGI_${kod}_${today}.pdf`

    // Audit log (best-effort via RPC)
    await tulisAudit(supabase, 'jana_kronologi', 'tanah_jv', id, { format: 'pdf', filename })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Tanah PDF Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
