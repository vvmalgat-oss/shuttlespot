-- Add opening hours columns (safe to run multiple times)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS opening_hours TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS open_hour  SMALLINT DEFAULT 9;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS close_hour SMALLINT DEFAULT 22;

-- ── Victoria ──────────────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 9am – midnight',  open_hour = 9,  close_hour = 24
WHERE name ILIKE '%mitcham badminton%';

UPDATE venues SET opening_hours = 'Mon–Sun 8am – 11pm',     open_hour = 8,  close_hour = 23
WHERE name ILIKE '%melbourne badminton centre%';

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 11pm',     open_hour = 9,  close_hour = 23
WHERE name ILIKE '%alpha badminton%';

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 11pm',     open_hour = 9,  close_hour = 23
WHERE name ILIKE '%beyond badminton%';

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 11pm',     open_hour = 9,  close_hour = 23
WHERE name ILIKE '%state sports centre%' OR name ILIKE '%MSAC%';

UPDATE venues SET opening_hours = 'Evening sessions only',   open_hour = 18, close_hour = 22
WHERE name ILIKE '%southside badminton%';

-- ── New South Wales ───────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 8am – midnight',  open_hour = 8,  close_hour = 24
WHERE name ILIKE '%kings park badminton%';

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 7pm',      open_hour = 9,  close_hour = 19
WHERE name ILIKE '%hunter badminton%';

-- ── Queensland ────────────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 10pm',     open_hour = 9,  close_hour = 22
WHERE name ILIKE '%brisbane badminton%';

-- ── Western Australia ─────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 8am – 10pm',     open_hour = 8,  close_hour = 22
WHERE name ILIKE '%perth badminton arena%';

-- ── South Australia ───────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 11am – midnight', open_hour = 11, close_hour = 24
WHERE name ILIKE '%adelaide badminton centre%';

-- ── Tasmania ──────────────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 9am – 9pm',      open_hour = 9,  close_hour = 21
WHERE name ILIKE '%badminton hobart%';

-- ── Northern Territory ────────────────────────────────────────────────────────

UPDATE venues SET opening_hours = 'Mon–Sun 6pm – 10pm',     open_hour = 18, close_hour = 22
WHERE name ILIKE '%darwin badminton%';
