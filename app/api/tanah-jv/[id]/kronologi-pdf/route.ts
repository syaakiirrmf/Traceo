import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { TanahKronologiPDF } from '@/lib/pdf/TanahKronologiPDF'
import { format } from 'date-fns'
import type { DocumentProps } from '@react-pdf/renderer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, peranan')
      .eq('auth_id', authUser.id)
      .single()

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    if (!['admin', 'pengurus'].includes(userProfile.peranan)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [{ data: tanah }, { data: susulan }] = await Promise.all([
      supabase.from('tanah_jv').select('*').eq('id', id).single(),
      supabase.from('susulan')
        .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
        .eq('tanah_id', id)
        .order('tarikh_susulan', { ascending: true }),
    ])

    if (!tanah) return NextResponse.json({ error: 'Land not found' }, { status: 404 })

    const buffer = await renderToBuffer(
      createElement(TanahKronologiPDF, { tanah, susulan: susulan ?? [] }) as ReactElement<DocumentProps>
    )

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (tanah.no_lot ?? 'TANAH').replace(/[^a-zA-Z0-9]/g, '')
    const filename = `KRONOLOGI_${kod}_${today}.pdf`

    // Audit log
    if (userProfile) {
      await supabase.from('log_audit').insert({
        user_id: userProfile.id,
        tindakan: 'jana_kronologi',
        entiti_jenis: 'tanah_jv',
        entiti_id: id,
        butiran: { format: 'pdf', filename },
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Tanah PDF Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}