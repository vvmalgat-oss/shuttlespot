-- Add Google rating columns to venues table
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS google_review_count INTEGER;
