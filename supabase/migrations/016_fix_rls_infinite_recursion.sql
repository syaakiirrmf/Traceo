-- =============================================================
-- Migration 016: Fix RLS infinite recursion (SQLSTATE 42P17)
-- Traceo — JV Facility & Chronology Management System
--
-- MASALAH: Policy `superadmin_bypass_*` dalam migration 015
-- menggunakan subquery `SELECT ... FROM users` dalam qual policy.
-- RLS menilai semula policy pada subquery tersebut -> infinite
-- recursion -> SQLSTATE 42P17. SEMUA query ke table tersebut oleh
-- pengguna authenticated gagal, termasuk login admin/superadmin
-- (dashboard layout sign out serta-merta).
--
-- PENYELESAIAN: Ganti subquery `FROM users` dengan helper function
-- get_current_user_role() / get_current_user_id() yang SECURITY
-- DEFINER (bypass RLS, tiada recursion).
--
-- TAMBAHAN: Tukar email auth superadmin daripada syakir@traceo.dev
-- kepada superadmin@traceo.dev supaya log masuk menggunakan email
-- yang sama dengan jadual public.users.
-- =============================================================

-- ── users ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_users" ON public.users;
CREATE POLICY "superadmin_bypass_users"
  ON public.users FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── fasiliti ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_fasiliti" ON public.fasiliti;
CREATE POLICY "superadmin_bypass_fasiliti"
  ON public.fasiliti FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── susulan ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_susulan" ON public.susulan;
CREATE POLICY "superadmin_bypass_susulan"
  ON public.susulan FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── lampiran ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_lampiran" ON public.lampiran;
CREATE POLICY "superadmin_bypass_lampiran"
  ON public.lampiran FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── log_audit ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_log_audit" ON public.log_audit;
CREATE POLICY "superadmin_bypass_log_audit"
  ON public.log_audit FOR SELECT TO authenticated
  USING (get_current_user_role() = 'superadmin');

-- ── fasiliti_pegawai ───────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_fasiliti_pegawai" ON public.fasiliti_pegawai;
CREATE POLICY "superadmin_bypass_fasiliti_pegawai"
  ON public.fasiliti_pegawai FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── tanah_jv ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_bypass_tanah_jv" ON public.tanah_jv;
CREATE POLICY "superadmin_bypass_tanah_jv"
  ON public.tanah_jv FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- ── feature_access ─────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_manage_feature_access" ON public.feature_access;
CREATE POLICY "superadmin_manage_feature_access"
  ON public.feature_access FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "users_read_own_feature_access" ON public.feature_access;
CREATE POLICY "users_read_own_feature_access"
  ON public.feature_access FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

-- ── page_access ────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_manage_page_access" ON public.page_access;
CREATE POLICY "superadmin_manage_page_access"
  ON public.page_access FOR ALL TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "users_read_own_page_access" ON public.page_access;
CREATE POLICY "users_read_own_page_access"
  ON public.page_access FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

-- ── tanah_jv: policy admin/pengurus juga subquery users ────────
DROP POLICY IF EXISTS "Admin and pengurus can update tanah_jv" ON public.tanah_jv;
CREATE POLICY "Admin and pengurus can update tanah_jv"
  ON public.tanah_jv FOR UPDATE TO authenticated
  USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'pengurus'::user_role]));

DROP POLICY IF EXISTS "Admin can delete tanah_jv" ON public.tanah_jv;
CREATE POLICY "Admin can delete tanah_jv"
  ON public.tanah_jv FOR DELETE TO authenticated
  USING (get_current_user_role() = 'admin'::user_role);

-- ── Selaraskan email auth superadmin ───────────────────────────
UPDATE auth.users
SET email = 'superadmin@traceo.dev'
WHERE email = 'syakir@traceo.dev';

-- ── VERIFY ─────────────────────────────────────────────────────
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual::text ILIKE '%from users%')
-- ORDER BY policyname;  -- mesti kosong (tiada recursion)
