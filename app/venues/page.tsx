"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabase";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Map, List } from "lucide-react";
import VenueCard from "../components/VenueCard";
import VenueMap from "../components/VenueMap";
import VenueSlideOver from "../components/VenueSlideOver";
import { useUserLocation } from "../hooks/useUserLocation";

type Venue = { id: number; name: string; suburb: string; address: string; city: string; state: string; courts: number; price: string; booking_url: string; lat: number; lng: number };
type SortKey = "distance" | "name" | "price-asc" | "price-desc" | "courts";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVenueId, setActiveVenueId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [autoSortedToDistance, setAutoSortedToDistance] = useState(false);
  const [stateFilter, setStateFilter] = useState("");
  const [minCourts, setMinCourts] = useState(0);
  const [slideOverVenue, setSlideOverVenue] = useState<Venue | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const { location: userLocation } = useUserLocation();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("venues").select("*").order("name");
      if (!error) setVenues((data as Venue[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  // Auto-switch to nearest sort once location is available (only once)
  useEffect(() => {
    if (userLocation && !autoSortedToDistance) {
      setSort("distance");
      setAutoSortedToDistance(true);
    }
  }, [userLocation, autoSortedToDistance]);

  const states = useMemo(
    () => [...new Set(venues.map((v) => v.state).filter(Boolean))].sort() as string[],
    [venues]
  );

  const filtered = useMemo(() => {
    let result = venues.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !v.name?.toLowerCase().includes(q) &&
          !v.suburb?.toLowerCase().includes(q) &&
          !v.city?.toLowerCase().includes(q)
        ) return false;
      }
      if (stateFilter && v.state !== stateFilter) return false;
      if (minCourts && (v.courts || 0) < minCourts) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "distance" && userLocation) {
        const dA = a.lat && a.lng ? haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : 9999;
        const dB = b.lat && b.lng ? haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : 9999;
        return dA - dB;
      }
      if (sort === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
      if (sort === "courts") return (b.courts || 0) - (a.courts || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [venues, search, sort, stateFilter, minCourts, userLocation]);

  const hasActiveFilters = !!stateFilter || minCourts > 0;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h1 className="text-lg font-bold">All Venues</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} badminton venues across Australia</p>
          </div>
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues..." className="h-9 pl-9 text-sm" />
          </div>
        </div>

        {/* Filter / Sort bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-t bg-muted/30 px-4 py-2 sm:px-6 [scrollbar-width:none]">
          {/* Sort */}
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
          <div className="flex gap-1">
            {userLocation && <FilterPill label="Nearest" active={sort === "distance"} onClick={() => setSort("distance")} />}
            {([ ["name", "Name"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"], ["courts", "Most Courts"] ] as [SortKey, string][]).map(([key, label]) => (
              <FilterPill key={key} label={label} active={sort === key} onClick={() => setSort(key as SortKey)} />
            ))}
          </div>

          <div className="h-4 w-px shrink-0 bg-border" />

          {/* State */}
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">State</span>
          <div className="flex gap-1">
            <FilterPill label="All" active={!stateFilter} onClick={() => setStateFilter("")} />
            {states.map((s) => (
              <FilterPill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(stateFilter === s ? "" : s)} />
            ))}
          </div>

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
                onClick={() => { setStateFilter(""); setMinCourts(0); }}
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
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">🏸</p>
              <p className="mt-3 text-sm text-muted-foreground">No venues match your filters</p>
              <button
                onClick={() => { setSearch(""); setStateFilter(""); setMinCourts(0); }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isActive={activeVenueId === venue.id}
                  onHover={setActiveVenueId}
                  onClick={(id) => setSlideOverVenue(filtered.find((v) => v.id === id) ?? null)}
                />
              ))}
            </div>
          )}
        </div>
        <div className={`min-h-[300px] flex-1 lg:min-h-0 ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          <VenueMap venues={filtered} selectedVenueId={activeVenueId} onMarkerClick={(id) => { setActiveVenueId(id); setMobileView("list"); }} userLocation={userLocation} fullHeight className="h-full" />
        </div>
      </div>

      <VenueSlideOver venue={slideOverVenue} open={slideOverVenue !== null} onClose={() => setSlideOverVenue(null)} />
    </div>
  );
}
