-- =============================================================
-- Migration 004: Create tanah_jv table
-- Traceo — JV Facility & Chronology Management System
-- Run this in Supabase Dashboard > SQL Editor (after migration 003)
-- =============================================================

CREATE TABLE IF NOT EXISTS tanah_jv (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negeri                TEXT NOT NULL,
  daerah                TEXT NOT NULL,
  bandar_mukim          TEXT NOT NULL,
  tempat                TEXT NOT NULL,
  no_lot                TEXT NOT NULL,
  tarikh_daftar         DATE,
  no_hak_milik          TEXT,
  luas_meter_persegi    DECIMAL(15,4),
  anggaran_nilaian      DECIMAL(15,2),
  catatan               TEXT,
  dicipta_oleh          UUID NOT NULL REFERENCES users(id),
  dicipta_pada          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update trigger
DROP TRIGGER IF EXISTS trg_tanah_jv_dikemaskini ON tanah_jv;
CREATE TRIGGER trg_tanah_jv_dikemaskini
  BEFORE UPDATE ON tanah_jv
  FOR EACH ROW EXECUTE FUNCTION update_dikemaskini_pada();

-- Index
CREATE INDEX IF NOT EXISTS idx_tanah_jv_negeri ON tanah_jv(negeri);
CREATE INDEX IF NOT EXISTS idx_tanah_jv_dicipta_oleh ON tanah_jv(dicipta_oleh);

-- RLS
ALTER TABLE tanah_jv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tanah_jv"
  ON tanah_jv FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and pengurus can insert tanah_jv"
  ON tanah_jv FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND peranan IN ('admin', 'pengurus')
    )
  );

CREATE POLICY "Admin and pengurus can update tanah_jv"
  ON tanah_jv FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND peranan IN ('admin', 'pengurus')
    )
  );

CREATE POLICY "Admin can delete tanah_jv"
  ON tanah_jv FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND peranan = 'admin'
    )
  );
