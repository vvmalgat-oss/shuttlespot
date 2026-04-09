-- Fix: coach inbox not showing messages due to RLS subquery issue.
-- The old policy used a subquery (SELECT user_id FROM coaches WHERE id = coach_id)
-- which is itself subject to coaches table RLS and can silently return NULL.
-- Fix: store coach_user_id directly on each message row — no subquery needed.
-- Run in Supabase SQL Editor.

-- 1. Add the column
ALTER TABLE coach_messages ADD COLUMN IF NOT EXISTS coach_user_id UUID REFERENCES auth.users(id);

-- 2. Backfill existing rows
UPDATE coach_messages cm
SET coach_user_id = c.user_id
FROM coaches c
WHERE c.id = cm.coach_id AND c.user_id IS NOT NULL;

-- 3. Replace the old SELECT policy with one that uses the column directly
DROP POLICY IF EXISTS "read coach messages" ON coach_messages;

CREATE POLICY "read coach messages" ON coach_messages
  FOR SELECT USING (
    auth.uid() = thread_user_id
    OR (coach_user_id IS NOT NULL AND auth.uid() = coach_user_id)
  );
