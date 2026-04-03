"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Map, List } from "lucide-react";
import VenueCard from "../components/VenueCard";
import VenueMap from "../components/VenueMap";
import SearchModal from "../components/SearchModal";
import VenueSlideOver from "../components/VenueSlideOver";
import { useUserLocation } from "../hooks/useUserLocation";

type Venue = { id: number; name: string; suburb: string; address: string; city: string; state: string; courts: number; price: string; booking_url: string; lat: number; lng: number };
type SortKey = "distance" | "price-asc" | "price-desc" | "courts";

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

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("distance");
  const [maxDistance, setMaxDistance] = useState(15);
  const [minCourts, setMinCourts] = useState(0);
  const [slideOverVenue, setSlideOverVenue] = useState<Venue | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const { location: userLocation } = useUserLocation();

  const hasCoords = !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("venues").select("*");
      if (!error) setVenues((data as Venue[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  // Reset filters when location changes
  useEffect(() => {
    setSort("distance");
    setMaxDistance(15);
    setMinCourts(0);
  }, [location]);

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
        return true;
      });

    result = [...result].sort((a, b) => {
      if (sort === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
      if (sort === "courts") return (b.courts || 0) - (a.courts || 0);
      return (distances[a.id] ?? 999) - (distances[b.id] ?? 999); // distance default
    });

    return { results: result, distances };
  }, [venues, location, lat, lng, hasCoords, sort, maxDistance, minCourts]);

  const center = hasCoords ? { lat, lng } : null;
  const hasActiveFilters = maxDistance !== 15 || minCourts > 0;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm transition hover:bg-muted/80"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{location}</span>
            <span className="text-muted-foreground">· Change</span>
          </button>
          <span className="hidden text-xs text-muted-foreground sm:block">{results.length} venues</span>
        </div>

        {/* Filter / Sort bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-t bg-muted/30 px-4 py-2 sm:px-6 [scrollbar-width:none]">
          {/* Sort */}
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
          <div className="flex gap-1">
            {([ ["distance", "Distance"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"], ["courts", "Most Courts"] ] as [SortKey, string][]).map(([key, label]) => (
              <FilterPill key={key} label={label} active={sort === key} onClick={() => setSort(key)} />
            ))}
          </div>

          {hasCoords && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />

              {/* Distance radius */}
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Within</span>
              <div className="flex gap-1">
                {([[5, "5 km"], [10, "10 km"], [15, "15 km"], [25, "25 km"], [0, "Any"]] as [number, string][]).map(([km, label]) => (
                  <FilterPill key={km} label={label} active={maxDistance === km} onClick={() => setMaxDistance(km)} />
                ))}
              </div>
            </>
          )}

          <div className="h-4 w-px shrink-0 bg-border" />

          {/* Courts */}
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Courts</span>
          <div className="flex gap-1">
            {([[0, "Any"], [2, "2+"], [4, "4+"], [6, "6+"]] as [number, string][]).map(([n, label]) => (
              <FilterPill key={n} label={label} active={minCourts === n} onClick={() => setMinCourts(n)} />
            ))}
          </div>

          {hasActiveFilters && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <button
                onClick={() => { setMaxDistance(15); setMinCourts(0); }}
                className="shrink-0 text-[11px] text-destructive hover:underline"
              >
                Clear filters
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
        <div className={`venue-scroll w-full flex-shrink-0 overflow-y-auto p-4 lg:w-[440px] xl:w-[480px] lg:border-r ${mobileView === "map" ? "hidden lg:block" : ""}`}>
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
            <div className="py-16 text-center">
              <p className="text-4xl">🏸</p>
              <p className="mt-3 text-sm text-muted-foreground">No venues found near {location}</p>
              <Button variant="link" size="sm" onClick={() => setSearchOpen(true)} className="mt-2">
                Try a different search
              </Button>
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
                />
              ))}
            </div>
          )}
        </div>
        <div className={`min-h-[300px] flex-1 lg:min-h-0 ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          <VenueMap venues={results} selectedVenueId={activeVenueId} onMarkerClick={(id) => { setActiveVenueId(id); setMobileView("list"); }} center={center} userLocation={userLocation} fullHeight className="h-full" />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VenueSlideOver venue={slideOverVenue} open={slideOverVenue !== null} onClose={() => setSlideOverVenue(null)} />
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
