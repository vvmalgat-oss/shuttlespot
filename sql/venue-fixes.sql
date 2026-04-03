-- ============================================================
-- VENUE DATA FIXES
-- Run this in Supabase SQL Editor to correct venue locations.
-- ============================================================

-- Fix 1: Melbourne Badminton Centre
-- Incorrect: suburb listed as 'Mitcham' (wrong — that is Mitcham Badminton Centre)
-- Correct:   Melbourne Badminton Centre is at 6-16 Joseph Street, Blackburn North VIC 3130
UPDATE venues
SET
  suburb    = 'Blackburn North',
  city      = 'Melbourne',
  address   = '6-16 Joseph Street, Blackburn North VIC 3130',
  lat       = -37.8133,
  lng       = 145.1555
WHERE name = 'Melbourne Badminton Centre'
  AND (suburb = 'Mitcham' OR suburb = 'Mount Waverley');

-- Fix 2: Adelaide Badminton Centre
-- Incorrect: suburb listed as 'Brooklyn Park'
-- Correct:   60 Hardys Road, Torrensville SA 5031
UPDATE venues
SET
  suburb  = 'Torrensville',
  address = '60 Hardys Road, Torrensville SA 5031',
  lat     = -34.9214,
  lng     = 138.5618
WHERE name = 'Adelaide Badminton Centre'
  AND suburb = 'Brooklyn Park';
