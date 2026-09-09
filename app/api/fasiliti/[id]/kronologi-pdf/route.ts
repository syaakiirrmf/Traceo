import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import { generateKronologiPdf } from '@/lib/pdf/kronologiPdfme'
import { format } from 'date-fns'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authed = await requireApiUser('jana_kronologi')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  const rl = await rateLimitFailOpen(`kronologi_pdf:${userProfile.id}`, 20, 60, 'kronologi_pdf')
  if (!rl.ok) {
    Sentry.captureMessage('kronologi_pdf_429', { level: 'warning', extra: { userId: userProfile.id } })
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

    const [{ data: fasiliti }, { data: susulan }] = await Promise.all([
      supabase.from('fasiliti').select('*').eq('id', id).single(),
      supabase
        .from('susulan')
        .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
        .eq('fasiliti_id', id)
        .order('tarikh_susulan', { ascending: true }),
    ])

    if (!fasiliti) return NextResponse.json({ error: 'Facility not found' }, { status: 404 })

    const buffer = await generateKronologiPdf(fasiliti, susulan ?? [])

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (fasiliti.kod_rujukan ?? 'JV').replace('-', '')
    const filename = `KRONOLOGI_${kod}_${today}.pdf`

    // Audit log (best-effort via RPC)
    await tulisAudit(supabase, 'jana_kronologi', 'fasiliti', id, { format: 'pdf', filename })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[PDF Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
