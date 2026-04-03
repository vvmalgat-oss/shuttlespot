"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, MapPin, Users, CalendarDays, Zap, Navigation } from "lucide-react";
import SearchModal from "./components/SearchModal";
import { supabase } from "../supabase";
import { useUserLocation } from "./hooks/useUserLocation";
import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: number; name: string; city: string; state: string;
  courts: number; price: string; lat: number; lng: number;
  booking_url: string; distance?: number;
};

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
  { icon: Users,        label: "Book or find partners", desc: "Proceed to booking or join other players" },
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
  const { location: userLoc, status: locStatus, request: requestLocation } = useUserLocation();

  // Fetch all venues once
  useEffect(() => {
    supabase
      .from("venues")
      .select("id, name, city, state, courts, price, lat, lng, booking_url")
      .then(({ data }) => { if (data) setAllVenues(data as Venue[]); });
  }, []);

  // Sort venues by distance when location is available, else by courts
  const featured = useMemo<Venue[]>(() => {
    if (allVenues.length === 0) return [];
    if (userLoc) {
      return [...allVenues]
        .filter(v => v.lat && v.lng)
        .map(v => ({ ...v, distance: haversineKm(userLoc.lat, userLoc.lng, v.lat, v.lng) }))
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
        .slice(0, 6);
    }
    if (locStatus === "denied") {
      return [...allVenues].sort((a, b) => (b.courts || 0) - (a.courts || 0)).slice(0, 6);
    }
    return [];
  }, [allVenues, userLoc, locStatus]);

  // "View all" link — when location is granted use the nearest known city so search returns results
  const viewAllHref = useMemo(() => {
    if (userLoc) {
      const city = nearestCity(userLoc.lat, userLoc.lng);
      return `/search?location=${encodeURIComponent(`${city.label}, ${city.state}`)}&lat=${userLoc.lat}&lng=${userLoc.lng}`;
    }
    return "/venues";
  }, [userLoc]);

  const showSkeleton = locStatus === "requesting" || (locStatus !== "denied" && featured.length === 0 && allVenues.length === 0);

  return (
    <div className="min-h-[calc(100vh-56px)]">

      {/* ── Hero with background video ── */}
      <section className="relative flex min-h-[600px] items-center overflow-hidden px-4 pb-20 pt-28 sm:min-h-[680px] sm:pb-28 sm:pt-36">

        {/* Background video — free stock badminton footage */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/*
            Replace this URL with a local file at /public/videos/hero.mp4
            Free badminton stock videos: https://www.pexels.com/search/videos/badminton/
          */}
          <source
            src="https://cdn.coverr.co/videos/covr-2081/720p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Gradient overlay — also acts as the fallback when video is unavailable */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/85 to-primary/80" />
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
              {featured.map((v) => (
                <Link
                  key={v.id}
                  href={`/search?location=${encodeURIComponent([v.city, v.state].filter(Boolean).join(", "))}&lat=${userLoc?.lat ?? v.lat}&lng=${userLoc?.lng ?? v.lng}`}
                  className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(v.name)}`}>
                    {initials(v.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    {v.distance != null ? (
                      <p className="text-xs text-muted-foreground">{v.distance.toFixed(1)} km away</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{[v.city, v.state].filter(Boolean).join(", ")}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      {v.price && <span className="text-xs font-semibold text-primary">{v.price}</span>}
                      {v.courts ? <span className="text-xs text-muted-foreground">{v.courts} courts</span> : null}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}

          {/* Denied + empty fallback */}
          {locStatus === "denied" && featured.length === 0 && allVenues.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <button onClick={requestLocation} className="text-primary underline-offset-2 hover:underline">Enable location</button>{" "}
              to see venues near you, or{" "}
              <Link href="/venues" className="text-primary underline-offset-2 hover:underline">browse all venues</Link>.
            </p>
          )}
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
