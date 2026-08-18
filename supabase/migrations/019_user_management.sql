-- =============================================================
-- Migration 019: Superadmin user management
-- Traceo — JV Facility & Chronology Management System
--
-- WHY:
--   The original user-management RPC functions (traceo_cipta_pengguna,
--   traceo_kemaskini_status_pengguna, traceo_kemaskini_peranan) were
--   written in migration 007, before the 'superadmin' role existed.
--   They gate on `v_role <> 'admin'`, so superadmin is DENIED —
--   superadmin cannot create users, toggle status, or change roles.
--
--   This migration:
--     1. Relaxes those gates to allow both 'admin' and 'superadmin'.
--     2. Adds traceo_kemaskini_pengguna — a single atomic function that
--        updates nama + emel + peranan of a user row and writes an audit
--        entry. (The Supabase Auth email/password are handled separately
--        in the server action via the admin API, with compensation.)
-- =============================================================

-- ─── 1. Relax admin-only gates to allow superadmin ───────────────────────────

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
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Access denied: admin or superadmin required';
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
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Access denied: admin or superadmin required';
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
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Access denied: admin or superadmin required';
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

-- ─── 2. New: edit user (nama + emel + peranan) atomically ─────────────────────
-- The caller (server action) updates Supabase Auth email/password separately
-- via the admin API. This function only touches the users row + audit.

CREATE OR REPLACE FUNCTION traceo_kemaskini_pengguna(
  p_id uuid,
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
  v_emel_lama text;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Access denied: admin or superadmin required';
  END IF;

  SELECT emel INTO v_emel_lama FROM users WHERE id = p_id;

  IF v_emel_lama IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak dijumpai';
  END IF;

  UPDATE users SET
    nama    = p_nama,
    emel    = p_emel,
    peranan = p_peranan::user_role
  WHERE id = p_id;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'kemaskini_pengguna', 'user', p_id,
          jsonb_build_object(
            'nama', p_nama,
            'emel_lama', v_emel_lama,
            'emel_baharu', p_emel,
            'peranan', p_peranan
          ));
END;
$$;

GRANT EXECUTE ON FUNCTION traceo_kemaskini_pengguna(uuid, text, text, text) TO authenticated;