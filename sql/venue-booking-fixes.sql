-- ============================================================
-- BOOKING URL + NAME FIXES
-- Run this in Supabase → SQL Editor → paste all → Run.
-- Safe to re-run (idempotent UPDATEs).
-- ============================================================

-- ── VICTORIA ─────────────────────────────────────────────────────────────────

-- Melbourne Badminton Centre (Blackburn North):
-- Use the YEP!Booking system URL, not just the homepage.
UPDATE venues
SET booking_url = 'https://melbournebadminton.yepbooking.com.au/'
WHERE name = 'Melbourne Badminton Centre';

-- ── NEW SOUTH WALES ───────────────────────────────────────────────────────────

-- Sydney Olympic Park Badminton:
-- sopa.com.au is a generic redirect; use the official sports halls page.
UPDATE venues
SET booking_url = 'https://www.sydneyolympicpark.com.au/venue/sports-halls'
WHERE name = 'Sydney Olympic Park Badminton';

-- ── QUEENSLAND ────────────────────────────────────────────────────────────────

-- Gold Coast Badminton Centre (Southport):
-- gcbadminton.com.au does not exist. The real venue at 6 Pinter Drive,
-- Southport is Star Badminton.
UPDATE venues
SET
  name        = 'Star Badminton',
  booking_url = 'https://starbadminton.sportlogic.net.au/secure/customer/booking/v1/public/show'
WHERE name = 'Gold Coast Badminton Centre'
  AND suburb = 'Southport';

-- Brisbane Badminton Centre (Zillmere):
-- brisbanebadminton.com.au is not a confirmed real venue site.
-- The real Brisbane Badminton is in Crestmead (separate entry).
-- Clear the booking URL to avoid sending users to a wrong/dead link.
UPDATE venues
SET booking_url = NULL
WHERE name = 'Brisbane Badminton Centre'
  AND suburb = 'Zillmere';

-- ── AUSTRALIAN CAPITAL TERRITORY ─────────────────────────────────────────────

-- Badminton ACT - Lyneham:
-- badmintonact.com.au does not resolve. Correct domain is .org.au.
UPDATE venues
SET booking_url = 'https://badmintonact.org.au/'
WHERE name = 'Badminton ACT - Lyneham';

-- ── WESTERN AUSTRALIA ─────────────────────────────────────────────────────────

-- Badminton WA - Burswood Stadium:
-- badmintonwa.com.au does not resolve. Correct domain is .org.au.
UPDATE venues
SET booking_url = 'https://www.badmintonwa.org.au/'
WHERE name = 'Badminton WA - Burswood Stadium';

-- ── NEW SOUTH WALES (continued) ──────────────────────────────────────────────

-- Alpha Badminton Centre (Silverwater):
-- Court hire is $29/hr (confirmed from venue).
UPDATE venues
SET price = '$29/hr'
WHERE name = 'Alpha Badminton Centre'
  AND suburb = 'Silverwater';

-- ── VERIFY (run this separately to confirm changes applied) ───────────────────

SELECT name, suburb, state, booking_url
FROM venues
WHERE name IN (
  'Melbourne Badminton Centre',
  'Star Badminton',
  'Brisbane Badminton Centre',
  'Sydney Olympic Park Badminton',
  'Badminton ACT - Lyneham',
  'Badminton WA - Burswood Stadium',
  'Alpha Badminton Centre'
)
ORDER BY state, name;
