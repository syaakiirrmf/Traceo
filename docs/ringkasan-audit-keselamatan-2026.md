# Ringkasan Audit Keselamatan & Pembaikan — Traceo

Tarikh: 13 Ogos 2026
Status: SEMUA fix selesai, disahkan (tsc/eslint/build lulus + ujian runtime)

---

## Skop Audit

Audit keselamatan dijalankan ke atas keseluruhan sistem Traceo:

- **Backend**: Supabase (Postgres, RLS, auth), Redis (Upstash), Edge Functions (Netlify)
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19
- **Modul**: Pengguna, Audit Log, Fasiliti JV, Tanah JV, Kronologi, Susulan, Ringkasan, Chat
- **Kawalan akses**: RBAC dengan peranan `admin`, `pengurus`, `pegawai_susulan`, `viewer`

Penemuan dikelaskan ikut keutamaan:
- **P1 (Critical)** — mesti dibaiki segera
- **P2 (High)** — perlu dibaiki
- **P3 (Low/Info)** — disahkan, mungkin dokumentasi sahaja

---

## Penemuan P1 (Critical) & Fix

### P1#1 — Policy `log_audit_insert` terima sebarang `user_id` (pemalsuan audit)

**Masalah**: Policy RLS `log_audit_insert` menggunakan `WITH CHECK (true)` — sesiapa sahaja boleh masukkan baris audit log atas nama pengguna lain. Ini memusnahkan integriti audit trail.

**Fix**: Policy ditukar kepada:
```sql
WITH CHECK (
  user_id = get_current_user_id()
  AND get_current_user_role() IN ('admin', 'pengurus', 'pegawai_susulan', 'viewer')
)
```
Setiap baris audit mesti atribut kepada pengguna yang sebenarnya membuat tindakan (dipasang dari JWT auth) dan mesti pengguna berperanan sah.

**Pengesahan**: Ujian dengan `SET ROLE authenticated` menunjukkan pengguna `viewer` yang cuba masukkan audit atas nama admin ditolak — `ERROR: new row violates row-level security policy`.

### P1#2 — Policy `users_select_authenticated = true` (pendedahan semua pengguna)

**Masalah**: Semua pengguna berdaftar boleh `SELECT` semua maklumat pengguna lain (nama, emel, peranan, status) — risiko enumerasi pengguna/emel.

**Fix**: Policy disasarkan kepada:
- `admin` / `pengurus` — lihat semua
- Pengguna sendiri — `auth_id = auth.uid()`
- Pengguna yang dirujuk oleh `susulan.dicatat_oleh` (untuk `viewer`/tugasan, supaya paparan join nama dalam susulan berfungsi)
- Pengguna yang dirujuk oleh `fasiliti_pegawai` (untuk `viewer`/tugasan)

**Pengesahan**:
- `pegawai_susulan` (Rafiq) hanya nampak dirinya sendiri
- `viewer` masih boleh resolve nama pengguna yang dirujuk dalam senarai susulan (join display berfungsi)
- `admin` nampak semua 5 pengguna

### P1#3 — Fungsi `next_kod_rujukan` boleh dieksekusi oleh `anon`

**Masalah**: Grant `EXECUTE` pada fungsi `next_kod_rujukan` diberikan kepada `PUBLIC`/`anon`. Sesiapa sahaja (tanpa login) boleh panggil fungsi ini untuk membakar sequence kod rujukan (jujukan `currval`/`nextval`) — boleh menyebabkan DoS dengan menghabiskan ruang nombor kod, atau menyebabkan nombor kod di-skip secara besar-besaran.

**Fix**:
```sql
REVOKE EXECUTE ON FUNCTION public.next_kod_rujukan FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_kod_rujukan TO authenticated;
```

**Pengesahan**: `has_function_privilege('anon', 'next_kod_rujukan', 'EXECUTE') = false`, `authenticated = true`.

### P1#4 — Tiada rate limiting pada login & chat (Redis terpasang tapi tidak digunakan)

**Masalah**: Modul rate limiting tidak wujud walaupun Redis (Upstash) sudah disediakan. Akibatnya:
- API `/api/auth/login` boleh diserang brute-force tanpa had
- API `/api/chat` boleh dibanjiri request secara bebas

**Fix**:
1. Fail baru `lib/ratelimit.ts` — helper fixed-window Redis counter:
   ```ts
   rateLimit(key: string, limit: number, windowSeconds: number)
   // → { ok, remaining, retryAfterSeconds }
   ```
2. `app/api/auth/login/route.ts` — route login baru dengan had **5 percubaan / 60 saat per IP** (dari `x-forwarded-for`/`x-real-ip`). Mesej 429 dalam Bahasa Melayu.
3. `app/api/chat/route.ts` — had **30 request / 60 saat per pengguna** (`rateLimit('chat:{id}', 30, 60)`).

**Pengesahan runtime**: 6 request berturut-turut ke `/api/auth/login` → 5 pertama `401`, request ke-6 dan seterusnya `429`.

---

## Penemuan P2 (High) & Fix

### P2#5 — Route kronologi `tanah-jv` tidak konsisten dengan route kronologi fasiliti

**Masalah**: Route kronologi fasiliti membenarkan `viewer`, tetapi route kronologi `tanah-jv` (`/kronologi` dan `/kronologi-pdf`) hanya `['admin', 'pengurus']` — walaupun permission `jana_kronologi` dalam matriks RBAC termasuk `viewer`. Ini menghalang `viewer` daripada menjana kronologi tanah seperti yang sepatutnya.

**Fix**: Kedua-dua route `app/api/tanah-jv/[id]/kronologi/route.ts` dan `kronologi-pdf/route.ts` ditukar kepada `['admin', 'pengurus', 'viewer']` — konsisten dengan fasiliti dan matriks permission.

### P2#6 — REVOKE 008 tidak berkesan (grant `PUBLIC =X` masih wujud) untuk `traceo_kemaskini_profil`

**Masalah**: Migrasi 008 cuba `REVOKE EXECUTE` pada `traceo_kemaskini_profil` daripada `anon`, tetapi ternyata grant `EXECUTE ... TO PUBLIC` (dari `GRANT ALL ON ALL FUNCTIONS`) masih wujud, menjadikan revoke awal tidak berkesan. Fungsi `traceo_*` lain juga dianugerahkan ke `PUBLIC`.

**Fix**:
- `REVOKE EXECUTE ON FUNCTION public.traceo_kemaskini_profil FROM PUBLIC, anon;`
- `GRANT EXECUTE ... TO authenticated;`
- Loops DO yang sama untuk **semua fungsi `traceo_*`** sebagai langkah pencegahan menyeluruh.

**Pengesahan**: Semua fungsi `traceo_*` — `anon_exec = false`, `auth_exec = true`. `get_current_user_id`/`get_current_user_role` kekal PUBLIC secara sengaja (diperlukan oleh penilaian RLS pada jadual, dan kembali `NULL` untuk unauthenticated).

### P2#7 — Firewall Netlify pasif (tiada had per-IP, tiada perlindungan endpoint kritikal)

**Masalah**: `netlify/edge-functions/firewall.ts` sebelumnya hanya menyekat bot/extensions/path yang diketahui dan `denyCountries` kosong — tiada had kadar per-IP, dan endpoint `/api/auth/login` tidak dilindungi pada lapisan edge.

**Fix**: Firewall ditulis semula:
- **`IP_LIMITS`** — had per-IP bagi `/login` dan `/api/auth/login`: 20 request / 60 saat
- **Redis best-effort** — guna `Redis.fromEnv()` untuk keyed limiting; jika tiada env, fungsi langkau secara selamat (fail-open untuk fungsi bukan kritikal, kekal menyekat untuk yang kritikal bila Redis ada)
- **Logging berstruktur** (console JSON) untuk audit edge
- **`excludedPath`** — senarai config untuk path yang perlu dikecualikan
- Kekalkan `BAD_BOTS`, `BAD_EXTENSIONS`, `BANNED_PATHS`, `SUSPICIOUS_KEYWORDS` sedia ada

---

## Penemuan P3 (Low/Info) & Status

### P3#8 — FK `log_audit_user_id_fkey` (bukan CASCADE) vs padam pengguna

**Status: Diselesaikan — tiada perubahan kod diperlukan.**

UI sistem hanya menyediakan **soft-delete** (toggle `aktif`/`tidak_aktif` dalam `UsersTable.tsx`). Tiada jalan padam fizikal dalam UI, jadi FK bukan-CASCADE tidak memberi kesan negatif kepada pengguna. Ia hanya menjejaskan padam manual SQL. Ini adalah tingkah laku yang betul untuk integriti audit trail (log audit tidak boleh dihapuskan dengan memadam pengguna).

### P3#9 — Guard halaman guna perbandingan literal `peranan !== 'admin'`

**Masalah**: Halaman Dashboard Users dan Audit menggunakan guard literal (contohnya hanya periksa `peranan !== 'admin'`), tidak konsisten dengan fungsi `hasPermission()` yang membaca matriks RBAC penuh (`lib/auth/permissions.ts`). Ini boleh menyebabkan logik akses yang tidak konsisten jika matriks permissions berubah.

**Fix**:
- `app/(dashboard)/dashboard/users/page.tsx` → `hasPermission(userProfile.peranan, 'urus_pengguna')`
- `app/(dashboard)/dashboard/audit/page.tsx` → `hasPermission(userProfile.peranan, 'lihat_audit_log')`

---

## Isu Aktif Ditemui Semasa Verifikasi Runtime (dan dibaiki)

**Bug**: `proxy.ts` (middleware) hanya menyenaraikan `['/', '/login']` sebagai public routes. Request POST ke `/api/auth/login` dianggap protected kerana tiada session → di-redirect ke `/login`, jadi route login API sebenar (dengan rate limit) tidak pernah dicapai — `fetch('/api/auth/login')` menerima HTML halaman login (200, body `null`).

**Fix**: Tambah `'/api/auth/login'` ke `publicRoutes` dalam `proxy.ts`, dan laraskan logik redirect supaya:
- Public page routes (`/`, `/login`) — redirect ke `/dashboard` jika sudah login
- Public API route (`/api/auth/login`) — lalukan terus (jangan redirect pengguna yang sudah login)

---

## Verifikasi Keseluruhan

| Item | Keputusan |
|------|-----------|
| `npx tsc --noEmit` | Lulus |
| `npx eslint` (fail diubah) | Lulus |
| `npm run build` | Lulus (route table termasuk `/api/auth/login` dan `/api/chat`) |
| Ujian SQL RLS (P1#1, P1#2, P1#3, P2#6) | Lulus |
| Ujian runtime rate limit login (P1#4) | 5×401 → 429 |
| Ujian login penuh (browser → dashboard) | Lulus |
| Ujian `next_kod_rujukan` anon (P1#3) | anon dinafikan, authenticated dibenarkan |
| Ujian firewall edge (P2#7) | Build lulus; konfigurasi IP_LIMITS disemak |

---

## Senarai Fail Diubah / Baru

| Fail | Perubahan |
|------|-----------|
| `supabase/migrations/011_security_hardening_fixes.sql` | **BARU** — fix P1#1, P1#2, P1#3, P2#6 |
| `lib/ratelimit.ts` | **BARU** — helper rate limiting Redis |
| `app/api/auth/login/route.ts` | **BARU** — route login dengan rate limit 5/60s per IP |
| `proxy.ts` | Tambah `/api/auth/login` ke publicRoutes + logik redirect API |
| `app/(auth)/login/page.tsx` | Guna `fetch('/api/auth/login')`; buang import supabase client |
| `app/api/chat/route.ts` | Rate limit 30/60s per pengguna |
| `app/api/tanah-jv/[id]/kronologi/route.ts` | Gate `['admin','pengurus','viewer']` |
| `app/api/tanah-jv/[id]/kronologi-pdf/route.ts` | Gate `['admin','pengurus','viewer']` |
| `netlify/edge-functions/firewall.ts` | Ditulis semula — IP_LIMITS, Redis best-effort, logging |
| `app/(dashboard)/dashboard/users/page.tsx` | Guard `hasPermission(..., 'urus_pengguna')` |
| `app/(dashboard)/dashboard/audit/page.tsx` | Guard `hasPermission(..., 'lihat_audit_log')` |

---

## Cadangan Susulan

1. **Ujian beban/penetration test** berkala (login brute-force, abuse chat API) selepas deploy.
2. Pertimbang **rate limit pada semua route mutating** (`POST`, `PUT`, `DELETE`) secara berperingkat.
3. Sediakan **alerting** (Sentry) bagi anomali 429/brute-force.
4. Kaji semula **polisi RLS** selepas setiap perubahan skema untuk elak regresi.
