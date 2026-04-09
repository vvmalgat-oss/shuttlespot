-- Tighten play_requests security now that auth is required to post
-- Run in Supabase SQL Editor

-- 1. Add user_id so RLS can verify ownership without trusting player_email
ALTER TABLE play_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_play_requests_user_id ON play_requests(user_id);

-- 2. Drop the wide-open policies
DROP POLICY IF EXISTS "Public insert play_requests" ON play_requests;
DROP POLICY IF EXISTS "Public update play_requests" ON play_requests;

-- 3. Only authenticated users can insert, and they must claim their own user_id
CREATE POLICY "Auth insert play_requests" ON play_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Only the owner can cancel their own session
CREATE POLICY "Owner update play_requests" ON play_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Note: SELECT remains public (needed to show session grid to everyone).
-- player_email is in the response but only used server-side for own-session checks
-- on pre-auth records. New records use user_id for ownership — email no longer needed.
