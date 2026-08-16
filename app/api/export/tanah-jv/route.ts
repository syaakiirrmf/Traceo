import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export async function GET() {
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

  if (!['admin', 'pengurus'].includes(userProfile.peranan)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data: tanahList } = await supabase
      .from('tanah_jv')
      .select(
        'negeri, daerah, bandar_mukim, tempat, no_lot, tarikh_daftar, no_hak_milik, luas_meter_persegi, anggaran_nilaian, catatan'
      )
      .order('dicipta_pada', { ascending: true })

    if (!tanahList) {
      return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    const rows = tanahList.map((t) => ({
      State: t.negeri,
      District: t.daerah,
      'Town / Mukim': t.bandar_mukim,
      Place: t.tempat,
      'Lot No': t.no_lot,
      'Registered On': t.tarikh_daftar,
      'Title Number': t.no_hak_milik,
      'Area (m²)': t.luas_meter_persegi ?? 0,
      'Collateral Value (RM)': t.anggaran_nilaian ?? 0,
      Notes: t.catatan,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 40 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tanah JV')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const today = format(new Date(), 'ddMMyyyy')
    const filename = `TANAH_JV_${today}.xlsx`

    await supabase.from('log_audit').insert({
      user_id: userProfile.id,
      tindakan: 'eksport_excel',
      entiti_jenis: 'tanah_jv',
      butiran: { format: 'xlsx', filename },
    })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Export Tanah JV Excel Error]', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}