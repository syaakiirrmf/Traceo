# Traceo — JV Facility & Chronology Management System

Internal system for tracking JV financing facilities (companies, land, individual loans),
follow-up chronology, and Word/PDF report generation. Replaces manual Excel/Word workflows.

Stack: **Next.js 16** (App Router) + **Supabase** (Postgres, Auth, RLS) + **Upstash Redis**
(rate limiting) + **Cloudinary** (attachments) + **Resend** (email) + **Gemini** (AI assistant).
Deployed on **Netlify** (`netlify.toml`).

## Quick start

```bash
npm install
cp .env.example .env.local   # isi nilai sebenar
npm run dev                  # http://localhost:3000
```

Required env (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_*`, `RESEND_API_KEY`,
`CLOUDINARY_*`, `GEMINI_API_KEY`, `SENTRY_DSN` (+ `NEXT_PUBLIC_SENTRY_DSN`, same value).

Database: apply migrations in order from `supabase/migrations/` (currently `001–021`)
via Supabase Dashboard → SQL Editor.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | dev / production build / serve |
| `npm run typecheck` | `tsc --noEmit` (wajib lulus sebelum commit) |
| `npm run lint` | ESLint `--max-warnings=0` |
| `npm test` / `npm run test:coverage` | Vitest / with V8 coverage |

## Roles & access

`superadmin` → `admin` → `pengurus` (manager) → `pegawai_susulan` (field officer) →
`viewer` (read-only). Enforced in 3 layers: `proxy.ts` (edge), RLS policies
(`supabase/migrations/021_fasa1_tighten_rls.sql`), and server actions / API routes
(`lib/auth/api.ts` → `requireApiUser()`). Disabled accounts (`tidak_aktif`) are blocked
at every layer with session revocation.

Key rules: pegawai only sees assigned facilities; tanah registry is admin/pengurus/viewer
only; audit writes go through RPC `traceo_audit()` (`lib/audit.ts`); uploads max
10 files / 10MB each / 50MB total, HEIC rejected with guidance (`lib/storage/limits.ts`).

## Docs

- `PRODUCT.md` — product context · `DESIGN.md` — design tokens
- `docs/api-reference.md` — schema, RLS, routes, rate limits
- `AGENTS.md` — Next.js 16 agent rules (read before writing code)
