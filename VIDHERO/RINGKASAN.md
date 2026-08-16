# Traceo — Ringkasan Kerja

Ringkasan kerja-kerja penambahbaikan yang telah dilaksanakan pada sistem **Traceo**
(pengurusan fasiliti pembiayaan & JV tanah). Dokumen ini dikemas kini secara berkala.

> Status terakhir dikemas kini: **16 Ogos 2026**

---

## 1. Kualiti & CI/CD (SELESAI)

- **Prettier baseline** — keseluruhan kodbase diformat seragam (commit `d589311`).
- **Vitest + Husky + lint-staged** — rangka kerja ujian dan gating pra-commit
  (`74c4a65`). Ujian: **19/19 lulus**.
- **GitHub Actions CI** — workflow automatik (lint + test + build) untuk setiap
  push/PR.
- Hook `pre-commit` menjalankan prettier + eslint secara automatik.

## 2. Fungsi & UX (SELESAI — 5/5)

1. **Sejarah chat AI** (`afe3c22`)
   - Jadual `chat_sesi` + `chat_mesej` untuk persist perbualan.
   - Sidebar senarai sesi, sambung semula perbualan, tajuk automatik.
2. **Notifikasi susulan** (`6560c79`)
   - Loceng notifikasi dengan badge jumlah tertunggak.
   - Dropdown senarai fasiliti yang memerlukan tindakan susulan.
3. **Pagination & carian** (`bde60a3`)
   - Pagination server-side untuk halaman fasiliti (10 setiap muka).
   - Pagination client-side untuk jadual tanah JV (8) & pengguna (8).
   - Carian dengan reset muka surat automatik.
4. **Eksport Excel** (`07babc6`)
   - Eksport data fasiliti & tanah JV ke fail `.xlsx`.
   - Skop mengikut peranan (pegawai susulan: fasiliti ditugaskan sahaja).
   - Jejak audit (`log_audit` — tindakan `eksport_excel`).
   - Library `xlsx@0.18.5` dipindah ke `dependencies`.
5. **KPI Dashboard** (`e671cf8`)
   - Kad KPI: Arrears Ratio (19.8%), Collection Rate (80.2%),
     At-Risk Portfolio, Avg Financing.
   - Panel "Top Financiers by Exposure" (pembiaya teratas mengikut dedahan).

## 3. Keselamatan Lanjutan (SELESAI — peringkat aplikasi)

Commit `f36251b`:

- **Security headers** (semua route via `proxy.ts`):
  - `X-Frame-Options: DENY` (anti clickjacking)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (hadkan camera/mic/geolocation/payment/usb)
  - `Cross-Origin-Opener-Policy: same-origin`
- **Password policy** pada cipta pengguna (server + client):
  - Minimum 8 aksara; mesti ada huruf besar, huruf kecil & nombor.
- **Leaked-password check** — semak hash SHA-1 terhadap API
  **Have I Been Pwned** (k-anonymity) dan tolak kata laluan yang bocor.

Sedia ada (daripada sesi terdahulu):

- Rate limiting login (5/60s/IP) + server actions (mutating routes).
- Generic error login (elak user enumeration).
- Peranan & skop AI (RLS + role guard).

## 4. Operasi & Monitoring (SELESAI — peringkat aplikasi)

Commit `a6b3454`:

- **Health check endpoint** `/api/health` (route awam):
  - Menyemak sambungan pangkalan data (`db: ok/degraded/down`).
  - Mengembalikan `status`, `uptime`, `timestamp`.
  - Sesuai untuk uptime monitor luaran.
- **Sentry capture** pada route kritikal (chat AI, eksport Excel) supaya
  kegagalan direkod untuk alerting.
- Sentry sudah dikonfigurasi penuh (server/client/edge + instrumentation +
  session replay).

---

## Item yang memerlukan akses Supabase Dashboard / Management API

Berikut TIDAK boleh diubah melalui kod sahaja — perlu diubah manual di
**Supabase Dashboard**. Ikut langkah di bawah satu per satu.

---

### LANGKAH 1 — Disable public signup (`disable_signup: true`)

> **Kenapa:** Sistem dalaman — akaun hanya dicipta oleh pentadbir. Kini
> `disable_signup: false` bermakna sesiapa boleh mendaftar sendiri.

1. Log masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih project **Traceo** (`ncexqufycjbzhxwbatqx`).
3. Di menu sebelah kiri, buka **Authentication → Sign In / Up**.
4. Dalam bahagian **Email**, cari tetapan **Allow new users to sign up**.
5. **Matikan** toggle tersebut (pastikan ia jadi OFF / kelabu).
6. Klik **Save** / ia auto-simpan.
7. (Pilihan) Pastikan **Confirm email** kekal ON supaya pengesahan email
   diperlukan untuk aliran yang masih ada.

> Nota: Toggle ini ialah `disable_signup` yang kita sahkan kini `false`.

---

### LANGKAH 2 — Tetapkan password policy di Supabase

> **Kenapa:** Walaupun kita sudah kuatkuasakan policy di peringkat aplikasi
> (server + client), adalah lebih selamat untuk ikat juga di peringkat
> Supabase sebagai lapisan kedua.

1. Di project yang sama, buka **Authentication → Authentication** (atau
   **Auth → Providers**, bergantung pada versi dashboard).
2. Buka tab **Authentication → Password Rules** (atau **Auth → Settings →
   Password Rules**).
3. Tetapkan:
   - **Minimum password length**: `8`
   - **Password strength**: aktifkan **require uppercase**, **require
     lowercase**, **require number** (jika ada pilihan per aksara).
   - **Prevent password reuse** (jika tersedia): ON.
   - Jika ada pilihan **Common passwords / breached passwords block**: ON
     (Supabase menggunakan senarai NIST — ini selari dengan check HIBP kita).
4. Klik **Save**.

> Jika pilihan per-aksara tiada, sekurang-kurangnya tetapkan minimum length 8.
> Kod aplikasi kita sudah enforce upper/lower/number di sisi server.

---

### LANGKAH 3 — Aktifkan CAPTCHA (hCaptcha atau Cloudflare Turnstile)

> **Kenapa:** Melindungi aliran login/signup daripada serangan automatik
> (brute-force / credential stuffing) di peringkat Supabase.

**Pilih SATU pembekal sahaja.** Dua-dua tidak perlu; gunakan yang paling
mudah untuk anda — **Cloudflare Turnstile** disyorkan (percuma & tanpa
bayaran).

**Pilihan A — Cloudflare Turnstile (disyorkan):**

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile**.
2. Klik **Add Site** → masukkan nama site (cth: `Traceo Login`).
3. Dalam **Hostnames**, tambah domain deploy Traceo (cth: `traceo.vercel.app`
   atau domain custom anda).
4. Pilih widget mode: **Managed** (paling senang).
5. Klik **Create** — salin **Site Key** dan **Secret Key**.

6. Kembali ke Supabase → **Authentication → Authentication**.
7. Klik **Add CAPTCHA protection** → pilih **Cloudflare Turnstile**.
8. Tampal **Site Key** dan **Secret Key** yang disalin tadi.
9. Pilih **Enable CAPTCHA for**: Sign in (Login) + Sign up (sekurang-kurangnya
   Login).
10. Klik **Save**.

**Pilihan B — hCaptcha:**

1. Buka [hCaptcha](https://www.hcaptcha.com/) → daftar/masuk.
2. Buat **site key** baru → salin **Site Key** dan **Secret Key**.
3. Kembali ke Supabase → **Authentication → Authentication** →
   **Add CAPTCHA protection** → pilih **hCaptcha**.
4. Tampal kedua-dua key, pilih aliran (Login/Sign up), klik **Save**.

> Selepas ini, request login/signup yang tanpa token CAPTCHA akan ditolak
> oleh Supabase. (Boleh guna `fetchCaptchaToken` dari pakej supabase di
> frontend jika perlu.)

---

### LANGKAH 4 — Aktifkan Backup & Point-in-Time Recovery (PITR)

> **Kenapa:** Melindungi data daripada kehilangan / kerosakan. PITR membolehkan
> pemulihan ke titik masa tertentu.

1. Di project, buka **Database → Backups**.
2. Semak status semasa:
   - **Scheduled backups** — biasalah sudah aktif (auto) pada plan berbayar.
   - **PITR** — mungkin OFF (biasanya hanya pada plan Pro+).
3. Untuk mengaktifkan PITR (jika plan anda menyokong):
   - Klik **Enable PITR**.
   - Pilih tempoh penyimpanan (cth: **7 days**) — lebih panjang = lebih mahal.
   - Sahkan. Ia akan mula mengambil snapshot.
4. Untuk ujian pemulihan (disyorkan):
   - Klik **Restore** → pilih titik masa → **Review changes** (jangan terus
     restore ke production; guna **branch/DR** atau buat dump dulu).
   - Anda boleh buat **Database → Backups → Download backup** untuk salinan
     manual .sql sebagai sandaran luar.
5. (Pilihan) Jadualkan **daily backup** manual jika plan tidak ada scheduled.

> Cadangan minimum: pastikan sekurang-kurangnya **scheduled backups** aktif,
> dan aktifkan **PITR** jika bajet mengizinkan — paling penting untuk data
> `fasiliti`, `tanah_jv`, `users`, `log_audit`.

---

### LANGKAH 5 — Konfigurasi Sentry alerting

> **Kenapa:** Supaya anda dimaklumkan segera apabila ada error / penurunan
> kualiti pada aplikasi, bukan sekadar merekod dalam Sentry.

1. Buka [Sentry](https://sentry.io) → masuk ke organisasi **syaakiirr** →
   project **traceo**.
2. Di menu kiri, buka **Alerts** (atau **Issues → Alerts**).
3. Klik **Create Alert**.
4. Pilih jenis:
   - **Issues**: alert apabila error baharu muncul.
   - **Metrics**: alert apabila error rate melebihi ambang.
5. Konfigurasi **rule** yang dicadangkan:
   - **New issue**: trigger bila ada issue baharu yang "New".
   - **Issue frequency**: apabila issue tertentu berlaku lebih X kali dalam
     tempoh Y (cth: >5 dalam 30 min).
6. Tetapkan **conditions**:
   - Level: `error` dan `fatal` sahaja (abaikan `info`/`warning` sedia ada).
   - Environment: `production`.
7. Pilih **action**:
   - **Email** — anda dan pasukan.
   - **Slack** — sambungkan saluran `#traceo-alerts` (jika guna Slack).
8. Tetapkan **threshold** & **time window**, kemudian klik **Save Rule**.
9. (Pilihan) Tambah **Sentry monitor / uptime** bagi halaman login untuk
   memantau ketersediaan, selari dengan `/api/health` yang kita buat.

> Nota: Error dari route kritikal (chat AI, eksport Excel) sudah di-capture
> melalui `Sentry.captureException` — jadi alert ini akan menerima mesej
> sebaik sahaja ia berlaku.

---


## Teknologi

- **Next.js** 16.2.12 (Turbopack), **React** 19.2
- **Supabase** (Auth + Postgres + RLS) — project `ncexqufycjbzhxwbatqx`
- **Upstash Redis** (rate limiting)
- **Google Gemini** 3.1 (AI chat + tool calling)
- **Sentry** 10.69 (monitoring & error tracking)
- **xlsx** 0.18.5 (eksport Excel)
- **Vitest** 4.1 (ujian) + Husky/lint-staged/Prettier/ESLint

Repo: `github.com/syaakiirrmf/Traceo.git` (branch `master`)
