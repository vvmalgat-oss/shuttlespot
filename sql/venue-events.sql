-- Create venue_events table for venue-hosted social/group events
CREATE TABLE IF NOT EXISTS venue_events (
  id serial PRIMARY KEY,
  venue_name text NOT NULL,
  venue_suburb text,
  venue_state text NOT NULL,
  title text NOT NULL,
  description text,
  day_of_week text,      -- e.g. 'Monday', 'Tuesday', 'Multiple'
  time_slot text,        -- e.g. '7:30 PM – 10:00 PM'
  frequency text DEFAULT 'weekly',  -- weekly, fortnightly, monthly, daily
  price text,            -- e.g. '$13/session', 'Free'
  skill_level text DEFAULT 'All levels',
  booking_url text,
  source_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable public read access
ALTER TABLE venue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read venue_events" ON venue_events FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_events_state ON venue_events(venue_state);
CREATE INDEX IF NOT EXISTS idx_venue_events_active ON venue_events(is_active);

-- ─── Seed: Real Australian badminton venue social events ───────────────────────

INSERT INTO venue_events (venue_name, venue_suburb, venue_state, title, description, day_of_week, time_slot, frequency, price, skill_level, booking_url, source_url) VALUES

-- VICTORIA
('Melbourne Sports & Aquatic Centre', 'Albert Park', 'VIC',
 'Wesley Social Badminton',
 'Casual and friendly social session run by Wesley Badminton Club. All skill levels welcome — games are rotated regularly.',
 'Monday', '7:30 PM – 10:00 PM', 'weekly', NULL, 'All levels',
 'https://www.centralbadminton.com/wesley-badminton-club',
 'https://www.centralbadminton.com/wesley-badminton-club'),

('Melbourne Sports & Aquatic Centre', 'Albert Park', 'VIC',
 'Albert Park Social Badminton',
 '12 dedicated courts with games paired by skill level and 20-minute rotations. Run by Albert Park Badminton Club.',
 'Wednesday', '7:30 PM – 10:00 PM', 'weekly', NULL, 'All levels',
 'https://albertparkbadmintonclub.square.site/',
 'https://albertparkbadmintonclub.square.site/'),

('Melbourne Sports & Aquatic Centre', 'Albert Park', 'VIC',
 'MSAC Saturday Social',
 'Drop-in social badminton at MSAC. No membership required — just turn up and play.',
 'Saturday', '5:30 PM – 7:30 PM', 'weekly', '$13/session', 'All levels',
 'https://opensports.net/social-badminton-msac',
 'https://opensports.net/social-badminton-msac'),

('Melbourne Sports & Aquatic Centre', 'Albert Park', 'VIC',
 'Melbourne Smashers Sunday Social',
 'LGBTQI+ friendly social badminton. One of the largest badminton clubs in Victoria with 300+ members. All welcome.',
 'Sunday', '1:00 PM – 4:00 PM', 'weekly', NULL, 'All levels',
 'https://www.melbournesmashers.com.au/',
 'https://www.melbournesmashers.com.au/'),

('Melbourne Sports & Aquatic Centre', 'Albert Park', 'VIC',
 'Melbourne Smashers Thursday Social',
 'LGBTQI+ friendly evening session. Members and guests welcome. Relaxed and inclusive atmosphere.',
 'Thursday', '7:00 PM – 9:00 PM', 'weekly', NULL, 'All levels',
 'https://www.melbournesmashers.com.au/',
 'https://www.melbournesmashers.com.au/'),

('Mitcham Badminton Centre', 'Mitcham', 'VIC',
 'Mitcham Morning Social Play',
 'Relaxed morning sessions with no membership required. Available Monday to Friday — drop in anytime.',
 'Multiple', 'Monday – Friday, Morning Sessions', 'daily', NULL, 'All levels',
 'https://www.mitchambadminton.com.au/',
 'https://www.mitchambadminton.com.au/socials.pdf'),

('Abbotsford Badminton Club', 'Abbotsford', 'VIC',
 'ABC Wednesday Social',
 'Relaxed, friendly environment for players of all levels. Great community, beginner to advanced welcome.',
 'Wednesday', 'Evening', 'weekly', NULL, 'All levels',
 'https://abbotsfordbadmintonclub.com/',
 'https://abbotsfordbadmintonclub.com/'),

('Melbourne Badminton Centre', 'Mount Waverley', 'VIC',
 'MBC Weekly Social Sessions',
 'Popular social sessions that fill up fast — RSVP recommended. All skill levels welcome at this purpose-built facility.',
 'Multiple', 'Multiple times weekly', 'weekly', NULL, 'All levels',
 'https://melbournebadminton.com/socials/',
 'https://melbournebadminton.com/socials/'),

-- NEW SOUTH WALES
('Roketto Badminton', 'Lidcombe', 'NSW',
 'Roketto Monday Evening Social',
 'Walk-in social sessions. Shuttles provided. Contact WhatsApp to join.',
 'Monday', '6:00 PM – 8:00 PM', 'weekly', '$16–$18/session', 'All levels',
 'https://keepactive.com.au/venue/roketto-badminton',
 'https://keepactive.com.au/venue/roketto-badminton'),

('Roketto Badminton', 'Lidcombe', 'NSW',
 'Roketto Weekday Morning Social',
 'Morning social play Monday to Friday. Great for flexible schedules.',
 'Multiple', 'Mon–Fri, 10:00 AM – 2:00 PM', 'daily', '$16–$18/session', 'All levels',
 'https://keepactive.com.au/venue/roketto-badminton',
 'https://keepactive.com.au/venue/roketto-badminton'),

('Alpha Badminton Centre', 'Silverwater', 'NSW',
 'Alpha Egerton Monday Social',
 'Drop-in social play. All levels welcome. Great community of players.',
 'Monday', '8:00 PM – 11:00 PM', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47'),

('Alpha Badminton Centre', 'Silverwater', 'NSW',
 'Alpha LGBTQ+ Friendly Tuesday Social',
 'Inclusive and welcoming social session. LGBTQ+ friendly environment.',
 'Tuesday', '7:00 PM – 10:00 PM', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47'),

('Alpha Badminton Centre', 'Silverwater', 'NSW',
 'Alpha Sunday Afternoon Social',
 'Relaxed afternoon session. Mix of casual and competitive players.',
 'Sunday', '3:00 PM – 6:00 PM', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47'),

('Alpha Badminton Centre', 'Auburn', 'NSW',
 'AC Badminton Club Thursday Social',
 'Shuttles included. Welcoming group of regular players. All skill levels.',
 'Thursday', '8:00 PM – 11:00 PM', 'weekly', '$15–$17/session', 'All levels',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47',
 'https://keepactive.com.au/venue/alpha-badminton-centre-47'),

('Kings Park Indoor Sports', 'Blacktown', 'NSW',
 'Sydney Sports Club Badminton Social',
 'Open grade 2-hour social sessions. 10-session packs available.',
 'Multiple', 'Tue / Thu / Sun', 'weekly', '$10/session or $70 for 10', 'All levels',
 'https://sydneysportsclub.com.au/social/',
 'https://sydneysportsclub.com.au/social/'),

-- SOUTH AUSTRALIA
('Adelaide Badminton Centre', 'Torrensville', 'SA',
 'ABC Monday Night Social',
 '9 international standard courts at this purpose-built facility. Diverse group of players every week.',
 'Monday', '7:30 PM – 10:30 PM', 'weekly', NULL, 'All levels',
 'https://adelaidebadmintoncentre.com/',
 'https://adelaidebadmintoncentre.com/'),

('Adelaide Badminton Centre', 'Torrensville', 'SA',
 'ABC Friday Night Social',
 'Extended Friday night session running until midnight. Great end-of-week social.',
 'Friday', '7:30 PM – 12:00 AM', 'weekly', NULL, 'All levels',
 'https://adelaidebadmintoncentre.com/',
 'https://adelaidebadmintoncentre.com/'),

-- QUEENSLAND
('Brisbane State High School Hall', 'South Brisbane', 'QLD',
 'Sunnybank Hills Tuesday Social',
 'Online booking system. Non-members can attend twice before joining. 15+ years old welcome.',
 'Tuesday', '6:30 PM – 9:00 PM', 'weekly', '$13 non-members / $11 members', 'All levels',
 'https://www.sbhbadminton.com.au/bshs-socials-brisbane-city/',
 'https://www.sbhbadminton.com.au/bshs-socials-brisbane-city/'),

('Badminton Brisbane', 'South Brisbane', 'QLD',
 'CPLUSco Badminton Social',
 'Indoor courts in the TAFE building. Shower facilities, parking available. All ages and levels.',
 'Multiple', 'Multiple weekly sessions', 'weekly', NULL, 'All levels',
 'https://www.badmintonbrisbane.com.au/',
 'https://www.badmintonbrisbane.com.au/'),

-- WESTERN AUSTRALIA
('Kingsway Indoor Stadium', 'Madeley', 'WA',
 'Wescoast Tuesday Social',
 'Established club since 1972. Pay-and-play welcome. Season runs February to November.',
 'Tuesday', '7:30 PM – 9:30 PM', 'weekly', NULL, 'Intermediate – Advanced',
 'https://www.wescoastbadminton.org.au/',
 'https://www.wescoastbadminton.org.au/'),

('Stirling Leisure – Dianella', 'Dianella', 'WA',
 'Satellite Social Doubles',
 'Experienced players. Partners rotate every 15 minutes. Relaxed environment. Registration required.',
 'Monday', '7:30 PM – 11:00 PM', 'weekly', NULL, 'Intermediate – Advanced',
 'https://satellitebadminton.asn.au/',
 'https://satellitebadminton.asn.au/'),

('Perth Badminton Arena', 'Canning Vale', 'WA',
 'Perth Badminton Social Sessions',
 'Largest badminton facility in WA with 22 premium BWF courts. Coaching available. All standards welcome.',
 'Multiple', 'Multiple weekly sessions', 'weekly', NULL, 'All levels',
 'https://keepactive.com.au/venue/perth-badminton-arena-canning-vale',
 'https://keepactive.com.au/venue/perth-badminton-arena-canning-vale'),

-- AUSTRALIAN CAPITAL TERRITORY
('Active Leisure Centre', 'Wanniassa', 'ACT',
 'Phoenix Beginners Social',
 'Dedicated beginner-friendly session run by Phoenix Badminton Club. Registration required.',
 'Wednesday', '5:30 PM – 7:00 PM', 'weekly', NULL, 'Beginner',
 'https://badmintonact.org.au/phoenix-badminton-club/',
 'https://badmintonact.org.au/phoenix-badminton-club/'),

('Canberra Grammar School', 'Red Hill', 'ACT',
 'Phoenix Thursday Social',
 'Mixed social session for intermediate and advanced players. Phoenix Badminton Club.',
 'Thursday', '7:30 PM – 9:30 PM', 'weekly', NULL, 'Intermediate – Advanced',
 'https://badmintonact.org.au/phoenix-badminton-club/',
 'https://badmintonact.org.au/phoenix-badminton-club/'),

('Active Leisure Centre', 'Wanniassa', 'ACT',
 'Phoenix Sunday Social',
 'All-levels Sunday afternoon session. Great community atmosphere.',
 'Sunday', '3:00 PM – 5:00 PM', 'weekly', NULL, 'All levels',
 'https://badmintonact.org.au/phoenix-badminton-club/',
 'https://badmintonact.org.au/phoenix-badminton-club/');
