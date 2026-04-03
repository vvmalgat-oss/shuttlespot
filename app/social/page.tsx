"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Calendar, Clock, ChevronDown, ChevronUp, Trash2, Search, Map, List, Radio, Navigation, ExternalLink, PartyPopper } from "lucide-react";
import AuthModal from "../components/AuthModal";
import SocialMap from "../components/SocialMap";
import { useUserLocation } from "../hooks/useUserLocation";
import type { User } from "@supabase/supabase-js";

type Venue = { id: number; name: string; suburb: string; city: string; state: string; lat: number; lng: number };
type PlayRequest = { id: number; venue_id: number; venue_name: string; date: string; time_slot: string; player_name: string; player_email: string; skill_level: string; spots_available: number; message: string; status: string; created_at: string };
type VenueEvent = { id: number; venue_name: string; venue_suburb: string; venue_state: string; title: string; description: string; day_of_week: string; time_slot: string; frequency: string; price: string | null; skill_level: string; booking_url: string | null; source_url: string | null };

// 2-hour slots starting at 8am (earliest any Australian badminton venue opens for casual hire).
// start/end in 24h for per-venue filtering.
const ALL_TIME_SLOTS: { label: string; start: number; end: number }[] = [
  { label: "8:00 AM - 10:00 AM",  start: 8,  end: 10 },
  { label: "10:00 AM - 12:00 PM", start: 10, end: 12 },
  { label: "12:00 PM - 2:00 PM",  start: 12, end: 14 },
  { label: "2:00 PM - 4:00 PM",   start: 14, end: 16 },
  { label: "4:00 PM - 6:00 PM",   start: 16, end: 18 },
  { label: "6:00 PM - 8:00 PM",   start: 18, end: 20 },
  { label: "8:00 PM - 10:00 PM",  start: 20, end: 22 },
];

// Confirmed opening hours per venue (partial lowercase name match).
// open/close in 24h. Source: each venue's website.
const VENUE_HOURS: { match: string; open: number; close: number }[] = [
  { match: "mitcham badminton",          open: 9,  close: 24 }, // 9am–midnight  (mitchambadminton.com.au)
  { match: "melbourne badminton centre", open: 8,  close: 23 }, // 8am–11pm      (melbournebadminton.com)
  { match: "kings park badminton",       open: 8,  close: 24 }, // 8am–midnight  (sydneysportsclub.com.au)
  { match: "alpha badminton",            open: 9,  close: 23 }, // 9am–11pm      (alphabadminton.com.au)
  { match: "hunter badminton",           open: 9,  close: 19 }, // 9am–7pm       (hunterbadminton.com.au)
  { match: "adelaide badminton centre",  open: 11, close: 24 }, // 11am–midnight (adelaidebadmintoncentre.com)
  { match: "badminton hobart",           open: 9,  close: 21 }, // 9am–9pm       (badmintonhobart.com)
  { match: "darwin badminton",           open: 18, close: 22 }, // 6pm–10pm      (darwinbadmintonclub.net.au)
  { match: "southside badminton",        open: 18, close: 22 }, // evening sessions only
];

const DEFAULT_OPEN = 9;  // 9am: safe default — no casual venue opens earlier
const DEFAULT_CLOSE = 22; // 10pm: safe default

function getVenueSlots(venueName: string): string[] {
  const name = venueName.toLowerCase();
  const hours = VENUE_HOURS.find((h) => name.includes(h.match));
  const open = hours?.open ?? DEFAULT_OPEN;
  const close = hours?.close ?? DEFAULT_CLOSE;
  return ALL_TIME_SLOTS.filter((s) => s.start >= open && s.end <= close).map((s) => s.label);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Approximate state capital coordinates for proximity sorting
const STATE_CAPITALS: Record<string, { lat: number; lng: number }> = {
  VIC: { lat: -37.8136, lng: 144.9631 },
  NSW: { lat: -33.8688, lng: 151.2093 },
  QLD: { lat: -27.4698, lng: 153.0251 },
  SA:  { lat: -34.9285, lng: 138.6007 },
  WA:  { lat: -31.9505, lng: 115.8605 },
  ACT: { lat: -35.2809, lng: 149.1300 },
  TAS: { lat: -42.8821, lng: 147.3272 },
  NT:  { lat: -12.4634, lng: 130.8456 },
};

function getNextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}
function formatDate(d: Date) { return d.toISOString().split("T")[0]; }
function formatDateLabel(d: Date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }

function FilterPill({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "border bg-background text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "events">("partners");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [requests, setRequests] = useState<PlayRequest[]>([]);
  const [venueEvents, setVenueEvents] = useState<VenueEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventStateFilter, setEventStateFilter] = useState("");
  const [nearMeEvents, setNearMeEvents] = useState(false);
  const [eventsMobileView, setEventsMobileView] = useState<"list" | "map">("list");
  const [activeEventVenueId, setActiveEventVenueId] = useState<number | null>(null);
  const eventsListRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [expandedVenueId, setExpandedVenueId] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ venue: Venue; date: Date; timeSlot: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", skill: "Intermediate", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [liveIndicator, setLiveIndicator] = useState(false);
  // pendingScrollId triggers a scroll after the next DOM paint
  const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);
  const { location: userLocation, status: locStatus, request: requestLocation } = useUserLocation();

  // Refs for scroll-into-view within the overflow container
  const listContainerRef = useRef<HTMLDivElement>(null);
  const venueRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const dates = getNextDays(7);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Initial data load
  useEffect(() => {
    async function load() {
      const [v, r, e] = await Promise.all([
        supabase.from("venues").select("id, name, suburb, city, state, lat, lng").order("name"),
        supabase.from("play_requests").select("*").eq("status", "open").gte("date", new Date().toISOString().split("T")[0]).order("created_at", { ascending: false }),
        supabase.from("venue_events").select("*").eq("is_active", true).order("venue_state").order("venue_name"),
      ]);
      if (v.data) setVenues(v.data as Venue[]);
      if (r.data) setRequests(r.data as PlayRequest[]);
      if (e.data) setVenueEvents(e.data as VenueEvent[]);
      setLoading(false);
      setEventsLoading(false);
    }
    load();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("play_requests_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "play_requests" }, (payload) => {
        const newReq = payload.new as PlayRequest;
        if (newReq.status === "open") {
          setRequests((prev) => [newReq, ...prev]);
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 2000);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "play_requests" }, (payload) => {
        const updated = payload.new as PlayRequest;
        if (updated.status !== "open") {
          setRequests((prev) => prev.filter((r) => r.id !== updated.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Pre-fill name when user logs in
  useEffect(() => {
    if (user) setFormData((f) => ({ ...f, name: user.user_metadata?.full_name || f.name }));
  }, [user]);

  // Enable "near me" automatically once location is granted
  useEffect(() => {
    if (locStatus === "granted" && userLocation) setNearMe(true);
  }, [locStatus, userLocation]);

  const getSession = useCallback((venueId: number, date: Date, slot: string) => {
    const dateStr = formatDate(date);
    return requests.find((r) => r.venue_id === venueId && r.date === dateStr && r.time_slot === slot && r.status === "open");
  }, [requests]);

  const sessionCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    requests.forEach((r) => { counts[r.venue_id] = (counts[r.venue_id] || 0) + 1; });
    return counts;
  }, [requests]);

  const states = useMemo(
    () => [...new Set(venues.map((v) => v.state).filter(Boolean))].sort() as string[],
    [venues]
  );

  // Distances from user location
  const distances = useMemo<Record<number, number>>(() => {
    if (!userLocation) return {};
    const d: Record<number, number> = {};
    venues.forEach((v) => {
      if (v.lat && v.lng) d[v.id] = haversineKm(userLocation.lat, userLocation.lng, v.lat, v.lng);
    });
    return d;
  }, [venues, userLocation]);

  const filteredVenues = useMemo(() => {
    let result = venues.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        if (!v.name?.toLowerCase().includes(q) && !v.suburb?.toLowerCase().includes(q) && !v.city?.toLowerCase().includes(q)) return false;
      }
      if (stateFilter && v.state !== stateFilter) return false;
      if (activeOnly && !sessionCounts[v.id]) return false;
      return true;
    });

    if (nearMe && userLocation) {
      result = [...result].sort((a, b) => (distances[a.id] ?? 9999) - (distances[b.id] ?? 9999));
    }

    return result;
  }, [venues, search, stateFilter, activeOnly, nearMe, userLocation, distances, sessionCounts]);

  // Fast lookup: venue name → venue row (for event coords + distance)
  const venueByName = useMemo(() => {
    const m: Record<string, Venue> = {};
    venues.forEach((v) => { m[v.name] = v; });
    return m;
  }, [venues]);

  const eventStates = useMemo(
    () => [...new Set(venueEvents.map((e) => e.venue_state))].sort(),
    [venueEvents]
  );

  const filteredEvents = useMemo(() => {
    let result = venueEvents.filter((e) => {
      if (eventStateFilter && e.venue_state !== eventStateFilter) return false;
      if (nearMeEvents && userLocation) {
        const v = venueByName[e.venue_name];
        if (!v?.lat || !v?.lng) return false; // no coords → exclude when Near me active
        return haversineKm(userLocation.lat, userLocation.lng, v.lat, v.lng) <= 50;
      }
      return true;
    });

    if (userLocation) {
      result = [...result].sort((a, b) => {
        const vA = venueByName[a.venue_name];
        const vB = venueByName[b.venue_name];
        const dA = vA?.lat && vA?.lng ? haversineKm(userLocation.lat, userLocation.lng, vA.lat, vA.lng) : 9999;
        const dB = vB?.lat && vB?.lng ? haversineKm(userLocation.lat, userLocation.lng, vB.lat, vB.lng) : 9999;
        return dA !== dB ? dA - dB : a.venue_name.localeCompare(b.venue_name);
      });
    }

    return result;
  }, [venueEvents, venueByName, eventStateFilter, nearMeEvents, userLocation]);

  // Events filtered further by map marker selection
  const displayedEvents = useMemo(() => {
    if (!activeEventVenueId) return filteredEvents;
    return filteredEvents.filter((e) => venueByName[e.venue_name]?.id === activeEventVenueId);
  }, [filteredEvents, activeEventVenueId, venueByName]);

  // Pins for the Group Events map — one per unique venue that has events
  const eventVenuePins = useMemo(() => {
    const seen = new Set<number>();
    const pins: { id: number; name: string; lat: number; lng: number; sessionCount: number }[] = [];
    filteredEvents.forEach((e) => {
      const v = venueByName[e.venue_name];
      if (!v?.lat || !v?.lng || seen.has(v.id)) return;
      seen.add(v.id);
      const count = filteredEvents.filter((ev) => ev.venue_name === e.venue_name).length;
      pins.push({ id: v.id, name: e.venue_name, lat: v.lat, lng: v.lng, sessionCount: count });
    });
    return pins;
  }, [filteredEvents, venueByName]);

  const mapPins = useMemo(
    () => filteredVenues
      .filter((v) => v.lat && v.lng)
      .map((v) => ({ id: v.id, name: v.name, lat: v.lat, lng: v.lng, sessionCount: sessionCounts[v.id] || 0 })),
    [filteredVenues, sessionCounts]
  );

  // After React paints + browser lays out (rAF), scroll the list container to that venue.
  // rAF is needed on mobile: the list container has "hidden" removed in the same render,
  // so getBoundingClientRect() returns 0 until the browser has painted.
  useEffect(() => {
    if (pendingScrollId === null) return;
    const id = pendingScrollId;
    setPendingScrollId(null);
    requestAnimationFrame(() => {
      const venueEl = venueRefs.current[id];
      const container = listContainerRef.current;
      if (venueEl && container) {
        const containerTop = container.getBoundingClientRect().top;
        const venueTop = venueEl.getBoundingClientRect().top;
        container.scrollTo({ top: Math.max(0, container.scrollTop + venueTop - containerTop - 12), behavior: "smooth" });
      }
    });
  }, [pendingScrollId]);

  // Map pin click → expand in list + scroll
  const handleMarkerClick = useCallback((venueId: number) => {
    setExpandedVenueId(venueId);   // always expand (never toggle closed from map)
    setMobileView("list");
    setPendingScrollId(venueId);   // triggers scroll after next render
  }, []);

  const handleVenueClick = (venueId: number) => {
    setExpandedVenueId((prev) => (prev === venueId ? null : venueId));
  };

  const handleSlotClick = (venue: Venue, date: Date, slot: string) => {
    if (!user) { setAuthOpen(true); return; }
    const existing = getSession(venue.id, date, slot);
    if (existing) {
      if (existing.player_email === user.email) return;
      const subject = encodeURIComponent(`Let's play at ${venue.name}`);
      const body = encodeURIComponent(`Hi ${existing.player_name},\n\nI'd love to join you at ${venue.name} on ${formatDateLabel(date)} at ${slot}!`);
      window.open(`mailto:${existing.player_email}?subject=${subject}&body=${body}`);
      return;
    }
    setPendingSlot({ venue, date, timeSlot: slot });
    setShowPostModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation();
    if (!window.confirm("Remove your session from this slot?")) return;
    setDeleting(requestId);
    const { error } = await supabase.from("play_requests").update({ status: "cancelled" }).eq("id", requestId);
    if (!error) setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setDeleting(null);
  };

  const handlePost = async () => {
    if (!pendingSlot || !formData.name || !user?.email) return;
    setSubmitting(true);
    const { error, data } = await supabase.from("play_requests").insert({
      venue_id: pendingSlot.venue.id, venue_name: pendingSlot.venue.name,
      date: formatDate(pendingSlot.date), time_slot: pendingSlot.timeSlot,
      player_name: formData.name, player_email: user.email,
      skill_level: formData.skill, message: formData.message,
      spots_available: 1, status: "open",
    }).select();
    if (!error && data) setRequests((prev) => [data[0] as PlayRequest, ...prev]);
    setSubmitting(false);
    setShowPostModal(false);
    setPendingSlot(null);
    setFormData((f) => ({ ...f, message: "" }));
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        {/* Tab switcher */}
        <div className="flex items-center gap-6 border-b px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("partners")}
            className={`flex items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition ${activeTab === "partners" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-4 w-4" /> Find Partners
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition ${activeTab === "events" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <PartyPopper className="h-4 w-4" /> Group Events
            {venueEvents.length > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{venueEvents.length}</span>
            )}
          </button>
        </div>

        {activeTab === "partners" && (
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">Find Playing Partners</h1>
              {liveIndicator && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${filteredVenues.length} venues · ${requests.length} open session${requests.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues..." className="h-9 pl-9 text-sm" />
          </div>
        </div>
        )}

        {activeTab === "events" && (
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h1 className="text-base font-bold">Group Events at Venues</h1>
            <p className="text-xs text-muted-foreground">
              {eventsLoading ? "Loading…" : userLocation
                ? `${filteredEvents.length} events · sorted by distance`
                : `${filteredEvents.length} events across Australia`}
            </p>
          </div>
        </div>
        )}

        {/* Filter bar — Partners */}
        {activeTab === "partners" && (
        <div className="flex items-center gap-3 overflow-x-auto border-t bg-muted/30 px-4 py-2 sm:px-6 [scrollbar-width:none]">
          {/* Near me */}
          {locStatus === "denied" ? (
            <button
              onClick={requestLocation}
              className="flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Navigation className="h-3 w-3" /> Enable location
            </button>
          ) : (
            <FilterPill
              label={locStatus === "requesting" ? "Locating…" : "Near me"}
              active={nearMe && locStatus === "granted"}
              onClick={() => {
                if (locStatus === "granted") setNearMe((v) => !v);
                else requestLocation();
              }}
              icon={<Navigation className="h-3 w-3" />}
            />
          )}

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

          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
              activeOnly ? "bg-emerald-500 text-white" : "border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Users className="h-3 w-3" />
            Active only
          </button>

          {!user && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <button onClick={() => setAuthOpen(true)} className="shrink-0 text-[11px] text-primary hover:underline">
                Sign in to post
              </button>
            </>
          )}
        </div>
        )}

        {/* Filter bar — Group Events */}
        {activeTab === "events" && (
        <div className="flex items-center gap-2 overflow-x-auto border-t bg-muted/30 px-4 py-2 sm:px-6 [scrollbar-width:none]">
          {locStatus === "denied" ? (
            <button
              onClick={requestLocation}
              className="flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Navigation className="h-3 w-3" /> Enable location
            </button>
          ) : (
            <FilterPill
              label={locStatus === "requesting" ? "Locating…" : "Near me"}
              active={nearMeEvents}
              onClick={() => {
                if (locStatus === "granted") {
                  setNearMeEvents((v) => !v);
                  setEventStateFilter("");
                  setActiveEventVenueId(null);
                } else {
                  requestLocation();
                  setNearMeEvents(true);
                }
              }}
              icon={<Navigation className="h-3 w-3" />}
            />
          )}
          <div className="h-4 w-px shrink-0 bg-border" />
          <FilterPill label="All" active={!eventStateFilter && !nearMeEvents} onClick={() => { setEventStateFilter(""); setNearMeEvents(false); setActiveEventVenueId(null); }} />
          {eventStates.map((s) => (
            <FilterPill key={s} label={s} active={eventStateFilter === s} onClick={() => { setEventStateFilter(eventStateFilter === s ? "" : s); setNearMeEvents(false); setActiveEventVenueId(null); }} />
          ))}
        </div>
        )}
      </div>

      {/* ── GROUP EVENTS TAB ── */}
      {activeTab === "events" && (
        <>
        {/* Mobile list/map toggle */}
        <div className="flex-shrink-0 border-b bg-background px-4 py-2 lg:hidden">
          <div className="flex w-fit rounded-lg border p-0.5">
            <button
              onClick={() => setEventsMobileView("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${eventsMobileView === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setEventsMobileView("map")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${eventsMobileView === "map" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Event list */}
          <div ref={eventsListRef} className={`w-full flex-shrink-0 overflow-y-auto lg:w-[440px] xl:w-[480px] lg:border-r ${eventsMobileView === "map" ? "hidden lg:block" : ""}`}>
            {activeEventVenueId && (
              <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="flex-1 truncate text-xs font-medium text-primary">
                  {venueByName[displayedEvents[0]?.venue_name]?.name ?? "Selected venue"}
                </span>
                <button onClick={() => setActiveEventVenueId(null)} className="text-[11px] text-muted-foreground hover:text-foreground">
                  Show all
                </button>
              </div>
            )}
            {eventsLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-xl border p-4">
                    <Skeleton className="mb-2 h-4 w-40" />
                    <Skeleton className="mb-2 h-3 w-56" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl">🏸</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {nearMeEvents ? "No events within 50 km" : "No events found"}
                </p>
                <button onClick={() => { setEventStateFilter(""); setNearMeEvents(false); setActiveEventVenueId(null); }} className="mt-2 text-sm text-primary hover:underline">
                  Show all events
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {displayedEvents.map((event) => {
                  const v = venueByName[event.venue_name];
                  const dist = v && userLocation ? haversineKm(userLocation.lat, userLocation.lng, v.lat, v.lng) : null;
                  return (
                    <div key={event.id} className="flex flex-col rounded-xl border bg-card p-4 transition hover:shadow-sm">
                      <p className="font-semibold leading-snug">{event.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.venue_name}</span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{event.venue_state}</span>
                        {dist != null && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{dist.toFixed(1)} km</span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.day_of_week}</span>
                        {event.time_slot && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{event.time_slot}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{event.skill_level}</Badge>
                        {event.price && <Badge variant="outline" className="text-[10px] text-primary">{event.price}</Badge>}
                      </div>
                      {(event.booking_url || event.source_url) && (
                        <a
                          href={event.booking_url || event.source_url || ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-accent"
                        >
                          {event.booking_url ? "Book a spot" : "View details"}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Events map */}
          <div className={`min-h-[300px] flex-1 lg:min-h-0 ${eventsMobileView === "list" ? "hidden lg:block" : ""}`}>
            <SocialMap
              venues={eventVenuePins}
              selectedVenueId={activeEventVenueId}
              onMarkerClick={(id) => {
                setActiveEventVenueId((prev) => prev === id ? null : id);
                setEventsMobileView("list");
              }}
              userLocation={userLocation}
              className="h-full"
            />
          </div>
        </div>
        </>
      )}

      {/* ── FIND PARTNERS TAB ── */}
      {activeTab === "partners" && <>

      {/* Mobile toggle */}
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

      {/* Split layout */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Venue list — ref on the scroll container */}
        <div
          ref={listContainerRef}
          className={`w-full flex-shrink-0 overflow-y-auto p-4 lg:w-[440px] xl:w-[480px] lg:border-r ${mobileView === "map" ? "hidden lg:block" : ""}`}
        >
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
          ) : filteredVenues.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">🏸</p>
              <p className="mt-3 text-sm text-muted-foreground">No venues match your filters</p>
              <button onClick={() => { setSearch(""); setStateFilter(""); setActiveOnly(false); }} className="mt-2 text-sm text-primary hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVenues.map((venue) => {
                const isExpanded = expandedVenueId === venue.id;
                const sessionsCount = sessionCounts[venue.id] || 0;
                const dist = distances[venue.id];

                return (
                  <div
                    key={venue.id}
                    ref={(el) => { venueRefs.current[venue.id] = el; }}
                    className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                      isExpanded ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => handleVenueClick(venue.id)}
                      className="flex w-full items-center justify-between bg-card px-4 py-3.5 text-left transition hover:bg-accent/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sessionsCount > 0 ? "bg-emerald-500/10" : "bg-muted"}`}>
                          <MapPin className={`h-4 w-4 ${sessionsCount > 0 ? "text-emerald-600" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold leading-tight">{venue.name}</h3>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs text-muted-foreground">{venue.city || venue.suburb}{venue.state ? `, ${venue.state}` : ""}</p>
                            {dist != null && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                {dist.toFixed(1)} km
                              </span>
                            )}
                          </div>
                          {sessionsCount > 0 && (
                            <Badge variant="secondary" className="mt-1 bg-emerald-500/10 text-[10px] text-emerald-700">
                              {sessionsCount} active session{sessionsCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-card px-4 pb-5 pt-4">
                        <div className="space-y-5">
                          {dates.map((date) => {
                            const dateStr = formatDate(date);
                            const dayRequests = requests.filter((r) => r.venue_id === venue.id && r.date === dateStr);
                            return (
                              <div key={date.toISOString()}>
                                <div className="mb-2 flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <h4 className={`text-xs font-semibold ${isToday(date) ? "text-primary" : "text-foreground"}`}>
                                    {formatDateLabel(date)}{isToday(date) && " · Today"}
                                  </h4>
                                  {dayRequests.length > 0 && (
                                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                                      {dayRequests.length} open
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                                  {getVenueSlots(venue.name).map((slot) => {
                                    const session = getSession(venue.id, date, slot);
                                    const hasPlayer = !!session;
                                    const isOwn = hasPlayer && user?.email === session.player_email;

                                    if (isOwn) {
                                      return (
                                        <div key={slot} className="flex flex-col gap-1 rounded-lg border-2 border-primary bg-primary/5 px-2.5 py-2">
                                          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                                            <Clock className="h-3 w-3 shrink-0" />{slot.split(" - ")[0]}
                                          </span>
                                          <span className="truncate text-[11px] font-semibold">{session.player_name}</span>
                                          <span className="text-[10px] text-muted-foreground">{session.skill_level}</span>
                                          <button
                                            onClick={(e) => handleDelete(e, session.id)}
                                            disabled={deleting === session.id}
                                            className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive transition hover:bg-destructive/20"
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                            {deleting === session.id ? "Removing…" : "Remove"}
                                          </button>
                                        </div>
                                      );
                                    }

                                    if (hasPlayer) {
                                      return (
                                        <button
                                          key={slot}
                                          onClick={() => handleSlotClick(venue, date, slot)}
                                          className="flex flex-col gap-1 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-2.5 py-2 text-left transition hover:bg-emerald-100"
                                        >
                                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                            <Clock className="h-3 w-3 shrink-0" />{slot.split(" - ")[0]}
                                          </span>
                                          <span className="truncate text-[11px] font-semibold text-foreground">{session.player_name}</span>
                                          <span className="text-[10px] text-muted-foreground">{session.skill_level}</span>
                                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                            <Users className="h-2.5 w-2.5" /> Join
                                          </span>
                                        </button>
                                      );
                                    }

                                    return (
                                      <button
                                        key={slot}
                                        onClick={() => handleSlotClick(venue, date, slot)}
                                        className="flex h-auto flex-col gap-0.5 rounded-lg border bg-background px-2.5 py-2 text-left text-[11px] transition hover:border-primary/40 hover:bg-primary/5"
                                      >
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Clock className="h-3 w-3" />{slot.split(" - ")[0]}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60">Available</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 border-t pt-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 rounded border bg-background" /> Available</div>
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 rounded border-2 border-emerald-400 bg-emerald-50" /> Player looking</div>
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 rounded border-2 border-primary bg-primary/5" /> Your session</div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`min-h-[300px] flex-1 lg:min-h-0 ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          <SocialMap
            venues={mapPins}
            selectedVenueId={expandedVenueId}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
            className="h-full"
          />
        </div>
      </div>

      </> /* end partners tab */}

      {/* Post modal */}
      <Dialog open={showPostModal} onOpenChange={(v) => { if (!v) { setShowPostModal(false); setPendingSlot(null); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Post your availability</DialogTitle>
            {pendingSlot && (
              <DialogDescription>
                {pendingSlot.venue.name} · {formatDateLabel(pendingSlot.date)} · {pendingSlot.timeSlot}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Your name</label>
              <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} placeholder="John" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skill level</label>
              <div className="flex gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <Button key={level} variant={formData.skill === level ? "default" : "outline"} size="sm" className="flex-1 text-xs"
                    onClick={() => setFormData((f) => ({ ...f, skill: level }))}>{level}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Message (optional)</label>
              <Input value={formData.message} onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))} placeholder="Looking for a casual doubles match..." />
            </div>
            <Button className="w-full" disabled={!formData.name || submitting} onClick={handlePost}>
              {submitting ? "Posting..." : "Post Availability"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
