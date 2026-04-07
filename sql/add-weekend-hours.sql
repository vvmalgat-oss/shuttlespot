-- ============================================================
-- ADD WEEKDAY / WEEKEND HOUR COLUMNS
-- Run in Supabase → SQL Editor → paste all → Run.
-- open_hour / close_hour = WEEKDAY hours
-- open_hour_weekend / close_hour_weekend = WEEKEND hours (NULL = same as weekday)
-- ============================================================

ALTER TABLE venues ADD COLUMN IF NOT EXISTS open_hour_weekend  SMALLINT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS close_hour_weekend SMALLINT;

-- ── VERIFIED WEEKDAY vs WEEKEND HOURS ────────────────────────────────────────

-- Adelaide Badminton Centre: weekday 11am–11pm, weekend 8am–11pm
UPDATE venues SET
  open_hour = 11, close_hour = 23,
  open_hour_weekend = 8, close_hour_weekend = 23,
  opening_hours = 'Mon–Fri 11am – 11pm, Sat–Sun 8am – 11pm'
WHERE id = 61;

-- BTTC Truganina: weekday 10am–11pm, weekend 7am–11pm
UPDATE venues SET
  open_hour = 10, close_hour = 23,
  open_hour_weekend = 7, close_hour_weekend = 23,
  opening_hours = 'Mon–Fri 10am – 11pm, Sat–Sun 7am – 11pm'
WHERE id = 9;

-- Badminton Connect Noble Park: weekday 9am–11pm, weekend 8am–11pm
UPDATE venues SET
  open_hour = 9, close_hour = 23,
  open_hour_weekend = 8, close_hour_weekend = 23,
  opening_hours = 'Mon–Fri 9am – 11pm, Sat–Sun 8am – 11pm'
WHERE id = 7;

-- Badminton Connect Hallam: weekday 4pm–11pm, weekend 8am–11pm
UPDATE venues SET
  open_hour = 16, close_hour = 23,
  open_hour_weekend = 8, close_hour_weekend = 23,
  opening_hours = 'Mon–Fri 4pm – 11pm, Sat–Sun 8am – 11pm'
WHERE id = 8;

-- Alpha Badminton Centre (47 Slough): weekday 5pm–11pm, weekend 7am–11pm
UPDATE venues SET
  open_hour = 17, close_hour = 23,
  open_hour_weekend = 7, close_hour_weekend = 23,
  opening_hours = 'Mon–Fri 5pm – 11pm, Sat–Sun 7am – 11pm'
WHERE id = 70;

-- Sunshine Badminton Centre: same hours all week 6am–11pm (no weekend column needed)
UPDATE venues SET
  open_hour = 6, close_hour = 23
WHERE id = 10;
