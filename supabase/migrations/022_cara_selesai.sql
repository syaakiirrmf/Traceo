-- 022: Settle-via-asset — cara_selesai on fasiliti + RPC passthrough.
--
-- Business rule: a facility settles either by full payment (bayaran_penuh) or
-- when its collateral becomes an asset (melalui_aset: transferred to a nominee
-- or sold). Settled-via-asset rows clear jumlah_tunggakan_semasa (app layer)
-- so dashboard arrears stop counting resolved cases. NULL = legacy selesai
-- rows settled before this distinction existed.
--
-- NOTE: traceo_tambah_fasiliti / traceo_edit_fasiliti whitelist columns, so
-- both are redefined here with the new key (copied from 007 + cara_selesai).

ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS cara_selesai TEXT NULL
  CHECK (cara_selesai IN ('bayaran_penuh', 'melalui_aset'));

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
    penama_aset, status_pindahmilik, nama_kontraktor, harga_jualan, tahun_projek,
    cara_selesai
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
    NULLIF(p_payload->>'tahun_projek', '')::integer,
    NULLIF(p_payload->>'cara_selesai', '')
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
    tahun_projek         = NULLIF(p_payload->>'tahun_projek', '')::integer,
    cara_selesai         = NULLIF(p_payload->>'cara_selesai', '')
  WHERE id = p_id;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id)
  VALUES (get_current_user_id(), 'edit_fasiliti', 'fasiliti', p_id);
END;
$$;
