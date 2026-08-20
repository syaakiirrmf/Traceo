-- =============================================================
-- Migration 020: Superadmin boleh tulis log_audit
-- Traceo — JV Facility & Chronology Management System
--
-- MASALAH: Polisi `superadmin_bypass_log_audit` dalam migration 015
-- hanya `FOR SELECT`. Semua RPC yang menulis audit (traceo_cipta_pengguna,
-- traceo_kemaskini_pengguna, traceo_kemaskini_status_pengguna,
-- traceo_kemaskini_peranan, dll.) adalah SECURITY INVOKER — INSERT ke
-- log_audit berjalan di bawah RLS pengguna yang memanggil.
--
-- Akibatnya, superadmin gagal dengan ralat RLS:
--   "new row violates row-level security policy for table log_audit"
-- apabila cuba kemaskini pengguna / cipta pengguna / tukar status / peranan.
--
-- PENYELESAIAN: Tukar polisi tersebut kepada FOR ALL (sama seperti
-- bypass policy jadual lain) supaya superadmin boleh insert/update/delete.
-- =============================================================

DROP POLICY IF EXISTS "superadmin_bypass_log_audit" ON public.log_audit;
CREATE POLICY "superadmin_bypass_log_audit"
  ON public.log_audit
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');