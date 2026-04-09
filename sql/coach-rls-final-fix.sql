-- Final fix for coach messages RLS + coach profile ownership
-- Run in Supabase SQL Editor

-- ── 1. Security-definer functions ────────────────────────────────────────────
-- These run as the function owner (bypassing table-level RLS) so subqueries
-- inside RLS policies never silently return NULL.

CREATE OR REPLACE FUNCTION public.get_coach_owner_id(p_coach_id INTEGER)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT user_id FROM coaches WHERE id = p_coach_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── 2. Fix coach_messages SELECT policy ──────────────────────────────────────
-- Old policy used a plain subquery which was blocked by coaches-table RLS.
-- New policy uses the security-definer function — always works.

DROP POLICY IF EXISTS "read coach messages" ON coach_messages;

CREATE POLICY "read coach messages" ON coach_messages
  FOR SELECT USING (
    auth.uid() = thread_user_id
    OR auth.uid() = public.get_coach_owner_id(coach_id)
  );

-- ── 3. Allow coaches to claim their profile (link user_id when it is NULL) ──
-- This lets a coach who registered before auth was added link their account.
-- Email in the coaches row must match the signed-in user's email.

DROP POLICY IF EXISTS "claim coach profile" ON coaches;

CREATE POLICY "claim coach profile" ON coaches
  FOR UPDATE
  USING  (user_id IS NULL AND email = public.current_user_email())
  WITH CHECK (user_id = auth.uid());

-- ── 4. Supabase Storage bucket for coach profile photos ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-photos', 'coach-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photo
DROP POLICY IF EXISTS "coach photo upload" ON storage.objects;
CREATE POLICY "coach photo upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'coach-photos' AND auth.uid() IS NOT NULL
  );

-- Allow public read of coach photos
DROP POLICY IF EXISTS "coach photo public read" ON storage.objects;
CREATE POLICY "coach photo public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'coach-photos');

-- Allow coaches to replace their own photo (upsert)
DROP POLICY IF EXISTS "coach photo update" ON storage.objects;
CREATE POLICY "coach photo update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'coach-photos' AND auth.uid() IS NOT NULL
  );
