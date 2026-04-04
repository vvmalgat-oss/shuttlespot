import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../supabase";
import { MapPin, Clock, CheckCircle2, ArrowLeft, ArrowRight, Search } from "lucide-react";

// ─── City config ─────────────────────────────────────────────────────────────

const CITIES: Record<string, { state: string; label: string; region: string; lat: number; lng: number }> = {
  melbourne: { state: "VIC", label: "Melbourne", region: "Victoria", lat: -37.8136, lng: 144.9631 },
  sydney:    { state: "NSW", label: "Sydney",    region: "New South Wales", lat: -33.8688, lng: 151.2093 },
  brisbane:  { state: "QLD", label: "Brisbane",  region: "Queensland", lat: -27.4698, lng: 153.0251 },
  perth:     { state: "WA",  label: "Perth",     region: "Western Australia", lat: -31.9505, lng: 115.8605 },
  adelaide:  { state: "SA",  label: "Adelaide",  region: "South Australia", lat: -34.9285, lng: 138.6007 },
  canberra:  { state: "ACT", label: "Canberra",  region: "Australian Capital Territory", lat: -35.2809, lng: 149.1300 },
  hobart:    { state: "TAS", label: "Hobart",    region: "Tasmania", lat: -42.8821, lng: 147.3272 },
  darwin:    { state: "NT",  label: "Darwin",    region: "Northern Territory", lat: -12.4634, lng: 130.8456 },
};

const STATE_GRADIENTS: Record<string, string> = {
  VIC: "from-blue-600 to-indigo-700",
  NSW: "from-emerald-500 to-teal-700",
  QLD: "from-red-500 to-rose-700",
  WA:  "from-amber-500 to-orange-600",
  SA:  "from-purple-500 to-violet-700",
  ACT: "from-cyan-500 to-blue-600",
  TAS: "from-green-600 to-emerald-700",
  NT:  "from-orange-500 to-red-600",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: number;
  name: string;
  suburb: string;
  address: string;
  city: string;
  state: string;
  courts: number;
  price: string;
  booking_url: string;
  photo_url?: string | null;
  open_hour?: number | null;
  close_hour?: number | null;
  opening_hours?: string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
};

type Props = { params: Promise<{ city: string }> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function hoursStatus(open?: number | null, close?: number | null): { open: boolean; label: string } | null {
  if (open == null || close == null) return null;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= open && h < (close === 24 ? 24 : close)) return { open: true, label: `Open · closes ${fmtHour(close)}` };
  if (h < open) return { open: false, label: `Closed · opens ${fmtHour(open)}` };
  return { open: false, label: `Closed · opens ${fmtHour(open)} tomorrow` };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cfg = CITIES[city.toLowerCase()];
  if (!cfg) return { title: "Not Found" };

  const title = `Badminton Courts in ${cfg.label} — Book Indoor Courts`;
  const description = `Find and book indoor badminton courts in ${cfg.label}, ${cfg.region}. Compare venues, prices, opening hours and book online.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://shuttlespot.vercel.app/venues/${city}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://shuttlespot.vercel.app/venues/${city}` },
  };
}

export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityVenuesPage({ params }: Props) {
  const { city } = await params;
  const cfg = CITIES[city.toLowerCase()];
  if (!cfg) notFound();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, suburb, address, city, state, courts, price, booking_url, photo_url, open_hour, close_hour, opening_hours, google_rating, google_review_count")
    .eq("state", cfg.state)
    .order("name");

  const venueList = (venues as Venue[]) ?? [];
  const suburbs = [...new Set(venueList.map((v) => v.suburb).filter(Boolean))].sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Badminton Courts in ${cfg.label}`,
    description: `Indoor badminton venues in ${cfg.label}, ${cfg.region}`,
    numberOfItems: venueList.length,
    itemListElement: venueList.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsActivityLocation",
        name: v.name,
        address: { "@type": "PostalAddress", streetAddress: v.address, addressLocality: v.suburb, addressRegion: v.state, addressCountry: "AU" },
        url: `https://shuttlespot.vercel.app/venue/${v.id}`,
        sport: "Badminton",
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">Home</Link>
          <span>/</span>
          <Link href="/venues" className="hover:text-foreground transition">Venues</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cfg.label}</span>
        </nav>

        {/* Hero */}
        <div className={`relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br ${STATE_GRADIENTS[cfg.state]} px-8 py-10 text-white sm:py-12`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {cfg.region} · {cfg.state}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Badminton Courts in {cfg.label}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {venueList.length} indoor venue{venueList.length !== 1 ? "s" : ""} — compare prices, check availability, and book online
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/search?location=${encodeURIComponent(cfg.label + ", " + cfg.state)}&lat=${cfg.lat}&lng=${cfg.lng}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                <Search className="h-3.5 w-3.5" /> Search near me
              </Link>
              <Link
                href="/venues"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10"
              >
                All states
              </Link>
            </div>
          </div>
        </div>

        {/* Suburb pills */}
        {suburbs.length > 1 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browse by suburb</p>
            <div className="flex flex-wrap gap-2">
              {suburbs.map((s) => (
                <a
                  key={s}
                  href={`#suburb-${s.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-full border bg-background px-3 py-1 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Venue grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venueList.map((venue) => {
            const hrs = hoursStatus(venue.open_hour, venue.close_hour);
            const gradient = STATE_GRADIENTS[venue.state] || "from-slate-500 to-slate-700";
            return (
              <Link
                key={venue.id}
                id={`suburb-${venue.suburb.toLowerCase().replace(/\s+/g, "-")}`}
                href={`/venue/${venue.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Photo */}
                <div className="relative h-36 w-full overflow-hidden">
                  {venue.photo_url ? (
                    <img
                      src={venue.photo_url}
                      alt={venue.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${gradient}`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute bottom-2 left-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                        {initials(venue.name)}
                      </div>
                    </div>
                  )}
                  {venue.booking_url && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                      <CheckCircle2 className="h-3 w-3" /> Book online
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold leading-snug">{venue.name}</h2>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>

                  {hrs && (
                    <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${hrs.open ? "text-emerald-600" : "text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hrs.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      {hrs.label}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {venue.google_rating != null && venue.google_review_count != null && (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <GoogleRatingIcon />
                        <span className="font-semibold">{venue.google_rating.toFixed(1)}</span>
                        <span className="text-amber-400">★</span>
                        <span className="text-muted-foreground">({venue.google_review_count.toLocaleString()})</span>
                      </span>
                    )}
                    {venue.courts ? <span className="text-xs text-muted-foreground">{venue.courts} court{venue.courts !== 1 ? "s" : ""}</span> : null}
                    {venue.price ? <span className="text-xs font-semibold text-primary">{venue.price}</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {venueList.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-4xl">🏸</p>
            <p className="mt-3 text-sm text-muted-foreground">No venues listed yet for {cfg.label}</p>
            <Link href="/venues" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Browse all venues
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        {venueList.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/40 px-6 py-5">
            <div>
              <p className="text-sm font-semibold">Looking for a court near you?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use the search to find the closest available court right now</p>
            </div>
            <Link
              href={`/search?location=${encodeURIComponent(cfg.label + ", " + cfg.state)}&lat=${cfg.lat}&lng=${cfg.lng}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <Search className="h-4 w-4" /> Find a court
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function GoogleRatingIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" aria-label="Google">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
