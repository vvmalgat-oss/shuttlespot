-- Reliable coach inbox: bypasses all table RLS via SECURITY DEFINER.
-- The function checks ownership itself; only returns rows if the caller
-- is the coach who owns that profile. Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_coach_inbox(p_coach_id INTEGER)
RETURNS SETOF coach_messages
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT user_id INTO v_owner_id FROM coaches WHERE id = p_coach_id;

  -- Only return rows if the calling user is the coach owner
  IF auth.uid() IS NOT NULL AND auth.uid() = v_owner_id THEN
    RETURN QUERY
      SELECT * FROM coach_messages
      WHERE coach_id = p_coach_id
      ORDER BY created_at ASC;
  END IF;
END;
$$;
