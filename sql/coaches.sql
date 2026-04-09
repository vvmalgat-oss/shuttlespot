-- ============================================================
-- COACHES TABLE MIGRATION
-- Run in Supabase → SQL Editor → paste all → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS coaches (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  suburb          TEXT NOT NULL,
  state           TEXT NOT NULL,
  bio             TEXT,
  experience_years INTEGER,
  specialties     TEXT[] DEFAULT '{}',
  coaching_levels TEXT[] DEFAULT '{}',
  session_types   TEXT[] DEFAULT '{}',
  price_per_hour  INTEGER,                      -- AUD, null = contact for pricing
  price_notes     TEXT,
  website         TEXT,
  photo_url       TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coaches_state   ON coaches(state);
CREATE INDEX IF NOT EXISTS idx_coaches_active  ON coaches(active);
CREATE INDEX IF NOT EXISTS idx_coaches_verified ON coaches(verified);

-- RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coaches
CREATE POLICY "Public read coaches" ON coaches
  FOR SELECT USING (active = TRUE);

-- Anyone can register as a coach (submit a listing)
CREATE POLICY "Public insert coaches" ON coaches
  FOR INSERT WITH CHECK (TRUE);

-- Admins can update/delete (service role bypasses RLS automatically)
