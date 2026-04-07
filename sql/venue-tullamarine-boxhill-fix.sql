-- ============================================================
-- Remove Tullamarine / Add Box Hill Indoor Sports
-- Run in Supabase → SQL Editor → Run
-- ============================================================

-- Step 1: Remove Action Indoor Sports Tullamarine
-- (rebranded to Game On Indoor Sports which no longer offers badminton)
DELETE FROM venues
WHERE name IN ('Action Indoor Sports Tullamarine', 'Game On Indoor Sports');

-- Step 2: Add Box Hill Indoor Sports
-- Source: boxhillindoorsports.com.au | 3 Taraflex courts | est. 1984
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT
  'Box Hill Indoor Sports', 'Box Hill', 'Melbourne', 'VIC',
  '9 Clarice Road, Box Hill VIC 3128', 3, '$40/hr',
  'https://boxhillindoorsports.com.au/book-pickleball-badminton/',
  -37.8215, 145.1260
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Box Hill Indoor Sports'
);

-- Verify
SELECT id, name, suburb, address, courts, price, booking_url
FROM venues
WHERE name = 'Box Hill Indoor Sports'
   OR name IN ('Action Indoor Sports Tullamarine', 'Game On Indoor Sports');
