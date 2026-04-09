"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Calendar, CalendarDays, Clock, ChevronDown, ChevronUp, Trash2, Search, Map, List, Radio, Navigation, ExternalLink, PartyPopper, X, MessageSquare, Send } from "lucide-react";
import AuthModal from "../components/AuthModal";
import SocialMap from "../components/SocialMap";
import { useUserLocation } from "../hooks/useUserLocation";
import type { User } from "@supabase/supabase-js";

type Venue = { id: number; name: string; suburb: string; city: string; state: string; lat: number; lng: number; open_hour?: number | null; close_hour?: number | null; google_rating?: number | null; google_review_count?: number | null };
type PlayRequest = { id: number; venue_id: number; venue_name: string; date: string; time_slot: string; duration_minutes: number; player_name: string; player_email: string; skill_level: string; spots_available: number; message: string; status: string; created_at: string; user_id?: string | null };
type VenueEvent = { id: number; venue_name: string; venue_suburb: string; venue_state: string; title: string; description: string; day_of_week: string; time_slot: string; frequency: string; price: string | null; skill_level: string; booking_url: string | null; source_url: string | null };
type Message = { id: number; play_request_id: number; sender_user_id: string; sender_name: string; message: string; is_from_poster: boolean; created_at: string };

const DURATION_OPTIONS = [
  { value: 30,  label: "30 min" },
  { value: 60,  label: "1 hr" },
  { value: 90,  label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  if (mins % 60 === 0) return `${mins / 60} hr`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Generate start-time slots using the given step (minutes). Defaults to 30-min intervals. */
function generatePartnerSlots(venue: { open_hour?: number | null; close_hour?: number | null }, stepMinutes = 30): string[] {
  const open = venue.open_hour ?? 9;
  const close = venue.close_hour ?? 22;
  const slots: string[] = [];
  for (let m = open * 60; m < close * 60; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "am" : "pm";
    slots.push(`${h12}:${min.toString().padStart(2, "0")}${ampm}`);
  }
  return slots;
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

/**
 * Resolve coordinates for a venue_event row.
 * Many events are clubs (e.g. "Melbourne Smashers") that don't exist in
 * the venues table. Fall through three tiers so we always get a position:
 *   1. Exact venue name match in venues table
 *   2. Any venue in the same suburb + state (club meeting at a shared hall)
 *   3. State capital (rough but correct for state-level "near me" filtering)
 */
function getEventCoords(
  event: { venue_name: string; venue_suburb: string | null; venue_state: string },
  venueByName: Record<string, { lat: number; lng: number }>,
  venues: { name: string; suburb: string; state: string; lat: number; lng: number }[]
): { lat: number; lng: number } | null {
  const exact = venueByName[event.venue_name];
  if (exact?.lat && exact?.lng) return { lat: exact.lat, lng: exact.lng };

  const bySuburb = venues.find(
    (v) =>
      v.state === event.venue_state &&
      v.suburb?.toLowerCase() === event.venue_suburb?.toLowerCase() &&
      v.lat && v.lng
  );
  if (bySuburb) return { lat: bySuburb.lat, lng: bySuburb.lng };

  return STATE_CAPITALS[event.venue_state] ?? null;
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDateLabel(d: Date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }

/** Returns true if the given slot time (e.g. "9:30am") is in the past on today's date. */
function isSlotInPast(date: Date, slot: string): boolean {
  if (!isToday(date)) return false;
  const match = slot.match(/^(\d+):(\d+)(am|pm)$/i);
  if (!match) return false;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (match[3].toLowerCase() === "pm" && h !== 12) h += 12;
  if (match[3].toLowerCase() === "am" && h === 12) h = 0;
  const now = new Date();
  return h * 60 + m < now.getHours() * 60 + now.getMinutes();
}

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
  const [eventSearch, setEventSearch] = useState("");
  const [nearMeEvents, setNearMeEvents] = useState(false);
  const [eventsMobileView, setEventsMobileView] = useState<"list" | "map">("list");
  const [activeEventVenueId, setActiveEventVenueId] = useState<number | null>(null);
  const eventsListRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReturnTo, setAuthReturnTo] = useState<string | undefined>(undefined);
  const [expandedVenueId, setExpandedVenueId] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ venue: Venue; date: Date; timeSlot: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", skill: "Intermediate", message: "", duration: 60 });
  const [durationFilter, setDurationFilter] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("venue") ?? "");
  const [stateFilter, setStateFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [liveIndicator, setLiveIndicator] = useState(false);
  // pendingScrollId triggers a scroll after the next DOM paint
  const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);
  const { location: userLocation, status: locStatus, request: requestLocation } = useUserLocation();

  // Refs for scroll-into-view within the overflow container
  const listContainerRef = useRef<HTMLDivElement>(null);
  const venueRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [partnersDate, setPartnersDate] = useState<Date>(() => new Date());
  const [partnersCustomDate, setPartnersCustomDate] = useState("");
  const partnersDateInputRef = useRef<HTMLInputElement>(null);
  const todayDate = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const tomorrowDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = formatDate(todayDate);
  const partnersActivePill = isToday(partnersDate) ? "today" : partnersDate.toDateString() === tomorrowDate.toDateString() ? "tomorrow" : "custom";

  // Auth — restore post modal if user just came back from sign-in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      // If redirected back after auth with ?post=true, auto-open the post form
      if (data.user && searchParams.get("post") === "true") {
        // Restore the slot they had selected before being sent to sign in
        let slotRestored = false;
        try {
          const saved = sessionStorage.getItem("ss_pendingSlot");
          if (saved) {
            const { venue, date, timeSlot } = JSON.parse(saved);
            setPendingSlot({ venue, date: new Date(date), timeSlot });
            sessionStorage.removeItem("ss_pendingSlot");
            slotRestored = true;
          }
        } catch {}
        // Only open the modal if we have a slot to post — otherwise they'll just see the page
        if (slotRestored) setShowPostModal(true);
        // Clean the param from the URL without a full navigation
        const url = new URL(window.location.href);
        url.searchParams.delete("post");
        window.history.replaceState({}, "", url.toString());
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, [searchParams]);

  // Initial data load
  useEffect(() => {
    async function load() {
      const [v, r, e] = await Promise.all([
        supabase.from("venues").select("id, name, suburb, city, state, lat, lng, open_hour, close_hour, google_rating, google_review_count").order("name"),
        supabase.from("play_requests").select("id, venue_id, venue_name, date, time_slot, duration_minutes, player_name, player_email, skill_level, spots_available, message, status, created_at, user_id").eq("status", "open").gte("date", new Date().toISOString().split("T")[0]).order("created_at", { ascending: false }),
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
      if (openNow && !hoursStatus(v.open_hour, v.close_hour)?.open) return false;
      return true;
    });

    if (nearMe && userLocation) {
      result = [...result].sort((a, b) => (distances[a.id] ?? 9999) - (distances[b.id] ?? 9999));
    }

    return result;
  }, [venues, search, stateFilter, activeOnly, nearMe, openNow, userLocation, distances, sessionCounts]);

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

  // Detect user's state from actual GPS coords
  const userState = useMemo(() => {
    if (!userLocation) return null;
    let closest = null as string | null;
    let minDist = Infinity;
    for (const [state, coords] of Object.entries(STATE_CAPITALS)) {
      const d = haversineKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
      if (d < minDist) { minDist = d; closest = state; }
    }
    return closest;
  }, [userLocation]);

  const filteredEvents = useMemo(() => {
    let result = venueEvents.filter((e) => {
      if (eventSearch) {
        const q = eventSearch.toLowerCase();
        if (
          !e.venue_name.toLowerCase().includes(q) &&
          !e.venue_suburb?.toLowerCase().includes(q) &&
          !e.title.toLowerCase().includes(q) &&
          !e.venue_state.toLowerCase().includes(q)
        ) return false;
      }
      if (eventStateFilter && e.venue_state !== eventStateFilter) return false;
      // Near me: filter to user's detected state (reliable even when exact venue
      // coords aren't in the venues table — clubs, associations, etc.)
      if (nearMeEvents && userState && e.venue_state !== userState) return false;
      return true;
    });

    if (userLocation) {
      result = [...result].sort((a, b) => {
        const cA = getEventCoords(a, venueByName, venues);
        const cB = getEventCoords(b, venueByName, venues);
        const dA = cA ? haversineKm(userLocation.lat, userLocation.lng, cA.lat, cA.lng) : 9999;
        const dB = cB ? haversineKm(userLocation.lat, userLocation.lng, cB.lat, cB.lng) : 9999;
        return dA !== dB ? dA - dB : a.venue_name.localeCompare(b.venue_name);
      });
    }

    return result;
  }, [venueEvents, venueByName, venues, eventSearch, eventStateFilter, nearMeEvents, userState, userLocation]);

  // Events filtered further by map marker selection
  const displayedEvents = useMemo(() => {
    if (!activeEventVenueId) return filteredEvents;
    // Match by resolved venue id OR by venue_name if pin was placed via suburb fallback
    return filteredEvents.filter((e) => {
      const v = venues.find((vv) => vv.id === activeEventVenueId);
      if (!v) return false;
      // Direct name match or same suburb+state (for clubs at the same facility)
      return e.venue_name === v.name ||
        (e.venue_suburb?.toLowerCase() === v.suburb?.toLowerCase() && e.venue_state === v.state);
    });
  }, [filteredEvents, activeEventVenueId, venues]);

  // Pins for the Group Events map — one per resolved location
  const eventVenuePins = useMemo(() => {
    const seen = new Set<string>(); // key: "lat,lng"
    const pins: { id: number; name: string; lat: number; lng: number; sessionCount: number }[] = [];
    let syntheticId = -1;
    filteredEvents.forEach((e) => {
      const coords = getEventCoords(e, venueByName, venues);
      if (!coords) return;
      const key = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
      if (seen.has(key)) return;
      seen.add(key);
      // Use real venue id if available, otherwise a synthetic negative id
      const realVenue = venues.find(
        (v) => v.name === e.venue_name ||
          (v.suburb?.toLowerCase() === e.venue_suburb?.toLowerCase() && v.state === e.venue_state)
      );
      const count = filteredEvents.filter((ev) => {
        const c = getEventCoords(ev, venueByName, venues);
        return c && Math.abs(c.lat - coords.lat) < 0.001 && Math.abs(c.lng - coords.lng) < 0.001;
      }).length;
      pins.push({
        id: realVenue?.id ?? syntheticId--,
        name: e.venue_name,
        lat: coords.lat,
        lng: coords.lng,
        sessionCount: count,
      });
    });
    return pins;
  }, [filteredEvents, venueByName, venues]);

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

  const [authReason, setAuthReason] = useState("");
  // In-app messaging
  const [msgRequest, setMsgRequest] = useState<PlayRequest | null>(null);
  const [msgIsOwner, setMsgIsOwner] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});

  const loadMessages = async (requestId: number) => {
    const { data } = await supabase
      .from("play_request_messages")
      .select("*")
      .eq("play_request_id", requestId)
      .order("created_at", { ascending: true });
    if (data) setMessages((prev) => ({ ...prev, [requestId]: data as Message[] }));
  };

  const handleOpenMessages = (req: PlayRequest, isOwner: boolean) => {
    setMsgRequest(req);
    setMsgIsOwner(isOwner);
    setMsgText("");
    setMsgSent(false);
    setMsgOpen(true);
    loadMessages(req.id);
  };

  const handleSendMessage = async () => {
    if (!msgRequest || !user || !msgText.trim()) return;
    setMsgSending(true);
    const senderName = formData.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Player";
    const { error } = await supabase.from("play_request_messages").insert({
      play_request_id: msgRequest.id,
      sender_user_id: user.id,
      sender_name: senderName,
      message: msgText.trim(),
      is_from_poster: msgIsOwner,
    });
    if (!error) {
      setMsgSent(true);
      setMsgText("");
      loadMessages(msgRequest.id);
    }
    setMsgSending(false);
  };

  const handleSlotClick = (venue: Venue, date: Date, slot: string) => {
    if (!user) {
      // Save the slot so we can restore it after the user signs in
      try {
        sessionStorage.setItem("ss_pendingSlot", JSON.stringify({ venue, date: date.toISOString(), timeSlot: slot }));
      } catch {}
      setAuthReason(`Sign in to post your availability at ${venue.name} and connect with other players looking for a game.`);
      setAuthReturnTo("/social?post=true");
      setAuthOpen(true);
      return;
    }
    const existing = getSession(venue.id, date, slot);
    if (existing) {
      const isOwner = existing.user_id ? existing.user_id === user.id : existing.player_email === user.email;
      if (isOwner) return;
      handleOpenMessages(existing, false);
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
      duration_minutes: formData.duration,
      player_name: formData.name, player_email: user.email, user_id: user.id,
      skill_level: formData.skill, message: formData.message,
      spots_available: 1, status: "open",
    }).select();
    if (!error && data) setRequests((prev) => [data[0] as PlayRequest, ...prev]);
    setSubmitting(false);
    setShowPostModal(false);
    setPendingSlot(null);
    setFormData((f) => ({ ...f, message: "", duration: 60 }));
  };

  return (
    <div className="flex h-[calc(100svh-56px-64px)] flex-col md:h-[calc(100svh-56px)]">
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues..." className={`h-9 text-sm pl-9 ${search ? "pr-8" : ""}`} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        )}

        {activeTab === "events" && (
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <h1 className="text-base font-bold">Group Events at Venues</h1>
            <p className="text-xs text-muted-foreground">
              {eventsLoading ? "Loading…" : userLocation
                ? `${displayedEvents.length} events · sorted by distance`
                : `${displayedEvents.length} events across Australia`}
            </p>
          </div>
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={eventSearch}
              onChange={(e) => { setEventSearch(e.target.value); setActiveEventVenueId(null); }}
              placeholder="Search events…"
              className={`h-9 text-sm pl-9 ${eventSearch ? "pr-8" : ""}`}
            />
            {eventSearch && (
              <button onClick={() => { setEventSearch(""); setActiveEventVenueId(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
          <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">State</span>
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
            Has sessions
          </button>

          <FilterPill label="🟢 Open now" active={openNow} onClick={() => setOpenNow(!openNow)} />

          {!user && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <button onClick={() => { setAuthReturnTo("/social?post=true"); setAuthOpen(true); }} className="shrink-0 text-[11px] text-primary hover:underline">
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
          <FilterPill label="All" active={!eventStateFilter && !nearMeEvents} onClick={() => { setEventStateFilter(""); setNearMeEvents(false); setActiveEventVenueId(null); setEventSearch(""); }} />
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
                <button onClick={() => { setEventStateFilter(""); setNearMeEvents(false); setActiveEventVenueId(null); setEventSearch(""); }} className="mt-2 text-sm text-primary hover:underline">
                  Show all events
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {displayedEvents.map((event) => {
                  const coords = getEventCoords(event, venueByName, venues);
                  const dist = coords && userLocation ? haversineKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : null;
                  const matchedVenue = venues.find(v => v.name === event.venue_name || (v.suburb?.toLowerCase() === event.venue_suburb?.toLowerCase() && v.state === event.venue_state));
                  const hrs = matchedVenue ? hoursStatus(matchedVenue.open_hour, matchedVenue.close_hour) : null;
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
                      {/* Hours + Google rating row */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {hrs && (
                          <span className={`flex items-center gap-1 text-[11px] font-medium ${hrs.open ? "text-emerald-600" : "text-muted-foreground"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${hrs.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                            {hrs.label}
                          </span>
                        )}
                        {matchedVenue?.google_rating != null && matchedVenue?.google_review_count != null && (
                          <span className="flex items-center gap-0.5 text-[11px]">
                            <svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            <span className="font-semibold">{matchedVenue.google_rating.toFixed(1)}</span>
                            <span className="text-amber-400">★</span>
                            <span className="text-muted-foreground">({matchedVenue.google_review_count.toLocaleString()})</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {(() => { const hrs = hoursStatus(venue.open_hour, venue.close_hour); return hrs ? (
                              <span className={`flex items-center gap-1 text-[11px] font-medium ${hrs.open ? "text-emerald-600" : "text-muted-foreground"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${hrs.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                                {hrs.label}
                              </span>
                            ) : null; })()}
                            {venue.google_rating != null && venue.google_review_count != null && (
                              <span className="flex items-center gap-0.5 text-[11px]">
                                <svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                <span className="font-semibold">{venue.google_rating.toFixed(1)}</span>
                                <span className="text-amber-400">★</span>
                                <span className="text-muted-foreground">({venue.google_review_count.toLocaleString()})</span>
                              </span>
                            )}
                            {sessionsCount > 0 && (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-[10px] text-emerald-700">
                                {sessionsCount} active session{sessionsCount !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-card px-4 pb-5 pt-4">
                        {/* Date picker */}
                        <div className="mb-4 flex gap-1.5">
                          {[
                            { key: "today", label: "Today", date: todayDate },
                            { key: "tomorrow", label: "Tomorrow", date: tomorrowDate },
                          ].map(({ key, label, date }) => (
                            <button
                              key={key}
                              onClick={() => { setPartnersDate(date); setPartnersCustomDate(""); }}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                partnersActivePill === key
                                  ? "bg-primary text-primary-foreground"
                                  : "border bg-background text-foreground hover:bg-accent"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => partnersDateInputRef.current?.showPicker?.()}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                              partnersActivePill === "custom"
                                ? "bg-primary text-primary-foreground"
                                : "border bg-background text-foreground hover:bg-accent"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {partnersActivePill === "custom" && partnersCustomDate
                                ? partnersDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                                : "Other day"}
                            </span>
                          </button>
                          <input
                            ref={partnersDateInputRef}
                            type="date"
                            min={todayStr}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              setPartnersCustomDate(val);
                              const [y, mo, d] = val.split("-").map(Number);
                              setPartnersDate(new Date(y, mo - 1, d));
                            }}
                            className="sr-only"
                          />
                          <span className="ml-auto self-center text-[11px] text-muted-foreground">
                            {formatDateLabel(partnersDate)}{isToday(partnersDate) && " · Today"}
                          </span>
                        </div>

                        {/* Slot grid for selected date */}
                        {(() => {
                          const dayRequests = requests.filter((r) => r.venue_id === venue.id && r.date === formatDate(partnersDate));
                          const slots = generatePartnerSlots(venue, durationFilter ?? 30);
                          return (
                            <div>
                              {/* Duration filter */}
                              <div className="mb-3 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Duration</span>
                                <button
                                  onClick={() => setDurationFilter(null)}
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${durationFilter === null ? "bg-primary text-primary-foreground" : "border bg-background text-foreground hover:bg-accent"}`}
                                >Any</button>
                                {DURATION_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setDurationFilter(durationFilter === opt.value ? null : opt.value)}
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${durationFilter === opt.value ? "bg-primary text-primary-foreground" : "border bg-background text-foreground hover:bg-accent"}`}
                                  >{opt.label}</button>
                                ))}
                              </div>
                              {dayRequests.length > 0 && (
                                <p className="mb-2 text-[10px] font-semibold text-emerald-700">
                                  {dayRequests.length} player{dayRequests.length !== 1 ? "s" : ""} looking to play
                                </p>
                              )}
                              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                                {slots.map((slot) => {
                                  const session = getSession(venue.id, partnersDate, slot);
                                  const hasPlayer = !!session;
                                  const isPast = isSlotInPast(partnersDate, slot);
                                  const isOwn = hasPlayer && (session.user_id ? session.user_id === user?.id : user?.email === session.player_email);
                                  // Hide past empty slots — no point posting in the past
                                  if (isPast && !hasPlayer) return null;
                                  // Hide filled slots that don't match duration filter
                                  if (hasPlayer && durationFilter !== null && session.duration_minutes !== durationFilter) return null;

                                  if (isOwn) {
                                    const msgCount = messages[session.id]?.length ?? 0;
                                    return (
                                      <div key={slot} className="flex flex-col gap-1 rounded-lg border-2 border-primary bg-primary/5 px-2 py-2">
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                                          <Clock className="h-3 w-3 shrink-0" />{slot}
                                        </span>
                                        <span className="truncate text-[11px] font-semibold">{session.player_name}</span>
                                        <span className="text-[10px] text-muted-foreground">{session.skill_level}</span>
                                        <span className="text-[10px] text-primary/70">{fmtDuration(session.duration_minutes ?? 60)}</span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleOpenMessages(session, true); }}
                                          className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20"
                                        >
                                          <MessageSquare className="h-2.5 w-2.5" />
                                          {msgCount > 0 ? `${msgCount} message${msgCount !== 1 ? "s" : ""}` : "Messages"}
                                        </button>
                                        <button
                                          onClick={(e) => handleDelete(e, session.id)}
                                          disabled={deleting === session.id}
                                          className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive transition hover:bg-destructive/20"
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
                                        onClick={() => handleSlotClick(venue, partnersDate, slot)}
                                        className="flex flex-col gap-1 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-2 py-2 text-left transition hover:bg-emerald-100"
                                      >
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                          <Clock className="h-3 w-3 shrink-0" />{slot}
                                        </span>
                                        <span className="truncate text-[11px] font-semibold text-foreground">{session.player_name}</span>
                                        <span className="text-[10px] text-muted-foreground">{session.skill_level}</span>
                                        <span className="text-[10px] text-emerald-700">{fmtDuration(session.duration_minutes ?? 60)}</span>
                                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                          <MessageSquare className="h-2.5 w-2.5" /> Message
                                        </span>
                                      </button>
                                    );
                                  }

                                  return (
                                    <button
                                      key={slot}
                                      onClick={() => handleSlotClick(venue, partnersDate, slot)}
                                      className="flex h-auto flex-col gap-0.5 rounded-lg border bg-background px-2 py-2 text-left text-[11px] transition hover:border-primary/40 hover:bg-primary/5"
                                    >
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />{slot}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/60">Open</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
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
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Duration</label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <Button key={opt.value} variant={formData.duration === opt.value ? "default" : "outline"} size="sm" className="flex-1 text-xs"
                    onClick={() => setFormData((f) => ({ ...f, duration: opt.value }))}>{opt.label}</Button>
                ))}
              </div>
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

      {/* In-app message dialog */}
      <Dialog open={msgOpen} onOpenChange={(v) => { if (!v) { setMsgOpen(false); setMsgRequest(null); setMsgSent(false); setMsgText(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{msgIsOwner ? "Messages for your slot" : `Connect with ${msgRequest?.player_name}`}</DialogTitle>
            {msgRequest && (
              <DialogDescription>
                {msgRequest.venue_name} · {msgRequest.date} · {msgRequest.time_slot}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* Thread */}
            {msgRequest && (messages[msgRequest.id] ?? []).length > 0 && (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {(messages[msgRequest.id] ?? []).map((m) => {
                  const isMine = m.sender_user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-muted-foreground">{m.sender_name}</span>
                      <span className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-snug ${isMine ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                        {m.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Empty state for poster waiting for messages */}
            {msgIsOwner && msgRequest && (messages[msgRequest.id] ?? []).length === 0 && (
              <p className="rounded-lg border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                No messages yet — players who want to join will message you here.
              </p>
            )}
            {/* Compose area — poster can reply; others can send first message */}
            {msgSent ? (
              <div className="rounded-lg border bg-emerald-50 p-3 text-center text-xs text-emerald-700">
                Message sent! {!msgIsOwner && `${msgRequest?.player_name} will be notified.`}
              </div>
            ) : (
              <>
                {!msgIsOwner && (
                  <p className="text-xs text-muted-foreground">
                    Send {msgRequest?.player_name} a message to arrange your game. Your email stays private.
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={msgIsOwner ? "Reply…" : "Hi, I'd love to join you!"}
                    className="text-sm"
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={!msgText.trim() || msgSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onClose={() => { setAuthOpen(false); setAuthReturnTo(undefined); }} reason={authReason || undefined} returnTo={authReturnTo} />
    </div>
  );
}
