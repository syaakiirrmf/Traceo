-- =============================================================
-- Migration 015: Add superadmin to all RLS policies
-- Traceo — JV Facility & Chronology Management System
--
-- MASALAH: Peranan 'superadmin' tidak dikenali oleh RLS policies
-- sedia ada, menyebabkan superadmin tidak boleh akses data dalam
-- Supabase walaupun peranan dah ditetapkan dalam jadual users.
--
-- PENYELESAIAN: Pendekatan paling bersih & menyeluruh —
--   1. Kemaskini get_current_user_role() supaya tahu peranan superadmin
--   2. Tambah bypass policy (USING true) untuk superadmin pada setiap jadual
--   3. Kemaskini policies yang hardcode peranan tanpa guna helper function
-- =============================================================

-- ─── 1. BYPASS POLICIES: Superadmin boleh buat apa saja ─────────────────────
-- Cara paling bersih: tambah satu policy "superadmin bypass" pada setiap
-- jadual. Policy ini mengatasi semua polisi lain untuk superadmin.
--
-- ⚠️ PENTING: Jangan guna subquery `SELECT ... FROM users` dalam policy.
-- RLS akan re-evaluasi policy pada subquery tersebut -> infinite recursion
-- (SQLSTATE 42P17) dan SEMUA query ke table tersebut akan gagal untuk semua
-- pengguna berdaftar (termasuk admin!). Guna helper function
-- get_current_user_role() / get_current_user_id() yang SECURITY DEFINER
-- (bypass RLS) sebaliknya.

-- users table: superadmin boleh insert/update
DROP POLICY IF EXISTS "superadmin_bypass_users" ON public.users;
CREATE POLICY "superadmin_bypass_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- fasiliti table: superadmin boleh buat semua operasi
DROP POLICY IF EXISTS "superadmin_bypass_fasiliti" ON public.fasiliti;
CREATE POLICY "superadmin_bypass_fasiliti"
  ON public.fasiliti
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- susulan table: superadmin boleh buat semua operasi
DROP POLICY IF EXISTS "superadmin_bypass_susulan" ON public.susulan;
CREATE POLICY "superadmin_bypass_susulan"
  ON public.susulan
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- lampiran table: superadmin boleh buat semua operasi
DROP POLICY IF EXISTS "superadmin_bypass_lampiran" ON public.lampiran;
CREATE POLICY "superadmin_bypass_lampiran"
  ON public.lampiran
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- log_audit table: superadmin boleh baca log audit
DROP POLICY IF EXISTS "superadmin_bypass_log_audit" ON public.log_audit;
CREATE POLICY "superadmin_bypass_log_audit"
  ON public.log_audit
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'superadmin');

-- fasiliti_pegawai table: superadmin boleh buat semua operasi
DROP POLICY IF EXISTS "superadmin_bypass_fasiliti_pegawai" ON public.fasiliti_pegawai;
CREATE POLICY "superadmin_bypass_fasiliti_pegawai"
  ON public.fasiliti_pegawai
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- tanah_jv table: superadmin boleh buat semua operasi
DROP POLICY IF EXISTS "superadmin_bypass_tanah_jv" ON public.tanah_jv;
CREATE POLICY "superadmin_bypass_tanah_jv"
  ON public.tanah_jv
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- NOTE: chat_history bypass will be added once that table exists in DB

-- ─── 2. KEMASKINI get_current_user_role() ────────────────────────────────────
-- Fungsi ini digunakan secara meluas dalam policies lama.
-- Pastikan ia mengembalikan 'superadmin' dengan betul (sudah sepatutnya
-- berfungsi setelah enum ditambah, tapi kita recreate untuk pastikan).
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT peranan FROM public.users WHERE auth_id = (SELECT auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- ─── 3. Kemaskini policies yang hardcode semak peranan tanpa helper fn ────────
-- Policies dalam migration 012 untuk tanah_jv hardcode tanpa guna
-- get_current_user_role(). Kita dah ada bypass di atas, jadi cukup.

-- ─── 4. Bagi Grant untuk superadmin pada helper functions ────────────────────
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;

-- ─── VERIFY: Uncomment untuk semak policies ada ──────────────────────────────
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname LIKE 'superadmin%'
-- ORDER BY tablename, policyname;
