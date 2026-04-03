-- ============================================================
-- VENUE DATA FIXES  (safe to re-run)
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Fix 1: Remove duplicate Melbourne Badminton Centre rows.
-- A previous UPDATE matched two rows and set both to Blackburn North.
-- Keep the lowest-id row (original), delete all others.
DELETE FROM venues
WHERE name = 'Melbourne Badminton Centre'
  AND id > (SELECT MIN(id) FROM venues WHERE name = 'Melbourne Badminton Centre');

-- Fix 2: Ensure the surviving Melbourne Badminton Centre row has the correct location.
-- Real address: 6-16 Joseph Street, Blackburn North VIC 3130
UPDATE venues
SET
  suburb  = 'Blackburn North',
  city    = 'Melbourne',
  address = '6-16 Joseph Street, Blackburn North VIC 3130',
  lat     = -37.8133,
  lng     = 145.1555
WHERE name = 'Melbourne Badminton Centre';

-- Fix 3: Adelaide Badminton Centre — correct suburb and address.
-- Real address: 60 Hardys Road, Torrensville SA 5031 (not Brooklyn Park)
UPDATE venues
SET
  suburb  = 'Torrensville',
  address = '60 Hardys Road, Torrensville SA 5031',
  lat     = -34.9214,
  lng     = 138.5618
WHERE name = 'Adelaide Badminton Centre';

-- Verify — should show exactly ONE Melbourne Badminton Centre row in Blackburn North
SELECT id, name, suburb, address, lat, lng
FROM venues
WHERE name IN ('Melbourne Badminton Centre', 'Adelaide Badminton Centre', 'Mitcham Badminton Centre')
ORDER BY name, id;
