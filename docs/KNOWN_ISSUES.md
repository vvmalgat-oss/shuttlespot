# ShuttleSpot — Known Issues & TODO

## Active Known Issues

1. **Venue data not fully verified** — Pricing and opening hours for most venues are placeholders (~9am–10pm, generic price). User is doing manual research to bulk-update in one pass.
2. **Email-only social contact** — Find Partners uses mailto links; no in-app messaging.
3. **No admin dashboard** — Adding/editing venues requires direct DB access.

---

## TODO List

### P0 — Before Going Live
- [ ] **GitHub repo** — Code is local only; push to GitHub as backup and for Vercel deploy
- [ ] **Deploy to Vercel** — Connect GitHub repo, add env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_MAPS_KEY`), deploy
- [ ] **Bulk venue data update** — Apply verified pricing + hours from manual research doc (user to provide)

### P1 — Post-Launch Polish
- [ ] **Venue photos** — Most venues use gradient fallback; real photos would improve trust
- [ ] **More venues** — Coverage outside VIC/NSW/QLD is thin

### Lower Priority
- [ ] **Suburb landing pages** — `/play/badminton-box-hill` style SEO pages
- [ ] **Reviews & ratings** — User reviews on venue pages
- [ ] **Real-time court availability** — Integration with venue booking APIs
- [ ] **Native mobile app** — React Native + Expo after website validated
- [ ] **In-app social notifications** — Replace mailto with proper messaging

---

## Already Done (previously listed as known issues)

- **Suburb autocomplete** — Uses Google Places Autocomplete API with `country: "au"` restriction. Works for all Australian suburbs/cities.
- **Mobile map toggle** — Both search and venues pages have `mobileView` state with list/map toggle button (hidden on desktop via `lg:hidden`).
- **User authentication** — Supabase Auth with email/password. AuthModal + session persistence.
- **SEO** — Metadata, OpenGraph, structured data (JSON-LD), and canonical URLs on all key pages. City landing pages at `/venues/[city]`.
- **Opening hours** — `open_hour`/`close_hour` columns + weekday/weekend differentiation (`open_hour_weekend`/`close_hour_weekend`).
- **Venue photos** — `photo_url` column; gradient avatar fallback when missing.

---

## Past Bugs Fixed (for reference)

- **Melbourne Badminton Centre duplicate** — UPDATE matched two rows; fixed with DELETE (keep min id) before UPDATE.
- **Adelaide Badminton Centre wrong suburb** — Brooklyn Park → Torrensville.
- **Alpha Badminton No.46/47 duplicate entries** — Removed; canonical entry is Alpha Badminton Centre.
- **Late-night pricing ($20/hr) not applying** — `page.tsx` missing new columns in select; `late_night_price` was `undefined`. Fixed select to include all pricing columns.
- **7am weekend slots not showing** — `generateSlots` had `Math.max(open, 8)` cap. Fixed to `Math.max(open, 6)`.
- **1.5hr slot showing for 1hr-only venue** — `min_duration` filter was `>=` instead of exact match `===`.
- **Peak hours applying globally** — Replaced global `peakStartH` default with per-venue `peak_start_hour`/`peak_end_hour` DB columns.
