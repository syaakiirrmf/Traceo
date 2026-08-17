# 🔍 Cadangan Open Source dari nosignups.net untuk Traceo

> Dianalisa daripada **234 tools** di [nosignups.net](https://nosignups.net) | Sistem: JV Facility & Chronology Management (Next.js 16, Supabase, Tailwind v4)

---

## 🧠 Konteks Sistem Traceo

| Aspek | Detail |
|-------|--------|
| **Stack** | Next.js 16, React 19, Supabase, TailwindCSS v4 |
| **Storage** | AWS S3, Cloudinary |
| **AI** | Google Gemini (`@google/generative-ai`) |
| **PDF/Docs** | `@pdfme/generator`, `docx` |
| **Charts** | Recharts |
| **Email** | Resend |
| **Cache** | Upstash Redis |
| **Export** | xlsx, docx |
| **Roles** | Admin, Pengurus, Pegawai Susulan, Viewer |
| **Core Features** | Fasiliti tracking, Kronologi, Susulan, Reports, Audit |

---

## 🎯 TOP PICKS — Sangat Relevan untuk Traceo

### 1. 📊 PDFme — `EDITOR'S PICK`
> **Kau dah guna ini!** (`@pdfme/generator` dalam package.json)

| | |
|---|---|
| **Link** | https://playground.pdfme.com/ |
| **GitHub** | https://github.com/pdfme/pdfme ⭐ 4.7k |
| **Licence** | MIT |
| **Tags** | #pdf-editor #pdf-designer #pdf-template |

**Kenapa relevan:** Playground ini berguna untuk **design template kronologi** secara visual sebelum implement dalam kod. Kau boleh drag-drop dan export schema JSON untuk digunakan dalam `@pdfme/generator`.

**Use case dalam Traceo:** Bina/semak template PDF Kronologi fasiliti secara visual.

---

### 2. 🗃️ drawDB — `FEATURED`
| | |
|---|---|
| **Link** | https://www.drawdb.app/ |
| **GitHub** | https://github.com/drawdb-io/drawdb ⭐ 38.1k |
| **Licence** | AGPL-3.0 |
| **Tags** | #database #erd #sql #schema |

**Kenapa relevan:** Tool untuk **visualize Supabase schema** Traceo — fasiliti, tanah-jv, susulan, audit, users. Boleh generate SQL secara visual dan keep track schema.

**Use case dalam Traceo:** Document dan visualize database schema untuk presentation kepada stakeholder atau onboarding developer baru.

---

### 3. 🔀 JSON Crack
| | |
|---|---|
| **Link** | https://jsoncrack.com/ |
| **GitHub** | https://github.com/AykutSarac/jsoncrack.com ⭐ 44.2k |
| **Licence** | GPL-2.0 |
| **Tags** | #json #diagram #visualize |

**Kenapa relevan:** Traceo ada banyak API responses (Supabase queries, Gemini AI responses). Tool ni boleh **visualize JSON struktur** untuk debugging dan documentation.

**Use case dalam Traceo:** Debug complex nested data dari Supabase (fasiliti + susulan + cagaran) dan visualize API responses dari Gemini AI.

---

### 4. 🌐 hoppscotch — `FEATURED`
| | |
|---|---|
| **Link** | https://hoppscotch.io/ |
| **GitHub** | https://github.com/hoppscotch/hoppscotch ⭐ 79.8k |
| **Licence** | MIT |
| **Tags** | #postman #api #test |

**Kenapa relevan:** **Alternatif Postman** yang open-source. Traceo ada Next.js API routes (`/api/chat`, `/api/fasiliti/[id]/kronologi-pdf`, etc.). Guna ini untuk test semua API routes.

**Use case dalam Traceo:** Test `/api/fasiliti`, `/api/audit`, `/api/chat` routes sebelum deploy. Boleh save collections untuk team testing.

---

### 5. 📋 Grist — `FEATURED`
| | |
|---|---|
| **Link** | https://docs.getgrist.com/ |
| **GitHub** | https://github.com/gristlabs/grist-core ⭐ 11.3k |
| **Licence** | Apache-2.0 |
| **Tags** | #spreadsheet #database #tables #collaboration |

**Kenapa relevan:** Grist adalah "modern relational spreadsheet" yang combine spreadsheet + database. **Sesuai untuk import/export data fasiliti** dan semak data Supabase secara tabular tanpa masuk dashboard admin.

**Use case dalam Traceo:** Pentadbir boleh guna Grist untuk batch-edit data sebelum import ke Traceo, atau sebagai staging area.

---

### 6. 🔒 CyberChef — `EDITOR'S PICK`
| | |
|---|---|
| **Link** | https://gchq.github.io/CyberChef/ |
| **GitHub** | https://github.com/gchq/CyberChef ⭐ 35.3k |
| **Licence** | Apache-2.0 |
| **Tags** | #encode #decode #hash #data-analytics |

**Kenapa relevan:** Traceo ada system audit log, Supabase JWT tokens, dan encryption. CyberChef berguna untuk **decode/verify JWT tokens**, hash passwords, dan debug data encoding issues.

**Use case dalam Traceo:** Verify Supabase JWT, decode base64 data, analyse audit log entries.

---

### 7. 📈 RAWGraphs
| | |
|---|---|
| **Link** | https://app.rawgraphs.io/ |
| **GitHub** | https://github.com/rawgraphs/rawgraphs-app ⭐ 9.0k |
| **Licence** | Apache-2.0 |
| **Tags** | #charts #visualization #graphs #svg |

**Kenapa relevan:** Export data fasiliti (CSV/Excel via `xlsx`) dan **visualize dalam RAWGraphs** untuk buat custom charts yang lebih advanced dari Recharts. Sesuai untuk laporan executive.

**Use case dalam Traceo:** Buat visualisasi arrears ratio, distribution pembiayaan, atau trend kategori fasiliti untuk laporan management.

---

### 8. 🔁 Transform
| | |
|---|---|
| **Link** | https://transform.tools/ |
| **GitHub** | https://github.com/ritz078/transform ⭐ 9.2k |
| **Licence** | MIT |
| **Tags** | #code #converter #syntax #ast #transformer |

**Kenapa relevan:** Convert antara JSON↔TypeScript types, JSON↔Zod schemas. **Sangat berguna** bila kau nak buat Zod validation schema baru untuk forms fasiliti/tanah-jv.

**Use case dalam Traceo:** Generate Zod schemas dari Supabase JSON responses, convert API response types ke TypeScript interfaces.

---

### 9. 🗂️ IT-Tools
| | |
|---|---|
| **Link** | https://it-tools.tech/ |
| **GitHub** | https://github.com/corentinth/it-tools ⭐ 39.8k |
| **Licence** | MIT |
| **Tags** | #tools #list |

**Kenapa relevan:** Koleksi 100+ developer tools dalam satu app — UUID generator, JSON formatter, cron expression builder, hash generator, base64, token generator.

**Use case dalam Traceo:** Generate test UUIDs untuk Supabase, build cron expressions untuk scheduled reports, format JSON untuk debugging.

---

### 10. 📝 Mermaid Live
| | |
|---|---|
| **Link** | https://mermaid.live/ |
| **GitHub** | https://github.com/mermaid-js/mermaid-live-editor ⭐ 6.7k |
| **Licence** | MIT |
| **Tags** | #diagrams #markdown #flowcharts #visualization |

**Kenapa relevan:** Buat **flow diagram** untuk Traceo workflows — contoh: lifecycle fasiliti (aktif → overdue → legal action), flow approval susulan, role-based access flow.

**Use case dalam Traceo:** Document business logic Traceo sebagai diagram untuk onboarding dan documentation.

---

### 11. 📄 lookscanned
| | |
|---|---|
| **Link** | https://lookscanned.io/ |
| **GitHub** | https://github.com/lookscanned/lookscanned.io ⭐ 3.6k |
| **Licence** | MIT |
| **Tags** | #pdf #documents #scan |

**Kenapa relevan:** Convert PDF output Traceo (Kronologi report) supaya **nampak seperti scanned document**. Berguna untuk dokumen legal/formal yang perlu nampak seperti salinan fizikal.

**Use case dalam Traceo:** Export Kronologi PDF dari Traceo, process melalui lookscanned untuk bagi "scanned copy" feel kepada dokumen legal.

---

### 12. 📊 Datasette Lite
| | |
|---|---|
| **Link** | https://lite.datasette.io/ |
| **GitHub** | https://github.com/simonw/datasette-lite ⭐ 405 |
| **Licence** | MIT |
| **Tags** | #sqlite #database #query #analytics |

**Kenapa relevan:** Load SQLite database file dan **query dalam browser** tanpa server. Berguna untuk offline analytics bila export data fasiliti.

**Use case dalam Traceo:** Export Supabase data sebagai SQLite, load ke Datasette Lite untuk ad-hoc queries oleh pengurus.

---

### 13. 🔐 Cryptgeon
| | |
|---|---|
| **Link** | https://cryptgeon.com/ |
| **GitHub** | https://github.com/cupcakearmy/cryptgeon ⭐ 1.5k |
| **Licence** | MIT |
| **Tags** | #notes #file-transfer #share #send |

**Kenapa relevan:** Share sensitive data (credentials, one-time passwords) dengan selamat antara team members. **End-to-end encrypted** dan self-destructing.

**Use case dalam Traceo:** Share Supabase credentials, API keys, atau sensitive audit information kepada team secara selamat.

---

### 14. 📐 draw.io — `EDITOR'S PICK`
| | |
|---|---|
| **Link** | https://www.drawio.com/ |
| **GitHub** | https://github.com/jgraph/drawio ⭐ 6.8k |
| **Licence** | Apache-2.0 |
| **Tags** | #diagrams #editor |

**Kenapa relevan:** Buat **system architecture diagram** untuk Traceo — Next.js → Supabase → AWS S3 → Cloudinary → Resend → Upstash Redis.

**Use case dalam Traceo:** Dokumentasi architecture untuk onboarding, client presentations, dan technical documentation.

---

### 15. 💡 Mr. Data Converter
| | |
|---|---|
| **Link** | https://shancarter.github.io/mr-data-converter/ |
| **GitHub** | https://github.com/shancarter/Mr-Data-Converter ⭐ 2.0k |
| **Tags** | #data-conversion #excel #csv |

**Kenapa relevan:** Convert antara Excel/CSV/JSON/TSV dengan mudah. **Berguna untuk migration data** dari Excel manual lama ke format yang boleh diimport ke Traceo.

**Use case dalam Traceo:** Convert Excel spreadsheet data fasiliti lama ke JSON/CSV untuk batch import ke Supabase.

---

### 16. 🖼️ Excalidraw — `FEATURED`
| | |
|---|---|
| **Link** | https://excalidraw.com/ |
| **GitHub** | https://github.com/excalidraw/excalidraw ⭐ 127.6k |
| **Licence** | MIT |
| **Tags** | #whiteboard #diagrams #sketch #collaboration |

**Kenapa relevan:** Whiteboard untuk brainstorm features baru, sketch UI mockups, dan collaborative planning dengan team.

**Use case dalam Traceo:** Brainstorm next features (contoh: notification system, mobile susulan flow, report templates) dengan team.

---

### 17. 📦 Bundlephobia
| | |
|---|---|
| **Link** | https://bundlephobia.com/ |
| **GitHub** | https://github.com/pastelsky/bundlephobia ⭐ 9.6k |
| **Licence** | MIT |
| **Tags** | #dependency-audit #frontend-optimization #npm-analyzer #bundle-size |

**Kenapa relevan:** Traceo ada banyak dependencies berat. Check bundle size sebelum tambah package baru.

**Use case dalam Traceo:** Audit `@pdfme/generator`, `recharts`, `xlsx`, `cloudinary` — pastikan bundle size tidak terlalu besar, terutama untuk field officers dengan slow internet.

---

### 18. 🔎 RegExr — `FEATURED`
| | |
|---|---|
| **Link** | https://regexr.com/ |
| **GitHub** | https://github.com/gskinner/regexr ⭐ 10.3k |
| **Licence** | GPL-3.0 |
| **Tags** | #regex #pattern-matching |

**Kenapa relevan:** Traceo ada Zod validation dengan regex patterns (telefon, MyKad, reference codes). Test regex patterns secara visual.

**Use case dalam Traceo:** Build dan test regex untuk validation `kod_rujukan`, nombor telefon, IC number dalam Zod schemas.

---

### 19. 🔗 Sqlime
| | |
|---|---|
| **Link** | https://sqlime.org/ |
| **GitHub** | https://github.com/nalgeon/sqlime ⭐ 1.1k |
| **Licence** | MIT |
| **Tags** | #sql #playground #learn |

**Kenapa relevan:** Test SQL queries dalam browser sebelum run dalam Supabase. Berguna untuk complex JOIN queries fasiliti.

**Use case dalam Traceo:** Test complex queries untuk dashboard analytics (arrears ratio, top financiers) sebelum implement dalam Supabase.

---

### 20. 📋 Log Voyager
| | |
|---|---|
| **Link** | https://www.logvoyager.cc/ |
| **GitHub** | https://github.com/hsr88/log-voyager ⭐ 117 |
| **Licence** | MIT |
| **Tags** | #logs #analyze #visualize |

**Kenapa relevan:** Traceo ada Sentry untuk error tracking dan audit logs. Log Voyager boleh **analyze dan visualize log files** secara offline.

**Use case dalam Traceo:** Analyze Sentry exported logs atau Supabase audit logs untuk troubleshoot issues.

---

### 21. 📎 Enclosed
| | |
|---|---|
| **Link** | https://enclosed.cc/ |
| **GitHub** | https://github.com/CorentinTh/enclosed ⭐ 2.0k |
| **Licence** | MIT |
| **Tags** | #notes #file-sharing #files |

**Kenapa relevan:** Share secure one-time notes dengan password protection. Alternative kepada Cryptgeon.

**Use case dalam Traceo:** Share temporary credentials atau sensitive financial data antara admin dan team secara selamat.

---

### 22. 🧮 CSV Repair
| | |
|---|---|
| **Link** | https://www.csv.repair/ |
| **GitHub** | https://github.com/hsr88/csv-repair ⭐ 9 |
| **Tags** | #csv #analyze #visualize #query |

**Kenapa relevan:** Bila export data dari Traceo (via `xlsx`) dan ada isu dengan CSV format, tool ini boleh **fix dan query CSV data**.

**Use case dalam Traceo:** Repair exported fasiliti CSV data yang corrupt atau malformed sebelum re-import.

---

## 📊 Summary Table — Relevance Matrix

| Tool | Category | Relevance | Use Case |
|------|----------|-----------|----------|
| **PDFme** | Productivity | ⭐⭐⭐⭐⭐ | Design PDF Kronologi template visual |
| **drawDB** | Development | ⭐⭐⭐⭐⭐ | Visualize & document Supabase schema |
| **hoppscotch** | Development | ⭐⭐⭐⭐⭐ | Test semua API routes Traceo |
| **JSON Crack** | Development | ⭐⭐⭐⭐⭐ | Debug JSON dari Supabase & Gemini |
| **Transform** | Development | ⭐⭐⭐⭐⭐ | Generate Zod schemas dari JSON types |
| **IT-Tools** | Development | ⭐⭐⭐⭐ | UUID, cron, hash, base64 tools |
| **RAWGraphs** | Data | ⭐⭐⭐⭐ | Advanced visualization untuk laporan exec |
| **CyberChef** | Privacy | ⭐⭐⭐⭐ | Decode JWT, debug auth tokens |
| **Mermaid Live** | Development | ⭐⭐⭐⭐ | Document fasiliti lifecycle flows |
| **draw.io** | Design | ⭐⭐⭐⭐ | Architecture diagram Traceo system |
| **Grist** | Productivity | ⭐⭐⭐⭐ | Staging/bulk edit data fasiliti |
| **lookscanned** | Writing | ⭐⭐⭐ | Bagi "scan" look pada PDF kronologi |
| **Mr. Data Converter** | Data | ⭐⭐⭐ | Migrate Excel data lama ke JSON/CSV |
| **Bundlephobia** | Development | ⭐⭐⭐ | Audit bundle size dependencies |
| **RegExr** | Development | ⭐⭐⭐ | Build & test Zod regex patterns |
| **Datasette Lite** | Data | ⭐⭐⭐ | Ad-hoc offline analytics |
| **Sqlime** | Development | ⭐⭐⭐ | Test complex Supabase SQL queries |
| **Excalidraw** | Design | ⭐⭐⭐ | Brainstorm & sketch new features |
| **Cryptgeon** | Privacy | ⭐⭐⭐ | Share credentials securely |
| **Log Voyager** | Development | ⭐⭐⭐ | Analyze Sentry/audit logs |
| **Enclosed** | Utilities | ⭐⭐ | Secure one-time data sharing |
| **CSV Repair** | Data | ⭐⭐ | Fix exported fasiliti CSV |

---

## 🚫 Tools yang TIDAK relevan untuk Traceo

Tools berikut **di-skip** kerana tiada use case dalam konteks JV Facility Management system:

- Media tools (OpenCut, AudioMass, VideoEditor) — No media production need
- Gaming (Godot, BottleShip, Piskel) — Wrong domain
- Design/art (Graphite, Pixelorama, JSPaint) — Not needed
- Education (Algorithm Visualizer, Python Tutor) — Not applicable
- Resume builders (Lanjut, Lanjut) — Wrong use case
- OSINT tools — Not relevant

---

## 💡 Bonus: Tools boleh jadi INSPIRASI untuk features baru Traceo

| Tool | Inspiration |
|------|------------|
| **Grist** | Tambah spreadsheet-like view untuk fasiliti list (inline editing) |
| **flowchart.fun** | Auto-generate kronologi timeline dari susulan entries |
| **Mermaid Live** | Embed Mermaid diagram dalam notes/kronologi untuk visualize payment schedule |
| **QuickRetro** | Tambah retrospective/review feature untuk status fasiliti meetings |
| **Logseq** | Knowledge base / SOP documentation untuk pegawai susulan |

---

*Dihasilkan: 2026-08-16 | Sumber: nosignups.net (234 tools dari 10 categories)*
