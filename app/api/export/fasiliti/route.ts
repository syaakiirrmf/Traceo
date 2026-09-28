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
  // Exact-match drill-down dari Top Financiers dashboard (sama seperti page Facilities)
  const financier = (url?.searchParams.get('financier') ?? '').trim().slice(0, 200)

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
        'kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, tarikh_mula, tarikh_tamat, ringkasan_cagaran, catatan_am, cara_selesai'
      )
      .order('dicipta_pada', { ascending: false })
      .limit(EXPORT_LIMIT)

    if (status && ['aktif', 'tertunggak', 'tindakan_guaman', 'selesai'].includes(status)) {
      query = query.eq('status_fasiliti', status)
    }
    if (financier) {
      query = query.eq('pembiaya_modal', financier)
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

    // ─── Tanah Lot (helaian kedua) ───────────────────────────────────────────
    // Kongsi filter q/kategori dengan senarai unified Facilities. Status tidak
    // terpakai (lot tiada status). Hanya untuk peranan dengan lihat_tanah_jv.
    const showFasilitiSheet =
      !kategori || ['jv_syarikat', 'jv_tanah', 'pinjaman_individu'].includes(kategori)
    // Lot tanah tiada status — jangan campur ke dalam eksport yang ditapis ikut status.
    const showTanahSheet =
      !financier &&
      !status &&
      (!kategori || kategori === 'tanah_lot') &&
      ['superadmin', 'admin', 'pengurus'].includes(userProfile.peranan)
    let tanahRows: Record<string, unknown>[] = []
    if (showTanahSheet) {
      try {
        let tanahQuery = supabase
          .from('tanah_jv')
          .select(
            'no_lot, tempat, bandar_mukim, daerah, negeri, no_hak_milik, luas_meter_persegi, anggaran_nilaian, tarikh_daftar, catatan'
          )
          .order('dicipta_pada', { ascending: false })
          .limit(EXPORT_LIMIT)
        if (q) {
          const like = `%${q.replace(/[%_,]/g, '')}%`
          tanahQuery = tanahQuery.or(
            `no_lot.ilike.${like},tempat.ilike.${like},bandar_mukim.ilike.${like},daerah.ilike.${like},negeri.ilike.${like},no_hak_milik.ilike.${like}`
          )
        }
        const { data: tanah } = await tanahQuery
        tanahRows = (tanah ?? []).map((t) => ({
          'No. Lot': t.no_lot,
          Location: t.tempat,
          'Town / Mukim': t.bandar_mukim,
          District: t.daerah,
          State: t.negeri,
          'Title No.': t.no_hak_milik,
          'Area (m²)': t.luas_meter_persegi ?? 0,
          'Value (RM)': t.anggaran_nilaian ?? 0,
          'Registered Date': t.tarikh_daftar,
          Notes: t.catatan,
        }))
      } catch (tanahError) {
        Sentry.captureException(tanahError)
        console.error('[Export Tanah Excel Error]', tanahError)
      }
    }

    if ((!fasiliti || fasiliti.length === 0) && tanahRows.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    const workbook = XLSX.utils.book_new()

    if (showFasilitiSheet) {
      const rows = (fasiliti ?? []).map((f) => ({
        'Reference Code': f.kod_rujukan,
        Category: KATEGORI_LABELS[f.kategori] ?? f.kategori,
        'Borrower / Contractor': f.nama_peminjam,
        Financier: f.pembiaya_modal,
        'Financing (RM)': f.jumlah_pembiayaan ?? 0,
        'Arrears (RM)': f.jumlah_tunggakan_semasa ?? 0,
      Status: STATUS_LABELS[f.status_fasiliti] ?? f.status_fasiliti,
      'Settled How':
        f.cara_selesai === 'melalui_aset'
          ? 'Settled via asset'
          : f.cara_selesai === 'bayaran_penuh'
            ? 'Paid in full'
            : '',
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
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 40 },
        { wch: 40 },
      ]
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Facility')
    }

    if (showTanahSheet && tanahRows.length > 0) {
      const tanahSheet = XLSX.utils.json_to_sheet(tanahRows)
      tanahSheet['!cols'] = [
        { wch: 14 },
        { wch: 30 },
        { wch: 24 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 40 },
      ]
      XLSX.utils.book_append_sheet(workbook, tanahSheet, 'Tanah')
    }

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
