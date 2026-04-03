-- ============================================================
-- VENUE DATA FIXES
-- Run this in Supabase SQL Editor to correct venue locations.
-- Safe to re-run — uses UPDATE by name only.
-- ============================================================

-- Fix 1: Melbourne Badminton Centre
-- Real address: 6-16 Joseph Street, Blackburn North VIC 3130
-- (NOT Mitcham — that is a separate venue: Mitcham Badminton Centre)
UPDATE venues
SET
  suburb  = 'Blackburn North',
  city    = 'Melbourne',
  address = '6-16 Joseph Street, Blackburn North VIC 3130',
  lat     = -37.8133,
  lng     = 145.1555
WHERE name = 'Melbourne Badminton Centre';

-- Fix 2: Adelaide Badminton Centre
-- Real address: 60 Hardys Road, Torrensville SA 5031 (not Brooklyn Park)
UPDATE venues
SET
  suburb  = 'Torrensville',
  address = '60 Hardys Road, Torrensville SA 5031',
  lat     = -34.9214,
  lng     = 138.5618
WHERE name = 'Adelaide Badminton Centre';

-- Verify fixes applied correctly
SELECT name, suburb, address, lat, lng
FROM venues
WHERE name IN ('Melbourne Badminton Centre', 'Adelaide Badminton Centre', 'Mitcham Badminton Centre')
ORDER BY name;
