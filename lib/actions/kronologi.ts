'use server'

import { createClient } from '@/lib/supabase/server'
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType,
} from 'docx'
import sharp from 'sharp'
import { format, parseISO } from 'date-fns'
import { enGB } from 'date-fns/locale'

const MAX_IMAGE_WIDTH = 460 // px — fits A4 width minus margins/indent

function fmtDate(d: string) {
  try { return format(parseISO(d), 'dd MMMM yyyy', { locale: enGB }) }
  catch { return d }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

const KATEGORI: Record<string, string> = {
  jv_syarikat: 'Corporate JV', jv_tanah: 'Land JV', pinjaman_individu: 'Individual Loan',
}
const STATUS: Record<string, string> = {
  aktif: 'Active', tertunggak: 'Overdue', tindakan_guaman: 'Legal Action', selesai: 'Completed',
}

async function imageParagraph(url: string): Promise<Paragraph | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())

    const meta = await sharp(buffer).metadata()
    const { width = 1, height = 1 } = meta

    const scale = Math.min(1, MAX_IMAGE_WIDTH / width)
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)

    const isJpeg = meta.format === 'jpeg'
    const isPng = meta.format === 'png'
    const isGif = meta.format === 'gif'

    const data = isJpeg || isPng || isGif
      ? buffer
      : await sharp(buffer).resize(w, h).png().toBuffer()

    const type: 'jpg' | 'png' | 'gif' = isJpeg ? 'jpg' : isPng ? 'png' : isGif ? 'gif' : 'png'

    return new Paragraph({
      children: [
        new ImageRun({ type, data, transformation: { width: w, height: h } }),
      ],
      indent: { left: 360 },
      spacing: { after: 120 },
      alignment: AlignmentType.CENTER,
    })
  } catch (err) {
    console.error('[Kronologi Image Error]', err)
    return null
  }
}

export async function generateKronologiDocx(fasilitiId: string): Promise<Buffer> {
  const supabase = await createClient()

  const [{ data: fasiliti }, { data: susulan }] = await Promise.all([
    supabase.from('fasiliti').select('*').eq('id', fasilitiId).single(),
    supabase.from('susulan')
      .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
      .eq('fasiliti_id', fasilitiId)
      .order('tarikh_susulan', { ascending: true }),
  ])

  if (!fasiliti) throw new Error('Facility not found')

  const today = format(new Date(), 'dd/MM/yyyy')

  const titlePara = new Paragraph({
    children: [
      new TextRun({ text: 'FOLLOW-UP CHRONOLOGY', bold: true, size: 28, font: 'Arial' }),
    ],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  })

  const subtitlePara = new Paragraph({
    children: [
      new TextRun({ text: `${fasiliti.kod_rujukan} — ${fasiliti.nama_peminjam}`, size: 24, font: 'Arial' }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  })

  const makeInfoRow = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial' })] })],
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Arial' })] })],
          width: { size: 65, type: WidthType.PERCENTAGE },
        }),
      ],
    })

  const isJV1 = fasiliti.kategori === 'jv_syarikat'
  const isJV2 = fasiliti.kategori === 'jv_tanah'
  const isJV3 = fasiliti.kategori === 'pinjaman_individu'

  const infoTable = new Table({
    rows: [
      makeInfoRow('Reference Code', fasiliti.kod_rujukan),
      makeInfoRow('Capital Funder (Pembiaya Modal)', fasiliti.pembiaya_modal),
      makeInfoRow(isJV2 ? 'Nama Kontraktor' : 'Nama Peminjam', fasiliti.nama_peminjam),
      makeInfoRow('Category', KATEGORI[fasiliti.kategori] ?? fasiliti.kategori),
      makeInfoRow('Status', STATUS[fasiliti.status_fasiliti] ?? fasiliti.status_fasiliti),
      makeInfoRow('Start Date', fmtDate(fasiliti.tarikh_mula)),
      ...(fasiliti.tarikh_tamat ? [makeInfoRow('End Date', fmtDate(fasiliti.tarikh_tamat))] : []),
      // ─── Maklumat Pembiayaan Modal ────────────────────────────────────────
      makeInfoRow('Jumlah Pembiayaan Modal (RM) — A', fmtCurrency(fasiliti.jumlah_pembiayaan)),
      // JV1/JV3: text description
      ...(isJV1 && fasiliti.kadar_dividen ? [makeInfoRow('Perkongsian Dividen Keuntungan', fasiliti.kadar_dividen)] : []),
      ...(isJV3 && fasiliti.kadar_dividen ? [makeInfoRow('Perkongsian Keuntungan', fasiliti.kadar_dividen)] : []),
      // JV2: numeric B
      ...(isJV2 && fasiliti.perkongsian_keuntungan > 0 ? [makeInfoRow('Perkongsian Keuntungan (RM) — B', fmtCurrency(fasiliti.perkongsian_keuntungan))] : []),
      // JV3: Bayaran Tambahan as B
      ...(isJV3 && fasiliti.bayaran_tambahan > 0 ? [makeInfoRow('Bayaran Tambahan (RM) — B', fmtCurrency(fasiliti.bayaran_tambahan))] : []),
      // ─── Maklumat Tunggakan & Bayaran ─────────────────────────────────────
      ...(isJV1 && fasiliti.tunggakan_dividen > 0 ? [makeInfoRow('Tunggakan Dividen (RM) — B', fmtCurrency(fasiliti.tunggakan_dividen))] : []),
      ...(isJV1 && fasiliti.caj_lewat > 0 ? [makeInfoRow('Caj Lewat (RM) — C', fmtCurrency(fasiliti.caj_lewat))] : []),
      ...(isJV1 && fasiliti.bayaran_tambahan > 0 ? [makeInfoRow('Bayaran Tambahan (RM) — D', fmtCurrency(fasiliti.bayaran_tambahan))] : []),
      ...(isJV2 && fasiliti.tunggakan_dividen > 0 ? [makeInfoRow('Tunggakan Perkongsian Keuntungan (RM) — C', fmtCurrency(fasiliti.tunggakan_dividen))] : []),
      ...(isJV2 && fasiliti.bayaran_tambahan > 0 ? [makeInfoRow('Bayaran Tambahan (RM) — D', fmtCurrency(fasiliti.bayaran_tambahan))] : []),
      ...(isJV2 && fasiliti.tahun_projek ? [makeInfoRow('Tahun Projek', String(fasiliti.tahun_projek))] : []),
      makeInfoRow(isJV3 ? 'Jumlah Tunggakan (RM) — C (A + B)' : 'Jumlah Tunggakan (RM) — E', fmtCurrency(fasiliti.jumlah_tunggakan_semasa)),
      // ─── Collateral / Hartanah ────────────────────────────────────────────
      ...(fasiliti.ringkasan_cagaran ? [makeInfoRow(isJV2 ? 'Jenis / Lokasi (Hartanah)' : 'Jenis / Lokasi / Nilaian Aset Cagaran', fasiliti.ringkasan_cagaran)] : []),
      ...(fasiliti.nilai_cagaran ? [makeInfoRow('Anggaran Nilaian (RM)', fmtCurrency(fasiliti.nilai_cagaran))] : []),
      ...(fasiliti.penama_aset ? [makeInfoRow('Penama Aset', fasiliti.penama_aset)] : []),
      ...(fasiliti.status_pindahmilik ? [makeInfoRow('Status Pindahmilik / Jualan Aset', fasiliti.status_pindahmilik)] : []),
      ...(isJV2 && fasiliti.harga_jualan ? [makeInfoRow('Harga Jualan / Jenis', fasiliti.harga_jualan)] : []),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })

  const kronologiHeader = new Paragraph({
    children: [new TextRun({ text: 'FOLLOW-UP CHRONOLOGY', bold: true, size: 22, font: 'Arial' })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  })

  const susulanRows: Paragraph[] = []
  for (let i = 0; i < (susulan ?? []).length; i++) {
    const s = susulan![i]
    susulanRows.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}.  ${fmtDate(s.tarikh_susulan)}`, bold: true, size: 20, font: 'Arial' }),
        ],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: s.catatan, size: 20, font: 'Arial' })],
        indent: { left: 360 },
        spacing: { after: 80 },
      }),
    )

    const lampiran = (s as { lampiran?: Array<{ url_fail: string; jenis_fail: string; nama_asal: string }> }).lampiran
    for (const l of lampiran ?? []) {
      if (l.jenis_fail === 'imej') {
        const img = await imageParagraph(l.url_fail)
        if (img) susulanRows.push(img)
      } else {
        susulanRows.push(
          new Paragraph({
            children: [new TextRun({ text: `Attachment: ${l.nama_asal}`, italics: true, size: 18, color: '666666', font: 'Arial' })],
            indent: { left: 360 },
            spacing: { after: 120 },
          })
        )
      }
    }

    susulanRows.push(
      new Paragraph({
        children: [new TextRun({ text: `Recorded by: ${s.dicatat_oleh_user?.nama ?? '—'}`, italics: true, size: 18, color: '666666', font: 'Arial' })],
        indent: { left: 360 },
        spacing: { after: 200 },
      })
    )
  }

  if ((susulan ?? []).length === 0) {
    susulanRows.push(new Paragraph({
      children: [new TextRun({ text: 'No follow-up records.', italics: true, size: 20, font: 'Arial' })],
    }))
  }

  const footerPara = new Paragraph({
    children: [new TextRun({ text: `Generated on: ${today}`, size: 18, color: '999999', font: 'Arial' })],
    alignment: AlignmentType.RIGHT,
    spacing: { before: 400 },
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children: [titlePara, subtitlePara, infoTable, kronologiHeader, ...susulanRows, footerPara],
    }],
  })

  return await Packer.toBuffer(doc)
}
