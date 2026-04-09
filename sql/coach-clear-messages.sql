-- Coach messaging: DELETE policies + clear-thread RPCs
-- Run in Supabase SQL Editor

-- 1. Allow players to delete their own thread (all messages where they are thread_user_id)
DROP POLICY IF EXISTS "delete own thread messages" ON coach_messages;
CREATE POLICY "delete own thread messages" ON coach_messages
  FOR DELETE USING (auth.uid() = thread_user_id);

-- 2. RPC: coach clears one player thread (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.coach_clear_thread(
  p_coach_id       INTEGER,
  p_thread_user_id UUID
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT user_id INTO v_owner_id FROM coaches WHERE id = p_coach_id;
  IF auth.uid() IS NOT NULL AND auth.uid() = v_owner_id THEN
    DELETE FROM coach_messages
    WHERE coach_id = p_coach_id
      AND thread_user_id = p_thread_user_id;
  END IF;
END;
$$;

-- 3. RPC: player clears their own thread (alternative to direct DELETE for edge cases)
CREATE OR REPLACE FUNCTION public.player_clear_thread(p_coach_id INTEGER)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    DELETE FROM coach_messages
    WHERE coach_id = p_coach_id
      AND thread_user_id = auth.uid();
  END IF;
END;
$$;
