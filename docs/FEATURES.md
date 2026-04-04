# ShuttleSpot — Pages & Components

## Pages

### `/` — Home
- Hero: "Find badminton courts across Australia"
- Search bar → opens SearchModal
- "View all venues" → /venues

### `/search?location=...&lat=...&lng=...` — Search Results
- Split layout: venue list (left) + Google Map (right)
- Venues sorted by distance, filtered within 15km
- Click card → venue detail; click marker → highlight card

### `/venues` — All Venues
- Split layout: full list + map
- Filter by name/suburb/city (no distance sorting)

### `/venue/[id]` — Venue Detail
- Name, address, city/state badges
- Stats: courts, price, facility type
- Book Now + Get Directions buttons
- Embedded Google Map

### `/social` — Social (two tabs)

#### Tab 1: Find Partners
- Venues in accordion; each shows 7 days × time slots
- Per-venue slot filtering via `VENUE_HOURS` + `getVenueSlots()` (no 6 AM slots)
- Empty slot → post availability dialog (name, email, skill, message)
- Filled slot (blue) → contact via mailto
- Search bar to filter venues

#### Tab 2: Group Events
- List + Map split layout (same as Find Partners)
- Events from `venue_events` table
- Near Me filters by detected user state (state capital coordinate detection)
- Search bar filters by venue/club/event type
- 3-tier coordinate fallback for map pins: exact name → suburb+state → state capital
- `SocialMap` component reused with `eventVenuePins` prop

---

## Components

### `Navbar.tsx`
- Sticky header: logo, nav links, search icon, sign in button
- Mobile hamburger menu
- Active link via pathname

### `SearchModal.tsx`
- shadcn Dialog
- Suburb autocomplete (hardcoded Melbourne list — needs expansion)
- Navigates to `/search?location=...&lat=...&lng=...`

### `VenueCard.tsx`
- shadcn Card + Badge
- Name, address, courts, price, city/state, distance
- Book Now button (external link), active ring highlight

### `VenueMap.tsx`
- `@react-google-maps/api`
- Blue = selected marker, red = others
- Auto-fits bounds, pans to selected
- POI + transit labels hidden
- `fullHeight` prop for split layouts

### `VenueSlideOver.tsx`
- Slide-over panel for venue booking (time slot picker)
- `generateSlots()` uses `VENUE_OPEN_HOURS` (min 8 AM start)
- Morning section label: "8am – 12pm"
- Peak hours: weekday 5–9 PM, weekend 8 AM – 12 PM

### `SocialMap.tsx`
- Reused for both Find Partners and Group Events map view
- Accepts `venuePins` or `eventVenuePins` prop
