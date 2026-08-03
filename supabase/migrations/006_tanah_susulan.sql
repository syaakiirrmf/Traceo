-- =============================================================
-- Migration 006: Polymorphic susulan for Tanah MD (tanah_jv)
-- Adds nullable tanah_id to susulan so follow-up records can belong
-- to either a fasiliti (fasiliti_id) or a tanah record (tanah_id).
-- Update/delete/insert policies already cover both cases; only the
-- read policies need a tanah branch (tanah_jv is readable by all).
-- =============================================================

-- ─── Add tanah_id column ────────────────────────────────────────────────────

ALTER TABLE susulan
  ADD COLUMN IF NOT EXISTS tanah_id UUID REFERENCES tanah_jv(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_susulan_tanah_id ON susulan(tanah_id);

-- ─── susulan_select: allow reading tanah-linked records ─────────────────────

DROP POLICY IF EXISTS "susulan_select" ON susulan;

CREATE POLICY "susulan_select"
  ON susulan FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus', 'viewer')
    OR susulan.tanah_id IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM fasiliti_pegawai fp
      WHERE fp.fasiliti_id = susulan.fasiliti_id
        AND fp.user_id = get_current_user_id()
    )
  );

-- ─── lampiran_select: allow tanah-linked susulan lamps ─────────────────────

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
          OR s.tanah_id IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM fasiliti_pegawai fp
            WHERE fp.fasiliti_id = s.fasiliti_id
              AND fp.user_id = get_current_user_id()
          )
        )
    )
  );