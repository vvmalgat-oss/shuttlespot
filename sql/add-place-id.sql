-- Add place_id column for Google Places API integration
-- Run in Supabase → SQL Editor → Run

ALTER TABLE venues ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS venues_place_id_idx ON venues (place_id) WHERE place_id IS NOT NULL;
