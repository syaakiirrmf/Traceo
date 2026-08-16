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
**Supabase Dashboard** (atau gunakan Management access token):

1. **`disable_signup`** — kini `false` (signup awam terbuka). Sistem dalaman
   sepatutnya `true` (pentadbir sahaja yang cipta akaun).
2. **Password policy** di peringkat Supabase (Auth → Authentication →
   Password rules): minimum length & kekuatan.
3. **CAPTCHA** (hCaptcha / Cloudflare Turnstile) pada aliran login & signup.
4. **Backup / PITR (Point-in-Time Recovery)** — semak & aktifkan di
   Database → Backups (cadangan: PITR untuk pemulihan data).
5. **Sentry alerting** — konfigurasi peraturan alert (email/Slack) untuk
   error rate di dashboard Sentry.

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
