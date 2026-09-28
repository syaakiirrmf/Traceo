# Ringkasan Perubahan Sesi Ini (Fasa 0 → Follow-up)

Semua kerja dalam sesi ini: audit kekurangan → Fasa 0+1 (security) → Fasa 2 (data/export)
→ Fasa 3 (UX) → Fasa 4 (docs) → follow-up (compress, inline errors, agenda, purge secret).
Verify akhir: `tsc` 0 error · `eslint` 0/0 · `vitest` 59/59 · `npm run build` lulus.

---

## 1. FASA 0 — Guardrail & Hygiene

| Perubahan | Fail | Cara trigger / guna |
|---|---|---|
| Script `typecheck`, `test:coverage`, `lint --max-warnings=0`, `engines node>=20.9` | `package.json` | `npm run typecheck`, `npm run lint`, `npm run test:coverage` |
| Coverage V8 + `import.meta.dirname` (ganti `__dirname` deprecated) | `vitest.config.mts`, `test/stubs/server-only.ts` | `npm run test:coverage` |
| `target ES2022` | `tsconfig.json` | automatik via `typecheck`/`build` |
| `.env.example` baharu (JANGAN commit `.env.local`) | `.env.example` | `cp .env.example .env.local` |
| `server-only` guard (halang import service_role/secret dari client) | `lib/supabase/admin.ts`, `lib/storage/cloudinary.ts` | build akan gagal jika client import fail ini |
| `recovery-codes.txt` di-untrack + ignore | `.gitignore` | automatik |

## 2. FASA 1 — Security Critical

### 2.1 Database (migration `021_fasa1_tighten_rls.sql` — SUDAH APPLY ke Supabase)
- `tanah_jv SELECT` ditutup (`USING(true)` → skop admin/pengurus/viewer/pencipta).
- `susulan`/`lampiran SELECT` dibuang `OR tanah_id IS NOT NULL` (bocor) → ikut assignment.
- `fasiliti_pegawai SELECT` → admin/pengurus atau diri sendiri (anti-enumerasi).
- Tambah polisi tiada sebelum ini: `lampiran UPDATE`, `chat_sesi UPDATE`, `chat_mesej UPDATE/DELETE`, superadmin bypass chat.
- Pin `search_path` semua helper; `log_audit.entiti_id` nullable; RPC baharu **`traceo_audit()`** (SECURITY DEFINER, whitelist) ganti direct insert.
- Trigger: migration sudah di-apply; semak polisi: `SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='tanah_jv'`.

### 2.2 Auth & session
| Perubahan | Fail | Cara trigger |
|---|---|---|
| Login: fail-closed rate, block `tidak_aktif` sebelum sesi, cookies dijamin ke response, Origin check, Sentry 429 | `app/api/auth/login/route.ts` | cuba login akaun disabled → `403`; cuba 6x salah → `429` |
| `proxy.ts`: kekal security headers, block `tidak_aktif` di edge, RBAC kasar, `/api/health` perlu auth, CSP penuh | `proxy.ts`, `netlify.toml` | buka `/dashboard/users` sebagai viewer → redirect `?denied=1`; `GET /api/health` tanpa login → `401` |
| Health guna anon client (bukan service_role) | `app/api/health/route.ts` | `curl -H "Cookie: ..." localhost:3000/api/health` |
| Semua 6 actions + semua API routes check `status tidak_aktif`; `toggleUserStatus` revoke sesi; helper `requireApiUser()` / `requireActiveUser()` | `lib/actions/*.ts`, `lib/auth/api.ts`, `lib/auth/session.ts`, `app/api/*` | disable user → panggil API terus dengan JWT lama → `403` |
| Tukar password wajib password semasa (+field UI) | `lib/actions/profil.ts`, profil `page.tsx` | cuba tukar tanpa password semasa → error inline |
| Generator DOCX ada guard dalaman + assignment check | `lib/actions/kronologi.ts`, `tanah_kronologi.ts` | pegawai akses kronologi unassigned → `Access denied` |
| Chat: had 4k chars/128KB, Origin check, status check, rate fail-open + Sentry | `app/api/chat/route.ts` | hantar mesej gergasi → `413` |
| Rate semua export/kronologi/history/superadmin (10–60/60s) + audit via RPC `tulisAudit()` + cap export 2000 rows | `app/api/export/*`, `app/api/*/kronologi*`, `lib/audit.ts`, `lib/ratelimit.ts` (Lua atomik, IP validate, fail-closed vs fail-open), `lib/redis.ts` (lazy) | spam export → `429`; Redis down → login `503` (closed), export jalan + log (open) |

## 3. FASA 2 — Data & Export

| Perubahan | Fail | Cara trigger |
|---|---|---|
| **Zod validation** semua actions (whitelist enum, range nombor, `tarikh_tamat>=mula`, tarikh susulan ≤ hari ini, UUID pegawai, had panjang) | `lib/validation.ts` (+12 tests `lib/validation.test.ts`) | submit kategori `alien`/nombor negatif/tarikh masa depan → mesej error inline (lihat §5) |
| Upload: had 10 fail/10MB/50MB, magic-byte anti-spoof, mesej HEIC, sanitasi nama, upload selari (3), assert env, ralat dilempar (bukan skip senyap) | `lib/storage/cloudinary.ts`, `lib/storage/limits.ts`, `lib/actions/susulan.ts`, `tanah_jv_susulan.ts` (+8 tests) | upload 11 fail / HEIC / fail rosak → error jelas |
| Tambah/padam lampiran di edit page (+permission check) | actions `tambahLampiranSusulan`/`padamLampiran`, kedua-dua edit pages | buka edit susulan → tambah/padam lampiran |
| Imej DOCX selari (4) + timeout 15s | `kronologi.ts`, `tanah_kronologi.ts` | jana kronologi banyak foto → jauh lebih laju |
| Export Excel hormati filter UI (`?q=&status=&kategori=`) | `app/api/export/fasiliti/route.ts`, fasiliti `page.tsx` (ExportButton bawa filter) | filter list → export → Excel ikut filter |
| Pagination: timeline/preview cap 200 + count, kalendar tetingkap 3 bulan (`?skop=semua`), audit 50/page | detail pages, kronologi previews, `susulan/page.tsx`, `audit/page.tsx` | skrol timeline; `?skop=semua`; audit `?page=2` |
| Buang dead dep `cloudconvert` | `package.json` | — |

## 4. FASA 3 — UX Mobile & Forms

| Perubahan | Fail | Cara trigger |
|---|---|---|
| Debounce search betul + chevron selects | `FasilitiFilter.tsx` | taip di search → 1 navigasi selepas 400ms |
| ExportButton anti double-click + 44px | `components/ExportButton.tsx` | klik export → "Menjana..." 8s |
| SubmitButton pending + **ActionForm inline errors** (10 forms) | `components/ui/SubmitButton.tsx`, `components/forms/ActionForm.tsx` | submit invalid (cth. tarikh depan) → error merah dalam borang, bukan full-page |
| Grid responsif, touch 36–44px, kronologi preview mobile | forms, detail pages, previews | resize 360px |
| Kalendar: grid sorok di mobile, agenda jadi utama + empty state | `FollowUpCalendar.tsx` | buka kalendar di telefon |

## 5. FASA 4 — Docs & Deploy
- `README.md` ditulis semula (setup/env/roles/scripts). `docs/api-reference.md` dikemaskini (enum superadmin, audit RPC, health auth, export filter/cap/rate, DOCX, scripts, migrations 001–021).
- CSP Netlify + proxy: benarkan Sentry/Upstash/Gemini/Cloudinary/Resend (sebelum ini event client dibuang).

## 6. Follow-up Terakhir
- **Compress foto client** (`LampiranInput` + `browser-image-compression`): foto >1MB → ≤1920px/≤1MB JPEG di peranti (GIF/PDF/DOC kekal), papar "jimat XMB". Trigger: pilih foto besar → "Memampatkan foto...".
- **Purge `recovery-codes.txt`**: fail dipadam lokal + di-untrack; history di-rewrite (`filter-branch`, 38 commits) + force-push. **WAJIB: rotate kod tersebut** jika masih aktif — salinan mungkin wujud di clone lama.

## Perintah verify pantas
```bash
npm run typecheck && npm run lint && npm test && npm run build
```
