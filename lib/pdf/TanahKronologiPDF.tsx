import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #e0e4ef',
    paddingBottom: 14,
  },
  confidential: {
    fontSize: 8,
    color: '#999',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a2e',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#5a6080',
  },
  infoTable: {
    marginBottom: 20,
    border: '1 solid #e0e4ef',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e0e4ef',
  },
  infoRowLast: {
    flexDirection: 'row',
  },
  infoLabel: {
    width: '35%',
    padding: '6 10',
    fontSize: 9,
    color: '#5a6080',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f5f7fc',
  },
  infoValue: {
    flex: 1,
    padding: '6 10',
    fontSize: 9,
    color: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#5a6080',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  timelineItem: {
    marginBottom: 14,
    paddingLeft: 14,
    borderLeft: '2 solid #3b5bdb',
  },
  timelineDate: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#3b5bdb',
    marginBottom: 4,
  },
  timelineCatatan: {
    fontSize: 9.5,
    color: '#1a1a2e',
    lineHeight: 1.5,
    marginBottom: 3,
  },
  timelineBy: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
  },
  timelineAttachment: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 3,
  },
  timelineImage: {
    maxWidth: '100%',
    maxHeight: 200,
    marginTop: 6,
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1 solid #e0e4ef',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#aaa',
  },
  noData: {
    fontSize: 9,
    color: '#999',
    fontStyle: 'italic',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── PDF Document Component ───────────────────────────────────────────────────

interface SusulanItem {
  id: string
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

interface TanahKronologiPDFProps {
  tanah: TanahData
  susulan: SusulanItem[]
}

export function TanahKronologiPDF({ tanah, susulan }: TanahKronologiPDFProps) {
  const today = format(new Date(), 'dd/MM/yyyy')

  const infoRows = [
    { label: 'Negeri', value: tanah.negeri },
    { label: 'Daerah', value: tanah.daerah },
    { label: 'Bandar / Pekan / Mukim', value: tanah.bandar_mukim },
    { label: 'Tempat', value: tanah.tempat },
    { label: 'No. Lot', value: tanah.no_lot },
    ...(tanah.no_hak_milik ? [{ label: 'No. Hak Milik', value: tanah.no_hak_milik }] : []),
    ...(tanah.tarikh_daftar ? [{ label: 'Daftar Pada', value: fmtDate(tanah.tarikh_daftar) }] : []),
    { label: 'Luas (m²)', value: fmtArea(tanah.luas_meter_persegi) },
    { label: 'Anggaran Nilaian (RM)', value: fmtCurrency(tanah.anggaran_nilaian) },
  ]

  return (
    <Document title={`Chronology ${tanah.no_lot}`} author="Traceo">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.confidential}>Strictly Confidential</Text>
          <Text style={styles.title}>FOLLOW-UP CHRONOLOGY</Text>
          <Text style={styles.subtitle}>
            No. Lot {tanah.no_lot} —{' '}
            {[tanah.bandar_mukim, tanah.daerah, tanah.negeri].filter(Boolean).join(', ')}
          </Text>
        </View>

        <View style={styles.infoTable}>
          {infoRows.map((row, i) => (
            <View
              key={row.label}
              style={i === infoRows.length - 1 ? styles.infoRowLast : styles.infoRow}
            >
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {tanah.catatan && (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Catatan</Text>
            <Text style={styles.timelineCatatan}>{tanah.catatan}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Follow-up Chronology ({susulan.length} records)</Text>

        {susulan.length === 0 ? (
          <Text style={styles.noData}>No follow-up records.</Text>
        ) : (
          susulan.map((s, i) => (
            <View key={s.id} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>
                {i + 1}. {fmtDate(s.tarikh_susulan)}
              </Text>
              <Text style={styles.timelineCatatan}>{s.catatan}</Text>
              {s.lampiran?.map((l) =>
                l.jenis_fail === 'imej' ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                  <Image key={l.id ?? l.url_fail} src={l.url_fail} style={styles.timelineImage} />
                ) : (
                  <Text key={l.id ?? l.url_fail} style={styles.timelineAttachment}>
                    Attachment: {l.nama_asal}
                  </Text>
                )
              )}
              <Text style={styles.timelineBy}>Recorded by: {s.dicatat_oleh_user?.nama ?? '—'}</Text>
            </View>
          ))
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>STRICTLY CONFIDENTIAL — Traceo</Text>
          <Text style={styles.footerText}>Generated on: {today}</Text>
        </View>
      </Page>
    </Document>
  )
}
