-- =============================================================
-- Traceo — Migration 014: Superadmin & Granular Feature Access
-- =============================================================
-- ARAHAN: Run SQL ini dalam Supabase Dashboard → SQL Editor
-- =============================================================

-- ─── Step 1: Add 'superadmin' to user_role enum ──────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ─── Step 2: Table — feature_access ─────────────────────────
-- Per-user feature grants/denials, overriding static role matrix

CREATE TABLE IF NOT EXISTS feature_access (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key      TEXT NOT NULL,
  is_allowed       BOOLEAN NOT NULL DEFAULT true,
  dicipta_pada     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

-- ─── Step 3: Table — page_access ────────────────────────────
-- Per-user page grants/denials (by route path)

CREATE TABLE IF NOT EXISTS page_access (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_path        TEXT NOT NULL,
  is_allowed       BOOLEAN NOT NULL DEFAULT true,
  dicipta_pada     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, page_path)
);

-- ─── Step 4: Indexes ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_key     ON feature_access(feature_key);
CREATE INDEX IF NOT EXISTS idx_page_access_user_id    ON page_access(user_id);
CREATE INDEX IF NOT EXISTS idx_page_access_path       ON page_access(page_path);

-- ─── Step 5: Auto-update triggers ────────────────────────────

CREATE TRIGGER trg_feature_access_dikemaskini
  BEFORE UPDATE ON feature_access
  FOR EACH ROW EXECUTE FUNCTION update_dikemaskini_pada();

CREATE TRIGGER trg_page_access_dikemaskini
  BEFORE UPDATE ON page_access
  FOR EACH ROW EXECUTE FUNCTION update_dikemaskini_pada();

-- ─── Step 6: RLS Policies ────────────────────────────────────

ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access    ENABLE ROW LEVEL SECURITY;

-- ⚠️ Guna get_current_user_role()/get_current_user_id() BUKAN subquery ke users.
-- Subquery `FROM users` dalam policy menyebabkan infinite recursion (42P17).

-- Superadmin: full control over feature_access
CREATE POLICY "superadmin_manage_feature_access"
  ON feature_access FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- Users: read their own feature_access rows
CREATE POLICY "users_read_own_feature_access"
  ON feature_access FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id());

-- Superadmin: full control over page_access
CREATE POLICY "superadmin_manage_page_access"
  ON page_access FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');

-- Users: read their own page_access rows
CREATE POLICY "users_read_own_page_access"
  ON page_access FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id());

-- =============================================================
-- Step 7: Create your Superadmin account
-- =============================================================
-- ARAHAN:
--   1. Pergi ke Supabase Dashboard → Authentication → Users
--   2. Klik "Add user" → masukkan email & password kau
--   3. Copy UUID dari kolum "UID"
--   4. Gantikan 'PASTE_SUPERADMIN_AUTH_UID_HERE' dengan UUID tu
--   5. Gantikan email dengan email kau
--   6. Run bahagian INSERT ini dalam SQL Editor
-- =============================================================

INSERT INTO users (auth_id, nama, emel, peranan, status)
VALUES (
  '730ba87f-4dbb-4ce1-8084-0379d4b2eb3c'::uuid,
  'Superadmin',
  'superadmin@traceo.dev',
  'superadmin',
  'aktif'
)
ON CONFLICT (auth_id) DO UPDATE SET peranan = 'superadmin';

-- Verify: uncomment below to check tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('feature_access', 'page_access');
