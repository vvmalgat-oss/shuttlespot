# ShuttleSpot — Deployment

## Status

Not yet deployed. Target: Vercel + GitHub.

---

## Environment Variables

These must be set in both `.env.local` (local dev) and Vercel dashboard (production).

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=     # Google Maps API key
```

---

## Deploy to Vercel (Steps)

1. Push code to GitHub repo
2. Go to vercel.com → New Project → Import GitHub repo
3. Add all 3 env vars in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

---

## Supabase Setup

- DB migrations are in `sql/migration.sql` (already run)
- Venue data: `sql/venue-import.sql`
- Group events: `sql/venue-events.sql` (TRUNCATE + re-insert, safe to re-run)
- Data fixes: `sql/venue-fixes.sql` (run if Melbourne/Adelaide data looks wrong)
- RLS: public read/insert/update on `play_requests`; public read on `venue_events`

---

## Google Maps API

- API key needs these APIs enabled:
  - Maps JavaScript API
  - (Optional) Places API — for suburb autocomplete expansion
- Restrict key to your domain in production

---

## Local Dev

```bash
cd C:\Users\vrush\Documents\badminton-finder
npm run dev
```

Run terminal as Administrator if Turbopack throws "Access denied" (Windows file lock issue).
