import { generate } from '@pdfme/generator'
import { text, table } from '@pdfme/schemas'
import type { Schema } from '@pdfme/common'
import { format, parseISO } from 'date-fns'

function fmtDate(d: string, fmt = 'dd MMMM yyyy') {
  try {
    return format(parseISO(d), fmt)
  } catch {
    return d
  }
}

function fmtCurrency(n: number | null | undefined) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

function fmtArea(n: number | null | undefined) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(n) + ' m²'
}

interface SusulanItem {
  tarikh_susulan: string
  catatan: string
  dicatat_oleh_user?: { nama: string } | null
  lampiran?: Array<{ id: string; url_fail: string; jenis_fail: string; nama_asal: string }> | null
}

interface TanahData {
  negeri: string
  daerah: string
  bandar_mukim: string
  tempat: string
  no_lot: string
  tarikh_daftar?: string | null
  no_hak_milik?: string | null
  luas_meter_persegi?: number | null
  anggaran_nilaian?: number | null
  catatan?: string | null
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

export async function generateTanahKronologiPdf(tanah: TanahData, susulan: SusulanItem[]) {
  const today = format(new Date(), 'dd/MM/yyyy')

  const infoRows: Array<[string, string]> = [
    ['Negeri', tanah.negeri],
    ['Daerah', tanah.daerah],
    ['Bandar / Pekan / Mukim', tanah.bandar_mukim],
    ['Tempat', tanah.tempat],
    ['No. Lot', tanah.no_lot],
  ]
  if (tanah.no_hak_milik) infoRows.push(['No. Hak Milik', tanah.no_hak_milik])
  if (tanah.tarikh_daftar) infoRows.push(['Daftar Pada', fmtDate(tanah.tarikh_daftar)])
  infoRows.push(['Luas (m²)', fmtArea(tanah.luas_meter_persegi)])
  infoRows.push(['Anggaran Nilaian (RM)', fmtCurrency(tanah.anggaran_nilaian)])

  const susulanRows = susulan.map((s, i) => [
    `${i + 1}. ${fmtDate(s.tarikh_susulan)}`,
    s.catatan,
    s.dicatat_oleh_user?.nama ?? '—',
  ])

  const subtitle = `No. Lot ${tanah.no_lot} — ${[tanah.bandar_mukim, tanah.daerah, tanah.negeri]
    .filter(Boolean)
    .join(', ')}`

  const schemas: Schema[] = [
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
      content: subtitle,
      fontSize: 10,
      fontColor: '#5a6080',
    },
    {
      type: 'table',
      name: 'info',
      position: { x: 12, y: 37 },
      width: 186,
      height: 80,
      content: '',
      showHead: false,
      head: ['', ''],
      headWidthPercentages: [35, 65],
      tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
      headStyles: { ...BASE_STYLES, backgroundColor: '#f5f7fc' },
      bodyStyles: { ...BASE_STYLES, alternateBackgroundColor: '#ffffff' },
      columnStyles: { 0: { alignment: 'left' }, 1: { alignment: 'left' } },
    },
  ]

  let yCursor = 37 + infoRows.length * 6 + 4
  if (tanah.catatan) {
    schemas.push({
      type: 'text',
      name: 'catatanTitle',
      position: { x: 12, y: yCursor },
      width: 186,
      height: 7,
      content: 'CATATAN',
      fontSize: 8,
      fontColor: '#5a6080',
    })
    yCursor += 8
    schemas.push({
      type: 'text',
      name: 'catatan',
      position: { x: 12, y: yCursor },
      width: 186,
      height: 12,
      content: tanah.catatan,
      fontSize: 8.5,
      fontColor: '#1a1a2e',
    })
    yCursor += 16
  }

  schemas.push({
    type: 'text',
    name: 'section',
    position: { x: 12, y: yCursor },
    width: 186,
    height: 7,
    content: `FOLLOW-UP CHRONOLOGY (${susulan.length} RECORDS)`,
    fontSize: 8,
    fontColor: '#5a6080',
  })

  schemas.push({
    type: 'table',
    name: 'susulan',
    position: { x: 12, y: yCursor + 9 },
    width: 186,
    height: 90,
    content: '',
    showHead: true,
    head: ['Date', 'Notes', 'Recorded by'],
    headWidthPercentages: [28, 56, 16],
    tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
    headStyles: { ...BASE_STYLES, backgroundColor: '#f5f7fc', fontColor: '#5a6080' },
    bodyStyles: { ...BASE_STYLES, alternateBackgroundColor: '#fafafa' },
    columnStyles: {
      0: { alignment: 'left' },
      1: { alignment: 'left' },
      2: { alignment: 'left' },
    },
  })

  schemas.push({
    type: 'text',
    name: 'footer',
    position: { x: 12, y: 285 },
    width: 186,
    height: 6,
    content: `STRICTLY CONFIDENTIAL — Traceo    |    Generated on: ${today}`,
    fontSize: 7,
    fontColor: '#aaaaaa',
  })

  return generate({
    template: {
      basePdf: {
        width: 210,
        height: 297,
        padding: [12, 12, 12, 12] as [number, number, number, number],
      },
      schemas: [schemas],
    },
    inputs: [{ info: infoRows, susulan: susulanRows }],
    plugins: { text, table },
  })
}
