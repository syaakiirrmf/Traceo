# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: **Pegawai Susulan (field follow-up officer)** — records follow-up visits, notes, and photos from construction/facility sites using a phone or tablet, often on slow connections and under time pressure. Future design decisions prioritize this user: large touch targets, readable numbers outdoors, and a sub-60-second follow-up entry flow.

Other confirmed roles:
- **Admin** — full system management, users, audit logs.
- **Pengurus (Manager)** — manages facilities and follow-ups, assigns officers, exports reports.
- **Viewer** — read-only access to facility data for reference and meetings.
- **Superadmin** — exists in code (`user_role`) with elevated access control; exact boundary vs Admin is a working detail, not yet a documented product fact.

## Product Purpose

Traceo is an internal JV Facility & Chronology Management System. It exists to fully replace the manual Excel/Word workflow used to track financing facilities (JV companies, JV land, individual loans). Success means all facility and follow-up records live in Traceo and the Excel tracker is retired.

Core jobs-to-be-done:
1. Record and track JV financing facilities with key financial data.
2. Log follow-up visits/activities (date + notes + photos) chronologically.
3. Run the follow-up approval flow (menunggu → diluluskan / ditolak).
4. Generate formatted Kronologi (chronology) reports → export to Word (.docx) and PDF.
5. Monitor arrears and facility status at a glance.

## Positioning

The one internal tool that joins field follow-up capture with financing chronology: an officer logs a visit with photos from a phone, a manager approves it, and the system produces a boss-ready Kronologi document — covering company JV, land JV, and individual loans in one bilingual (English UI, Malay data) record, which a generic loan tracker or a raw Excel sheet cannot do end-to-end.

## Operating Context

- Desktop is the management surface (admin/manager office work); phone/tablet is the capture surface (officers in the field uploading photos).
- Field connectivity may be slow — minimize unnecessary data fetching.
- Legacy workflow is Excel (`SUMMARY FACILITIES` tracker with DONE / PENDING / DECLINED / DATABASE property / ASSET sheets) plus Word chronologies; every Excel workflow must exist in Traceo before Excel is retired.
- Rituals: follow-up visits, arrears monitoring, approval of susulan entries, kronologi generation for management/audit.
- Interface language: English (UI labels) + Malay (content/data).

## Capabilities and Constraints

Confirmed functionality: facility CRUD across three categories, susulan log with photo attachments (Cloudinary), susulan approval states, tanah JV registry, kronologi Word/PDF export, role-based and page/feature-level access control, immutable audit log, AI assistant (@syaakiirr) over facility data, Supabase Auth.

Durable constraints:
- Data accuracy over animation — this is financial record-keeping.
- Field-usable on small screens and slow networks.
- Least privilege by role; officers see only assigned facilities.

Real data loaded 2026-09-13 from `file excel/DATABASE - SUMMARY JV.xlsx` (8 sheets): 34 facilities (JV-001–007 company JV, JVT-001–008 land JV, PL-001–019 individual loans), 31 follow-up notes, 10 land registry lots. Dummy seed rows were backed up to `*_backup_20260913` tables, then replaced. Kod numbering restarts cleanly per category; `seq_kod_rujukan_jv/pi` remain far above (2038/3026), so future auto-numbering cannot collide.

## Brand Commitments

- Name: Traceo. Builder credit `@syaakiirr` appears in the product chrome.
- Voice: professional, precise, administrative. No marketing copy; CTAs name the exact action ("Jana kronologi", "Tambah susulan", "Eksport Word").

## Evidence on Hand

- `supabase/seed-dummy.sql` — dummy facility/susulan dataset currently in the database (not real).
- `../facility/documentation_excel_analysis.md` — analysis of the legacy Excel structure (reference only).
- `../facility/SUMMARY FACILITIES - LATEST.xlsm` — legacy tracker (reference only, per owner).
- Supabase migrations through `021_fasa1_tighten_rls` — schema and RLS history.
- Absences future work must not fabricate: no real customer dataset, no testimonials, no benchmarks.

## Product Principles

1. Field-first: the officer on a phone completes the core task fastest; desktop richness never comes at the field's expense.
2. Accuracy before polish: numbers, statuses, and chronology order are never approximated or faked for visual effect.
3. Excel parity, then retirement: no workflow is declared done until its Excel equivalent is fully covered.
4. Least privilege by default: each role sees exactly what it needs, nothing more.
5. Everything auditable: every mutation and generated document leaves a trace.

## Accessibility & Inclusion

Known need (not a certified standard): field officers use touch devices outdoors — minimum 44px touch targets, readable type above 11px, and layouts that survive 360px viewports. No formal WCAG conformance target has been established.
