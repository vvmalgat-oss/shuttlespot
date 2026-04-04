-- Add photo_url column to venues (safe to run multiple times)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS photo_url TEXT;
