# ShuttleSpot — Quick Reference

## Commands

```bash
npm run dev                          # Start dev server (Turbopack)
npm run build                        # Production build
npm install                          # Install dependencies
npx shadcn@latest add [component]    # Add shadcn component
```

---

## Common Fixes

| Problem | Fix |
|---------|-----|
| Turbopack "Access denied" | Run terminal as Administrator |
| Turbopack warnings about package-lock.json | Delete `C:\Users\vrush\package-lock.json` |
| shadcn styles broken | `npm install tailwindcss-animate` |
| Google Fonts not loading | Put `@import` for fonts before `@import "tailwindcss"` in globals.css |

---

## Key Files

| File | What it does |
|------|-------------|
| `app/social/page.tsx` | Most complex file — Find Partners + Group Events tabs, Near Me logic, map/list layout |
| `app/components/VenueSlideOver.tsx` | Time slot picker — `VENUE_OPEN_HOURS`, `generateSlots()`, min 8 AM |
| `sql/venue-events.sql` | Group events data — TRUNCATE + re-insert, run in Supabase SQL Editor |
| `sql/venue-fixes.sql` | Data corrections — run in Supabase SQL Editor if venue data looks wrong |
| `supabase.ts` | Supabase client (uses env vars) |

---

## Key Constants in `app/social/page.tsx`

```typescript
VENUE_HOURS          // Per-venue open hours { [name]: { open, close } }
getVenueSlots()      // Returns time slots for a venue respecting VENUE_HOURS
getEventCoords()     // 3-tier fallback: exact name → suburb+state → state capital
STATE_CAPITALS       // Coordinate fallback per state code
```

---

## Adding a New Group Event

1. Add row to `sql/venue-events.sql` inside the INSERT block
2. Re-run the entire SQL file in Supabase SQL Editor (safe — uses TRUNCATE first)

## Adding a New Venue

1. Add row to `sql/venue-import.sql`
2. Insert manually in Supabase, or re-run the import SQL
3. If venue has unusual opening hours, add to `VENUE_HOURS` in `app/social/page.tsx` and `app/components/VenueSlideOver.tsx`
