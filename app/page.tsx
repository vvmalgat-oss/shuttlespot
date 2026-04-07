"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, MapPin, Users, CalendarDays, Zap, Navigation } from "lucide-react";
import SearchModal from "./components/SearchModal";
import StarRating from "./components/StarRating";
import { supabase } from "../supabase";
import { useUserLocation } from "./hooks/useUserLocation";
import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: number; name: string; city: string; state: string;
  courts: number; price: string; lat: number; lng: number;
  booking_url: string; distance?: number;
  open_hour?: number | null; close_hour?: number | null;
  google_rating?: number | null; google_review_count?: number | null;
};

type RatingStats = { avg_rating: number; review_count: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const CITIES = [
  { label: "Melbourne", state: "VIC", lat: -37.8136, lng: 144.9631 },
  { label: "Sydney",    state: "NSW", lat: -33.8688, lng: 151.2093 },
  { label: "Brisbane",  state: "QLD", lat: -27.4698, lng: 153.0251 },
  { label: "Perth",     state: "WA",  lat: -31.9505, lng: 115.8605 },
  { label: "Adelaide",  state: "SA",  lat: -34.9285, lng: 138.6007 },
  { label: "Gold Coast",state: "QLD", lat: -28.0167, lng: 153.4000 },
  { label: "Canberra",  state: "ACT", lat: -35.2809, lng: 149.1300 },
];

const HOW = [
  { icon: Search,       label: "Search your area",     desc: "Find courts by suburb, city or postcode" },
  { icon: CalendarDays, label: "Pick your time",        desc: "Choose date, duration and a start time" },
  { icon: Users,        label: "Book, find partners or join a group", desc: "Book a court, post your availability to find a partner, or join a group session near you" },
];

const GRADIENTS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700", "from-teal-500 to-teal-700",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the CITIES entry closest to the given coordinates */
function nearestCity(lat: number, lng: number) {
  return CITIES.reduce((best, city) => {
    const d = haversineKm(lat, lng, city.lat, city.lng);
    const bestD = haversineKm(lat, lng, best.lat, best.lng);
    return d < bestD ? city : best;
  });
}

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function hoursStatus(openHour?: number | null, closeHour?: number | null): { open: boolean; label: string } | null {
  if (openHour == null || closeHour == null) return null;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const close = closeHour === 24 ? 24 : closeHour;
  if (h >= openHour && h < close) return { open: true, label: `Open · closes ${fmtHour(closeHour)}` };
  if (h < openHour) return { open: false, label: `Closed · opens ${fmtHour(openHour)}` };
  return { open: false, label: `Closed · opens ${fmtHour(openHour)} tomorrow` };
}

function avatarGradient(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[h % GRADIENTS.length];
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [ratingStatsMap, setRatingStatsMap] = useState<Record<number, RatingStats>>({});
  const { location: userLoc, status: locStatus, request: requestLocation } = useUserLocation();

  // Fetch all venues + rating stats once
  useEffect(() => {
    Promise.all([
      supabase.from("venues").select("id, name, city, state, courts, price, lat, lng, booking_url, open_hour, close_hour, open_hour_weekend, close_hour_weekend, min_duration, peak_start_hour, peak_end_hour, late_night_hour, late_night_price, opening_hours, google_rating, google_review_count"),
      supabase.from("venue_rating_stats").select("venue_id, avg_rating, review_count"),
    ]).then(([{ data, error }, { data: statsData }]) => {
      if (error) console.error("Venues fetch error:", error);
      if (data && data.length > 0) setAllVenues(data as Venue[]);
      if (statsData) {
        const map: Record<number, RatingStats> = {};
        statsData.forEach((s: RatingStats & { venue_id: number }) => { map[s.venue_id] = s; });
        setRatingStatsMap(map);
      }
    });
  }, []);

  // Sort venues by distance when location is available, else by Google rating / courts
  const featured = useMemo<Venue[]>(() => {
    if (allVenues.length === 0) return [];
    if (userLoc) {
      return [...allVenues]
        .filter(v => v.lat && v.lng)
        .map(v => ({ ...v, distance: haversineKm(userLoc.lat, userLoc.lng, v.lat, v.lng) }))
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
        .slice(0, 6);
    }
    // Always fall back to top-rated venues — never show empty
    return [...allVenues]
      .sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0) || (b.courts || 0) - (a.courts || 0))
      .slice(0, 6);
  }, [allVenues, userLoc]);

  // "View all" link — use nearest city when location granted
  const viewAllHref = useMemo(() => {
    if (userLoc) {
      const city = nearestCity(userLoc.lat, userLoc.lng);
      return `/search?location=${encodeURIComponent(`${city.label}, ${city.state}`)}&lat=${userLoc.lat}&lng=${userLoc.lng}`;
    }
    return "/venues";
  }, [userLoc]);

  // Only skeleton while actively requesting AND no venues loaded yet
  const showSkeleton = locStatus === "requesting" && allVenues.length === 0;

  return (
    <div className="min-h-[calc(100vh-56px)] pb-16 md:pb-0">

      {/* ── Hero with background video ── */}
      <section className="relative flex min-h-[600px] items-center overflow-hidden px-4 pb-20 pt-28 sm:min-h-[680px] sm:pb-28 sm:pt-36">

        {/* Background video — falls back to poster image if video file not present */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.pexels.com/photos/8796050/pexels-photo-8796050.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          {/* Download a free badminton video from https://www.pexels.com/video/teammates-playing-badminton-8053653/
              and save it to /public/videos/hero.mp4 */}
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay — keeps text readable over the photo/video */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        {/* Bottom fade so the section blends into page */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            <MapPin className="h-3 w-3" />
            68+ venues across Australia
          </div>

          <h1 className="text-[2.7rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find &amp; book a<br />badminton court
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-base text-white/70 sm:text-lg">
            Search venues, compare prices, pick your time, and book in seconds.
          </p>

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="group mx-auto mt-8 flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-white px-5 py-3.5 text-left shadow-xl transition-all hover:shadow-2xl"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm text-muted-foreground">
              Search suburb, city or postcode…
            </span>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-primary/90">
              Search
            </span>
          </button>

          {/* Location button */}
          {locStatus === "denied" ? (
            <button
              onClick={requestLocation}
              className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-white/60 transition hover:text-white/90"
            >
              <Navigation className="h-3 w-3" />
              Enable location for nearby venues
            </button>
          ) : locStatus === "granted" ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Location detected
            </p>
          ) : (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/50">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" />
              Detecting your location…
            </p>
          )}

          {/* City quick links */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {CITIES.map(({ label, state, lat, lng }) => (
              <Link
                key={label}
                href={`/search?location=${encodeURIComponent(`${label}, ${state}`)}&lat=${lat}&lng=${lng}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearby / Featured venues ── */}
      <section className="px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold">
                {locStatus === "granted" && <Navigation className="h-4 w-4 text-primary" />}
                {locStatus === "granted" ? "Venues near you" : "Popular venues"}
              </h2>
              {locStatus === "granted" && (
                <p className="mt-0.5 text-xs text-muted-foreground">Based on your current location</p>
              )}
            </div>
            <Link href={viewAllHref} className="shrink-0 flex items-center gap-1 text-sm text-muted-foreground transition hover:text-primary">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Skeleton while requesting */}
          {showSkeleton && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/40" />
              ))}
            </div>
          )}

          {/* Venue cards */}
          {!showSkeleton && featured.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((v) => {
                const hrs = hoursStatus(v.open_hour, v.close_hour);
                return (
                <Link
                  key={v.id}
                  href={`/search?location=${encodeURIComponent([v.city, v.state].filter(Boolean).join(", "))}&lat=${v.lat}&lng=${v.lng}&venueId=${v.id}`}
                  className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(v.name)}`}>
                    {initials(v.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    {hrs ? (
                      <p className={`flex items-center gap-1 text-xs font-medium ${hrs.open ? "text-emerald-600" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${hrs.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                        {hrs.label}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{v.distance != null ? `${v.distance.toFixed(1)} km away` : [v.city, v.state].filter(Boolean).join(", ")}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {v.google_rating != null && v.google_review_count != null && (
                        <span className="flex items-center gap-0.5 text-[11px]">
                          <svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          <span className="font-semibold">{v.google_rating.toFixed(1)}</span>
                          <span className="text-amber-400">★</span>
                          <span className="text-muted-foreground">({v.google_review_count.toLocaleString()})</span>
                        </span>
                      )}
                      {ratingStatsMap[v.id]?.review_count > 0 && (
                        <StarRating rating={ratingStatsMap[v.id].avg_rating} count={ratingStatsMap[v.id].review_count} size="xs" />
                      )}
                      {v.price && <span className="text-xs font-semibold text-primary">{v.price}</span>}
                      {v.courts ? <span className="text-xs text-muted-foreground">{v.courts} courts</span> : null}
                      {hrs && v.distance != null && <span className="text-xs text-muted-foreground">{v.distance.toFixed(1)} km</span>}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition group-hover:text-primary" />
                </Link>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ── Browse by city ── */}
      <section className="border-t px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-1 text-base font-bold">Browse by city</h2>
          <p className="mb-6 text-xs text-muted-foreground">Indoor badminton venues across Australia</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { city: "melbourne", label: "Melbourne", state: "VIC", color: "from-blue-600 to-indigo-700" },
              { city: "sydney",    label: "Sydney",    state: "NSW", color: "from-emerald-500 to-teal-700" },
              { city: "brisbane",  label: "Brisbane",  state: "QLD", color: "from-red-500 to-rose-700" },
              { city: "perth",     label: "Perth",     state: "WA",  color: "from-amber-500 to-orange-600" },
              { city: "adelaide",  label: "Adelaide",  state: "SA",  color: "from-purple-500 to-violet-700" },
              { city: "canberra",  label: "Canberra",  state: "ACT", color: "from-cyan-500 to-blue-600" },
              { city: "hobart",    label: "Hobart",    state: "TAS", color: "from-green-600 to-emerald-700" },
              { city: "darwin",    label: "Darwin",    state: "NT",  color: "from-orange-500 to-red-600" },
            ].map(({ city, label, state, color }) => {
              const count = allVenues.filter((v) => v.state === state).length;
              return (
                <Link
                  key={city}
                  href={`/venues/${city}`}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-4 text-white transition-all hover:shadow-lg hover:scale-[1.02]`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10">
                    <p className="text-base font-bold">{label}</p>
                    {count > 0 && <p className="mt-0.5 text-[11px] text-white/70">{count} venue{count !== 1 ? "s" : ""}</p>}
                  </div>
                  <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-white/40 transition group-hover:text-white/80" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">How it works</span>
          </div>
          <p className="mb-8 text-center text-xl font-bold tracking-tight">Court booked in under a minute</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW.map(({ icon: Icon, label, desc }, i) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border bg-card p-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
                  <p className="mt-0.5 text-sm font-bold">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-14 text-center sm:py-16">
        <h2 className="text-xl font-bold tracking-tight">Ready to play?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Search for a court near you — it&apos;s free.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="gap-2" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" /> Find a court
          </Button>
          <Link href="/venues">
            <Button size="lg" variant="outline" className="gap-2">
              Browse all venues <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} userLocation={userLoc} />
    </div>
  );
}
