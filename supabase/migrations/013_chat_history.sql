-- =============================================================
-- Traceo — Chat History (AI Assistant conversations)
-- Each session belongs to exactly one user. Messages are owned
-- through their parent session. RLS enforces owner-only access.
-- =============================================================

CREATE TABLE chat_sesi (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tajuk            TEXT NOT NULL DEFAULT 'Perbualan baharu',
  dicipta_pada     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dikemaskini_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_mesej (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sesi_id      UUID NOT NULL REFERENCES chat_sesi(id) ON DELETE CASCADE,
  peranan      TEXT NOT NULL CHECK (peranan IN ('user', 'assistant')),
  kandungan    TEXT NOT NULL,
  dicipta_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sesi_user ON chat_sesi(user_id);
CREATE INDEX idx_chat_sesi_dikemaskini ON chat_sesi(dikemaskini_pada DESC);
CREATE INDEX idx_chat_mesej_sesi ON chat_mesej(sesi_id);

ALTER TABLE chat_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mesej ENABLE ROW LEVEL SECURITY;

-- ─── chat_sesi policies (owner only) ──────────────────────────────────────
CREATE POLICY "chat_sesi_select_owner"
  ON chat_sesi FOR SELECT
  TO authenticated
  USING (user_id = (SELECT get_current_user_id()));

CREATE POLICY "chat_sesi_insert_owner"
  ON chat_sesi FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT get_current_user_id()));

CREATE POLICY "chat_sesi_delete_owner"
  ON chat_sesi FOR DELETE
  TO authenticated
  USING (user_id = (SELECT get_current_user_id()));

-- ─── chat_mesej policies (inherit via parent session) ─────────────────────
CREATE POLICY "chat_mesej_select_owner"
  ON chat_mesej FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sesi s
      WHERE s.id = chat_mesej.sesi_id
        AND s.user_id = (SELECT get_current_user_id())
    )
  );

CREATE POLICY "chat_mesej_insert_owner"
  ON chat_mesej FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sesi s
      WHERE s.id = chat_mesej.sesi_id
        AND s.user_id = (SELECT get_current_user_id())
    )
  );