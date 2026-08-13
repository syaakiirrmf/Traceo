-- =============================================================
-- Migration 007: ACID — Atomic transactions for composite writes
-- Traceo — JV Facility & Chronology Management System
--
-- WHY:
--   The supabase-js client has no multi-statement transaction API.
--   Previously every composite write (e.g. insert fasiliti + pegawai
--   + log_audit) was issued as separate requests. If one failed after
--   another succeeded, the data was left partially written — violating
--   atomicity and leaving orphaned rows.
--
--   This migration moves each composite write into a single Postgres
--   function. A Postgres function call is atomic: any failure rolls
--   back every statement inside it. Server actions now call these via
--   supabase.rpc() instead of chaining insert/update/delete.
--
--   Also fixes a race condition: kod_rujukan was generated via
--   COUNT()+1, which can collide under concurrency (isolation
--   violation). Replaced with dedicated sequences (nextval is
--   race-free).
--
-- SECURITY MODEL:
--   Functions are SECURITY INVOKER (the default) so RLS policies on
--   the underlying tables still apply to each statement inside the
--   transaction — the same policies that already gate direct writes.
--   The one exception is traceo_kemaskini_profil, which is SECURITY
--   DEFINER and scoped to the authenticated user's own row via
--   auth.uid() (fixes self-update being silently blocked by the
--   admin-only users UPDATE policy).
-- =============================================================

-- ─── Kod rujukan sequences (race-free) ────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS seq_kod_rujukan_jv START 1;
CREATE SEQUENCE IF NOT EXISTS seq_kod_rujukan_pi START 1;

-- Seed above existing maxima (including JVT/PL variants sharing the namespace)
SELECT setval('seq_kod_rujukan_jv', GREATEST(
  COALESCE((SELECT MAX(CAST(regexp_replace(kod_rujukan, '^JV-', '') AS int))
            FROM fasiliti WHERE kod_rujukan ~ '^JV-[0-9]+$'), 0),
  COALESCE((SELECT MAX(CAST(regexp_replace(kod_rujukan, '^JVT-', '') AS int))
            FROM fasiliti WHERE kod_rujukan ~ '^JVT-[0-9]+$'), 0)
));

SELECT setval('seq_kod_rujukan_pi', GREATEST(
  COALESCE((SELECT MAX(CAST(regexp_replace(kod_rujukan, '^PI-', '') AS int))
            FROM fasiliti WHERE kod_rujukan ~ '^PI-[0-9]+$'), 0),
  COALESCE((SELECT MAX(CAST(regexp_replace(kod_rujukan, '^PL-', '') AS int))
            FROM fasiliti WHERE kod_rujukan ~ '^PL-[0-9]+$'), 0)
));

-- ─── Helper: next kod rujukan ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION next_kod_rujukan(p_kategori fasiliti_kategori)
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_kategori = 'pinjaman_individu'
      THEN 'PI-' || lpad(nextval('seq_kod_rujukan_pi')::text, 3, '0')
    ELSE 'JV-' || lpad(nextval('seq_kod_rujukan_jv')::text, 3, '0')
  END;
$$;

-- ─── susulan: exactly one parent (fasiliti OR tanah) ─────────────────────────
-- Makes tanah-linked follow-ups valid (fasiliti_id is currently NOT NULL,
-- which broke tambahSusulanTanah). Consistency constraint for ACID.

ALTER TABLE susulan ALTER COLUMN fasiliti_id DROP NOT NULL;

ALTER TABLE susulan DROP CONSTRAINT IF EXISTS susulan_parent_check;
ALTER TABLE susulan ADD CONSTRAINT susulan_parent_check CHECK (
  (fasiliti_id IS NOT NULL)::int + (tanah_id IS NOT NULL)::int = 1
);

-- =============================================================
-- FASILITI
-- =============================================================

-- Tambah fasiliti + pegawai assignments + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_tambah_fasiliti(
  p_payload jsonb,
  p_pegawai_ids uuid[] DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
  v_id uuid;
  v_kod text;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'pengurus') THEN
    RAISE EXCEPTION 'Access denied: admin or pengurus required';
  END IF;

  v_kod := next_kod_rujukan((p_payload->>'kategori')::fasiliti_kategori);

  INSERT INTO fasiliti (
    kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan,
    tarikh_mula, tarikh_tamat, ringkasan_cagaran, nilai_cagaran, jumlah_tunggakan_semasa,
    status_fasiliti, catatan_am, dicipta_oleh,
    kadar_dividen, perkongsian_keuntungan, tunggakan_dividen, caj_lewat, bayaran_tambahan,
    penama_aset, status_pindahmilik, nama_kontraktor, harga_jualan, tahun_projek
  ) VALUES (
    v_kod,
    (p_payload->>'kategori')::fasiliti_kategori,
    p_payload->>'pembiaya_modal',
    p_payload->>'nama_peminjam',
    COALESCE((p_payload->>'jumlah_pembiayaan')::numeric, 0),
    (p_payload->>'tarikh_mula')::date,
    NULLIF(p_payload->>'tarikh_tamat', '')::date,
    COALESCE(p_payload->>'ringkasan_cagaran', ''),
    NULLIF(p_payload->>'nilai_cagaran', '')::numeric,
    COALESCE((p_payload->>'jumlah_tunggakan_semasa')::numeric, 0),
    COALESCE((p_payload->>'status_fasiliti')::fasiliti_status, 'aktif'),
    NULLIF(p_payload->>'catatan_am', ''),
    get_current_user_id(),
    NULLIF(p_payload->>'kadar_dividen', ''),
    COALESCE((p_payload->>'perkongsian_keuntungan')::numeric, 0),
    COALESCE((p_payload->>'tunggakan_dividen')::numeric, 0),
    COALESCE((p_payload->>'caj_lewat')::numeric, 0),
    COALESCE((p_payload->>'bayaran_tambahan')::numeric, 0),
    NULLIF(p_payload->>'penama_aset', ''),
    NULLIF(p_payload->>'status_pindahmilik', ''),
    NULLIF(p_payload->>'nama_kontraktor', ''),
    NULLIF(p_payload->>'harga_jualan', '')::numeric,
    NULLIF(p_payload->>'tahun_projek', '')::integer
  ) RETURNING id INTO v_id;

  IF p_pegawai_ids IS NOT NULL AND cardinality(p_pegawai_ids) > 0 THEN
    INSERT INTO fasiliti_pegawai (fasiliti_id, user_id)
    SELECT v_id, unnest(p_pegawai_ids);
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'cipta_fasiliti', 'fasiliti', v_id,
          jsonb_build_object('kod_rujukan', v_kod));

  RETURN v_id;
END;
$$;

-- Edit fasiliti + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_edit_fasiliti(
  p_id uuid,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'pengurus') THEN
    RAISE EXCEPTION 'Access denied: admin or pengurus required';
  END IF;

  UPDATE fasiliti SET
    kategori             = (p_payload->>'kategori')::fasiliti_kategori,
    pembiaya_modal       = p_payload->>'pembiaya_modal',
    nama_peminjam        = p_payload->>'nama_peminjam',
    jumlah_pembiayaan    = COALESCE((p_payload->>'jumlah_pembiayaan')::numeric, 0),
    tarikh_mula          = (p_payload->>'tarikh_mula')::date,
    tarikh_tamat         = NULLIF(p_payload->>'tarikh_tamat', '')::date,
    ringkasan_cagaran    = COALESCE(p_payload->>'ringkasan_cagaran', ''),
    nilai_cagaran        = NULLIF(p_payload->>'nilai_cagaran', '')::numeric,
    jumlah_tunggakan_semasa = COALESCE((p_payload->>'jumlah_tunggakan_semasa')::numeric, 0),
    status_fasiliti      = COALESCE((p_payload->>'status_fasiliti')::fasiliti_status, status_fasiliti),
    catatan_am           = NULLIF(p_payload->>'catatan_am', ''),
    kadar_dividen        = NULLIF(p_payload->>'kadar_dividen', ''),
    perkongsian_keuntungan = COALESCE((p_payload->>'perkongsian_keuntungan')::numeric, 0),
    tunggakan_dividen    = COALESCE((p_payload->>'tunggakan_dividen')::numeric, 0),
    caj_lewat            = COALESCE((p_payload->>'caj_lewat')::numeric, 0),
    bayaran_tambahan     = COALESCE((p_payload->>'bayaran_tambahan')::numeric, 0),
    penama_aset          = NULLIF(p_payload->>'penama_aset', ''),
    status_pindahmilik   = NULLIF(p_payload->>'status_pindahmilik', ''),
    nama_kontraktor      = NULLIF(p_payload->>'nama_kontraktor', ''),
    harga_jualan         = NULLIF(p_payload->>'harga_jualan', '')::numeric,
    tahun_projek         = NULLIF(p_payload->>'tahun_projek', '')::integer
  WHERE id = p_id;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'edit_fasiliti', 'fasiliti', p_id);
END;
$$;

-- Padam fasiliti (cascades pegawai/susulan/lampiran) + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_padam_fasiliti(
  p_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin required';
  END IF;

  DELETE FROM fasiliti WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fasiliti tidak dijumpai';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'padam_fasiliti', 'fasiliti', p_id);
END;
$$;

-- Replace pegawai assignments + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_kemaskini_pegawai(
  p_fasiliti_id uuid,
  p_pegawai_ids uuid[] DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'pengurus') THEN
    RAISE EXCEPTION 'Access denied: admin or pengurus required';
  END IF;

  DELETE FROM fasiliti_pegawai WHERE fasiliti_id = p_fasiliti_id;

  IF p_pegawai_ids IS NOT NULL AND cardinality(p_pegawai_ids) > 0 THEN
    INSERT INTO fasiliti_pegawai (fasiliti_id, user_id)
    SELECT p_fasiliti_id, unnest(p_pegawai_ids);
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'kemaskini_pegawai', 'fasiliti', p_fasiliti_id,
          jsonb_build_object('pegawai_ids', to_jsonb(p_pegawai_ids)));
END;
$$;

-- =============================================================
-- SUSULAN (fasiliti-linked and tanah-linked)
-- =============================================================

-- Tambah susulan + lampiran + audit, atomically.
-- p_id is pre-generated in the server action so Cloudinary files can be
-- uploaded under susulan/<p_id> BEFORE this call; lampiran urls are passed
-- in p_lampiran (jsonb array of {url_fail, jenis_fail, nama_asal}).
CREATE OR REPLACE FUNCTION traceo_tambah_susulan(
  p_id uuid,
  p_fasiliti_id uuid,
  p_tanah_id uuid,
  p_tarikh_susulan date,
  p_catatan text,
  p_lampiran jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO susulan (id, fasiliti_id, tanah_id, tarikh_susulan, catatan, dicatat_oleh)
  VALUES (p_id, p_fasiliti_id, p_tanah_id, p_tarikh_susulan, p_catatan, get_current_user_id());

  IF jsonb_typeof(p_lampiran) = 'array' AND jsonb_array_length(p_lampiran) > 0 THEN
    INSERT INTO lampiran (susulan_id, url_fail, jenis_fail, nama_asal)
    SELECT p_id,
           l->>'url_fail',
           COALESCE((l->>'jenis_fail')::lampiran_jenis, 'imej'),
           l->>'nama_asal'
    FROM jsonb_array_elements(p_lampiran) AS l;
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'cipta_susulan', 'susulan', p_id);
END;
$$;

-- Edit susulan + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_edit_susulan(
  p_id uuid,
  p_tarikh_susulan date,
  p_catatan text
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE susulan SET tarikh_susulan = p_tarikh_susulan, catatan = p_catatan
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Susulan tidak dijumpai atau tiada kebenaran';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'edit_susulan', 'susulan', p_id);
END;
$$;

-- Padam susulan (cascades lampiran) + audit, atomically.
-- Returns the lampiran url_fail list so the caller can clean up Cloudinary
-- after the transaction commits (external side-effect compensation).
CREATE OR REPLACE FUNCTION traceo_padam_susulan(
  p_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_urls jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(url_fail), '[]'::jsonb) INTO v_urls
  FROM lampiran WHERE susulan_id = p_id;

  DELETE FROM susulan WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Susulan tidak dijumpai atau tiada kebenaran';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'padam_susulan', 'susulan', p_id);

  RETURN v_urls;
END;
$$;

-- =============================================================
-- TANAH JV
-- =============================================================

-- Tambah tanah_jv + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_tambah_tanah_jv(
  p_payload jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
  v_id uuid;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'pengurus') THEN
    RAISE EXCEPTION 'Access denied: admin or pengurus required';
  END IF;

  INSERT INTO tanah_jv (
    negeri, daerah, bandar_mukim, tempat, no_lot, tarikh_daftar, no_hak_milik,
    luas_meter_persegi, anggaran_nilaian, catatan, dicipta_oleh
  ) VALUES (
    p_payload->>'negeri',
    p_payload->>'daerah',
    p_payload->>'bandar_mukim',
    p_payload->>'tempat',
    p_payload->>'no_lot',
    NULLIF(p_payload->>'tarikh_daftar', '')::date,
    NULLIF(p_payload->>'no_hak_milik', ''),
    NULLIF(p_payload->>'luas_meter_persegi', '')::numeric,
    NULLIF(p_payload->>'anggaran_nilaian', '')::numeric,
    NULLIF(p_payload->>'catatan', ''),
    get_current_user_id()
  ) RETURNING id INTO v_id;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'cipta_tanah_jv', 'tanah_jv', v_id,
          jsonb_build_object('no_lot', p_payload->>'no_lot'));

  RETURN v_id;
END;
$$;

-- Edit tanah_jv + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_edit_tanah_jv(
  p_id uuid,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'pengurus') THEN
    RAISE EXCEPTION 'Access denied: admin or pengurus required';
  END IF;

  UPDATE tanah_jv SET
    negeri             = p_payload->>'negeri',
    daerah             = p_payload->>'daerah',
    bandar_mukim       = p_payload->>'bandar_mukim',
    tempat             = p_payload->>'tempat',
    no_lot             = p_payload->>'no_lot',
    tarikh_daftar      = NULLIF(p_payload->>'tarikh_daftar', '')::date,
    no_hak_milik       = NULLIF(p_payload->>'no_hak_milik', ''),
    luas_meter_persegi = NULLIF(p_payload->>'luas_meter_persegi', '')::numeric,
    anggaran_nilaian   = NULLIF(p_payload->>'anggaran_nilaian', '')::numeric,
    catatan            = NULLIF(p_payload->>'catatan', '')
  WHERE id = p_id;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'edit_tanah_jv', 'tanah_jv', p_id);
END;
$$;

-- Padam tanah_jv + audit, atomically.
CREATE OR REPLACE FUNCTION traceo_padam_tanah_jv(
  p_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin required';
  END IF;

  DELETE FROM tanah_jv WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tanah JV tidak dijumpai';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'padam_tanah_jv', 'tanah_jv', p_id);
END;
$$;

-- =============================================================
-- USERS (auth users are created via the admin API externally; the
-- users-row + audit insert is atomic here. The server action compensates
-- by deleting the auth user if this transaction fails.)
-- =============================================================

CREATE OR REPLACE FUNCTION traceo_cipta_pengguna(
  p_auth_id uuid,
  p_nama text,
  p_emel text,
  p_peranan text
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin required';
  END IF;

  INSERT INTO users (auth_id, nama, emel, peranan, status)
  VALUES (p_auth_id, p_nama, p_emel, p_peranan::user_role, 'aktif');

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'cipta_pengguna', 'user', p_auth_id,
          jsonb_build_object('nama', p_nama, 'emel', p_emel, 'peranan', p_peranan));
END;
$$;

CREATE OR REPLACE FUNCTION traceo_kemaskini_status_pengguna(
  p_id uuid,
  p_status text
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin required';
  END IF;

  UPDATE users SET status = p_status::user_status WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak dijumpai';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'kemaskini_status_pengguna', 'user', p_id,
          jsonb_build_object('status_baharu', p_status));
END;
$$;

CREATE OR REPLACE FUNCTION traceo_kemaskini_peranan(
  p_id uuid,
  p_peranan text
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role user_role := get_current_user_role();
BEGIN
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin required';
  END IF;

  UPDATE users SET peranan = p_peranan::user_role WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak dijumpai';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'kemaskini_peranan', 'user', p_id,
          jsonb_build_object('peranan_baharu', p_peranan));
END;
$$;

-- =============================================================
-- PROFIL (self update — SECURITY DEFINER scoped to auth.uid() so
-- users can update their own nama without bypassing admin role checks
-- on the users table)
-- =============================================================

CREATE OR REPLACE FUNCTION traceo_kemaskini_profil(
  p_nama text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  IF p_nama IS NULL OR trim(p_nama) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  UPDATE users SET nama = trim(p_nama) WHERE auth_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak dijumpai';
  END IF;
END;
$$;
