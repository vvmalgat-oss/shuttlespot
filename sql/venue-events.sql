-- Create venue_events table for venue-hosted social/group events
CREATE TABLE IF NOT EXISTS venue_events (
  id serial PRIMARY KEY,
  venue_name text NOT NULL,
  venue_suburb text,
  venue_state text NOT NULL,
  title text NOT NULL,
  description text,
  day_of_week text,
  time_slot text,
  frequency text DEFAULT 'weekly',
  price text,
  skill_level text DEFAULT 'All levels',
  booking_url text,
  source_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venue_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_events' AND policyname = 'Public read venue_events'
  ) THEN
    CREATE POLICY "Public read venue_events" ON venue_events FOR SELECT USING (true);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_venue_events_state  ON venue_events(venue_state);
CREATE INDEX IF NOT EXISTS idx_venue_events_active ON venue_events(is_active);

-- Clear existing seed data before re-seeding
TRUNCATE venue_events RESTART IDENTITY;

-- ─── VICTORIA ────────────────────────────────────────────────────────────────

INSERT INTO venue_events (venue_name, venue_suburb, venue_state, title, description, day_of_week, time_slot, frequency, price, skill_level, booking_url, source_url) VALUES

('Albert Park Badminton Club', 'Albert Park', 'VIC',
 'Wednesday Socials',
 'Weekly social badminton at MSAC. Book online to secure your spot — limited walk-in tickets available. Full refunds for cancellations 24+ hours before session. Games paired by skill level with 20-minute rotations.',
 'Wednesday', '7:00 PM – 10:00 PM', 'weekly', '$14/session', 'All levels',
 'https://albertparkbadmintonclub.square.site/',
 'https://albertparkbadmintonclub.square.site/'),

('Albert Park Badminton Club', 'Albert Park', 'VIC',
 'Saturday Socials',
 'Weekend social badminton at MSAC. Book online to secure your spot. VIP members prioritised on waiting list when sold out.',
 'Saturday', '10:00 AM – 12:00 PM', 'weekly', NULL, 'All levels',
 'https://albertparkbadmintonclub.square.site/',
 'https://albertparkbadmintonclub.square.site/'),

('Melbourne Smashers Badminton Club', 'Albert Park', 'VIC',
 'Tuesday Evening Social',
 'LGBTQI+ inclusive social badminton at MSAC (Court 3, Badminton Hall). One of the largest badminton clubs in Victoria with 300+ members. Members $15, guests $20 — pre-registration required.',
 'Tuesday', '7:30 PM – 9:30 PM', 'weekly', '$15 members / $20 guests', 'All levels',
 'https://melbournesmashers.tidyhq.com/public/schedule/events/',
 'https://www.melbournesmashers.com.au/'),

('Melbourne Smashers Badminton Club', 'Albert Park', 'VIC',
 'Thursday Evening Social',
 'LGBTQI+ inclusive social badminton at MSAC. Members $15, guests $20 — pre-registration required.',
 'Thursday', '7:00 PM – 9:00 PM', 'weekly', '$15 members / $20 guests', 'All levels',
 'https://melbournesmashers.tidyhq.com/public/schedule/events/',
 'https://www.melbournesmashers.com.au/'),

('Melbourne Smashers Badminton Club', 'Albert Park', 'VIC',
 'Sunday Afternoon Social',
 'LGBTQI+ inclusive Sunday social at MSAC. Members $15, guests $20 — pre-registration required.',
 'Sunday', '1:00 PM – 4:00 PM', 'weekly', '$15 members / $20 guests', 'All levels',
 'https://melbournesmashers.tidyhq.com/public/schedule/events/',
 'https://www.melbournesmashers.com.au/'),

('MSAC', 'Albert Park', 'VIC',
 'Social Badminton @MSAC',
 'Friendly drop-in social event where players of all levels are welcome. Organisers match participants by skill level for balanced games. RSVP opens every Sunday at 8:30 AM — payment by Tuesday confirms your spot. Price includes shuttlecocks and court costs.',
 'Saturday', '5:30 PM – 7:30 PM', 'weekly', '$13/session', 'All levels',
 'https://opensports.net/social-badminton-msac',
 'https://opensports.net/social-badminton-msac'),

('Wesley Badminton Club', 'Albert Park', 'VIC',
 'Monday Social Badminton',
 'Social badminton sessions at MSAC. Players grouped by skill with rotational play. Welcoming to all abilities.',
 'Monday', '7:30 PM – 10:00 PM', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/provider/wesley-badminton-club-1842',
 'https://keepactive.com.au/provider/wesley-badminton-club-1842'),

('Badminton Wednesdays Incorporated', 'Albert Park', 'VIC',
 'Wednesday Social Badminton',
 'Friendly social badminton play at MSAC with well-organised rotations and friendly regulars.',
 'Wednesday', '7:30 PM – 10:00 PM', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/provider/badminton-wednesdays-incorporated-1950',
 'https://keepactive.com.au/provider/badminton-wednesdays-incorporated-1950'),

('The Badfit Collective', 'Albert Park', 'VIC',
 'Thursday Evening Social',
 'Weekly social badminton at MSAC. Inclusive of all genders and ages, focusing on community engagement. Coaching available.',
 'Thursday', '5:30 PM – 7:00 PM', 'weekly', NULL, 'Intermediate and above',
 'https://keepactive.com.au/provider/the-badfit-collective-9541',
 'https://keepactive.com.au/provider/the-badfit-collective-9541'),

('YG Badminton', 'Albert Park', 'VIC',
 'Sunday Morning Social',
 'Professionally-run social badminton at MSAC. Shuttles provided. Emphasis on respect, sportsmanship, and community. Join via organiser WhatsApp group.',
 'Sunday', '8:00 AM – 10:00 AM', 'weekly', '$19/session', 'All levels',
 'https://www.revolutionise.com.au/ygbadminton/home',
 'https://keepactive.com.au/provider/social-badminton-melbourne-msac-9634'),

('Shuttlecats Badminton Club', 'Albert Park', 'VIC',
 'Tuesday Evening Social',
 'LGBTQI+ inclusive social badminton at MSAC. All skill levels welcome. Equipment rental and coaching available. Low-cost child minding with prior notice.',
 'Tuesday', 'Evening', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/provider/shuttlecats-badminton-club-8503',
 'https://keepactive.com.au/provider/shuttlecats-badminton-club-8503'),

('Shuttlecats Badminton Club', 'Albert Park', 'VIC',
 'Friday Evening Social',
 'LGBTQI+ inclusive social badminton at MSAC. All skill levels welcome. Equipment rental and coaching available.',
 'Friday', 'Evening', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/provider/shuttlecats-badminton-club-8503',
 'https://keepactive.com.au/provider/shuttlecats-badminton-club-8503'),

('Carlton Racketeers', 'Carlton', 'VIC',
 'Friday Social Badminton',
 'Social badminton at Carlton Baths. Three courts available. Bring your own racquet. First come first served.',
 'Friday', '6:00 PM – 7:30 PM', 'weekly', '$12/session', 'Beginner to Intermediate',
 'https://keepactive.com.au/provider/carlton-racketeers-social-badminton-melbourne-city-1902',
 'https://keepactive.com.au/provider/carlton-racketeers-social-badminton-melbourne-city-1902'),

('Abbotsford Badminton Club', 'Abbotsford', 'VIC',
 'Monday Social (All Levels Welcome)',
 'Relaxed social badminton with friendly doubles games and a supportive community. Doubles-only format with court rotation. Quality shuttles provided. Non-marking shoes required. Free parking.',
 'Monday', '7:30 PM – 10:00 PM', 'weekly', '$20/session', 'All levels',
 'https://luma.com/xsx8knk7',
 'https://luma.com/xsx8knk7'),

('Abbotsford Badminton Club', 'Abbotsford', 'VIC',
 'Wednesday Social (All Levels Welcome)',
 'Relaxed social badminton with friendly doubles and court rotation. Quality shuttles provided. Payment via bank transfer before playing.',
 'Wednesday', '7:00 PM – 9:00 PM', 'weekly', NULL, 'All levels',
 'https://luma.com/1372hfqi',
 'https://luma.com/1372hfqi'),

('MSAC', 'Albert Park', 'VIC',
 'Saturday MBTC Social',
 'Relaxed social badminton at MSAC Courts 5–8. Friendly doubles with rotating courts. Minimum group of 4. Quality shuttles provided. Free parking. Tickets required — registration needs approval.',
 'Saturday', '10:00 AM – 12:00 PM', 'weekly', '$17/session', 'All levels',
 'https://luma.com/enoypdcz',
 'https://luma.com/enoypdcz'),

('Mitcham Badminton Centre', 'Mitcham', 'VIC',
 'Weekday Morning/Afternoon Social Play',
 'Social badminton sessions Monday to Friday — drop in and make new friends! No membership required. Saturday social capped at 45 players.',
 'Monday–Friday', '9:00 AM onwards', 'daily', NULL, 'All levels',
 'https://mitchambadminton.yepbooking.com.au/',
 'https://www.mitchambadminton.com.au/'),

-- ─── NEW SOUTH WALES ──────────────────────────────────────────────────────────

('Kings Park Badminton Centre', 'Kings Park', 'NSW',
 'Tuesday Evening Social',
 'Open grade 2-hour social session at a brand new state-of-the-art badminton centre. Must be booked and paid before play time. Bring your own racquet and non-black soled sports shoes. Shuttles provided.',
 'Tuesday', '6:00 PM – 8:00 PM', 'weekly', '$23 / $200 for 10 sessions', 'All levels',
 'https://sydneybadminton.intennis.com.au/secure/customer/booking/v1/public/show',
 'https://sydneysportsclub.com.au/social/'),

('Kings Park Badminton Centre', 'Kings Park', 'NSW',
 'Thursday Evening Social',
 'Open grade 2-hour social session. Must be booked and paid before play time. Bring your own racquet and non-black soled sports shoes. Shuttles provided.',
 'Thursday', '6:00 PM – 8:00 PM', 'weekly', '$23 / $200 for 10 sessions', 'All levels',
 'https://sydneybadminton.intennis.com.au/secure/customer/booking/v1/public/show',
 'https://sydneysportsclub.com.au/social/'),

('Kings Park Badminton Centre', 'Kings Park', 'NSW',
 'Friday Evening Social',
 'Open grade 2-hour social session. Must be booked and paid before play time. Bring your own racquet and non-black soled sports shoes. Shuttles provided.',
 'Friday', '6:00 PM – 8:00 PM', 'weekly', '$23 / $200 for 10 sessions', 'All levels',
 'https://sydneybadminton.intennis.com.au/secure/customer/booking/v1/public/show',
 'https://sydneysportsclub.com.au/social/'),

('Kings Park Badminton Centre', 'Kings Park', 'NSW',
 'Sunday Morning Social',
 'Open grade 2-hour social session. Must be booked and paid before play time. Bring your own racquet and non-black soled sports shoes. Shuttles provided.',
 'Sunday', '10:00 AM – 12:00 PM', 'weekly', '$23 / $200 for 10 sessions', 'All levels',
 'https://sydneybadminton.intennis.com.au/secure/customer/booking/v1/public/show',
 'https://sydneysportsclub.com.au/social/'),

('Alpha Badminton Centre', 'Silverwater', 'NSW',
 'Social Sessions',
 'Social badminton sessions across multiple locations including Silverwater (47/2 Slough Avenue) and Auburn. Walk-ins welcome.',
 'Multiple', 'Multiple times', 'weekly', NULL, 'All levels',
 'https://alphabadminton.yepbooking.com.au/',
 'https://alphabadminton.com.au/'),

('Hunter Badminton', 'Wickham', 'NSW',
 'Monday & Thursday Walk-In Social',
 '4-court facility with wooden flooring in Newcastle. Non-marking shoes and own racquet required. Pay at the hall — no pre-registration needed for Mon/Thu morning sessions.',
 'Monday, Thursday', '9:30 AM – 12:00 PM', 'weekly', '$10/session', 'All levels',
 'https://hunterbadminton.yepbooking.com.au/',
 'https://www.hunterbadminton.com.au/social-play/'),

('Hunter Badminton', 'Wickham', 'NSW',
 'Friday Afternoon Social',
 'Prepaid booking required via YEP!Booking. Non-marking shoes and own racquet required.',
 'Friday', '3:00 PM – 5:00 PM', 'weekly', '$10/session', 'All levels',
 'https://hunterbadminton.yepbooking.com.au/',
 'https://www.hunterbadminton.com.au/social-play/'),

('Hunter Badminton', 'Wickham', 'NSW',
 'Saturday Midday Social',
 'Prepaid booking required via YEP!Booking. Non-marking shoes and own racquet required.',
 'Saturday', '12:00 PM – 2:30 PM', 'weekly', '$10/session', 'All levels',
 'https://hunterbadminton.yepbooking.com.au/',
 'https://www.hunterbadminton.com.au/social-play/'),

('Hunter Badminton', 'Wickham', 'NSW',
 'Sunday Evening Social',
 'Prepaid booking required via YEP!Booking. Non-marking shoes and own racquet required.',
 'Sunday', '4:15 PM – 6:45 PM', 'weekly', '$10/session', 'All levels',
 'https://hunterbadminton.yepbooking.com.au/',
 'https://www.hunterbadminton.com.au/social-play/'),

-- ─── QUEENSLAND ───────────────────────────────────────────────────────────────

('Southside Badminton Club', 'Varsity Lakes', 'QLD',
 'Weeknight Social Sessions',
 'Non-profit social badminton club on the Gold Coast, welcoming all levels from beginner to advanced. Five nights per week. Come for fun, fitness, and making friends.',
 'Monday, Tuesday, Wednesday, Thursday, Saturday', '7:30 PM – 9:30 PM', 'weekly', '$15/session', 'All levels',
 'https://events.humanitix.com/southside-badminton-club-session-booking/tickets',
 'https://events.humanitix.com/southside-badminton-club-session-booking'),

('Sunnybank Hills Badminton Club', 'South Brisbane', 'QLD',
 'BSHS Socials – Brisbane City',
 'Social badminton at Brisbane State High School Hall. Non-members can attend twice before joining. 15+ years old. Online booking system.',
 'Tuesday', '6:30 PM – 9:00 PM', 'weekly', '$13 non-members / $11 members', 'All levels',
 'https://www.sbhbadminton.com.au/bshs-socials-brisbane-city/',
 'https://www.sbhbadminton.com.au/bshs-socials-brisbane-city/'),

-- ─── SOUTH AUSTRALIA ──────────────────────────────────────────────────────────

('Adelaide Badminton Centre', 'Brooklyn Park', 'SA',
 'All You Can Play (Weekday Daytime)',
 'Play all you can between 11am–4pm. All courts must be shared — walk-ins welcome, no advance registration required.',
 'Tuesday, Wednesday, Thursday, Friday', '11:00 AM – 4:00 PM', 'weekly', '$14/session', 'All levels',
 'https://adelaidebadmintoncentre.yepbooking.com.au/',
 'https://adelaidebadmintoncentre.com/'),

('Adelaide Badminton Centre', 'Brooklyn Park', 'SA',
 'Friday Social Night',
 'Weekly Friday social badminton night at this purpose-built 9-court facility. Contact (08) 8443 4035 or admin@adelaidebadmintoncentre.com for details.',
 'Friday', '7:30 PM onwards', 'weekly', NULL, 'All levels',
 'https://adelaidebadmintoncentre.yepbooking.com.au/',
 'https://adelaidebadmintoncentre.com/'),

-- ─── WESTERN AUSTRALIA ────────────────────────────────────────────────────────

('Wescoast Badminton Club', 'Madeley', 'WA',
 'Tuesday Club Night',
 'Social badminton at Kingsway Indoor Sports Stadium. Competitive rotation for various skill levels. Season runs February to November. Established club since 1972. Membership options available; casual visitors $15/session.',
 'Tuesday', '7:30 PM – 9:30 PM', 'weekly', '$15 casual / membership from $100', 'Intermediate to Advanced',
 'https://www.wescoastbadminton.org.au/',
 'https://www.wescoastbadminton.org.au/'),

('Satellite Badminton Club', 'Dianella', 'WA',
 'Monday Social Doubles',
 'Experienced players only. Relaxed and friendly doubles badminton at Stirling Leisure – Dianella. Games rotate every 15 minutes. No commitment required. Volunteer-run not-for-profit. At least 6 months prior experience required. Registration needed — contact via website.',
 'Monday', '7:30 PM – 11:00 PM', 'weekly', NULL, 'Experienced (6+ months)',
 'https://rsvp.satellitebadminton.asn.au/',
 'https://satellitebadminton.asn.au/'),

('Perth Badminton Arena', 'Canning Vale', 'WA',
 'Social Sessions',
 'Social and competitive sessions at Perth''s largest badminton centre (22 BWF approved rubberised courts). Registration and payment at reception. Largest one-stop badminton centre in WA.',
 'Tuesday, Thursday', '6:00 PM – 8:00 PM', 'weekly', '$10/session', 'All levels',
 'https://pba.yepbooking.com.au/',
 'https://www.perthbadmintonarena.com/'),

-- ─── AUSTRALIAN CAPITAL TERRITORY ────────────────────────────────────────────

('Phoenix Badminton Club', 'Red Hill', 'ACT',
 'Thursday Social Session',
 'Weekly social badminton at Canberra Grammar School. Must register and pay before attending. Both members and casuals welcome.',
 'Thursday', '7:30 PM – 9:30 PM', 'weekly', NULL, 'Social players',
 'https://www.revolutionise.com.au/phoenixbadmintonclub/',
 'https://badmintonact.org.au/phoenix-badminton-club/'),

('Phoenix Badminton Club', 'Wanniassa', 'ACT',
 'Sunday Social Session',
 'Weekly social badminton at Erindale Leisure Centre. Must register and pay before attending. Members and casuals welcome.',
 'Sunday', '3:00 PM – 5:00 PM', 'weekly', NULL, 'All levels',
 'https://www.revolutionise.com.au/phoenixbadmintonclub/',
 'https://badmintonact.org.au/phoenix-badminton-club/'),

('Phoenix Badminton Club', 'Wanniassa', 'ACT',
 'Wednesday Beginners Session',
 'Dedicated beginner-friendly session at Erindale Leisure Centre. Must register and pay before attending.',
 'Wednesday', '5:30 PM – 7:00 PM', 'weekly', NULL, 'Beginners',
 'https://www.revolutionise.com.au/phoenixbadmintonclub/',
 'https://badmintonact.org.au/phoenix-badminton-club/'),

('Social Badminton Canberra', 'Bruce', 'ACT',
 'Sunday Morning Social',
 'Beginner to intermediate social badminton at University of Canberra (UCFitX, Building 4). 5 permanent courts, 30-player capacity. Membership required — contact organiser before attending.',
 'Sunday', '9:00 AM – 11:00 AM', 'weekly', '$45/year + $20/session', 'Beginner to Intermediate',
 NULL,
 'https://badmintonact.org.au/social-badminton-canberra/'),

-- ─── TASMANIA ─────────────────────────────────────────────────────────────────

('Badminton Hobart', 'South Hobart', 'TAS',
 'Tuesday Intermediate After Work',
 'Designed to fit a session between work and dinner. No pre-registration required. Shuttles provided; racquet hire $5.',
 'Tuesday', '5:00 PM – 7:00 PM', 'weekly', '$17 for 2hrs / $9 for 2nd hour only', 'Intermediate (Div 3 or above)',
 NULL,
 'https://badmintonhobart.com/social-sessions-2/'),

('Badminton Hobart', 'South Hobart', 'TAS',
 'Thursday Beginner After Work',
 'Beginner-friendly session designed to fit between work and dinner. No registration required. Shuttles provided — racquets free to use.',
 'Thursday', '5:00 PM – 7:00 PM', 'weekly', '$17 for 2hrs / $9 for 2nd hour only', 'Beginners',
 NULL,
 'https://badmintonhobart.com/social-sessions-2/'),

('Badminton Hobart', 'South Hobart', 'TAS',
 'Saturday All-Levels Social',
 'All levels welcome including dedicated courts for players 35+. Shuttles provided; racquet hire $5.',
 'Saturday', '5:00 PM – 7:00 PM', 'weekly', '$17 for 2hrs / $9 for 2nd hour only', 'All levels (35+ courts available)',
 NULL,
 'https://badmintonhobart.com/social-sessions-2/'),

-- ─── NORTHERN TERRITORY ───────────────────────────────────────────────────────

('Darwin Badminton Club', 'Winnellie', 'NT',
 'Social Nights (Mon–Thu)',
 'Social badminton Monday to Thursday evenings. Fridays are competition nights during school term. All ages and abilities welcome. Non-members covered for 1 trial visit — annual registration required after that.',
 'Monday, Tuesday, Wednesday, Thursday', '7:30 PM – 10:00 PM', 'weekly',
 '$10 senior members / $18 senior non-members / $6 junior members / $15 junior non-member students',
 'All levels',
 'https://www.revolutionise.com.au/darwinbadminton/registration/',
 'https://www.darwinbadmintonclub.net.au/');
