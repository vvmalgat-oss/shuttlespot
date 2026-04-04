# ShuttleSpot — Database Reference

## `venues` table

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| name | text | Venue name |
| suburb | text | Suburb |
| city | text | City |
| state | text | AU state code: VIC, NSW, QLD, SA, WA, ACT, TAS, NT |
| address | text | Full street address |
| courts | integer | Number of badminton courts |
| price | text | e.g. "$22/hr" |
| booking_url | text | External booking URL |
| lat | float | Latitude |
| lng | float | Longitude |

**Data:** ~68 venues across all Australian states. Re-run `sql/venue-import.sql` if needed.

---

## `play_requests` table (Social > Find Partners)

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| venue_id | integer | FK → venues(id) |
| venue_name | text | Denormalized |
| date | date | |
| time_slot | text | e.g. "6:00 PM – 8:00 PM" |
| player_name | text | |
| player_email | text | |
| skill_level | text | Beginner / Intermediate / Advanced |
| spots_available | integer | Default 1 |
| message | text | Optional |
| status | text | open / confirmed / cancelled |
| created_at | timestamptz | Auto-set |

---

## `venue_events` table (Social > Group Events)

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| venue_id | integer | FK → venues(id), nullable |
| venue_name | text | Display name |
| venue_suburb | text | |
| venue_state | text | AU state code |
| club_name | text | Organising club name |
| event_type | text | e.g. "Social Play", "Coaching" |
| day_of_week | text | e.g. "Monday" |
| start_time | time | |
| end_time | time | |
| skill_level | text | All / Beginner / Intermediate / Advanced |
| cost | text | e.g. "$10 per session" |
| contact_email | text | |
| notes | text | Optional |
| is_active | boolean | Default true |

**SQL:** `sql/venue-events.sql` — uses TRUNCATE + re-insert pattern, safe to re-run.

---

## Indexes

- `venues`: city, state
- `play_requests`: venue_id, date, status

## RLS (Row Level Security)

- `play_requests`: public read / insert / update enabled
- `venue_events`: public read enabled

---

## SQL Files

| File | Purpose |
|------|---------|
| `sql/migration.sql` | Schema creation (already run) |
| `sql/venue-import.sql` | Initial venue data insert |
| `sql/venue-events.sql` | Group events data (TRUNCATE + re-insert) |
| `sql/venue-fixes.sql` | Data corrections (Melbourne duplicate, Adelaide suburb) |

### venue-fixes.sql summary

- Removes duplicate Melbourne Badminton Centre rows (keeps lowest id)
- Sets Melbourne Badminton Centre to Blackburn North (not Mitcham)
- Fixes Adelaide Badminton Centre suburb: Brooklyn Park → Torrensville
