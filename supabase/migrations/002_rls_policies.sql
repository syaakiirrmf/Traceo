-- =============================================================
-- Traceo — Row Level Security (RLS) Policies
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasiliti ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasiliti_pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE susulan ENABLE ROW LEVEL SECURITY;
ALTER TABLE lampiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_audit ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT peranan FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── users policies ────────────────────────────────────────────────────────

-- Anyone authenticated can see all users (needed for dropdowns, assignments)
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can insert/update/delete users
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- ─── fasiliti policies ─────────────────────────────────────────────────────

-- Admin, Pengurus, Viewer: see all fasiliti
-- Pegawai Susulan: only see assigned fasiliti
CREATE POLICY "fasiliti_select"
  ON fasiliti FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus', 'viewer')
    OR EXISTS (
      SELECT 1 FROM fasiliti_pegawai fp
      WHERE fp.fasiliti_id = fasiliti.id
        AND fp.user_id = get_current_user_id()
    )
  );

-- Only admin and pengurus can insert/update fasiliti
CREATE POLICY "fasiliti_insert"
  ON fasiliti FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'pengurus'));

CREATE POLICY "fasiliti_update"
  ON fasiliti FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'pengurus'));

-- Only admin can delete fasiliti
CREATE POLICY "fasiliti_delete"
  ON fasiliti FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- ─── fasiliti_pegawai policies ─────────────────────────────────────────────

CREATE POLICY "fasiliti_pegawai_select"
  ON fasiliti_pegawai FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "fasiliti_pegawai_modify"
  ON fasiliti_pegawai FOR ALL
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'pengurus'));

-- ─── susulan policies ──────────────────────────────────────────────────────

-- Same visibility as fasiliti
CREATE POLICY "susulan_select"
  ON susulan FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus', 'viewer')
    OR EXISTS (
      SELECT 1 FROM fasiliti_pegawai fp
      WHERE fp.fasiliti_id = susulan.fasiliti_id
        AND fp.user_id = get_current_user_id()
    )
  );

-- Admin, Pengurus, Pegawai Susulan (for assigned) can insert
CREATE POLICY "susulan_insert"
  ON susulan FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'pengurus')
    OR (
      get_current_user_role() = 'pegawai_susulan'
      AND EXISTS (
        SELECT 1 FROM fasiliti_pegawai fp
        WHERE fp.fasiliti_id = susulan.fasiliti_id
          AND fp.user_id = get_current_user_id()
      )
    )
  );

-- Admin and Pengurus can update any susulan; Pegawai Susulan only their own
CREATE POLICY "susulan_update"
  ON susulan FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'pengurus')
    OR (
      get_current_user_role() = 'pegawai_susulan'
      AND dicatat_oleh = get_current_user_id()
    )
  );

-- Admin and Pengurus can delete any susulan; Pegawai Susulan only their own
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

-- ─── lampiran policies ─────────────────────────────────────────────────────

-- Same visibility as susulan
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

-- Inherits insert permission from parent susulan (same rules as susulan_insert)
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

CREATE POLICY "lampiran_delete"
  ON lampiran FOR DELETE
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'pengurus'));

-- ─── log_audit policies ────────────────────────────────────────────────────

-- Only admin can read audit log
CREATE POLICY "log_audit_select"
  ON log_audit FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- Service role inserts audit logs (bypasses RLS)
CREATE POLICY "log_audit_insert"
  ON log_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);
