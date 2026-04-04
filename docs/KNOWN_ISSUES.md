# ShuttleSpot — Known Issues & TODO

## Active Known Issues

1. **Suburb autocomplete hardcoded** — only Melbourne suburbs in SearchModal. Needs Google Places API or full AU suburbs list.
2. **No user authentication** — Sign In button is placeholder. Social posts identified by name/email only.
3. **No venue photos or opening hours** — Not in DB schema yet.
4. **Mobile map hidden** — Map panel hidden on mobile for split-layout pages. Needs list/map toggle.
5. **Email-only social contact** — Find Partners uses mailto links; no in-app messaging.

---

## TODO List

### High Priority
- [ ] **Deploy to Vercel** — Connect GitHub repo, add env vars, deploy
- [ ] **GitHub repo** — Push code to GitHub
- [ ] **Expand suburb autocomplete** — Google Places API or full AU suburb list
- [ ] **Mobile map toggle** — Tabbed list/map view on mobile

### Medium Priority
- [ ] **SEO** — Meta tags, OpenGraph, structured data per venue page
- [ ] **User authentication** — Supabase Auth
- [ ] **Venue photos** — `venue_photos` table + Supabase Storage upload
- [ ] **Opening hours** — `venue_hours` table, display on venue detail
- [ ] **Admin dashboard** — Add/edit venues

### Lower Priority
- [ ] **Suburb landing pages** — `/play/badminton-box-hill` style SEO pages
- [ ] **Reviews & ratings** — User reviews on venue pages
- [ ] **Real-time court availability** — Integration with venue booking APIs
- [ ] **Native mobile app** — React Native + Expo after website validated
- [ ] **In-app social notifications** — Replace mailto with proper messaging

---

## Past Bugs Fixed (for reference)

- **Melbourne Badminton Centre duplicate** — UPDATE matched two rows; fixed with DELETE (keep min id) before UPDATE. See `sql/venue-fixes.sql`.
- **Adelaide Badminton Centre wrong suburb** — Brooklyn Park → Torrensville. Fixed in `sql/venue-fixes.sql` and `sql/venue-events.sql`.
- **6 AM slots showing** — VenueSlideOver.tsx had separate `generateSlots()` hardcoded to `start = 6 * 60`. Fixed: `VENUE_OPEN_HOURS` constant, minimum 8 AM enforced.
- **Group Events Near Me blank** — Club names don't match venues table; venueByName lookup returned undefined. Fixed with 3-tier `getEventCoords()` fallback + state-based filtering.
