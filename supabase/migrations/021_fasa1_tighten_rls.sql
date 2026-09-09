-- =============================================================
-- Migration 021: Fasa 1 — RLS tighten + audit RPC
-- Traceo — JV Facility & Chronology Management System
--
-- Menutup lubang dari audit Fasa 0:
--   1. tanah_jv SELECT USING(true) -> skop peranan
--   2. susulan/lampiran SELECT OR tanah_id IS NOT NULL (bocor) -> skop peranan
--   3. fasiliti_pegawai SELECT USING(true) -> skop
--   4. lampiran tiada UPDATE -> tambah
--   5. chat_sesi tiada UPDATE, chat_mesej tiada UPDATE/DELETE -> tambah
--      + superadmin bypass untuk chat_* (TODO 015)
--   6. get_current_user_id() tiada SET search_path -> pin
--   7. log_audit forgeable -> RPC traceo_audit (SECURITY DEFINER)
--      + whitelist tindakan/entiti_jenis di policy
--
-- PENTING: Jangan guna subquery `FROM users` dalam policy (recursion 42P17).
-- Guna helper get_current_user_role() / get_current_user_id() sahaja.
-- =============================================================

-- ─── 0. Pin search_path + status helper ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT peranan FROM public.users WHERE auth_id = (SELECT auth.uid())
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ─── 1. tanah_jv SELECT: tutup USING(true) ──────────────────────────────────
-- Selaras dengan permission matrix lihat_tanah_jv (admin/pengurus) +
-- viewer baca (konsisten dengan fasiliti_select) + pencipta sendiri.
-- pegawai_susulan TANPA assignment tanah tidak boleh baca (sebelum ini boleh).

DROP POLICY IF EXISTS "Authenticated users can read tanah_jv" ON public.tanah_jv;
CREATE POLICY "tanah_jv_select_scoped"
  ON public.tanah_jv FOR SELECT TO authenticated
  USING (
    (SELECT get_current_user_role()) IN ('admin', 'pengurus', 'viewer')
    OR dicipta_oleh = (SELECT get_current_user_id())
  );

-- Selaraskan insert/update/delete tanah ke helper (buang subquery FROM users
-- yang berisiko recursion + tidak konsisten dengan bypass superadmin).
DROP POLICY IF EXISTS "Admin and pengurus can insert tanah_jv" ON public.tanah_jv;
CREATE POLICY "tanah_jv_insert"
  ON public.tanah_jv FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT get_current_user_role()) IN ('admin', 'pengurus')
  );

DROP POLICY IF EXISTS "Admin and pengurus can update tanah_jv" ON public.tanah_jv;
DROP POLICY IF EXISTS "Admin and pengurus can update tanah_jv " ON public.tanah_jv;
CREATE POLICY "tanah_jv_update"
  ON public.tanah_jv FOR UPDATE TO authenticated
  USING ((SELECT get_current_user_role()) IN ('admin', 'pengurus'))
  WITH CHECK ((SELECT get_current_user_role()) IN ('admin', 'pengurus'));

DROP POLICY IF EXISTS "Admin can delete tanah_jv" ON public.tanah_jv;
CREATE POLICY "tanah_jv_delete"
  ON public.tanah_jv FOR DELETE TO authenticated
  USING ((SELECT get_current_user_role()) = 'admin');

-- ─── 2. susulan SELECT: buang OR tanah_id IS NOT NULL ───────────────────────
-- Rekod tanah ikut skop tanah (admin/pengurus/viewer); rekod fasiliti ikut
-- skop fasiliti sedia ada. Tiada lagi laluan baca tanpa check.

DROP POLICY IF EXISTS "susulan_select" ON public.susulan;
CREATE POLICY "susulan_select"
  ON public.susulan FOR SELECT TO authenticated
  USING (
    (SELECT get_current_user_role()) IN ('admin', 'pengurus', 'viewer')
    OR (
      susulan.fasiliti_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.fasiliti_pegawai fp
        WHERE fp.fasiliti_id = susulan.fasiliti_id
          AND fp.user_id = (SELECT get_current_user_id())
      )
    )
  );

-- ─── 3. lampiran SELECT + UPDATE ────────────────────────────────────────────

DROP POLICY IF EXISTS "lampiran_select" ON public.lampiran;
CREATE POLICY "lampiran_select"
  ON public.lampiran FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.susulan s
      WHERE s.id = lampiran.susulan_id
        AND (
          (SELECT get_current_user_role()) IN ('admin', 'pengurus', 'viewer')
          OR (
            s.fasiliti_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.fasiliti_pegawai fp
              WHERE fp.fasiliti_id = s.fasiliti_id
                AND fp.user_id = (SELECT get_current_user_id())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "lampiran_update" ON public.lampiran;
CREATE POLICY "lampiran_update"
  ON public.lampiran FOR UPDATE TO authenticated
  USING ((SELECT get_current_user_role()) IN ('admin', 'pengurus'))
  WITH CHECK ((SELECT get_current_user_role()) IN ('admin', 'pengurus'));

-- ─── 4. fasiliti_pegawai SELECT: tutup USING(true) ──────────────────────────
-- Admin/pengurus nampak semua (untuk assignment UI); pegawai/viewer hanya
-- baris sendiri. Menghalang enumerasi mapping fasiliti <-> user.

DROP POLICY IF EXISTS "fasiliti_pegawai_select" ON public.fasiliti_pegawai;
CREATE POLICY "fasiliti_pegawai_select"
  ON public.fasiliti_pegawai FOR SELECT TO authenticated
  USING (
    (SELECT get_current_user_role()) IN ('admin', 'pengurus')
    OR user_id = (SELECT get_current_user_id())
  );

-- ─── 5. chat_* lengkap + superadmin bypass ──────────────────────────────────

DROP POLICY IF EXISTS "chat_sesi_update_owner" ON public.chat_sesi;
CREATE POLICY "chat_sesi_update_owner"
  ON public.chat_sesi FOR UPDATE TO authenticated
  USING (user_id = (SELECT get_current_user_id()))
  WITH CHECK (user_id = (SELECT get_current_user_id()));

DROP POLICY IF EXISTS "chat_mesej_update_owner" ON public.chat_mesej;
CREATE POLICY "chat_mesej_update_owner"
  ON public.chat_mesej FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sesi s
      WHERE s.id = chat_mesej.sesi_id
        AND s.user_id = (SELECT get_current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sesi s
      WHERE s.id = chat_mesej.sesi_id
        AND s.user_id = (SELECT get_current_user_id())
    )
  );

DROP POLICY IF EXISTS "chat_mesej_delete_owner" ON public.chat_mesej;
CREATE POLICY "chat_mesej_delete_owner"
  ON public.chat_mesej FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sesi s
      WHERE s.id = chat_mesej.sesi_id
        AND s.user_id = (SELECT get_current_user_id())
    )
  );

-- Superadmin bypass untuk chat (menutup TODO migration 015).
DROP POLICY IF EXISTS "superadmin_bypass_chat_sesi" ON public.chat_sesi;
CREATE POLICY "superadmin_bypass_chat_sesi"
  ON public.chat_sesi FOR ALL TO authenticated
  USING ((SELECT get_current_user_role()) = 'superadmin')
  WITH CHECK ((SELECT get_current_user_role()) = 'superadmin');

DROP POLICY IF EXISTS "superadmin_bypass_chat_mesej" ON public.chat_mesej;
CREATE POLICY "superadmin_bypass_chat_mesej"
  ON public.chat_mesej FOR ALL TO authenticated
  USING ((SELECT get_current_user_role()) = 'superadmin')
  WITH CHECK ((SELECT get_current_user_role()) = 'superadmin');

-- ─── 6. log_audit: RPC + whitelist ──────────────────────────────────────────
-- Direct INSERT kekal untuk traceo_* dalaman (SECURITY INVOKER), tetapi
-- dihadkan kepada whitelist tindakan/entiti supaya viewer tidak boleh forge
-- sebarang audit. Laluan aplikasi (export/kronologi) mesti guna traceo_audit().
-- entiti_id dijadikan NULLABLE: eksport agregat (ringkasan/excel penuh) tiada
-- satu entiti — sebelum ini insert tanpa entiti_id gagal NOT NULL secara senyap.

ALTER TABLE public.log_audit ALTER COLUMN entiti_id DROP NOT NULL;

DROP POLICY IF EXISTS "log_audit_insert" ON public.log_audit;
DROP POLICY IF EXISTS log_audit_insert ON public.log_audit;
CREATE POLICY "log_audit_insert"
  ON public.log_audit FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT get_current_user_id())
    AND tindakan IN (
      'cipta_fasiliti', 'edit_fasiliti', 'padam_fasiliti', 'kemaskini_pegawai',
      'cipta_susulan', 'edit_susulan', 'padam_susulan', 'lulus_susulan',
      'cipta_tanah_jv', 'edit_tanah_jv', 'padam_tanah_jv',
      'cipta_pengguna', 'kemaskini_pengguna', 'kemaskini_status_pengguna',
      'kemaskini_peranan', 'kemaskini_profil',
      'jana_kronologi', 'eksport_excel', 'eksport_ringkasan'
    )
    AND entiti_jenis IN ('fasiliti', 'susulan', 'lampiran', 'tanah_jv', 'user')
  );

-- RPC audit untuk laluan aplikasi: SECURITY DEFINER, self-attributed,
-- whitelist yang sama. Grant kepada authenticated sahaja.
CREATE OR REPLACE FUNCTION public.traceo_audit(
  p_tindakan text,
  p_entiti_jenis text,
  p_entiti_id uuid DEFAULT NULL,
  p_butiran jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  IF p_tindakan NOT IN ('jana_kronologi', 'eksport_excel', 'eksport_ringkasan') THEN
    RAISE EXCEPTION 'Tindakan audit tidak dibenarkan: %', p_tindakan;
  END IF;

  IF p_entiti_jenis NOT IN ('fasiliti', 'susulan', 'tanah_jv', 'user') THEN
    RAISE EXCEPTION 'Entiti audit tidak dibenarkan: %', p_entiti_jenis;
  END IF;

  INSERT INTO public.log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (v_user_id, p_tindakan, p_entiti_jenis, p_entiti_id, p_butiran);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.traceo_audit(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.traceo_audit(text, text, uuid, jsonb) TO authenticated;
