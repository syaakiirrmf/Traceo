import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { generateRingkasanPdf, type RingkasanData } from '@/lib/pdf/ringkasanPdfme'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

  try {
    let query = supabase
      .from('fasiliti')
      .select(
        'kod_rujukan, kategori, nama_peminjam, status_fasiliti, jumlah_pembiayaan, jumlah_tunggakan_semasa'
      )
      .order('dicipta_pada', { ascending: false })

    if (userProfile.peranan === 'pegawai_susulan') {
      const { data: assigned } = await supabase
        .from('fasiliti_pegawai')
        .select('fasiliti_id')
        .eq('user_id', userProfile.id)
      const assignedIds = (assigned ?? []).map((r) => r.fasiliti_id as string)
      if (assignedIds.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      query = query.in('id', assignedIds)
    }

    const { data: fasiliti } = await query
    if (!fasiliti) {
      return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    const kategori: Record<string, number> = {}
    const status: Record<string, number> = {}
    let jumlah_pembiayaan = 0
    let jumlah_tunggakan = 0

    for (const f of fasiliti) {
      kategori[f.kategori] = (kategori[f.kategori] ?? 0) + 1
      status[f.status_fasiliti] = (status[f.status_fasiliti] ?? 0) + 1
      jumlah_pembiayaan += Number(f.jumlah_pembiayaan) || 0
      jumlah_tunggakan += Number(f.jumlah_tunggakan_semasa) || 0
    }

    const data: RingkasanData = {
      jumlah: fasiliti.length,
      jumlah_pembiayaan,
      jumlah_tunggakan,
      kategori,
      status,
      senarai: fasiliti.map((f) => ({
        kod_rujukan: f.kod_rujukan,
        nama_peminjam: f.nama_peminjam,
        kategori: f.kategori,
        status_fasiliti: f.status_fasiliti,
        jumlah_pembiayaan: Number(f.jumlah_pembiayaan) || 0,
        jumlah_tunggakan_semasa: Number(f.jumlah_tunggakan_semasa) || 0,
      })),
    }

    const buffer = await generateRingkasanPdf(data)

    const today = format(new Date(), 'ddMMyyyy')
    const filename = `RINGKASAN_PORTFOLIO_${today}.pdf`

    await supabase.from('log_audit').insert({
      user_id: userProfile.id,
      tindakan: 'eksport_ringkasan',
      entiti_jenis: 'fasiliti',
      butiran: { format: 'pdf', filename },
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Export Ringkasan Error]', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}