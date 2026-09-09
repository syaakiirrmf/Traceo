import 'server-only'

import { z } from 'zod'

// ─── Kongsi ──────────────────────────────────────────────────────────────────

const uuid = z.uuid('ID tidak sah')
const tarikh = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarikh tidak sah (YYYY-MM-DD)')
const wang = z.coerce.number().min(0, 'Nilai tidak boleh negatif').max(999_999_999_999, 'Nilai terlalu besar')

export const KATEGORI = ['jv_syarikat', 'jv_tanah', 'pinjaman_individu'] as const
export const STATUS_FASILITI = ['aktif', 'tertunggak', 'tindakan_guaman', 'selesai'] as const
export const PERANAN = ['admin', 'pengurus', 'pegawai_susulan', 'viewer'] as const

// ─── Fasiliti ────────────────────────────────────────────────────────────────

const fasilitiBase = z.object({
  kategori: z.enum(KATEGORI, 'Kategori tidak sah'),
  pembiaya_modal: z.string().trim().min(1, 'Pembiaya modal diperlukan').max(200),
  nama_peminjam: z.string().trim().min(1, 'Nama peminjam diperlukan').max(200),
  jumlah_pembiayaan: wang,
  tarikh_mula: tarikh,
  tarikh_tamat: z.union([tarikh, z.literal(''), z.null()]).transform((v) => v || null),
  ringkasan_cagaran: z.string().trim().max(2000).default(''),
  nilai_cagaran: z.union([z.coerce.number().min(0), z.literal(''), z.nan(), z.null()]).transform((v) =>
    typeof v === 'number' && Number.isFinite(v) ? v : null
  ),
  jumlah_tunggakan_semasa: z.union([z.coerce.number().min(0), z.literal('')]).transform((v) =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined
  ),
  status_fasiliti: z.enum(STATUS_FASILITI, 'Status tidak sah'),
  catatan_am: z.string().trim().max(5000).nullable().default(null),
  kadar_dividen: z.string().trim().max(200).nullable().default(null),
  perkongsian_keuntungan: wang.default(0),
  tunggakan_dividen: wang.default(0),
  caj_lewat: wang.default(0),
  bayaran_tambahan: wang.default(0),
  penama_aset: z.string().trim().max(200).nullable().default(null),
  status_pindahmilik: z.string().trim().max(200).nullable().default(null),
  nama_kontraktor: z.string().trim().max(200).nullable().default(null),
  harga_jualan: z.string().trim().max(200).nullable().default(null),
  tahun_projek: z
    .union([z.coerce.number().int().min(1900).max(2100), z.literal(''), z.nan(), z.null()])
    .transform((v) => (typeof v === 'number' && Number.isInteger(v) ? v : null)),
  pegawai_ids: z.array(uuid).max(20, 'Maksimum 20 pegawai').default([]),
})

export const fasilitiSchema = fasilitiBase.superRefine((v, ctx) => {
  if (v.tarikh_tamat && v.tarikh_tamat < v.tarikh_mula) {
    ctx.addIssue({ code: 'custom', message: 'Tarikh tamat mesti selepas tarikh mula', path: ['tarikh_tamat'] })
  }
})

export type FasilitiInput = z.infer<typeof fasilitiSchema>

// ─── Susulan ─────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10)

export const susulanSchema = z.object({
  tarikh_susulan: tarikh.refine((v) => v <= todayStr(), 'Tarikh susulan tidak boleh pada masa depan'),
  catatan: z.string().trim().min(1, 'Catatan diperlukan').max(5000, 'Catatan maksimum 5000 aksara'),
})

export type SusulanInput = z.infer<typeof susulanSchema>

// ─── Tanah JV ────────────────────────────────────────────────────────────────

export const tanahSchema = z.object({
  negeri: z.string().trim().min(1, 'Negeri diperlukan').max(100),
  daerah: z.string().trim().min(1, 'Daerah diperlukan').max(100),
  bandar_mukim: z.string().trim().min(1, 'Bandar/mukim diperlukan').max(100),
  tempat: z.string().trim().min(1, 'Tempat diperlukan').max(200),
  no_lot: z.string().trim().min(1, 'No. lot diperlukan').max(100),
  tarikh_daftar: z.union([tarikh, z.literal(''), z.null()]).transform((v) => v || null),
  no_hak_milik: z.string().trim().max(100).nullable().default(null),
  luas_meter_persegi: z
    .union([z.coerce.number().min(0).max(999_999_999), z.literal(''), z.nan(), z.null()])
    .transform((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)),
  anggaran_nilaian: z
    .union([z.coerce.number().min(0).max(999_999_999_999), z.literal(''), z.nan(), z.null()])
    .transform((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)),
  catatan: z.string().trim().max(5000).nullable().default(null),
})

export type TanahInput = z.infer<typeof tanahSchema>

// ─── Pengguna ────────────────────────────────────────────────────────────────

export const ciptaPenggunaSchema = z.object({
  emel: z.email('Emel tidak sah').max(200),
  nama: z.string().trim().min(3, 'Nama minimum 3 aksara').max(200),
  peranan: z.enum(PERANAN, 'Peranan tidak sah'),
})

export const kemaskiniPenggunaSchema = ciptaPenggunaSchema.extend({ id: uuid })

export const pegawaiIdsSchema = z.array(uuid).max(20, 'Maksimum 20 pegawai')

// ─── Pembantu FormData ───────────────────────────────────────────────────────

/** Ambil string dari FormData (null jika tiada). */
export function fd(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  if (typeof v === 'string') return v
  return null
}

/** Validate + throw Error mesra dengan mesej pertama. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const res = schema.safeParse(data)
  if (res.success) return res.data
  const first = res.error.issues[0]
  throw new Error(first?.message ?? 'Input tidak sah')
}
