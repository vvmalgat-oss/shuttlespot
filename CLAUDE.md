# ShuttleSpot — Claude Code Handoff

> This document captures the full context of the ShuttleSpot project so Claude Code can pick up where we left off. Place this file in the project root as `CLAUDE.md` — Claude Code reads it automatically at the start of every session.

---

## Project Overview

**ShuttleSpot** is a badminton venue discovery platform for Australia. Users can search for badminton courts by suburb/postcode, browse venues on a map, view venue details, book via external links, and find playing partners through the social matchmaking feature.

**Live status:** In active development, not yet deployed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix, Nova preset) |
| Backend/DB | Supabase (PostgreSQL) |
| Maps | Google Maps API via `@react-google-maps/api` |
| Fonts | Inter (via shadcn Nova preset) |
| Icons | Lucide React |
| Hosting | Vercel (planned, not yet deployed) |

---

## Project Structure

```
badminton-finder/
├── app/
│   ├── components/
│   │   ├── Navbar.tsx          # Shared nav bar (all pages)
│   │   ├── SearchModal.tsx     # Suburb search modal with autocomplete
│   │   ├── VenueCard.tsx       # Reusable venue card (used in lists)
│   │   └── VenueMap.tsx        # Google Maps with markers
│   ├── search/
│   │   └── page.tsx            # Search results with distance sorting
│   ├── social/
│   │   └── page.tsx            # Find playing partners (post/join time slots)
│   ├── venue/
│   │   └── [id]/
│   │       └── page.tsx        # Venue detail page
│   ├── venues/
│   │   └── page.tsx            # All venues list + map
│   ├── globals.css             # Tailwind v4 + shadcn theme
│   ├── layout.tsx              # Root layout with Navbar
│   └── page.tsx                # Home page (hero + search)
├── components/
│   └── ui/                     # shadcn/ui components (auto-generated)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       └── skeleton.tsx
├── lib/
│   └── utils.ts                # shadcn cn() utility
├── sql/
│   └── migration.sql           # DB migration (already run)
├── supabase.ts                 # Supabase client
├── .env.local                  # API keys (not committed)
├── components.json             # shadcn/ui config
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.ts
```

---

## Database Schema (Supabase)

### `venues` table

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| name | text | Venue name |
| suburb | text | Suburb |
| city | text | City (added via migration) |
| state | text | Australian state code (VIC, NSW, QLD, etc.) |
| address | text | Full street address |
| courts | integer | Number of badminton courts |
| price | text | e.g. "$22/hr" |
| booking_url | text | External booking website URL |
| lat | float | Latitude |
| lng | float | Longitude |

### `play_requests` table (Social feature)

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| venue_id | integer | FK → venues(id) |
| venue_name | text | Denormalized venue name |
| date | date | Date to play |
| time_slot | text | e.g. "6:00 PM - 8:00 PM" |
| player_name | text | Name of person posting |
| player_email | text | Contact email |
| skill_level | text | Beginner / Intermediate / Advanced |
| spots_available | integer | Default 1 |
| message | text | Optional note |
| status | text | open / confirmed / cancelled |
| created_at | timestamptz | Auto-set |

**Indexes:** venue_id, date, status on play_requests; city, state on venues.

**RLS:** Public read/insert/update enabled on play_requests.

**Current data:** ~68 venues across all Australian states imported. The venue import SQL is in `sql/venue-import.sql` if it needs to be re-run.

---

## Environment Variables

File: `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<google-maps-api-key>
```

These must also be added in Vercel when deploying.

---

## Pages & Features

### `/` — Home
- Hero section with "Find badminton courts across Australia" heading
- Clickable search bar that opens SearchModal
- "View all venues" link to /venues

### `/search?location=Box+Hill&lat=-37.8189&lng=145.1218` — Search Results
- Split layout: venue list (left) + Google Map (right)
- Venues sorted by distance from searched location
- Text + proximity filtering (within 15km)
- Click venue card → navigate to venue detail page
- Click map marker → highlight venue card
- Change search via top bar

### `/venues` — All Venues
- Split layout: full venue list + map
- Filter input to search by name/suburb/city
- No location-based distance sorting (shows all)

### `/venue/[id]` — Venue Detail
- Venue name, address, city/state badges
- Stats cards: courts, price, facility type
- Book Now + Get Directions buttons
- Embedded Google Map

### `/social` — Find Playing Partners
- List of venues, expandable accordion-style
- Each venue shows 7 days of time slots (8 slots per day)
- Empty slot = click to post availability (opens dialog form)
- Filled slot (blue) = click to contact player via email
- Form collects: name, email, skill level, optional message
- Data stored in `play_requests` table

---

## Shared Components

### `Navbar.tsx`
- Sticky header with logo, nav links (Find Courts, Venues, Social), search icon, sign in button
- Mobile hamburger menu
- Active link highlighting based on pathname
- Search icon opens SearchModal

### `SearchModal.tsx`
- shadcn Dialog component
- Text input with suburb autocomplete (hardcoded Melbourne suburbs list)
- Suburb coordinate lookup for distance-based results
- Navigates to `/search?location=...&lat=...&lng=...`

### `VenueCard.tsx`
- shadcn Card + Badge components
- Shows name, address, courts, price, city/state, distance
- Book Now button (external link)
- Active state with ring highlight

### `VenueMap.tsx`
- Google Maps via `@react-google-maps/api`
- Blue marker for selected venue, red for others
- Auto-fits bounds to show all venues
- Pans to selected venue on click
- Hides POI and transit labels for cleaner look
- Supports `fullHeight` prop for split layouts

---

## Known Issues & Limitations

1. **Suburb autocomplete is hardcoded** — only Melbourne suburbs. Should be expanded to all Australian suburbs or use Google Places Autocomplete API.
2. **No user authentication** — Sign in button is placeholder. Social feature collects name/email per-post but has no user accounts.
3. **No venue photos or opening hours** — DB schema doesn't include these yet.
4. **Social feature uses email for contact** — No in-app messaging. Players are connected via mailto links.
5. **Mobile map** — Map panel is hidden on mobile for list+map pages. Needs a toggle or tabbed view.
6. **OneDrive/cloud sync conflicts** — Project must be in a local folder (not OneDrive/Google Drive synced). Turbopack crashes with "Access denied" errors otherwise. Run terminal as Administrator if needed.

---

## What's Been Done

- [x] Project setup (Next.js 16, Supabase, Google Maps, Tailwind v4)
- [x] shadcn/ui installed (Radix, Nova preset) with Button, Card, Input, Dialog, Badge, Separator, Skeleton
- [x] Home page with search hero
- [x] Search modal with suburb autocomplete
- [x] Search results page with distance sorting + map
- [x] All venues page with filter + map
- [x] Venue detail page
- [x] Social matchmaking page (post availability, join players)
- [x] Database migration (city/state columns, play_requests table)
- [x] 68 venues imported across all Australian states
- [x] Shared Navbar with mobile menu

---

## What Needs To Be Done Next

### High Priority
1. **Deploy to Vercel** — Connect GitHub repo, add env vars, deploy
2. **Set up GitHub** — Initialize git, create repo, push code
3. **Expand suburb autocomplete** — Add all Australian suburbs or integrate Google Places API
4. **Mobile responsive map** — Add toggle between list/map view on mobile
5. **SEO** — Add meta tags, OpenGraph, structured data per venue page

### Medium Priority
6. **User authentication** — Supabase Auth for sign in/sign up
7. **Venue photos** — New `venue_photos` table, image upload to Supabase Storage
8. **Opening hours** — New `venue_hours` table, display on venue detail
9. **Improve social feature** — In-app notifications instead of email, user profiles
10. **Admin dashboard** — Add/edit venues, manage data

### Lower Priority
11. **Suburb landing pages** — SEO pages like `/play/badminton-box-hill`
12. **Reviews & ratings** — User reviews on venue pages
13. **Court availability integration** — Real-time booking data from venue APIs
14. **Native mobile app** — React Native with Expo (after website is validated)

---

## Design Direction

- Clean, white, professional. Not playful or cartoonish.
- Blue primary color (shadcn default oklch blue)
- Inspired by tennis.com.au's court hire flow but adapted for badminton
- UI components from shadcn/ui for consistency
- Design work paused — to be done properly in Figma before major UI changes

---

## Development Notes

- **Windows environment** — Project runs on Windows 11. Use `cd C:\Users\vrush\Documents\badminton-finder` to navigate.
- **Run as Administrator** if Turbopack throws "Access denied" errors.
- **Don't put project in OneDrive/Google Drive** — causes file locking crashes.
- **Stray package-lock.json** at `C:\Users\vrush\package-lock.json` was causing Turbopack warnings. Delete if it reappears.
- **`tailwindcss-animate`** package must be installed for shadcn to work (`npm install tailwindcss-animate`).
- **Google Fonts @import** must come before `@import "tailwindcss"` in globals.css, or remove it entirely if using shadcn's built-in font setup.

---

## Commands

```bash
# Start development server
npm run dev

# Install dependencies
npm install

# Add a new shadcn component
npx shadcn@latest add [component-name]

# Build for production
npm run build
```
