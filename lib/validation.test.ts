import { describe, expect, it } from 'vitest'
import { fasilitiSchema, susulanSchema, tanahSchema, ciptaPenggunaSchema } from '@/lib/validation'

const fasilitiValid = {
  kategori: 'jv_syarikat',
  pembiaya_modal: 'Bank Test',
  nama_peminjam: 'Acme Sdn Bhd',
  jumlah_pembiayaan: '1000000',
  tarikh_mula: '2024-01-01',
  tarikh_tamat: '2026-01-01',
  ringkasan_cagaran: '',
  nilai_cagaran: '',
  jumlah_tunggakan_semasa: '',
  status_fasiliti: 'aktif',
  catatan_am: null,
  kadar_dividen: null,
  perkongsian_keuntungan: '0',
  tunggakan_dividen: '0',
  caj_lewat: '0',
  bayaran_tambahan: '0',
  penama_aset: null,
  status_pindahmilik: null,
  nama_kontraktor: null,
  harga_jualan: null,
  tahun_projek: '',
  pegawai_ids: [],
}

describe('fasilitiSchema', () => {
  it('accepts valid input', () => {
    expect(fasilitiSchema.safeParse(fasilitiValid).success).toBe(true)
  })
  it('rejects invalid kategori', () => {
    const r = fasilitiSchema.safeParse({ ...fasilitiValid, kategori: 'alien' })
    expect(r.success).toBe(false)
  })
  it('rejects negative financing', () => {
    const r = fasilitiSchema.safeParse({ ...fasilitiValid, jumlah_pembiayaan: '-5' })
    expect(r.success).toBe(false)
  })
  it('rejects tarikh_tamat before tarikh_mula', () => {
    const r = fasilitiSchema.safeParse({
      ...fasilitiValid,
      tarikh_mula: '2026-01-01',
      tarikh_tamat: '2024-01-01',
    })
    expect(r.success).toBe(false)
  })
  it('rejects invalid pegawai uuid', () => {
    const r = fasilitiSchema.safeParse({ ...fasilitiValid, pegawai_ids: ['not-a-uuid'] })
    expect(r.success).toBe(false)
  })
})

describe('susulanSchema', () => {
  it('accepts valid input', () => {
    expect(
      susulanSchema.safeParse({ tarikh_susulan: '2024-05-01', catatan: 'Lawatan tapak' }).success
    ).toBe(true)
  })
  it('rejects future date', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    expect(susulanSchema.safeParse({ tarikh_susulan: tomorrow, catatan: 'x' }).success).toBe(false)
  })
  it('rejects empty catatan', () => {
    expect(susulanSchema.safeParse({ tarikh_susulan: '2024-05-01', catatan: '  ' }).success).toBe(
      false
    )
  })
})

describe('tanahSchema', () => {
  it('accepts valid input', () => {
    expect(
      tanahSchema.safeParse({
        negeri: 'Selangor',
        daerah: 'Petaling',
        bandar_mukim: 'Damansara',
        tempat: 'Seksyen 13',
        no_lot: '12345',
        tarikh_daftar: '',
        no_hak_milik: null,
        luas_meter_persegi: '500',
        anggaran_nilaian: '',
        catatan: null,
      }).success
    ).toBe(true)
  })
  it('rejects missing no_lot', () => {
    expect(
      tanahSchema.safeParse({
        negeri: 'Selangor',
        daerah: 'Petaling',
        bandar_mukim: 'Damansara',
        tempat: 'Seksyen 13',
        no_lot: '',
        tarikh_daftar: '',
        no_hak_milik: null,
        luas_meter_persegi: '',
        anggaran_nilaian: '',
        catatan: null,
      }).success
    ).toBe(false)
  })
})

describe('ciptaPenggunaSchema', () => {
  it('accepts valid input', () => {
    expect(
      ciptaPenggunaSchema.safeParse({ emel: 'a@b.com', nama: 'Ali Baba', peranan: 'viewer' })
        .success
    ).toBe(true)
  })
  it('rejects bad email and role', () => {
    expect(
      ciptaPenggunaSchema.safeParse({ emel: 'bukan-emel', nama: 'Al', peranan: 'god' }).success
    ).toBe(false)
  })
})
