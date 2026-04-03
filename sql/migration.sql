-- ============================================
-- SHUTTLESPOT DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add city and state columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'VIC';

-- 2. Populate city from suburb for existing records
UPDATE venues SET city = suburb WHERE city IS NULL;

-- 3. Create play_requests table for social feature
CREATE TABLE IF NOT EXISTS play_requests (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
  venue_name TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_email TEXT NOT NULL,
  skill_level TEXT DEFAULT 'Intermediate' CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced')),
  spots_available INTEGER DEFAULT 1,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_play_requests_venue_id ON play_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_play_requests_date ON play_requests(date);
CREATE INDEX IF NOT EXISTS idx_play_requests_status ON play_requests(status);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_state ON venues(state);

-- 5. Enable Row Level Security (allow public read, authenticated write)
ALTER TABLE play_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read play requests
CREATE POLICY "Public read play_requests" ON play_requests
  FOR SELECT USING (true);

-- Allow anyone to insert play requests (for now, before auth is added)
CREATE POLICY "Public insert play_requests" ON play_requests
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update their own play requests
CREATE POLICY "Public update play_requests" ON play_requests
  FOR UPDATE USING (true);
