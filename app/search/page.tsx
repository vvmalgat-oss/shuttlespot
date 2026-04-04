"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Map, List, X } from "lucide-react";
import VenueCard from "../components/VenueCard";
import VenueMap from "../components/VenueMap";
import SearchModal from "../components/SearchModal";
import VenueSlideOver from "../components/VenueSlideOver";
import { useUserLocation } from "../hooks/useUserLocation";
import { useSavedVenues } from "../hooks/useSavedVenues";
import AuthModal from "../components/AuthModal";

type Venue = { id: number; name: string; suburb: string; address: string; city: string; state: string; courts: number; price: string; booking_url: string; lat: number; lng: number; open_hour?: number | null; close_hour?: number | null; google_rating?: number | null; google_review_count?: number | null };
type RatingStats = { avg_rating: number; review_count: number };
type SortKey = "distance" | "rating" | "price-asc" | "price-desc" | "courts";

function isOpenNow(v: Venue): boolean {
  if (v.open_hour == null || v.close_hour == null) return false;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= v.open_hour && h < (v.close_hour === 24 ? 24 : v.close_hour);
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parsePrice(p: string | null): number {
  if (!p) return 0;
  const m = p.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "border bg-background text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const location = searchParams.get("location") || "";
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const venueIdParam = searchParams.get("venueId");

  const [venues, setVenues] = useState<Venue[]>([]);
  const [ratingStatsMap, setRatingStatsMap] = useState<Record<number, RatingStats>>({});
  const [loading, setLoading] = useState(true);
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null);
  const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("distance");
  const [maxDistance, setMaxDistance] = useState(15);
  const [minCourts, setMinCourts] = useState(0);
  const [openNow, setOpenNow] = useState(false);
  const [bookOnline, setBookOnline] = useState(false);
  const [slideOverVenue, setSlideOverVenue] = useState<Venue | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const { location: userLocation } = useUserLocation();
  const { savedIds, toggleSave } = useSavedVenues();
  const [authOpen, setAuthOpen] = useState(false);

  const hasCoords = !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    async function load() {
      const [{ data, error }, { data: statsData }] = await Promise.all([
        supabase.from("venues").select("*"),
        supabase.from("venue_rating_stats").select("venue_id, avg_rating, review_count"),
      ]);
      if (!error) {
        const loaded = (data as Venue[]) || [];
        setVenues(loaded);
        if (venueIdParam) {
          const id = parseInt(venueIdParam);
          const target = loaded.find((v) => v.id === id);
          if (target) { setSlideOverVenue(target); setActiveVenueId(id); }
        }
      }
      if (statsData) {
        const map: Record<number, RatingStats> = {};
        statsData.forEach((s: RatingStats & { venue_id: number }) => { map[s.venue_id] = s; });
        setRatingStatsMap(map);
      }
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset filters when location changes
  useEffect(() => {
    setSort("distance");
    setMaxDistance(15);
    setMinCourts(0);
    setOpenNow(false);
    setBookOnline(false);
  }, [location]);

  // Scroll list to active venue after render (triggered by marker click).
  // rAF defers until after the browser paints — required when switching from map view on mobile.
  useEffect(() => {
    if (pendingScrollId === null) return;
    const id = pendingScrollId;
    setPendingScrollId(null);
    requestAnimationFrame(() => {
      const container = listContainerRef.current;
      const card = document.getElementById(`venue-${id}`);
      if (container && card) {
        const containerTop = container.getBoundingClientRect().top;
        const cardTop = card.getBoundingClientRect().top;
        container.scrollTo({ top: Math.max(0, container.scrollTop + cardTop - containerTop - 16), behavior: "smooth" });
      }
    });
  }, [pendingScrollId]);

  const { results, distances } = useMemo(() => {
    const distances: Record<number, number> = {};

    let result = venues
      .map((v) => {
        if (v.lat && v.lng && hasCoords) distances[v.id] = getDistance(lat, lng, v.lat, v.lng);
        return v;
      })
      .filter((v) => {
        const q = location.toLowerCase().replace(/,?\s*\w{2,3}\s*\d*/i, "").trim();
        const textMatch =
          v.name.toLowerCase().includes(q) ||
          v.suburb.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          (v.city && v.city.toLowerCase().includes(q));

        if (textMatch) return true;

        const km = distances[v.id];
        if (hasCoords && km !== undefined) {
          return maxDistance === 0 ? true : km <= maxDistance;
        }
        return false;
      })
      .filter((v) => {
        if (minCourts && (v.courts || 0) < minCourts) return false;
        if (openNow && !isOpenNow(v)) return false;
        if (bookOnline && !v.booking_url) return false;
        return true;
      });

    result = [...result].sort((a, b) => {
      if (sort === "rating") return (b.google_rating ?? 0) - (a.google_rating ?? 0);
      if (sort === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
      if (sort === "courts") return (b.courts || 0) - (a.courts || 0);
      return (distances[a.id] ?? 999) - (distances[b.id] ?? 999); // distance default
    });

    return { results: result, distances };
  }, [venues, location, lat, lng, hasCoords, sort, maxDistance, minCourts, openNow, bookOnline]);

  // When nothing matches the radius/filters, show the closest venues as a fallback.
  const nearestFallback = useMemo(() => {
    if (results.length > 0 || !hasCoords || venues.length === 0) return [];
    return [...venues]
      .filter((v) => v.lat && v.lng)
      .sort((a, b) => (distances[a.id] ?? 9999) - (distances[b.id] ?? 9999))
      .slice(0, 6);
  }, [results.length, venues, distances, hasCoords]);

  const center = hasCoords ? { lat, lng } : null;

  // Persist the searched location so other pages (e.g. /venues) can default to it.
  useEffect(() => {
    if (center) {
      try { localStorage.setItem("ss_lastCenter", JSON.stringify(center)); } catch {}
    }
  }, [center?.lat, center?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasActiveFilters = maxDistance !== 15 || minCourts > 0 || openNow || bookOnline;

  return (
    <div className="flex h-[calc(100svh-56px-64px)] flex-col md:h-[calc(100svh-56px)]">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
            <button onClick={() => setSearchOpen(true)} className="flex flex-1 items-center gap-2 min-w-0 transition hover:opacity-70">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium truncate">{location}</span>
              <span className="text-muted-foreground shrink-0">· Change</span>
            </button>
            <button onClick={() => setSearchOpen(true)} className="shrink-0 text-muted-foreground hover:text-foreground transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">{results.length} venues</span>
        </div>

        {/* Filter / Sort bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-t bg-muted/30 px-4 py-2 sm:px-6 [scrollbar-width:none]">
          {/* Sort */}
          <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">Sort</span>
          <div className="flex gap-1">
            {([ ["distance", "Nearest"], ["rating", "Top Rated"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"], ["courts", "Most Courts"] ] as [SortKey, string][]).map(([key, label]) => (
              <FilterPill key={key} label={label} active={sort === key} onClick={() => setSort(key)} />
            ))}
          </div>

          {hasCoords && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">Within</span>
              <div className="flex gap-1">
                {([[5, "5 km"], [10, "10 km"], [15, "15 km"], [25, "25 km"], [0, "Any"]] as [number, string][]).map(([km, label]) => (
                  <FilterPill key={km} label={label} active={maxDistance === km} onClick={() => setMaxDistance(km)} />
                ))}
              </div>
            </>
          )}

          <div className="h-4 w-px shrink-0 bg-border" />

          {/* Courts */}
          <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">Courts</span>
          <div className="flex gap-1">
            {([[0, "Any"], [2, "2+"], [4, "4+"], [6, "6+"]] as [number, string][]).map(([n, label]) => (
              <FilterPill key={n} label={label} active={minCourts === n} onClick={() => setMinCourts(n)} />
            ))}
          </div>

          <div className="h-4 w-px shrink-0 bg-border" />

          {/* Quick filters */}
          <FilterPill label="🟢 Open now" active={openNow} onClick={() => setOpenNow(!openNow)} />
          <FilterPill label="Book online" active={bookOnline} onClick={() => setBookOnline(!bookOnline)} />

          {hasActiveFilters && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <button
                onClick={() => { setMaxDistance(15); setMinCourts(0); setOpenNow(false); setBookOnline(false); }}
                className="shrink-0 text-[11px] text-destructive hover:underline"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile list/map toggle */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2 lg:hidden">
        <div className="flex w-fit rounded-lg border p-0.5">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${mobileView === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${mobileView === "map" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Map className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div ref={listContainerRef} className={`venue-scroll w-full flex-shrink-0 overflow-y-auto p-4 pb-6 lg:w-[440px] xl:w-[480px] lg:border-r ${mobileView === "map" ? "hidden lg:block" : ""}`}>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Results near {location}</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border p-4">
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="mb-2 h-3 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div>
              <div className="py-8 text-center">
                <p className="text-4xl">🏸</p>
                <p className="mt-3 text-sm font-medium text-foreground">No venues found near {location}</p>
                <p className="mt-1 text-xs text-muted-foreground">Showing the nearest courts we could find instead</p>
                <Button variant="link" size="sm" onClick={() => setSearchOpen(true)} className="mt-1 text-xs">
                  Try a different suburb
                </Button>
              </div>
              {nearestFallback.length > 0 && (
                <div className="space-y-3">
                  {nearestFallback.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      distance={distances[venue.id] !== undefined ? distances[venue.id].toFixed(1) : null}
                      isActive={activeVenueId === venue.id}
                      onHover={setActiveVenueId}
                      onClick={(id) => setSlideOverVenue(nearestFallback.find((v) => v.id === id) ?? null)}
                      ratingStats={ratingStatsMap[venue.id] ?? null}
                      isSaved={savedIds.has(venue.id)}
                      onToggleSave={(id) => toggleSave(id, () => setAuthOpen(true))}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  distance={distances[venue.id] !== undefined ? distances[venue.id].toFixed(1) : null}
                  isActive={activeVenueId === venue.id}
                  onHover={setActiveVenueId}
                  onClick={(id) => setSlideOverVenue(results.find((v) => v.id === id) ?? null)}
                  ratingStats={ratingStatsMap[venue.id] ?? null}
                  isSaved={savedIds.has(venue.id)}
                  onToggleSave={(id) => toggleSave(id, () => setAuthOpen(true))}
                />
              ))}
            </div>
          )}
        </div>
        <div className={`min-h-[300px] flex-1 lg:min-h-0 ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          <VenueMap venues={results.length > 0 ? results : nearestFallback} selectedVenueId={activeVenueId} onMarkerClick={(id) => { setActiveVenueId(id); setMobileView("list"); setPendingScrollId(id); }} center={center} userLocation={userLocation} fullHeight className="h-full" />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VenueSlideOver venue={slideOverVenue} open={slideOverVenue !== null} onClose={() => setSlideOverVenue(null)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-56px)] items-center justify-center text-muted-foreground">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
