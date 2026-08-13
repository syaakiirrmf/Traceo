-- =============================================================
-- Migration 011: Security hardening fixes (P1 + P2#6)
-- Traceo — JV Facility & Chronology Management System
--
-- Fixes from the prioritized security audit:
--   P1#1  log_audit_insert allowed ANY authenticated user to insert
--         audit rows -> audit-log forgery. Now self-attributed only.
--   P1#2  users_select_authenticated = true -> any logged-in user could
--         enumerate the full staff directory (nama/emel/peranan/auth_id).
--         Now scoped to admin/pengurus, self, and users referenced by
--         facilities the caller can see (preserves embedded FK joins used
--         by viewer/pegawai_susulan display pages).
--   P1#3  next_kod_rujukan was callable by anon -> sequence-burning DoS.
--         Now authenticated only.
--   P2#6  Migration 008's REVOKE was ineffective: functions still carry a
--         PUBLIC =X grant. All traceo_* now drop PUBLIC and anon.
--
-- Note: get_current_user_id/role remain PUBLIC-executable because RLS
-- policies on anon-reachable tables evaluate them; they are harmless
-- (return NULL for unauthenticated).
-- =============================================================

-- ─── P1#1: log_audit insert — self-attribution + role gate ───────────────────
DROP POLICY IF EXISTS log_audit_insert ON log_audit;
CREATE POLICY log_audit_insert
  ON log_audit FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = get_current_user_id()
    AND get_current_user_role() IN ('admin', 'pengurus', 'pegawai_susulan', 'viewer')
  );

-- ─── P1#2: users SELECT — scope to admin/pengurus + self + referenced ─────────
DROP POLICY IF EXISTS users_select_authenticated ON public.users;
CREATE POLICY users_select_authenticated
  ON public.users FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus')
    OR auth_id = auth.uid()
    -- viewer / pegawai_susulan may read the recorder name of susulan on
    -- facilities they can see, and officers assigned to those facilities
    -- (these back the dicatat_oleh_user / user embedded joins).
    OR EXISTS (
      SELECT 1 FROM susulan s
      WHERE s.dicatat_oleh = users.id
        AND (
          get_current_user_role() = 'viewer'
          OR (s.fasiliti_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM fasiliti_pegawai fp
                WHERE fp.fasiliti_id = s.fasiliti_id
                  AND fp.user_id = get_current_user_id()
              ))
        )
    )
    OR EXISTS (
      SELECT 1 FROM fasiliti_pegawai fp
      WHERE fp.user_id = users.id
        AND (
          get_current_user_role() = 'viewer'
          OR EXISTS (
            SELECT 1 FROM fasiliti_pegawai fp2
            WHERE fp2.fasiliti_id = fp.fasiliti_id
              AND fp2.user_id = get_current_user_id()
          )
        )
    )
  );

-- ─── P1#3 + P2#6: revoke PUBLIC/anon EXECUTE; authenticated only ──────────────

-- next_kod_rujukan: only reachable from inside traceo_* (role-gated).
REVOKE EXECUTE ON FUNCTION public.next_kod_rujukan(fasiliti_kategori) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_kod_rujukan(fasiliti_kategori) FROM anon;
GRANT EXECUTE ON FUNCTION public.next_kod_rujukan(fasiliti_kategori) TO authenticated;

-- traceo_kemaskini_profil: the 008 revoke never took because of the PUBLIC
-- =X grant. Fix properly here.
REVOKE EXECUTE ON FUNCTION public.traceo_kemaskini_profil(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.traceo_kemaskini_profil(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.traceo_kemaskini_profil(text) TO authenticated;

-- All remaining traceo_* functions (SECURITY INVOKER, role-gated internally):
-- drop the PUBLIC =X grant and anon, keep authenticated + service_role.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'traceo_%'
      AND p.oid::regprocedure::text NOT IN
          ('traceo_kemaskini_profil(text)')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;