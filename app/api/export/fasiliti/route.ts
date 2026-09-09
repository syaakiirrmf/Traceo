import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireApiUser } from '@/lib/auth/api'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import { tulisAudit } from '@/lib/audit'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { NextRequest } from 'next/server'

const STATUS_LABELS: Record<string, string> = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
}

const KATEGORI_LABELS: Record<string, string> = {
  jv_syarikat: 'Company JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
}

const EXPORT_LIMIT = 2000 // cap eksport — elak OOM bila dataset besar

export async function GET(request?: NextRequest) {
  const authed = await requireApiUser('eksport_excel')
  if (authed.error) return authed.error
  const { supabase, profile: userProfile } = authed

  // Hormati filter UI (q/status/kategori) — sebelum ini eksport abaikan filter.
  const url = request ? new URL(request.url) : null
  const q = (url?.searchParams.get('q') ?? '').trim().slice(0, 100)
  const status = (url?.searchParams.get('status') ?? '').trim()
  const kategori = (url?.searchParams.get('kategori') ?? '').trim()

  const rl = await rateLimitFailOpen(`export_fasiliti:${userProfile.id}`, 10, 60, 'export_fasiliti')
  if (!rl.ok) {
    Sentry.captureMessage('export_fasiliti_429', { level: 'warning', extra: { userId: userProfile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  try {
    let query = supabase
      .from('fasiliti')
      .select(
        'kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, tarikh_mula, tarikh_tamat, ringkasan_cagaran, catatan_am'
      )
      .order('dicipta_pada', { ascending: false })
      .limit(EXPORT_LIMIT)

    if (status && ['aktif', 'tertunggak', 'tindakan_guaman', 'selesai'].includes(status)) {
      query = query.eq('status_fasiliti', status)
    }
    if (kategori && ['jv_syarikat', 'jv_tanah', 'pinjaman_individu'].includes(kategori)) {
      query = query.eq('kategori', kategori)
    }
    if (q) {
      const like = `%${q.replace(/[%_,]/g, '')}%`
      query = query.or(`nama_peminjam.ilike.${like},pembiaya_modal.ilike.${like},kod_rujukan.ilike.${like}`)
    }

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

    const rows = fasiliti.map((f) => ({
      'Reference Code': f.kod_rujukan,
      Category: KATEGORI_LABELS[f.kategori] ?? f.kategori,
      'Borrower / Contractor': f.nama_peminjam,
      Financier: f.pembiaya_modal,
      'Financing (RM)': f.jumlah_pembiayaan ?? 0,
      'Arrears (RM)': f.jumlah_tunggakan_semasa ?? 0,
      Status: STATUS_LABELS[f.status_fasiliti] ?? f.status_fasiliti,
      'Start Date': f.tarikh_mula,
      'End Date': f.tarikh_tamat,
      'Collateral Summary': f.ringkasan_cagaran,
      Notes: f.catatan_am,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 36 },
      { wch: 36 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 40 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facility')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const today = format(new Date(), 'ddMMyyyy')
    const filename = `FASILITI_${today}.xlsx`

    await tulisAudit(supabase, 'eksport_excel', 'fasiliti', null, { format: 'xlsx', filename })

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
    console.error('[Export Fasiliti Excel Error]', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}
