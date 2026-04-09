-- In-app messaging for Find Partners
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS play_request_messages (
  id               SERIAL PRIMARY KEY,
  play_request_id  INTEGER NOT NULL REFERENCES play_requests(id) ON DELETE CASCADE,
  sender_user_id   UUID    NOT NULL REFERENCES auth.users(id),
  sender_name      TEXT    NOT NULL,
  message          TEXT    NOT NULL,
  is_from_poster   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prm_request ON play_request_messages(play_request_id);
CREATE INDEX IF NOT EXISTS idx_prm_sender  ON play_request_messages(sender_user_id);

ALTER TABLE play_request_messages ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read messages (scoped in UI to relevant threads)
CREATE POLICY "read messages" ON play_request_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only insert their own messages
CREATE POLICY "insert own messages" ON play_request_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
