-- =============================================================
-- Traceo — Database Schema
-- Sistem Pengurusan Fasiliti JV & Penjanaan Kronologi
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'pengurus', 'pegawai_susulan', 'viewer');
CREATE TYPE user_status AS ENUM ('aktif', 'tidak_aktif');
CREATE TYPE fasiliti_kategori AS ENUM ('jv_syarikat', 'jv_tanah', 'pinjaman_individu');
CREATE TYPE fasiliti_status AS ENUM ('aktif', 'tertunggak', 'tindakan_guaman', 'selesai');
CREATE TYPE lampiran_jenis AS ENUM ('imej', 'dokumen');

-- ─── Table: users ──────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE,                        -- links to Supabase auth.users
  nama          TEXT NOT NULL,
  emel          TEXT NOT NULL UNIQUE,
  peranan       user_role NOT NULL DEFAULT 'viewer',
  status        user_status NOT NULL DEFAULT 'aktif',
  dicipta_pada  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: fasiliti ───────────────────────────────────────────────────────

CREATE TABLE fasiliti (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kod_rujukan               TEXT NOT NULL UNIQUE,   -- e.g. JV-001
  kategori                  fasiliti_kategori NOT NULL,
  pembiaya_modal            TEXT NOT NULL,
  nama_peminjam             TEXT NOT NULL,
  jumlah_pembiayaan         DECIMAL(15,2) NOT NULL DEFAULT 0,
  tarikh_mula               DATE NOT NULL,
  tarikh_tamat              DATE,
  ringkasan_cagaran         TEXT NOT NULL DEFAULT '',
  nilai_cagaran             DECIMAL(15,2),
  jumlah_tunggakan_semasa   DECIMAL(15,2) NOT NULL DEFAULT 0,
  status_fasiliti           fasiliti_status NOT NULL DEFAULT 'aktif',
  catatan_am                TEXT,
  dicipta_oleh              UUID NOT NULL REFERENCES users(id),
  dicipta_pada              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: fasiliti_pegawai ───────────────────────────────────────────────

CREATE TABLE fasiliti_pegawai (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fasiliti_id  UUID NOT NULL REFERENCES fasiliti(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(fasiliti_id, user_id)
);

-- ─── Table: susulan ────────────────────────────────────────────────────────

CREATE TABLE susulan (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fasiliti_id      UUID NOT NULL REFERENCES fasiliti(id) ON DELETE CASCADE,
  tarikh_susulan   DATE NOT NULL,
  catatan          TEXT NOT NULL,
  dicatat_oleh     UUID NOT NULL REFERENCES users(id),
  dicipta_pada     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: lampiran ───────────────────────────────────────────────────────

CREATE TABLE lampiran (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  susulan_id       UUID NOT NULL REFERENCES susulan(id) ON DELETE CASCADE,
  url_fail         TEXT NOT NULL,
  jenis_fail       lampiran_jenis NOT NULL DEFAULT 'imej',
  nama_asal        TEXT NOT NULL,
  dimuat_naik_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: log_audit ──────────────────────────────────────────────────────

CREATE TABLE log_audit (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id),
  tindakan     TEXT NOT NULL,        -- e.g. 'cipta_fasiliti', 'edit_susulan', 'jana_kronologi'
  entiti_jenis TEXT NOT NULL,        -- 'fasiliti', 'susulan', 'lampiran', 'user'
  entiti_id    UUID NOT NULL,
  butiran      JSONB,                -- before/after values if needed
  tarikh       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_fasiliti_status ON fasiliti(status_fasiliti);
CREATE INDEX idx_fasiliti_kategori ON fasiliti(kategori);
CREATE INDEX idx_fasiliti_dicipta_oleh ON fasiliti(dicipta_oleh);
CREATE INDEX idx_susulan_fasiliti_id ON susulan(fasiliti_id);
CREATE INDEX idx_susulan_tarikh ON susulan(tarikh_susulan);
CREATE INDEX idx_lampiran_susulan_id ON lampiran(susulan_id);
CREATE INDEX idx_fasiliti_pegawai_user ON fasiliti_pegawai(user_id);
CREATE INDEX idx_log_audit_user_id ON log_audit(user_id);
CREATE INDEX idx_log_audit_tarikh ON log_audit(tarikh DESC);

-- ─── Auto-update dikemaskini_pada trigger ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_dikemaskini_pada()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dikemaskini_pada = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fasiliti_dikemaskini
  BEFORE UPDATE ON fasiliti
  FOR EACH ROW EXECUTE FUNCTION update_dikemaskini_pada();

CREATE TRIGGER trg_susulan_dikemaskini
  BEFORE UPDATE ON susulan
  FOR EACH ROW EXECUTE FUNCTION update_dikemaskini_pada();
