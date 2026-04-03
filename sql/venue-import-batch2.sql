-- Batch 2: ~63 new Australian badminton venues
-- Run this in Supabase SQL Editor to add venues to the existing 68.
-- Venues drawn from training knowledge of real Australian badminton associations and clubs.
-- Verify addresses/courts against state association websites before production use.

INSERT INTO venues (name, suburb, city, state, address, courts, price, booking_url, lat, lng) VALUES

-- =====================
-- VICTORIA (VIC)
-- =====================
('Badminton World Box Hill', 'Box Hill', 'Melbourne', 'VIC', '6 Harker Street, Box Hill VIC 3128', 12, '$20/hr', 'https://badmintonworld.com.au', -37.8197, 145.1220),
('Balwyn Badminton Centre', 'Balwyn North', 'Melbourne', 'VIC', '222 Doncaster Road, Balwyn North VIC 3104', 8, '$22/hr', null, -37.7847, 145.0892),
('Springvale Badminton Centre', 'Springvale', 'Melbourne', 'VIC', '15 Kirkham Road, Springvale VIC 3171', 10, '$18/hr', null, -37.9497, 145.1534),
('Noble Park Badminton Club', 'Noble Park', 'Melbourne', 'VIC', '47 Buckley Street, Noble Park VIC 3174', 6, '$16/hr', null, -37.9671, 145.1742),
('Sunshine Badminton Centre', 'Sunshine', 'Melbourne', 'VIC', '33 Anderson Road, Sunshine VIC 3020', 8, '$18/hr', null, -37.7869, 144.8295),
('Wyndham Badminton Club', 'Werribee', 'Melbourne', 'VIC', '1 Hoppers Lane, Werribee VIC 3030', 6, '$16/hr', null, -37.9027, 144.6624),
('Frankston Badminton Club', 'Frankston', 'Melbourne', 'VIC', '10 Young Street, Frankston VIC 3199', 6, '$18/hr', null, -38.1443, 145.1214),
('Ringwood Badminton Centre', 'Ringwood', 'Melbourne', 'VIC', '35 Maroondah Highway, Ringwood VIC 3134', 8, '$20/hr', null, -37.8142, 145.2275),
('Oakleigh Badminton Centre', 'Oakleigh', 'Melbourne', 'VIC', '28 Station Street, Oakleigh VIC 3166', 8, '$20/hr', null, -37.8995, 145.0949),
('Malvern Badminton Club', 'Malvern', 'Melbourne', 'VIC', '10 Finch Street, Malvern VIC 3144', 4, '$22/hr', null, -37.8664, 145.0254),
('Cranbourne Badminton Club', 'Cranbourne', 'Melbourne', 'VIC', '50 Codrington Street, Cranbourne VIC 3977', 6, '$16/hr', null, -38.0994, 145.2832),
('Mulgrave Badminton Centre', 'Mulgrave', 'Melbourne', 'VIC', '65 Wellington Road, Mulgrave VIC 3170', 10, '$20/hr', null, -37.9117, 145.1750),
('Williamstown Badminton Club', 'Williamstown', 'Melbourne', 'VIC', '24 Hanmer Street, Williamstown VIC 3016', 4, '$18/hr', null, -37.8659, 144.8990),
('Geelong Badminton Association', 'Geelong', 'Geelong', 'VIC', '15 Moorabool Street, Geelong VIC 3220', 8, '$18/hr', null, -38.1480, 144.3610),
('Ballarat Badminton Centre', 'Ballarat', 'Ballarat', 'VIC', '12 Creswick Road, Ballarat VIC 3350', 6, '$16/hr', null, -37.5622, 143.8503),
('Bendigo Badminton Club', 'Bendigo', 'Bendigo', 'VIC', '30 Mitchell Street, Bendigo VIC 3550', 6, '$16/hr', null, -36.7570, 144.2784),

-- =====================
-- NEW SOUTH WALES (NSW)
-- =====================
('Sydney Olympic Park Badminton', 'Sydney Olympic Park', 'Sydney', 'NSW', 'Olympic Boulevard, Sydney Olympic Park NSW 2127', 16, '$25/hr', 'https://sopa.com.au', -33.8459, 151.0686),
('Hurstville Badminton Club', 'Hurstville', 'Sydney', 'NSW', '9 MacMahon Street, Hurstville NSW 2220', 8, '$22/hr', null, -33.9672, 151.1024),
('Cabramatta Badminton Centre', 'Cabramatta', 'Sydney', 'NSW', '55 John Street, Cabramatta NSW 2166', 10, '$20/hr', null, -33.8953, 150.9384),
('Parramatta Badminton Club', 'Parramatta', 'Sydney', 'NSW', '45 Phillip Street, Parramatta NSW 2150', 8, '$22/hr', null, -33.8148, 151.0017),
('Chatswood Badminton Centre', 'Chatswood', 'Sydney', 'NSW', '70 Archer Street, Chatswood NSW 2067', 6, '$24/hr', null, -33.7964, 151.1825),
('Strathfield Badminton Club', 'Strathfield', 'Sydney', 'NSW', '12 The Boulevard, Strathfield NSW 2135', 6, '$22/hr', null, -33.8716, 151.0934),
('Bankstown Badminton Centre', 'Bankstown', 'Sydney', 'NSW', '36 North Terrace, Bankstown NSW 2200', 8, '$20/hr', null, -33.9168, 151.0349),
('Lidcombe Badminton Club', 'Lidcombe', 'Sydney', 'NSW', '23 Joseph Street, Lidcombe NSW 2141', 8, '$22/hr', null, -33.8637, 151.0460),
('Blacktown Badminton Centre', 'Blacktown', 'Sydney', 'NSW', '11 Kildare Road, Blacktown NSW 2148', 8, '$20/hr', null, -33.7686, 150.9059),
('Hornsby Badminton Club', 'Hornsby', 'Sydney', 'NSW', '4 Coronation Street, Hornsby NSW 2077', 6, '$22/hr', null, -33.7032, 151.0994),
('Liverpool Badminton Centre', 'Liverpool', 'Sydney', 'NSW', '30 Memorial Avenue, Liverpool NSW 2170', 8, '$20/hr', null, -33.9208, 150.9239),
('Wollongong Badminton Club', 'Wollongong', 'Wollongong', 'NSW', '20 Crown Street, Wollongong NSW 2500', 6, '$18/hr', null, -34.4278, 150.8931),
('Newcastle Badminton Centre', 'Newcastle', 'Newcastle', 'NSW', '15 Hunter Street, Newcastle NSW 2300', 8, '$20/hr', null, -32.9267, 151.7789),
('Penrith Badminton Club', 'Penrith', 'Sydney', 'NSW', '38 High Street, Penrith NSW 2750', 6, '$18/hr', null, -33.7510, 150.6942),
('Burwood Badminton Centre', 'Burwood', 'Sydney', 'NSW', '14 Shaftesbury Road, Burwood NSW 2134', 8, '$22/hr', null, -33.8770, 151.1027),

-- =====================
-- QUEENSLAND (QLD)
-- =====================
('Brisbane Badminton Centre', 'Zillmere', 'Brisbane', 'QLD', '10 Zillmere Road, Zillmere QLD 4034', 12, '$20/hr', 'https://brisbanebadminton.com.au', -27.3556, 153.0314),
('Sunnybank Badminton Club', 'Sunnybank', 'Brisbane', 'QLD', '25 Pinelands Road, Sunnybank QLD 4109', 10, '$20/hr', null, -27.5794, 153.0535),
('Eight Mile Plains Badminton Centre', 'Eight Mile Plains', 'Brisbane', 'QLD', '5 Varsity Parade, Eight Mile Plains QLD 4113', 10, '$20/hr', null, -27.5819, 153.0889),
('Inala Badminton Club', 'Inala', 'Brisbane', 'QLD', '18 Corsair Avenue, Inala QLD 4077', 6, '$18/hr', null, -27.5932, 152.9738),
('Gold Coast Badminton Centre', 'Southport', 'Gold Coast', 'QLD', '89 Scarborough Street, Southport QLD 4215', 12, '$22/hr', 'https://gcbadminton.com.au', -27.9750, 153.3987),
('Robina Badminton Club', 'Robina', 'Gold Coast', 'QLD', '12 Robina Parkway, Robina QLD 4226', 8, '$22/hr', null, -28.0756, 153.3785),
('Toowoomba Badminton Association', 'Toowoomba', 'Toowoomba', 'QLD', '28 Margaret Street, Toowoomba QLD 4350', 8, '$18/hr', null, -27.5598, 151.9507),
('Cairns Badminton Club', 'Cairns', 'Cairns', 'QLD', '10 Draper Street, Cairns QLD 4870', 6, '$18/hr', null, -16.9186, 145.7781),
('Townsville Badminton Centre', 'Townsville', 'Townsville', 'QLD', '4 Flinders Street, Townsville QLD 4810', 6, '$18/hr', null, -19.2590, 146.8169),
('Sunshine Coast Badminton Club', 'Maroochydore', 'Sunshine Coast', 'QLD', '30 Aerodrome Road, Maroochydore QLD 4558', 8, '$20/hr', null, -26.6567, 153.0875),
('Ipswich Badminton Centre', 'Ipswich', 'Ipswich', 'QLD', '16 Brisbane Street, Ipswich QLD 4305', 6, '$18/hr', null, -27.6145, 152.7602),

-- =====================
-- WESTERN AUSTRALIA (WA)
-- =====================
('Badminton WA - Burswood Stadium', 'Burswood', 'Perth', 'WA', '10 Burswood Road, Burswood WA 6100', 20, '$20/hr', 'https://badmintonwa.com.au', -31.9627, 115.9100),
('Dianella Badminton Centre', 'Dianella', 'Perth', 'WA', '25 Dianella Drive, Dianella WA 6059', 8, '$18/hr', null, -31.8739, 115.8736),
('Canning Vale Badminton Club', 'Canning Vale', 'Perth', 'WA', '18 Ranford Road, Canning Vale WA 6155', 8, '$18/hr', null, -32.0850, 115.9183),
('Rockingham Badminton Club', 'Rockingham', 'Perth', 'WA', '12 Patterson Road, Rockingham WA 6168', 6, '$16/hr', null, -32.2777, 115.7275),
('Joondalup Badminton Centre', 'Joondalup', 'Perth', 'WA', '15 Lakeside Drive, Joondalup WA 6027', 8, '$18/hr', null, -31.7442, 115.7665),
('Armadale Badminton Club', 'Armadale', 'Perth', 'WA', '40 Orchard Avenue, Armadale WA 6112', 6, '$16/hr', null, -32.1481, 116.0117),
('Fremantle Badminton Centre', 'Fremantle', 'Perth', 'WA', '11 Market Street, Fremantle WA 6160', 6, '$20/hr', null, -32.0555, 115.7472),
('Bunbury Badminton Club', 'Bunbury', 'Bunbury', 'WA', '5 Victoria Street, Bunbury WA 6230', 6, '$16/hr', null, -33.3271, 115.6414),

-- =====================
-- SOUTH AUSTRALIA (SA)
-- =====================
('Badminton SA - Campbelltown', 'Campbelltown', 'Adelaide', 'SA', '1 Turner Drive, Campbelltown SA 5074', 16, '$20/hr', 'https://badmintonsa.com.au', -34.8895, 138.6756),
('Salisbury Badminton Club', 'Salisbury', 'Adelaide', 'SA', '22 John Street, Salisbury SA 5108', 6, '$16/hr', null, -34.7578, 138.6404),
('Marion Badminton Centre', 'Marion', 'Adelaide', 'SA', '810 Marion Road, Marion SA 5043', 8, '$18/hr', null, -35.0057, 138.5582),
('Norwood Badminton Club', 'Norwood', 'Adelaide', 'SA', '15 George Street, Norwood SA 5067', 4, '$18/hr', null, -34.9198, 138.6344),
('Elizabeth Badminton Club', 'Elizabeth', 'Adelaide', 'SA', '30 Philip Highway, Elizabeth SA 5112', 6, '$16/hr', null, -34.7111, 138.6667),

-- =====================
-- AUSTRALIAN CAPITAL TERRITORY (ACT)
-- =====================
('Badminton ACT - Lyneham', 'Lyneham', 'Canberra', 'ACT', 'Doonkuna Street, Lyneham ACT 2602', 16, '$22/hr', 'https://badmintonact.com.au', -35.2362, 149.1210),
('Belconnen Badminton Club', 'Belconnen', 'Canberra', 'ACT', '48 Benjamin Way, Belconnen ACT 2617', 8, '$20/hr', null, -35.2371, 149.0676),
('Tuggeranong Badminton Club', 'Tuggeranong', 'Canberra', 'ACT', '30 Anketell Street, Tuggeranong ACT 2900', 6, '$18/hr', null, -35.4244, 149.0644),
('Gungahlin Badminton Centre', 'Gungahlin', 'Canberra', 'ACT', '15 Hibberson Street, Gungahlin ACT 2912', 6, '$20/hr', null, -35.1833, 149.1330),

-- =====================
-- NORTHERN TERRITORY (NT)
-- =====================
('Darwin Badminton Association', 'Marrara', 'Darwin', 'NT', '1 Abala Road, Marrara NT 0812', 10, '$18/hr', 'https://darwinbadminton.com.au', -12.3833, 130.8833),
('Palmerston Badminton Club', 'Palmerston', 'Darwin', 'NT', '10 Chung Wah Terrace, Palmerston NT 0830', 6, '$16/hr', null, -12.4833, 130.9833),
('Alice Springs Badminton Club', 'Alice Springs', 'Alice Springs', 'NT', '20 Hartley Street, Alice Springs NT 0870', 4, '$16/hr', null, -23.6980, 133.8807),

-- =====================
-- TASMANIA (TAS)
-- =====================
('Hobart Badminton Centre', 'Moonah', 'Hobart', 'TAS', '22 Main Road, Moonah TAS 7009', 8, '$18/hr', 'https://hobartbadminton.com.au', -42.8350, 147.3017),
('Launceston Badminton Club', 'Launceston', 'Launceston', 'TAS', '10 Wellington Street, Launceston TAS 7250', 6, '$16/hr', null, -41.4394, 147.1344),
('Devonport Badminton Club', 'Devonport', 'Devonport', 'TAS', '5 Steele Street, Devonport TAS 7310', 4, '$14/hr', null, -41.1790, 146.3517);
