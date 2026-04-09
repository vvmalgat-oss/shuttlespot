-- Coach in-app messaging + profile ownership
-- Run in Supabase SQL Editor

-- 1. Add user_id to coaches so we can identify the owner
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);

-- 2. Allow coaches to soft-delete (deactivate) their own profile
--    (Enable RLS first in case it isn't already)
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Preserve existing read/insert access, only add the update policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coaches' AND policyname = 'read coaches'
  ) THEN
    CREATE POLICY "read coaches" ON coaches FOR SELECT USING (active = true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coaches' AND policyname = 'insert coaches'
  ) THEN
    CREATE POLICY "insert coaches" ON coaches FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DROP POLICY IF EXISTS "update own coach profile" ON coaches;
CREATE POLICY "update own coach profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Coach messages table
--    thread_user_id = the player who started the conversation
--    Both the player's messages and the coach's replies share the same thread_user_id
CREATE TABLE IF NOT EXISTS coach_messages (
  id               SERIAL PRIMARY KEY,
  coach_id         INTEGER  NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  sender_user_id   UUID     NOT NULL REFERENCES auth.users(id),
  sender_name      TEXT     NOT NULL,
  message          TEXT     NOT NULL,
  is_from_coach    BOOLEAN  NOT NULL DEFAULT FALSE,
  thread_user_id   UUID     NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cm_coach   ON coach_messages(coach_id);
CREATE INDEX IF NOT EXISTS idx_cm_thread  ON coach_messages(thread_user_id);
CREATE INDEX IF NOT EXISTS idx_cm_sender  ON coach_messages(sender_user_id);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- Players see their own thread; coaches see all messages for their profile
CREATE POLICY "read coach messages" ON coach_messages
  FOR SELECT USING (
    auth.uid() = thread_user_id
    OR auth.uid() = (SELECT user_id FROM coaches WHERE id = coach_id LIMIT 1)
  );

-- Users can only send messages as themselves
CREATE POLICY "insert coach messages" ON coach_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
