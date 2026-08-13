-- =============================================================
-- Migration 012: Database advisor fixes (security + performance)
-- Traceo - JV Facility & Chronology Management System
--
-- Fixes from Supabase database advisors:
--   SECURITY
--   1. update_dikemaskini_pada - pin search_path (mutable search_path warning)
--   2. get_current_user_id / get_current_user_role - revoke anon EXECUTE
--      (safe: no anon policies exist on any table; RLS eval for authenticated
--       still needs them, and they are SECURITY DEFINER returning NULL for anon)
--   PERFORMANCE
--   3. susulan.dicatat_oleh - add missing FK covering index
--   4. RLS initplan: wrap auth.uid() calls in (SELECT ...) so they are
--      evaluated once per query instead of per-row
--   5. Drop unused indexes (INFO level)
-- =============================================================

-- ─── 1. Pin search_path on trigger function ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_dikemaskini_pada()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.dikemaskini_pada = NOW();
  RETURN NEW;
END;
$function$;

-- ─── 2. Revoke anon EXECUTE on current-user helper functions ────────────────
-- These are SECURITY DEFINER. RLS policies evaluate them for the
-- `authenticated` role only (there are no `anon` policies in this schema).
-- `anon` calling them would just get NULL, but exposing SECURITY DEFINER
-- functions to unauthenticated users is unnecessary attack surface.
REVOKE EXECUTE ON FUNCTION public.get_current_user_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ─── 3. Index covering FK susulan.dicatat_oleh ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_susulan_dicatat_oleh
  ON public.susulan (dicatat_oleh);

-- ─── 4. RLS initplan optimization: evaluate auth.uid() once per query ────────
-- Wrap auth.uid() in a scalar subselect so Postgres plans it as an
-- initplan instead of re-evaluating per row.
DROP POLICY "Admin and pengurus can insert tanah_jv" ON public.tanah_jv;
CREATE POLICY "Admin and pengurus can insert tanah_jv"
  ON public.tanah_jv
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = (SELECT auth.uid())
        AND users.peranan IN ('admin', 'pengurus')
    )
  );

DROP POLICY "Admin and pengurus can update tanah_jv" ON public.tanah_jv;
CREATE POLICY "Admin and pengurus can update tanah_jv"
  ON public.tanah_jv
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = (SELECT auth.uid())
        AND users.peranan IN ('admin', 'pengurus')
    )
  );

DROP POLICY "Admin can delete tanah_jv" ON public.tanah_jv;
CREATE POLICY "Admin can delete tanah_jv"
  ON public.tanah_jv
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = (SELECT auth.uid())
        AND users.peranan = 'admin'
    )
  );

-- ─── 5. Drop unused indexes (INFO) ───────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_fasiliti_status;
DROP INDEX IF EXISTS public.idx_fasiliti_kategori;
DROP INDEX IF EXISTS public.idx_log_audit_tarikh;
DROP INDEX IF EXISTS public.idx_tanah_jv_negeri;

-- ─── 6. RLS initplan: wrap get_current_user_id/role in scalar subselects ─────
-- Same initplan optimization for the users SELECT policy so current_setting()
-- calls are evaluated once per query instead of per-row.
DROP POLICY users_select_authenticated ON public.users;
CREATE POLICY users_select_authenticated
  ON public.users
  FOR SELECT
  USING (
    (SELECT get_current_user_role()) IN ('admin', 'pengurus')
    OR auth_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.susulan s
      WHERE s.dicatat_oleh = users.id
        AND (
          (SELECT get_current_user_role()) = 'viewer'
          OR (
            s.fasiliti_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.fasiliti_pegawai fp
              WHERE fp.fasiliti_id = s.fasiliti_id
                AND fp.user_id = (SELECT get_current_user_id())
            )
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.fasiliti_pegawai fp
      WHERE fp.user_id = users.id
        AND (
          (SELECT get_current_user_role()) = 'viewer'
          OR EXISTS (
            SELECT 1 FROM public.fasiliti_pegawai fp2
            WHERE fp2.fasiliti_id = fp.fasiliti_id
              AND fp2.user_id = (SELECT get_current_user_id())
          )
        )
    )
  );

-- ─── 7. Split fasiliti_pegawai_modify (ALL) into per-action policies ─────────
-- Removes the multiple-permissive-policy overhead on SELECT.
DROP POLICY fasiliti_pegawai_modify ON public.fasiliti_pegawai;
CREATE POLICY fasiliti_pegawai_modify
  ON public.fasiliti_pegawai
  FOR INSERT
  WITH CHECK (get_current_user_role() IN ('admin', 'pengurus'));

CREATE POLICY fasiliti_pegawai_update
  ON public.fasiliti_pegawai
  FOR UPDATE
  USING (get_current_user_role() IN ('admin', 'pengurus'))
  WITH CHECK (get_current_user_role() IN ('admin', 'pengurus'));

CREATE POLICY fasiliti_pegawai_delete
  ON public.fasiliti_pegawai
  FOR DELETE
  USING (get_current_user_role() IN ('admin', 'pengurus'));
