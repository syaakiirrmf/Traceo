# Traceo — Analisis Sistem & Ruang Penambahbaikan Open Source

Dokumen ini menjawab 4 soalan penting untuk menentukan arah penambahbaikan
Traceo dengan komponen open source. Disusun berdasarkan pembacaan sebenar
kod & skema pangkalan data project.

> Dikemas kini: **16 Ogos 2026**

---

## 1. Apa Traceo buat (secara ringkas)

**Traceo ialah sistem pengurusan fasiliti pembiayaan & pelaburan (JV) untuk
firma pembiayaan / pelaburan tanah**, dengan fokus pada:

- Merekod & memantau **kemudahan pembiayaan** (fasiliti) — siapa peminjam,
  siapa pembiaya modal, jumlah pembiayaan, tunggakan, status.
- Merekod **rekod tanah** yang menjadi aset JV (lokasi, lot, hak milik,
  anggaran nilai).
- Menjejak **aktiviti susulan** (follow-up) bagi setiap fasiliti/tanah,
  termasuk lampiran dokumen/imej.
- Menjana **laporan kronologi** (chronology) setiap fasiliti dalam format
  **PDF & Word (DOCX)** untuk dokumentasi & pembentangan.
- **Pembantu AI** (`@syaakiirr`) yang menjawab soalan tentang data,
  menjana laporan, dan memuat turun kronologi secara automatik.
- **Ringkasan JV** (JV1/JV2/JV3) & **Summary Tanah MD** untuk paparan
  portfolio ikut kategori.

> Ringkasan satu baris: **"Sistem rekod, pemantauan, susulan, dan pelaporan
> fasiliti pembiayaan & aset tanah JV dengan pembantu AI."**

> Sila sahkan jika sebaliknya — konteks ini diambil daripada struktur kod &
> skema (`fasiliti`, `tanah_jv`, `susulan`, `log_audit`) dan teks sistem AI.

---

## 2. Modul / Feature Sedia Ada

Berikut modul & feature yang wujud dalam sistem (nama feature, bukan code
detail):

**Pengurusan Fasiliti (Pembiayaan)**
- Senarai fasiliti (dengan pagination & carian)
- Tambah / edit / lihat detail fasiliti
- Kategori: JV Syarikat, JV Tanah, Pinjaman Individu
- Status: aktif / tertunggak / tindakan guaman / selesai
- Eksport senarai ke Excel (xlsx)

**Pengurusan Tanah JV (Tanah MD)**
- Rekod tanah: negeri, daerah, bandar/mukim, tempat, no lot, hak milik,
  luas, anggaran nilai
- Senarai / tambah / edit / detail tanah

**Ringkasan / Portfolio**
- Dashboard KPI (Arrears Ratio, Collection Rate, At-Risk, Avg Financing)
- Top Financiers by Exposure
- Summary JV1 / JV2 / JV3
- Summary Tanah MD
- Carian & paparan ikut kategori/status

**Susulan (Follow-up)**
- Rekod susulan bagi setiap fasiliti & tanah
- Lampiran dokumen/imej (Cloudinary)
- Notifikasi susulan (bell + badge + dropdown)

**Laporan Kronologi**
- Penjanaan PDF (react-pdf)
- Penjanaan Word DOCX (docx)
- Jejak & muat turun kronologi

**Pembantu AI (`@syaakiirr`)**
- Chat dengan sejarah (session + message)
- Tool calling: ringkasan fasiliti, susulan terkini, jana PDF kronologi
- Had skop peranan (Admin / Pengurus / Pegawai Susulan / Viewer)

**Pengurusan Pengguna & Audit**
- Pengurusan pengguna (tambah, status, peranan)
- Audit log (jejak tindakan pengguna)

**Sistem / Keselamatan**
- Auth (Supabase), peranan & kebenaran
- Rate limiting (Redis/Upstash)
- Security headers, password policy, leaked-password check (HIBP)
- Health check endpoint `/api/health`

---

## 3. Pain Point Semasa (Gap — tempat open source boleh diisi)

Senarai ini penting — ia menunjukkan apa yang sistem **belum** boleh buat atau
buat secara manual/leceh. Dikenal pasti daripada analisis kod:

**Pelaporan & Data (gabungan beberapa gap)**
- Tiada **library charting** yang sebenar — carta dashboard dibina manual
  (div/CSS), jadi tiada interaktiviti (tooltip, drill-down, zoom, banding
  masa). → *boleh isi dengan Recharts / Chart.js / Apache ECharts.*
- Tiada **table sorting** interaktif (klik header untuk sort) — cuma
  pagination & carian teks.
- Tiada **eksport DOCX/PDF untuk keseluruhan portfolio / ringkasan** —
  kronologi ada, tetapi laporan ringkasan penuh belum automatik.
- Tiada **analisis trend masa** (bulan-ke-bulan) untuk tunggakan/pembiayaan.

**Aliran Kerja & Kerjasama**
- Tiada **pengesahan/komen** atau workflow antara pengguna (cth: pegawai
  susulan → pengurus review).
- Tiada **sistem tiket/peringatan SLA** automatik (tarikh susulan tertunggak
  tak dijejak secara automatik mengikut jadual).
- Notifikasi hanya dalam aplikasi (bell) — **tiada e-mel/Slack** walaupun
  `resend` & cloud services sudah dalam dependencies tetapi belum digunakan.
- Tiada **kalendar** untuk tarikh susulan / tarikh tamat fasiliti.

**Dokumen & Stor
- Muat naik lampiran guna Cloudinary — tiada pengurusan dokumen berstruktur
  (versi, kategori dokumen, carian dokumen).

**Pembangunan / Kualiti**
- Ujian hanya pada lapisan kecil (AI post-process + permissions) — tiada
  ujian integrasi untuk route/server actions.
- Tiada dokumentasi API / skema untuk pembangunan.

> **Cadangan keutamaan:** Library charting (untuk dashboard), table sorting
> interaktif, dan notifikasi e-mel/Slack (guna `resend` yang sudah ada).

---

## 4. Struktur Pangkalan Data (garis besar)

Skema sebenar dalam `supabase/migrations/`. Hubungan kasar:

```
users  (id, auth_id, nama, emel, peranan[admin/pengurus/pegawai_susulan/viewer], status)
  │
  ├── fasiliti  (id, kod_rujukan, kategori[jv_syarikat/jv_tanah/pinjaman_individu],
  │      pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula/tamat,
  │      ringkasan_cagaran, nilai_cagaran, jumlah_tunggakan_semasa,
  │      status_fasiliti[aktif/tertunggak/tindakan_guaman/selesai], dicipta_oleh)
  │       │
  │       ├── fasiliti_pegawai  (fasiliti_id, user_id)  -- penugasan pegawai
  │       │
  │       └── susulan  (id, fasiliti_id, tanah_id(NULLABLE), tarikh_susulan,
  │              catatan, dicatat_oleh)
  │               │
  │               └── lampiran  (id, susulan_id, url_fail, jenis_fail[imej/dokumen], nama_asal)
  │
  ├── tanah_jv  (id, negeri, daerah, bandar_mukim, tempat, no_lot,
  │      tarikh_daftar, no_hak_milik, luas_meter_persegi, anggaran_nilaian,
  │      catatan, dicipta_oleh)
  │       │
  │       └── susulan  (melalui kolum tanah_id — polymorphic)
  │
  ├── log_audit  (id, user_id, tindakan, entiti_jenis, entiti_id, butiran[JSONB], tarikh)
  │
  └── chat_sesi  (id, user_id, tajuk)
          │
          └── chat_mesej  (id, sesi_id, peranan[user/assistant], kandungan)
```

**Hubungan kasar:**
- `users` → `fasiliti` (satu-ke-banyak, via `dicipta_oleh`)
- `users` ↔ `fasiliti` (banyak-ke-banyak, via `fasiliti_pegawai` — penugasan)
- `fasiliti` → `susulan` (satu-ke-banyak)
- `tanah_jv` → `susulan` (satu-ke-banyak, via `tanah_id` — polymorphic)
- `susulan` → `lampiran` (satu-ke-banyak)
- `users` → `log_audit` (satu-ke-banyak)
- `users` → `chat_sesi` → `chat_mesej` (satu-ke-banyak)

**Nota relevan:**
- Semua jadual utama guna **RLS** (row-level security) dengan peranan.
- Terdapat fungsi DB: `get_current_user_id()`, `get_current_user_role()`,
  `traceo_cipta_pengguna`, `traceo_kemaskini_status_pengguna`,
  `traceo_kemaskini_peranan` (transaksi ACID).
- Tiada jadual transaksi kewangan berasingan — jumlah kewangan disimpan
  sebagai kolum pada `fasiliti` (bukan lejar pergerakan tunai).
