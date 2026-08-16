import { generate } from '@pdfme/generator'
import { text, table } from '@pdfme/schemas'
import { format, parseISO } from 'date-fns'

function fmtDate(d: string, fmt = 'dd MMMM yyyy') {
  try {
    return format(parseISO(d), fmt)
  } catch {
    return d
  }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

const KATEGORI: Record<string, string> = {
  jv_syarikat: 'Corporate JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
}
const STATUS: Record<string, string> = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
}

interface SusulanItem {
  tarikh_susulan: string
  catatan: string
  dicatat_oleh_user?: { nama: string } | null
  lampiran?: Array<{ id: string; url_fail: string; jenis_fail: string; nama_asal: string }> | null
}

interface FasilitiData {
  kod_rujukan: string
  nama_peminjam: string
  pembiaya_modal: string
  kategori: string
  status_fasiliti: string
  jumlah_pembiayaan: number
  jumlah_tunggakan_semasa: number
  tarikh_mula: string
  tarikh_tamat?: string | null
  ringkasan_cagaran?: string
  nilai_cagaran?: number | null
  kadar_dividen?: string | null
  perkongsian_keuntungan?: number
  tunggakan_dividen?: number
  caj_lewat?: number
  bayaran_tambahan?: number
  penama_aset?: string | null
  status_pindahmilik?: string | null
  nama_kontraktor?: string | null
  harga_jualan?: string | null
  tahun_projek?: number | null
}

function buildInfoRows(f: FasilitiData): Array<[string, string]> {
  const isJV1 = f.kategori === 'jv_syarikat'
  const isJV2 = f.kategori === 'jv_tanah'
  const isJV3 = f.kategori === 'pinjaman_individu'
  const rows: Array<[string, string]> = [
    ['Reference Code', f.kod_rujukan],
    ['Capital Funder', f.pembiaya_modal],
    [isJV2 ? 'Contractor Name' : 'Borrower Name', f.nama_peminjam],
    ['Category', KATEGORI[f.kategori] ?? f.kategori],
    ['Status', STATUS[f.status_fasiliti] ?? f.status_fasiliti],
    ['Start Date', fmtDate(f.tarikh_mula)],
  ]
  if (f.tarikh_tamat) rows.push(['End Date', fmtDate(f.tarikh_tamat)])
  rows.push(['Total Capital Financing (RM) — A', fmtCurrency(f.jumlah_pembiayaan)])
  if ((isJV1 || isJV3) && f.kadar_dividen)
    rows.push([isJV1 ? 'Profit Share Dividends' : 'Profit Sharing', f.kadar_dividen])
  if (isJV2 && (f.perkongsian_keuntungan ?? 0) > 0)
    rows.push(['Profit Sharing (RM) — B', fmtCurrency(f.perkongsian_keuntungan!)])
  if (isJV3 && (f.bayaran_tambahan ?? 0) > 0)
    rows.push(['Additional Payment (RM) — B', fmtCurrency(f.bayaran_tambahan!)])
  if (isJV1 && (f.tunggakan_dividen ?? 0) > 0)
    rows.push(['Dividend Arrears (RM) — B', fmtCurrency(f.tunggakan_dividen!)])
  if (isJV1 && (f.caj_lewat ?? 0) > 0) rows.push(['Late Charge (RM) — C', fmtCurrency(f.caj_lewat!)])
  if (isJV1 && (f.bayaran_tambahan ?? 0) > 0)
    rows.push(['Additional Payment (RM) — D', fmtCurrency(f.bayaran_tambahan!)])
  if (isJV2 && (f.tunggakan_dividen ?? 0) > 0)
    rows.push(['Profit Sharing Arrears (RM) — C', fmtCurrency(f.tunggakan_dividen!)])
  if (isJV2 && (f.bayaran_tambahan ?? 0) > 0)
    rows.push(['Additional Payment (RM) — D', fmtCurrency(f.bayaran_tambahan!)])
  if (isJV2 && f.tahun_projek) rows.push(['Project Year', String(f.tahun_projek)])
  rows.push([
    isJV3 ? 'Total Arrears (RM) — C (A + B)' : 'Total Arrears (RM) — E',
    fmtCurrency(f.jumlah_tunggakan_semasa),
  ])
  if (f.ringkasan_cagaran)
    rows.push([
      isJV2 ? 'Type / Location (Property)' : 'Type / Location / Collateral Asset Value',
      f.ringkasan_cagaran,
    ])
  if (f.nilai_cagaran) rows.push(['Estimated Value (RM)', fmtCurrency(f.nilai_cagaran)])
  if (f.penama_aset) rows.push(['Asset Nominee', f.penama_aset])
  if (f.status_pindahmilik) rows.push(['Transfer / Asset Sale Status', f.status_pindahmilik])
  if (isJV2 && f.harga_jualan) rows.push(['Sale Price / Type', f.harga_jualan])
  return rows
}

const BASE_STYLES = {
  fontName: 'Roboto',
  alignment: 'left',
  verticalAlignment: 'middle',
  fontSize: 8,
  lineHeight: 1.2,
  characterSpacing: 0,
  fontColor: '#1a1a2e',
  backgroundColor: '#ffffff',
  borderColor: '#e0e4ef',
  borderWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
  padding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
} as const

export async function generateKronologiPdf(fasiliti: FasilitiData, susulan: SusulanItem[]) {
  const infoRows = buildInfoRows(fasiliti)
  const today = format(new Date(), 'dd/MM/yyyy')

  const infoTableRows = infoRows.map(([label, value]) => [label, value])
  const susulanRows = susulan.map((s, i) => [
    `${i + 1}. ${fmtDate(s.tarikh_susulan)}`,
    s.catatan,
    s.dicatat_oleh_user?.nama ?? '—',
  ])

  const template = {
    basePdf: { width: 210, height: 297, padding: [12, 12, 12, 12] as [number, number, number, number] },
    schemas: [
      [
        {
          type: 'text',
          name: 'conf',
          position: { x: 12, y: 12 },
          width: 186,
          height: 5,
          content: 'STRICTLY CONFIDENTIAL',
          fontSize: 7,
          fontColor: '#999999',
        },
        {
          type: 'text',
          name: 'title',
          position: { x: 12, y: 18 },
          width: 186,
          height: 10,
          content: 'FOLLOW-UP CHRONOLOGY',
          fontSize: 17,
          fontColor: '#1a1a2e',
        },
        {
          type: 'text',
          name: 'subtitle',
          position: { x: 12, y: 28 },
          width: 186,
          height: 6,
          content: `${fasiliti.kod_rujukan} — ${fasiliti.nama_peminjam}`,
          fontSize: 10,
          fontColor: '#5a6080',
        },
        {
          type: 'table',
          name: 'info',
          position: { x: 12, y: 37 },
          width: 186,
          height: 130,
          content: '',
          showHead: false,
          head: ['', ''],
          headWidthPercentages: [35, 65],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { ...BASE_STYLES, backgroundColor: '#f5f7fc' },
          bodyStyles: {
            ...BASE_STYLES,
            alternateBackgroundColor: '#ffffff',
          },
          columnStyles: { 0: { alignment: 'left' }, 1: { alignment: 'left' } },
        },
        {
          type: 'text',
          name: 'section',
          position: { x: 12, y: 172 },
          width: 186,
          height: 7,
          content: `FOLLOW-UP CHRONOLOGY (${susulan.length} RECORDS)`,
          fontSize: 8,
          fontColor: '#5a6080',
        },
        {
          type: 'table',
          name: 'susulan',
          position: { x: 12, y: 181 },
          width: 186,
          height: 100,
          content: '',
          showHead: true,
          head: ['Date', 'Notes', 'Recorded by'],
          headWidthPercentages: [28, 56, 16],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { ...BASE_STYLES, backgroundColor: '#f5f7fc', fontColor: '#5a6080' },
          bodyStyles: {
            ...BASE_STYLES,
            alternateBackgroundColor: '#fafafa',
          },
          columnStyles: {
            0: { alignment: 'left' },
            1: { alignment: 'left' },
            2: { alignment: 'left' },
          },
        },
        {
          type: 'text',
          name: 'footer',
          position: { x: 12, y: 285 },
          width: 186,
          height: 6,
          content: `STRICTLY CONFIDENTIAL — Traceo    |    Generated on: ${today}`,
          fontSize: 7,
          fontColor: '#aaaaaa',
        },
      ],
    ],
  }

  return generate({
    template,
    inputs: [{ info: infoTableRows, susulan: susulanRows }],
    plugins: { text, table },
  })
}
