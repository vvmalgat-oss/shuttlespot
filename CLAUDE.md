# ShuttleSpot — Claude Code Handoff

**ShuttleSpot** is an Australian badminton venue discovery platform. Next.js 16 (App Router) + Supabase + Google Maps + Tailwind v4 + shadcn/ui.

**Live status:** Active development, not yet deployed.

---

## Quick Reference

| Topic | File |
|-------|------|
| DB schema + tables | [docs/DATABASE.md](docs/DATABASE.md) |
| Pages & components | [docs/FEATURES.md](docs/FEATURES.md) |
| Known issues & TODOs | [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) |
| Design direction | [docs/DESIGN.md](docs/DESIGN.md) |
| Deploy + env vars | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Commands + common fixes | [docs/QUICK_REF.md](docs/QUICK_REF.md) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix, Nova preset) |
| Backend/DB | Supabase (PostgreSQL) |
| Maps | Google Maps API via `@react-google-maps/api` |
| Icons | Lucide React |
| Hosting | Vercel (planned) |

---

## Project Structure

```
badminton-finder/
├── app/
│   ├── components/         # Navbar, SearchModal, VenueCard, VenueMap, VenueSlideOver, SocialMap
│   ├── search/page.tsx     # Search results with distance sorting + map
│   ├── social/page.tsx     # Find partners + Group Events tabs
│   ├── venue/[id]/page.tsx # Venue detail page
│   ├── venues/page.tsx     # All venues list + map
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Home page
├── components/ui/          # shadcn/ui components
├── lib/utils.ts
├── sql/
│   ├── migration.sql       # DB schema (already run)
│   ├── venue-import.sql    # ~68 venues (re-run if needed)
│   ├── venue-events.sql    # Group events (TRUNCATE + re-insert, safe to re-run)
│   └── venue-fixes.sql     # Data fixes (Melbourne duplicate, Adelaide suburb)
├── supabase.ts
└── .env.local              # Not committed
```

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

---

## Development Notes

- **Windows 11** — run terminal as Administrator if Turbopack throws "Access denied"
- **No OneDrive/Google Drive** — file locking causes crashes; keep project in local folder
- **Stray package-lock.json** at `C:\Users\vrush\package-lock.json` causes warnings — delete if it reappears
- `tailwindcss-animate` must be installed for shadcn (`npm install tailwindcss-animate`)
- Google Fonts `@import` must come before `@import "tailwindcss"` in globals.css

---

## Commands

```bash
npm run dev                          # Start dev server
npm run build                        # Production build
npx shadcn@latest add [component]    # Add shadcn component
```
