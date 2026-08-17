export type UserRole = 'superadmin' | 'admin' | 'pengurus' | 'pegawai_susulan' | 'viewer'
export type UserStatus = 'aktif' | 'tidak_aktif'

export type FasilitiKategori = 'jv_syarikat' | 'jv_tanah' | 'pinjaman_individu'
export type FasilitiStatus = 'aktif' | 'tertunggak' | 'tindakan_guaman' | 'selesai'

export type LampiranJenis = 'imej' | 'dokumen'

// ─── Database Entities ───────────────────────────────────────────────────────

export interface User {
  id: string
  nama: string
  emel: string
  peranan: UserRole
  status: UserStatus
  dicipta_pada: string
}

export interface Fasiliti {
  id: string
  kod_rujukan: string
  kategori: FasilitiKategori
  pembiaya_modal: string
  nama_peminjam: string       // Also used as "Nama Kontraktor" label for jv_tanah
  jumlah_pembiayaan: number   // A — financing amount for all categories
  tarikh_mula: string
  tarikh_tamat: string | null
  ringkasan_cagaran: string   // Jenis/Lokasi/Nilaian Aset / Hartanah
  nilai_cagaran: number | null
  jumlah_tunggakan_semasa: number  // E for JV1/JV2, C for JV3 (computed/editable)
  status_fasiliti: FasilitiStatus
  catatan_am: string | null
  dicipta_oleh: string
  dicipta_pada: string
  dikemaskini_pada: string
  // ─── Financial fields — mapped by category ───────────────────────────────────
  // JV1 (jv_syarikat): text description of profit sharing rate
  // JV3 (pinjaman_individu): text description of profit sharing
  kadar_dividen: string | null
  // JV2 (jv_tanah) only: B = profit sharing AMOUNT (numeric)
  perkongsian_keuntungan: number
  // JV1: B = dividend arrears  |  JV2: C = tunggakan perkongsian keuntungan
  tunggakan_dividen: number
  // JV1: C = late charges  |  not used in JV2/JV3
  caj_lewat: number
  // JV1: D | JV2: D | JV3: B
  bayaran_tambahan: number
  // ─── Collateral & Asset fields ───────────────────────────────────────────────
  penama_aset: string | null          // Penama Aset
  status_pindahmilik: string | null   // Status Pindahmilik / Jualan Aset
  // ─── JV Tanah specific ───────────────────────────────────────────────────────
  nama_kontraktor: string | null      // Nama Kontraktor (stored separately from nama_peminjam)
  harga_jualan: string | null         // Harga Jualan / Jenis (text e.g. "400,000 - BUNGALOW")
  tahun_projek: number | null         // Project year
}

export interface FasilitiPegawai {
  id: string
  fasiliti_id: string
  user_id: string
}

export interface Susulan {
  id: string
  fasiliti_id: string | null
  tanah_id?: string | null
  tarikh_susulan: string
  catatan: string
  dicatat_oleh: string
  dicipta_pada: string
  dikemaskini_pada: string
  // Joined
  lampiran?: Lampiran[]
  dicatat_oleh_user?: Pick<User, 'id' | 'nama'>
}

export interface Lampiran {
  id: string
  susulan_id: string
  url_fail: string
  jenis_fail: LampiranJenis
  nama_asal: string
  dimuat_naik_pada: string
}

export interface LogAudit {
  id: string
  user_id: string
  tindakan: string
  entiti_jenis: string
  entiti_id: string
  butiran: Record<string, unknown> | null
  tarikh: string
  // Joined
  user?: Pick<User, 'id' | 'nama' | 'emel'>
}

// ─── Tanah JV (Land Registry) ────────────────────────────────────────────────

export interface TanahJV {
  id: string
  negeri: string
  daerah: string
  bandar_mukim: string
  tempat: string
  no_lot: string
  tarikh_daftar: string | null
  no_hak_milik: string | null
  luas_meter_persegi: number | null
  anggaran_nilaian: number | null
  catatan: string | null
  dicipta_oleh: string
  dicipta_pada: string
  dikemaskini_pada: string
}

export interface TanahJVFormData {
  negeri: string
  daerah: string
  bandar_mukim: string
  tempat: string
  no_lot: string
  tarikh_daftar?: string
  no_hak_milik?: string
  luas_meter_persegi?: number
  anggaran_nilaian?: number
  catatan?: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface FasilitiFormData {
  kategori: FasilitiKategori
  pembiaya_modal: string
  nama_peminjam: string
  jumlah_pembiayaan: number
  tarikh_mula: string
  tarikh_tamat?: string
  ringkasan_cagaran: string
  nilai_cagaran?: number
  jumlah_tunggakan_semasa: number
  status_fasiliti: FasilitiStatus
  catatan_am?: string
  pegawai_ids?: string[]
  // Financial breakdown (category-specific)
  kadar_dividen?: string
  perkongsian_keuntungan?: number
  tunggakan_dividen?: number
  caj_lewat?: number
  bayaran_tambahan?: number
  // Collateral & asset
  penama_aset?: string
  status_pindahmilik?: string
  // JV Tanah specific
  nama_kontraktor?: string
  harga_jualan?: string
  tahun_projek?: number
}

export interface SusulanFormData {
  tarikh_susulan: string
  catatan: string
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface FasilitiFilter {
  search?: string
  kategori?: FasilitiKategori
  status?: FasilitiStatus
  page?: number
  pageSize?: number
}


// ─── Database Entities (duplicate removed — defined at line 11) ───────────────

// ─── Access Control Types ─────────────────────────────────────────────────────

export type FeatureKey =
  | 'tambah_fasiliti'
  | 'edit_fasiliti'
  | 'padam_fasiliti'
  | 'tambah_susulan'
  | 'edit_susulan'
  | 'padam_susulan'
  | 'jana_kronologi'
  | 'eksport_excel'
  | 'lihat_audit_log'
  | 'urus_pengguna'
  | 'lihat_dashboard'
  | 'lihat_assistant'
  | 'lihat_fasiliti'
  | 'lihat_tanah_jv'
  | 'lihat_summary'

export type PageKey =
  | '/dashboard'
  | '/dashboard/fasiliti'
  | '/dashboard/tanah-jv'
  | '/dashboard/summary'
  | '/dashboard/summary/jv1'
  | '/dashboard/summary/jv2'
  | '/dashboard/summary/jv3'
  | '/dashboard/audit'
  | '/dashboard/users'
  | '/dashboard/assistant'
  | '/dashboard/profil'
  | '/dashboard/superadmin'
  | (string & {})

export interface FeatureAccess {
  id: string
  user_id: string
  feature_key: FeatureKey
  is_allowed: boolean
  dicipta_pada: string
  dikemaskini_pada: string
}

export interface PageAccess {
  id: string
  user_id: string
  page_path: PageKey
  is_allowed: boolean
  dicipta_pada: string
  dikemaskini_pada: string
}
