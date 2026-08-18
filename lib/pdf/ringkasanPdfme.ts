import { generate } from '@pdfme/generator'
import { text, table } from '@pdfme/schemas'
import { format } from 'date-fns'

export const RINGKASAN_KATEGORI: Record<string, string> = {
  jv_syarikat: 'Corporate JV',
  jv_tanah: 'Land JV',
  pinjaman_individu: 'Individual Loan',
}

export const RINGKASAN_STATUS: Record<string, string> = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
}

export interface RingkasanData {
  jumlah: number
  jumlah_pembiayaan: number
  jumlah_tunggakan: number
  kategori: Record<string, number>
  status: Record<string, number>
  senarai: Array<{
    kod_rujukan: string
    nama_peminjam: string
    kategori: string
    status_fasiliti: string
    jumlah_pembiayaan: number
    jumlah_tunggakan_semasa: number
  }>
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

export async function generateRingkasanPdf(data: RingkasanData): Promise<Uint8Array> {
  const today = format(new Date(), 'dd/MM/yyyy')

  const kategoriRows = Object.entries(data.kategori)
    .map(([k, count]) => [RINGKASAN_KATEGORI[k] ?? k, String(count)])
    .filter(([, c]) => c !== '0')

  const statusRows = Object.entries(data.status)
    .map(([k, count]) => [RINGKASAN_STATUS[k] ?? k, String(count)])
    .filter(([, c]) => c !== '0')

  const totalRows = [
    ['Total Facilities', String(data.jumlah)],
    ['Total Financing (RM)', fmtCurrency(data.jumlah_pembiayaan)],
    ['Total Arrears (RM)', fmtCurrency(data.jumlah_tunggakan)],
  ]

  const listRows = data.senarai.map((f) => [
    f.kod_rujukan,
    f.nama_peminjam,
    RINGKASAN_KATEGORI[f.kategori] ?? f.kategori,
    RINGKASAN_STATUS[f.status_fasiliti] ?? f.status_fasiliti,
    fmtCurrency(f.jumlah_pembiayaan),
    fmtCurrency(f.jumlah_tunggakan_semasa),
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
          content: 'PORTFOLIO SUMMARY',
          fontSize: 17,
          fontColor: '#1a1a2e',
        },
        {
          type: 'text',
          name: 'subtitle',
          position: { x: 12, y: 28 },
          width: 186,
          height: 6,
          content: `Financing Facilities Overview — Generated on ${today}`,
          fontSize: 10,
          fontColor: '#5a6080',
        },
        {
          type: 'table',
          name: 'totals',
          position: { x: 12, y: 40 },
          width: 186,
          height: 26,
          content: '',
          showHead: false,
          head: ['', ''],
          headWidthPercentages: [70, 30],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { backgroundColor: '#f5f7fc' },
          bodyStyles: { alternateBackgroundColor: '#fafafa' },
          columnStyles: { 0: { alignment: 'left' }, 1: { alignment: 'right' } },
        },
        {
          type: 'table',
          name: 'kategori',
          position: { x: 12, y: 70 },
          width: 186,
          height: 28,
          content: '',
          showHead: true,
          head: ['Category', 'Count'],
          headWidthPercentages: [70, 30],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { backgroundColor: '#f5f7fc', fontColor: '#5a6080' },
          bodyStyles: { alternateBackgroundColor: '#fafafa' },
          columnStyles: { 0: { alignment: 'left' }, 1: { alignment: 'right' } },
        },
        {
          type: 'table',
          name: 'status',
          position: { x: 12, y: 102 },
          width: 186,
          height: 28,
          content: '',
          showHead: true,
          head: ['Status', 'Count'],
          headWidthPercentages: [70, 30],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { backgroundColor: '#f5f7fc', fontColor: '#5a6080' },
          bodyStyles: { alternateBackgroundColor: '#fafafa' },
          columnStyles: { 0: { alignment: 'left' }, 1: { alignment: 'right' } },
        },
        {
          type: 'text',
          name: 'section',
          position: { x: 12, y: 134 },
          width: 186,
          height: 7,
          content: `FACILITY LIST (${data.jumlah} RECORDS)`,
          fontSize: 8,
          fontColor: '#5a6080',
        },
        {
          type: 'table',
          name: 'list',
          position: { x: 12, y: 143 },
          width: 186,
          height: 138,
          content: '',
          showHead: true,
          head: ['Ref', 'Borrower / Contractor', 'Category', 'Status', 'Financing', 'Arrears'],
          headWidthPercentages: [12, 30, 16, 14, 14, 14],
          tableStyles: { borderColor: '#e0e4ef', borderWidth: 0.2 },
          headStyles: { backgroundColor: '#f5f7fc', fontColor: '#5a6080' },
          bodyStyles: { alternateBackgroundColor: '#fafafa' },
          columnStyles: {
            0: { alignment: 'left' },
            1: { alignment: 'left' },
            2: { alignment: 'left' },
            3: { alignment: 'left' },
            4: { alignment: 'right' },
            5: { alignment: 'right' },
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
    inputs: [
      {
        totals: totalRows,
        kategori: kategoriRows,
        status: statusRows,
        list: listRows,
      },
    ],
    plugins: { text, table },
  })
}