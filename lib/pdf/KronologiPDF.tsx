import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
  },
  // Header
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
  // Info table
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
  // Section
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#5a6080',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  // Timeline
  timelineItem: {
    marginBottom: 14,
    paddingLeft: 14,
    borderLeft: '2 solid #3b5bdb',
  },
  timelineIndex: {
    fontSize: 8,
    color: '#3b5bdb',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
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
  // Footer
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
  try { return format(parseISO(d), fmt) }
  catch { return d }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}


const KATEGORI: Record<string, string> = {
  jv_syarikat: 'Corporate JV', jv_tanah: 'Land JV', pinjaman_individu: 'Individual Loan',
}
const STATUS: Record<string, string> = {
  aktif: 'Active', tertunggak: 'Overdue', tindakan_guaman: 'Legal Action', selesai: 'Completed',
}

// ─── PDF Document Component ───────────────────────────────────────────────────

interface SusulanItem {
  id: string
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
  // ─── Excel Fields ───────────────────────────────────
  kadar_dividen?: string | null
  perkongsian_keuntungan?: number      // B for JV2
  tunggakan_dividen?: number
  caj_lewat?: number
  bayaran_tambahan?: number
  penama_aset?: string | null
  status_pindahmilik?: string | null
  nama_kontraktor?: string | null
  harga_jualan?: string | null         // text e.g. "400,000 - BUNGALOW"
  tahun_projek?: number | null
}

interface KronologiPDFProps {
  fasiliti: FasilitiData
  susulan: SusulanItem[]
}

export function KronologiPDF({ fasiliti, susulan }: KronologiPDFProps) {
  const today = format(new Date(), 'dd/MM/yyyy')
  const isJV1 = fasiliti.kategori === 'jv_syarikat'
  const isJV2 = fasiliti.kategori === 'jv_tanah'
  const isJV3 = fasiliti.kategori === 'pinjaman_individu'

  const infoRows = [
    { label: 'Reference Code', value: fasiliti.kod_rujukan },
    { label: 'Capital Funder (Pembiaya Modal)', value: fasiliti.pembiaya_modal },
    { label: isJV2 ? 'Nama Kontraktor' : 'Nama Peminjam', value: fasiliti.nama_peminjam },
    { label: 'Category', value: KATEGORI[fasiliti.kategori] ?? fasiliti.kategori },
    { label: 'Status', value: STATUS[fasiliti.status_fasiliti] ?? fasiliti.status_fasiliti },
    { label: 'Start Date', value: fmtDate(fasiliti.tarikh_mula) },
    ...(fasiliti.tarikh_tamat ? [{ label: 'End Date', value: fmtDate(fasiliti.tarikh_tamat) }] : []),
    // Maklumat Pembiayaan Modal
    { label: 'Jumlah Pembiayaan Modal (RM) — A', value: fmtCurrency(fasiliti.jumlah_pembiayaan) },
    ...(isJV1 && fasiliti.kadar_dividen ? [{ label: 'Perkongsian Dividen Keuntungan', value: fasiliti.kadar_dividen }] : []),
    ...(isJV3 && fasiliti.kadar_dividen ? [{ label: 'Perkongsian Keuntungan', value: fasiliti.kadar_dividen }] : []),
    ...(isJV2 && (fasiliti.perkongsian_keuntungan ?? 0) > 0 ? [{ label: 'Perkongsian Keuntungan (RM) — B', value: fmtCurrency(fasiliti.perkongsian_keuntungan!) }] : []),
    ...(isJV3 && (fasiliti.bayaran_tambahan ?? 0) > 0 ? [{ label: 'Bayaran Tambahan (RM) — B', value: fmtCurrency(fasiliti.bayaran_tambahan!) }] : []),
    // Maklumat Tunggakan & Bayaran
    ...(isJV1 && (fasiliti.tunggakan_dividen ?? 0) > 0 ? [{ label: 'Tunggakan Dividen (RM) — B', value: fmtCurrency(fasiliti.tunggakan_dividen!) }] : []),
    ...(isJV1 && (fasiliti.caj_lewat ?? 0) > 0 ? [{ label: 'Caj Lewat (RM) — C', value: fmtCurrency(fasiliti.caj_lewat!) }] : []),
    ...(isJV1 && (fasiliti.bayaran_tambahan ?? 0) > 0 ? [{ label: 'Bayaran Tambahan (RM) — D', value: fmtCurrency(fasiliti.bayaran_tambahan!) }] : []),
    ...(isJV2 && (fasiliti.tunggakan_dividen ?? 0) > 0 ? [{ label: 'Tunggakan Perkongsian Keuntungan (RM) — C', value: fmtCurrency(fasiliti.tunggakan_dividen!) }] : []),
    ...(isJV2 && (fasiliti.bayaran_tambahan ?? 0) > 0 ? [{ label: 'Bayaran Tambahan (RM) — D', value: fmtCurrency(fasiliti.bayaran_tambahan!) }] : []),
    ...(isJV2 && fasiliti.tahun_projek ? [{ label: 'Tahun Projek', value: String(fasiliti.tahun_projek) }] : []),
    { label: isJV3 ? 'Jumlah Tunggakan (RM) — C (A + B)' : 'Jumlah Tunggakan (RM) — E', value: fmtCurrency(fasiliti.jumlah_tunggakan_semasa) },
    // Collateral / Hartanah
    ...(fasiliti.ringkasan_cagaran ? [{ label: isJV2 ? 'Jenis / Lokasi (Hartanah)' : 'Jenis / Lokasi / Nilaian Aset Cagaran', value: fasiliti.ringkasan_cagaran }] : []),
    ...(fasiliti.nilai_cagaran ? [{ label: 'Anggaran Nilaian (RM)', value: fmtCurrency(fasiliti.nilai_cagaran) }] : []),
    ...(fasiliti.penama_aset ? [{ label: 'Penama Aset', value: fasiliti.penama_aset }] : []),
    ...(fasiliti.status_pindahmilik ? [{ label: 'Status Pindahmilik / Jualan Aset', value: fasiliti.status_pindahmilik }] : []),
    ...(isJV2 && fasiliti.harga_jualan ? [{ label: 'Harga Jualan / Jenis', value: fasiliti.harga_jualan }] : []),
  ]

  return (
    <Document title={`Chronology ${fasiliti.kod_rujukan}`} author="Traceo">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.confidential}>Strictly Confidential</Text>
          <Text style={styles.title}>FOLLOW-UP CHRONOLOGY</Text>
          <Text style={styles.subtitle}>
            {fasiliti.kod_rujukan} — {fasiliti.nama_peminjam}
          </Text>
        </View>

        {/* Info Table */}
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

        {/* Susulan entries */}
        <Text style={styles.sectionTitle}>
          Follow-up Chronology ({susulan.length} records)
        </Text>

        {susulan.length === 0 ? (
          <Text style={styles.noData}>No follow-up records.</Text>
        ) : (
          susulan.map((s, i) => (
            <View key={s.id} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>
                {i + 1}.  {fmtDate(s.tarikh_susulan)}
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
              <Text style={styles.timelineBy}>
                Recorded by: {s.dicatat_oleh_user?.nama ?? '—'}
              </Text>
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>STRICTLY CONFIDENTIAL — Traceo</Text>
          <Text style={styles.footerText}>Generated on: {today}</Text>
        </View>
      </Page>
    </Document>
  )
}
