import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

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
        'kod_rujukan, kategori, nama_peminjam, pembiaya_modal, jumlah_pembiayaan, jumlah_tunggakan_semasa, status_fasiliti, tarikh_mula, tarikh_tamat, ringkasan_cagaran, catatan_am'
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fasiliti')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const today = format(new Date(), 'ddMMyyyy')
    const filename = `FASILITI_${today}.xlsx`

    await supabase.from('log_audit').insert({
      user_id: userProfile.id,
      tindakan: 'eksport_excel',
      entiti_jenis: 'fasiliti',
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
    console.error('[Export Fasiliti Excel Error]', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}