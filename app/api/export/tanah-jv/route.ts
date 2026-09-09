import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export async function GET() {
  const authed = await requireApiUser('eksport_excel')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  const rl = await rateLimitFailOpen(`export_tanah:${userProfile.id}`, 10, 60, 'export_tanah')
  if (!rl.ok) {
    Sentry.captureMessage('export_tanah_429', { level: 'warning', extra: { userId: userProfile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  try {
    const { data: tanahList } = await supabase
      .from('tanah_jv')
      .select(
        'negeri, daerah, bandar_mukim, tempat, no_lot, tarikh_daftar, no_hak_milik, luas_meter_persegi, anggaran_nilaian, catatan'
      )
      .order('dicipta_pada', { ascending: true })
      .limit(2000)

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Land JV')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const today = format(new Date(), 'ddMMyyyy')
    const filename = `TANAH_JV_${today}.xlsx`

    await tulisAudit(supabase, 'eksport_excel', 'tanah_jv', null, { format: 'xlsx', filename })

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