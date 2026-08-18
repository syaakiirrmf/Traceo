-- =============================================================
-- Migration 018: Approval workflow for susulan (follow-ups)
-- Pegawai Susulan records a follow-up; Pengurus/Admin review and
-- approve or reject it. Approval state is tracked on the susulan
-- row and written atomically with the audit log.
-- =============================================================

CREATE TYPE susulan_kelulusan AS ENUM ('menunggu', 'diluluskan', 'ditolak');

ALTER TABLE susulan
  ADD COLUMN IF NOT EXISTS status_kelulusan susulan_kelulusan NOT NULL DEFAULT 'menunggu',
  ADD COLUMN IF NOT EXISTS diluluskan_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diluluskan_pada TIMESTAMPTZ;

-- New follow-ups start as pending
ALTER TABLE susulan ALTER COLUMN status_kelulusan SET DEFAULT 'menunggu';

-- Approve / reject a follow-up, atomically with an audit entry.
-- Only admin and pengurus (Manager) may approve. Pegawai Susulan
-- cannot self-approve. SECURITY INVOKER so the UPDATE still passes
-- through RLS (which already limits the writer to authorised roles).
CREATE OR REPLACE FUNCTION traceo_lulus_susulan(
  p_id uuid,
  p_kelulusan text
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

  IF p_kelulusan NOT IN ('diluluskan', 'ditolak') THEN
    RAISE EXCEPTION 'Invalid approval status';
  END IF;

  UPDATE susulan SET
    status_kelulusan = p_kelulusan::susulan_kelulusan,
    diluluskan_oleh = get_current_user_id(),
    diluluskan_pada = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Susulan tidak dijumpai atau tiada kebenaran';
  END IF;

  INSERT INTO log_audit (user_id, tindakan, entiti_jenis, entiti_id, butiran)
  VALUES (get_current_user_id(), 'lulus_susulan', 'susulan', p_id,
          jsonb_build_object('status_kelulusan', p_kelulusan));
END;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- No policy change required: the existing "susulan_update" policy already
-- allows admin/pengurus (and the owning officer) to UPDATE. The approval
-- columns are only written through traceo_lulus_susulan above, which gates
-- on role. Re-assert the policy for clarity and to make the contract
-- explicit in this migration.

DROP POLICY IF EXISTS "susulan_update" ON susulan;
CREATE POLICY "susulan_update"
  ON susulan FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus')
    OR (
      susulan.dicatat_oleh = get_current_user_id()
      AND get_current_user_role() = 'pegawai_susulan'
    )
  );