# Traceo — API & Schema Reference

Sistem Pengurusan Fasiliti JV & Penjanaan Kronologi.

- Stack: Next.js 16 (App Router) + Supabase (Postgres, Auth, RLS) + Redis (Upstash).
- All API routes are **server-side**; the client talks to Supabase directly via the anon key for data.
- Database values (roles, statuses, categories) are stored in Malay **and must never be translated** — the UI maps them to English labels.

---

## 1. Database Schema

### Enums

| Enum | Values |
|---|---|
| `user_role` | `admin`, `pengurus`, `pegawai_susulan`, `viewer` (Superadmin is special-cased in app code, see below) |
| `user_status` | `aktif`, `tidak_aktif` |
| `fasiliti_kategori` | `jv_syarikat`, `jv_tanah`, `pinjaman_individu` |
| `fasiliti_status` | `aktif`, `tertunggak`, `tindakan_guaman`, `selesai` |
| `lampiran_jenis` | `imej`, `dokumen` |

> **Superadmin note:** there is no `superadmin` value in the `user_role` enum. A superadmin is a row in `users` created by the system owner (matching the app-config email). `permissions.ts` grants `superadmin` unconditional access; `supabase.auth.admin` is used to seed it.

### Tables

**users** (`001`)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `auth_id` | UUID UNIQUE | links to `auth.users` |
| `nama` | TEXT NOT NULL | |
| `emel` | TEXT NOT NULL UNIQUE | |
| `peranan` | `user_role` | default `viewer` |
| `status` | `user_status` | default `aktif` |
| `dicipta_pada` | TIMESTAMPTZ | |

**fasiliti** (`001`)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `kod_rujukan` | TEXT UNIQUE | e.g. `JV-001` |
| `kategori` | `fasiliti_kategori` | |
| `pembiaya_modal` | TEXT | financier |
| `nama_peminjam` | TEXT | borrower/contractor |
| `jumlah_pembiayaan` | DECIMAL(15,2) | financing |
| `tarikh_mula` | DATE | |
| `tarikh_tamat` | DATE | nullable |
| `ringkasan_cagaran` | TEXT | collateral summary |
| `nilai_cagaran` | DECIMAL(15,2) | nullable |
| `jumlah_tunggakan_semasa` | DECIMAL(15,2) | current arrears |
| `status_fasiliti` | `fasiliti_status` | |
| `catatan_am` | TEXT | nullable |
| `dicipta_oleh` | UUID FK → users | |
| `dicipta_pada` / `dikemaskini_pada` | TIMESTAMPTZ | |

**fasiliti_pegawai** (`001`) — assignment of officers to facilities. `UNIQUE(fasiliti_id, user_id)`.

**susulan** (`001`, extended in `006`)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `fasiliti_id` | UUID FK | nullable from `006` |
| `tanah_id` | UUID FK → tanah_jv | added in `006`; nullable |
| `tarikh_susulan` | DATE | |
| `catatan` | TEXT | |
| `dicatat_oleh` | UUID FK → users | |
| `dicipta_pada` / `dikemaskini_pada` | TIMESTAMPTZ | |

Constraint (`007`): exactly one of `fasiliti_id` / `tanah_id` must be set.

**lampiran** (`001`) — attachments to susulan: `url_fail`, `jenis_fail`, `nama_asal`, `dimuat_naik_pada`.

**log_audit** (`001`) — `user_id`, `tindakan`, `entiti_jenis`, `entiti_id`, `butiran` (JSONB), `tarikh`.

**tanah_jv** (`004`) — land registry: `negeri`, `daerah`, `bandar_mukim`, `tempat`, `no_lot`, `tarikh_daftar`, `no_hak_milik`, `luas_meter_persegi`, `anggaran_nilaian`, `catatan`, `dicipta_oleh`.

**chat_sesi / chat_mesej** (`013`) — AI assistant conversations, owner-only RLS.

**feature_access / page_access** (`014`) — superadmin access-control override tables (`user_id`, `feature_key`/`page_path`, `is_allowed`).

### RLS / Helpers

- `get_current_user_id()` — resolves `users.id` from `auth.uid()` (used by most policies).
- `update_dikemaskini_pada()` trigger — auto-stamps `dikemaskini_pada` on update (fasiliti, susulan, tanah_jv).
- Standard policy shape: `SELECT` for authenticated, `INSERT/UPDATE` restricted to `admin`/`pengurus` via `EXISTS` on `users`, `DELETE` to `admin` only; chat tables are owner-only.

---

## 2. App Permission Matrix

Defined in `lib/auth/permissions.ts` (key `permissions.ts`). `superadmin` bypasses everything.

| Permission | Roles |
|---|---|
| `urus_pengguna` | admin |
| `tambah_fasiliti` / `edit_fasiliti` | admin, pengurus |
| `padam_fasiliti` | admin |
| `lihat_fasiliti` | admin, pengurus, pegawai_susulan, viewer |
| `lihat_semua_fasiliti` | admin, pengurus, viewer |
| `tambah_susulan` / `edit_susulan_sendiri` / `padam_susulan` | admin, pengurus, pegawai_susulan |
| `edit_susulan_orang_lain` | admin, pengurus |
| `jana_kronologi` | all roles |
| `eksport_excel` | admin, pengurus |
| `lihat_audit_log` | admin |
| `lihat_dashboard` | all roles |
| `lihat_assistant` | admin, pengurus, pegawai_susulan |
| `lihat_tanah_jv` | admin, pengurus |
| `lihat_summary` | all roles |

`pegawai_susulan` visibility is additionally scoped to facilities in `fasiliti_pegawai`.

---

## 3. REST API Routes

All under `/api`. Auth = session cookie via `supabase.auth.getUser()` (or Supabase SSR client).

### Public / Utility

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | DB liveness probe → `200 {status:'ok', db:'ok'}` or `503 degraded/down` |

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | none | Email+password login via Supabase. **Rate-limited** (5 req / 60 s per IP). Normalizes email to lowercase. Errors: `400` missing/invalid body, `429` rate-limited, `401` bad credentials. |

### Exports

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/export/fasiliti` | session | Generates `.xlsx` of all facilities (`FASILITI_<DDMMYYYY>.xlsx`). `pegawai_susulan` scoped to assigned facilities (403 if none). Writes a `log_audit` row (`eksport_excel`). |
| GET | `/api/export/tanah-jv` | session | Generates `.xlsx` of all `tanah_jv` records. |

### Chronology / Kronologi

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/fasiliti/[id]/kronologi` | session | Returns the follow-up chronology (JSON) for a facility. |
| GET | `/api/fasiliti/[id]/kronologi-pdf` | session | Generates PDF of a facility chronology via `lib/pdf/kronologiPdfme.ts` (pdfme). |
| GET | `/api/tanah-jv/[id]/kronologi` | session | Chronology (JSON) for a `tanah_jv` record. |
| GET | `/api/tanah-jv/[id]/kronologi-pdf` | session | PDF of a land chronology via `lib/pdf/tanahKronologiPdfme.ts`. |

### AI Assistant

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/chat` | session | AI assistant chat (RAG over facilities/susulan; `lib/ai/functions.ts` queries DB). |
| GET | `/api/chat/history` | session | List chat sessions for current user. |
| GET | `/api/chat/history/[id]` | session | Load one session's messages. |

### Superadmin

| Method | Route | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/superadmin/page-access` | superadmin | Get/set `page_access` overrides. |
| GET/POST | `/api/superadmin/feature-access` | superadmin | Get/set `feature_access` overrides. |

---

## 4. Server Actions (`lib/actions`)

Server Actions are invoked directly (not HTTP) and also subject to `rateLimitAction` where relevant:

- `users.ts` — `toggleUserStatus`
- `kronologi.ts` / `tanah_kronologi.ts` — chronology generation (PDF/docx) + audit logging
- fasiliti / susulan / tanah-jv create/update/delete actions (rate-limited per `scope:ip:userId`)

---

## 5. Testing

- Runner: **Vitest** (`npm test`). Config: `vitest.config.mts` — includes `lib/**` and `app/**` test files.
- Existing suites: `lib/auth/permissions.test.ts`, `lib/ai/postProcess.test.ts`, and API route integration tests under `app/api/**/route.test.ts` (mock `@/lib/supabase/server`, `@/lib/supabase/admin`, `@/lib/ratelimit`, `next/headers`).
- Lint/typecheck: `npm run lint` (ESLint), `npx tsc --noEmit`.

## 6. Key Files

| Concern | Path |
|---|---|
| Server supabase client | `lib/supabase/server.ts` |
| Admin (service role) client | `lib/supabase/admin.ts` |
| Permissions | `lib/auth/permissions.ts` |
| Rate limiting | `lib/ratelimit.ts` |
| Notifications (overdue) | `lib/notifications.ts` |
| PDF generation | `lib/pdf/kronologiPdfme.ts`, `lib/pdf/tanahKronologiPdfme.ts` |
| AI functions | `lib/ai/functions.ts` |
| Migrations | `supabase/migrations/001–016` |