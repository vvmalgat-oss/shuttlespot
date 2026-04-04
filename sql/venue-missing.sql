-- ============================================================
-- MISSING VENUES — venues that appear in venue_events but
-- were not in the original venue import or batch2.
-- All addresses/courts verified against venue websites.
-- Run this in Supabase SQL Editor.
-- Safe to re-run: uses INSERT ... WHERE NOT EXISTS pattern.
-- ============================================================

-- ── VICTORIA ─────────────────────────────────────────────────────────────────

-- Beyond Badminton Centre (Clayton, VIC)
-- Source: beyondbadminton.com.au | 18 courts | 6 Torteval Place, Clayton VIC 3168
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Beyond Badminton Centre', 'Clayton', 'Melbourne', 'VIC',
       '6 Torteval Place, Clayton VIC 3168', 18, NULL,
       'https://beyondbadminton.yepbooking.com.au/', -37.9283, 145.1264
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Beyond Badminton Centre'
);

-- ── NEW SOUTH WALES ───────────────────────────────────────────────────────────

-- Alpha Badminton Centre (Silverwater, NSW)
-- Source: alphabadminton.com.au | 13 courts | 47/2 Slough Avenue, Silverwater NSW 2128
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Alpha Badminton Centre', 'Silverwater', 'Sydney', 'NSW',
       '47/2 Slough Avenue, Silverwater NSW 2128', 13, NULL,
       'https://alphabadminton.yepbooking.com.au/', -33.8421, 151.0350
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Alpha Badminton Centre'
);

-- Hunter Badminton (Wickham, NSW)
-- Source: hunterbadminton.com.au | 4 courts | Unit 1/16 Albert Street, Wickham NSW 2293
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Hunter Badminton', 'Wickham', 'Newcastle', 'NSW',
       'Unit 1/16 Albert Street, Wickham NSW 2293', 4, '$10/session',
       'https://hunterbadminton.yepbooking.com.au/', -32.9227, 151.7584
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Hunter Badminton'
);

-- Kings Park Badminton Centre / Sydney Sports Club (Kings Park, NSW)
-- Source: sydneysportsclub.com.au | 7 courts | 6 Garling Road, Kings Park NSW 2148
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Kings Park Badminton Centre', 'Kings Park', 'Sydney', 'NSW',
       '6 Garling Road, Kings Park NSW 2148', 7, '$21/hr',
       'https://sydneybadminton.intennis.com.au/secure/customer/booking/v1/public/show', -33.7622, 150.9125
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Kings Park Badminton Centre'
);

-- ── QUEENSLAND ────────────────────────────────────────────────────────────────

-- Brisbane Badminton (Crestmead, QLD)
-- Source: badmintonbrisbane.yepbooking.com.au | 9 courts | 39 Quilton Place, Crestmead QLD 4132
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Brisbane Badminton', 'Crestmead', 'Brisbane', 'QLD',
       '39 Quilton Place, Crestmead QLD 4132', 9, '$25/hr',
       'https://badmintonbrisbane.yepbooking.com.au/', -27.6636, 152.9988
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Brisbane Badminton'
);

-- ── WESTERN AUSTRALIA ─────────────────────────────────────────────────────────

-- Perth Badminton Arena (Canning Vale, WA)
-- Source: perthbadmintonarena.com | 22 courts | 16B Modal Crescent, Canning Vale WA 6155
INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng)
SELECT 'Perth Badminton Arena', 'Canning Vale', 'Perth', 'WA',
       '16B Modal Crescent, Canning Vale WA 6155', 22, NULL,
       'https://pba.yepbooking.com.au/', -32.0763, 115.9154
WHERE NOT EXISTS (
  SELECT 1 FROM venues WHERE name = 'Perth Badminton Arena'
);

-- ── VERIFY ────────────────────────────────────────────────────────────────────

-- Should return 6 rows (or fewer if some were already inserted previously)
SELECT id, name, suburb, state, address, courts
FROM venues
WHERE name IN (
  'Beyond Badminton Centre',
  'Alpha Badminton Centre',
  'Hunter Badminton',
  'Kings Park Badminton Centre',
  'Brisbane Badminton',
  'Perth Badminton Arena'
)
ORDER BY state, name;
