-- =============================================================
-- Traceo — Fix RLS Policies (pegawai_susulan delete + lampiran visibility)
-- Reconciles live DB with the permission matrix in lib/auth/permissions.ts:
--   * susulan_delete  : pegawai_susulan may delete their OWN records
--   * lampiran_select : restrict to same visibility as susulan
--   * lampiran_insert : inherit insert permission from parent susulan
-- =============================================================

-- ─── susulan: allow pegawai_susulan to delete their own records ────────────

DROP POLICY IF EXISTS "susulan_delete" ON susulan;

CREATE POLICY "susulan_delete"
  ON susulan FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus')
    OR (
      get_current_user_role() = 'pegawai_susulan'
      AND dicatat_oleh = get_current_user_id()
    )
  );

-- ─── lampiran: enforce fasiliti visibility + inherit from susulan ───────────

DROP POLICY IF EXISTS "lampiran_select" ON lampiran;

CREATE POLICY "lampiran_select"
  ON lampiran FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM susulan s
      WHERE s.id = lampiran.susulan_id
        AND (
          get_current_user_role() IN ('admin', 'pengurus', 'viewer')
          OR EXISTS (
            SELECT 1 FROM fasiliti_pegawai fp
            WHERE fp.fasiliti_id = s.fasiliti_id
              AND fp.user_id = get_current_user_id()
          )
        )
    )
  );

DROP POLICY IF EXISTS "lampiran_insert" ON lampiran;

CREATE POLICY "lampiran_insert"
  ON lampiran FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM susulan s
      WHERE s.id = lampiran.susulan_id
        AND (
          get_current_user_role() IN ('admin', 'pengurus')
          OR (
            get_current_user_role() = 'pegawai_susulan'
            AND EXISTS (
              SELECT 1 FROM fasiliti_pegawai fp
              WHERE fp.fasiliti_id = s.fasiliti_id
                AND fp.user_id = get_current_user_id()
            )
          )
        )
    )
  );
