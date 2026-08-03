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

function fmtCurrency(n: number | null | undefined) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

function fmtArea(n: number | null | undefined) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(n) + ' m²'
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

export async function generateTanahKronologiDocx(tanahId: string): Promise<Buffer> {
  const supabase = await createClient()

  const [{ data: tanah }, { data: susulan }] = await Promise.all([
    supabase.from('tanah_jv').select('*').eq('id', tanahId).single(),
    supabase.from('susulan')
      .select('*, dicatat_oleh_user:users(nama), lampiran(*)')
      .eq('tanah_id', tanahId)
      .order('tarikh_susulan', { ascending: true }),
  ])

  if (!tanah) throw new Error('Land parcel not found')

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
      new TextRun({
        text: `No. Lot ${tanah.no_lot} — ${[tanah.bandar_mukim, tanah.daerah, tanah.negeri].filter(Boolean).join(', ')}`,
        size: 24,
        font: 'Arial',
      }),
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

  const infoTable = new Table({
    rows: [
      makeInfoRow('Negeri', tanah.negeri),
      makeInfoRow('Daerah', tanah.daerah),
      makeInfoRow('Bandar / Pekan / Mukim', tanah.bandar_mukim),
      makeInfoRow('Tempat', tanah.tempat),
      makeInfoRow('No. Lot', tanah.no_lot),
      ...(tanah.no_hak_milik ? [makeInfoRow('No. Hak Milik', tanah.no_hak_milik)] : []),
      ...(tanah.tarikh_daftar ? [makeInfoRow('Daftar Pada', fmtDate(tanah.tarikh_daftar))] : []),
      makeInfoRow('Luas (m²)', fmtArea(tanah.luas_meter_persegi)),
      makeInfoRow('Anggaran Nilaian (RM)', fmtCurrency(tanah.anggaran_nilaian)),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })

  const catatanPara = tanah.catatan
    ? [new Paragraph({
        children: [new TextRun({ text: 'CATATAN', bold: true, size: 22, font: 'Arial' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
      }), new Paragraph({
        children: [new TextRun({ text: tanah.catatan, size: 20, font: 'Arial' })],
        spacing: { after: 120 },
      })]
    : []

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
      children: [titlePara, subtitlePara, infoTable, ...catatanPara, kronologiHeader, ...susulanRows, footerPara],
    }],
  })

  return await Packer.toBuffer(doc)
}