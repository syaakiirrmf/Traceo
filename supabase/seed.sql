-- =============================================================
-- Traceo — Seed Data
-- Jalankan SELEPAS membuat Auth User pertama di Supabase Dashboard
-- =============================================================
-- 
-- CARA PENGGUNAAN:
-- 1. Pergi Supabase Dashboard → Authentication → Users
-- 2. Klik "Add user" → "Create new user"
--    Email: admin@traceo.dev
--    Password: Admin@1234
--    Auto Confirm User: YES (tick)
-- 3. Copy UUID dari kolum "UID" pengguna yang baru dicipta
-- 4. Replace 'PASTE_AUTH_UID_HERE' di bawah dengan UUID tersebut
-- 5. Run SQL ini dalam SQL Editor
-- =============================================================

-- Insert admin user (replace UUID dengan auth UID dari Supabase Auth)
INSERT INTO users (auth_id, nama, emel, peranan, status)
VALUES (
  'ed991aef-89a8-432f-ac14-2b753df739f1'::uuid,  -- <-- TUKAR INI
  'Administrator',
  'admin@traceo.dev',
  'admin',
  'aktif'
)
ON CONFLICT (auth_id) DO NOTHING;

-- =============================================================
-- (OPTIONAL) Data demo — uncomment untuk test UI
-- =============================================================

-- Uncomment blok di bawah untuk seed data demo:
/*

-- Contoh fasiliti (perlu ada user admin dulu)
INSERT INTO fasiliti (
  kod_rujukan, kategori, pembiaya_modal, nama_peminjam,
  jumlah_pembiayaan, tarikh_mula, tarikh_tamat,
  ringkasan_cagaran, nilai_cagaran,
  jumlah_tunggakan_semasa, status_fasiliti,
  catatan_am, dicipta_oleh
)
SELECT
  'JV-001',
  'jv_syarikat',
  'Bank Islam Malaysia Berhad',
  'Syarikat ABC Sdn Bhd',
  5000000.00,
  '2022-01-15',
  '2027-01-15',
  'Lot 123, Taman Industri Baru, Shah Alam, Selangor',
  8500000.00,
  125000.00,
  'tertunggak',
  'Fasiliti pembiayaan JV untuk projek perumahan fasa 2',
  id
FROM users WHERE emel = 'admin@traceo.dev'
LIMIT 1;

INSERT INTO fasiliti (
  kod_rujukan, kategori, pembiaya_modal, nama_peminjam,
  jumlah_pembiayaan, tarikh_mula,
  ringkasan_cagaran, jumlah_tunggakan_semasa, status_fasiliti,
  dicipta_oleh
)
SELECT
  'JV-002',
  'jv_tanah',
  'Maybank Islamic',
  'Encik Rahman bin Hussain',
  2500000.00,
  '2023-06-01',
  'PN123456 Lot 456, Mukim Petaling, Kuala Lumpur',
  0.00,
  'aktif',
  id
FROM users WHERE emel = 'admin@traceo.dev'
LIMIT 1;

INSERT INTO fasiliti (
  kod_rujukan, kategori, pembiaya_modal, nama_peminjam,
  jumlah_pembiayaan, tarikh_mula,
  ringkasan_cagaran, jumlah_tunggakan_semasa, status_fasiliti,
  dicipta_oleh
)
SELECT
  'PI-001',
  'pinjaman_individu',
  'CIMB Islamic',
  'Puan Siti binti Ahmad',
  750000.00,
  '2021-03-10',
  'Rumah teres 2 tingkat No. 12, Jalan Mawar, Subang Jaya',
  45000.00,
  'tindakan_guaman',
  id
FROM users WHERE emel = 'admin@traceo.dev'
LIMIT 1;

*/
