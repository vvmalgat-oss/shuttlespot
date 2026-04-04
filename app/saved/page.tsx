"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import AuthModal from "../components/AuthModal";

type Venue = {
  id: number; name: string; suburb: string; address: string; city: string; state: string;
  courts: number; price: string; booking_url: string; photo_url?: string | null;
  open_hour?: number | null; close_hour?: number | null;
  google_rating?: number | null; google_review_count?: number | null;
};

const STATE_GRADIENTS: Record<string, string> = {
  VIC: "from-blue-600 to-indigo-700", NSW: "from-emerald-500 to-teal-700",
  QLD: "from-red-500 to-rose-700",    WA:  "from-amber-500 to-orange-600",
  SA:  "from-purple-500 to-violet-700", ACT: "from-cyan-500 to-blue-600",
  TAS: "from-green-600 to-emerald-700", NT: "from-orange-500 to-red-600",
};

function fmtHour(h: number) {
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
function hoursStatus(open?: number | null, close?: number | null) {
  if (open == null || close == null) return null;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= open && h < (close === 24 ? 24 : close)) return { open: true, label: `Open · closes ${fmtHour(close)}` };
  if (h < open) return { open: false, label: `Closed · opens ${fmtHour(open)}` };
  return { open: false, label: `Closed · opens ${fmtHour(open)} tomorrow` };
}

export default function SavedPage() {
  const [user, setUser] = useState<User | null | "loading">("loading");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user === "loading") { setLoading(false); return; }
    supabase
      .from("saved_venues")
      .select("venue_id, venues(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setVenues(data.map((r: { venue_id: number; venues: Venue }) => r.venues).filter(Boolean));
        setLoading(false);
      });
  }, [user]);

  const unsave = async (venueId: number) => {
    if (!user || user === "loading") return;
    setRemoving(venueId);
    await supabase.from("saved_venues").delete().eq("user_id", user.id).eq("venue_id", venueId);
    setVenues((vs) => vs.filter((v) => v.id !== venueId));
    setRemoving(null);
  };

  if (user === "loading" || loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Heart className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-lg font-bold">Sign in to save venues</p>
        <p className="text-sm text-muted-foreground max-w-xs">Create a free account to save your favourite badminton courts and access them anytime.</p>
        <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Saved venues</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{venues.length} saved court{venues.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/venues">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" /> Find more
          </Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-muted/20 py-20 text-center">
          <Heart className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium">No saved venues yet</p>
          <p className="text-xs text-muted-foreground">Tap the heart on any venue card to save it here</p>
          <Link href="/venues"><Button size="sm" variant="outline" className="mt-1">Browse venues</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => {
            const hrs = hoursStatus(v.open_hour, v.close_hour);
            const gradient = STATE_GRADIENTS[v.state] || "from-slate-500 to-slate-700";
            return (
              <div key={v.id} className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
                {/* Photo */}
                <Link href={`/venue/${v.id}`}>
                  <div className="relative h-36 w-full overflow-hidden">
                    {v.photo_url ? (
                      <Image src={v.photo_url} alt={v.name} fill sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized={v.photo_url.startsWith("https://lh3.") || v.photo_url.startsWith("https://maps.")} />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
                    )}
                    {v.booking_url && (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        <CheckCircle2 className="h-3 w-3" /> Book online
                      </div>
                    )}
                  </div>
                </Link>

                {/* Unsave button */}
                <button
                  onClick={() => unsave(v.id)}
                  disabled={removing === v.id}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow transition hover:bg-rose-600"
                  aria-label="Remove from saved"
                >
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </button>

                <Link href={`/venue/${v.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold leading-snug">{v.name}</h2>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-primary" />
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{v.address}</span>
                  </div>
                  {hrs && (
                    <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${hrs.open ? "text-emerald-600" : "text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hrs.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      {hrs.label}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {v.courts ? <span className="text-muted-foreground">{v.courts} courts</span> : null}
                    {v.price ? <span className="font-semibold text-primary">{v.price}</span> : null}
                    {v.google_rating != null && (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <span className="font-semibold">{v.google_rating.toFixed(1)}</span>
                        <span className="text-amber-400">★</span>
                        <span className="text-muted-foreground">({v.google_review_count?.toLocaleString()})</span>
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
