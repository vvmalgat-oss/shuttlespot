"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChevronRight, CheckCircle2, Heart } from "lucide-react";
import StarRating from "./StarRating";

type Venue = {
  id: number;
  name: string;
  suburb: string;
  address: string;
  city?: string;
  state?: string;
  courts: number;
  price: string;
  booking_url: string;
  lat?: number | null;
  lng?: number | null;
  photo_url?: string | null;
  open_hour?: number | null;
  close_hour?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
};

type RatingStats = { avg_rating: number; review_count: number };

type Props = {
  venue: Venue;
  distance?: string | null;
  isActive: boolean;
  onHover: (id: number) => void;
  onClick: (id: number) => void;
  ratingStats?: RatingStats | null;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
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

function stateGradient(state?: string | null) {
  return STATE_GRADIENTS[state || ""] || "from-slate-500 to-slate-700";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function hoursStatus(openHour?: number | null, closeHour?: number | null): { open: boolean; label: string } | null {
  if (openHour == null || closeHour == null) return null;
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const close = closeHour === 24 ? 24 : closeHour;
  if (h >= openHour && h < close) return { open: true, label: `Open · closes ${fmtHour(closeHour)}` };
  if (h < openHour) return { open: false, label: `Closed · opens ${fmtHour(openHour)}` };
  return { open: false, label: `Closed · opens ${fmtHour(openHour)} tomorrow` };
}

export default function VenueCard({ venue, distance, isActive, onHover, onClick, ratingStats, isSaved, onToggleSave }: Props) {
  const hasBooking = !!venue.booking_url;
  const hours = hoursStatus(venue.open_hour, venue.close_hour);

  return (
    <Card
      id={`venue-${venue.id}`}
      onMouseEnter={() => onHover(venue.id)}
      onClick={() => onClick(venue.id)}
      className={`group cursor-pointer overflow-hidden transition-all hover:shadow-md ${
        isActive
          ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/40"
          : "hover:border-primary/20"
      }`}
    >
      {/* Photo banner */}
      <div className="relative h-28 w-full overflow-hidden">
        {venue.photo_url ? (
          <Image
            src={venue.photo_url}
            alt={venue.name}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={venue.photo_url.startsWith("https://lh3.googleusercontent.com") || venue.photo_url.startsWith("https://maps.googleapis.com")}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${stateGradient(venue.state)}`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                {initials(venue.name)}
              </div>
              {venue.state && (
                <span className="text-[10px] font-semibold text-white/80">{venue.suburb || venue.city}, {venue.state}</span>
              )}
            </div>
          </div>
        )}
        {hasBooking && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <CheckCircle2 className="h-3 w-3" /> Book online
          </div>
        )}
        {/* Save button */}
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(venue.id); }}
            className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow transition-all ${
              isSaved ? "bg-rose-500 text-white" : "bg-black/30 text-white hover:bg-black/50"
            }`}
            aria-label={isSaved ? "Unsave venue" : "Save venue"}
          >
            <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      <CardContent className="p-4 pt-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug">{venue.name}</h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{venue.address}</span>
          </div>

          {hours && (
            <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${hours.open ? "text-emerald-600" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hours.open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {hours.label}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {venue.courts ? (
              <span className="text-xs text-muted-foreground">{venue.courts} court{venue.courts !== 1 ? "s" : ""}</span>
            ) : null}
            {venue.price ? (
              <span className="text-xs font-semibold text-primary">{venue.price}</span>
            ) : null}
            {(venue.city || venue.state) && (
              <span className="text-xs text-muted-foreground">{[venue.city, venue.state].filter(Boolean).join(", ")}</span>
            )}
            {distance && (
              <span className="text-xs text-muted-foreground">{distance} km away</span>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {venue.google_rating != null && venue.google_review_count != null && (
              <div className="flex items-center gap-1">
                <GoogleIcon />
                <span className="text-[11px] font-semibold">{venue.google_rating.toFixed(1)}</span>
                <span className="text-[10px] text-amber-400">{"★".repeat(Math.round(venue.google_rating))}</span>
                <span className="text-[10px] text-muted-foreground">({venue.google_review_count.toLocaleString()})</span>
              </div>
            )}
            {ratingStats && ratingStats.review_count > 0 && (
              <StarRating rating={ratingStats.avg_rating} count={ratingStats.review_count} size="xs" />
            )}
            {!venue.google_rating && !(ratingStats?.review_count) && hasBooking && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Online booking
              </div>
            )}
            {!venue.google_rating && !(ratingStats?.review_count) && !hasBooking && (
              <div className="text-[11px] text-muted-foreground">Enquire to book</div>
            )}
          </div>
          <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View details →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" aria-label="Google">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
