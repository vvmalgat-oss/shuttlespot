"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChevronRight, CheckCircle2 } from "lucide-react";

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
};

type Props = {
  venue: Venue;
  distance?: string | null;
  isActive: boolean;
  onHover: (id: number) => void;
  onClick: (id: number) => void;
};

const AVATAR_PALETTES = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function avatarColor(name: string) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function VenueCard({ venue, distance, isActive, onHover, onClick }: Props) {
  const colorClass = avatarColor(venue.name);
  const hasBooking = !!venue.booking_url;

  return (
    <Card
      id={`venue-${venue.id}`}
      onMouseEnter={() => onHover(venue.id)}
      onClick={() => onClick(venue.id)}
      className={`group cursor-pointer transition-all hover:shadow-md ${
        isActive
          ? "border-primary/50 bg-primary/[0.02] shadow-sm ring-1 ring-primary/20"
          : "hover:border-primary/20"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${colorClass}`}>
            {initials(venue.name)}
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug">{venue.name}</h3>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
            </div>

            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{venue.address}</span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {venue.courts ? (
                <span className="text-xs text-muted-foreground">
                  {venue.courts} court{venue.courts !== 1 ? "s" : ""}
                </span>
              ) : null}
              {venue.price ? (
                <span className="text-xs font-semibold text-primary">{venue.price}</span>
              ) : null}
              {(venue.city || venue.state) && (
                <span className="text-xs text-muted-foreground">
                  {[venue.city, venue.state].filter(Boolean).join(", ")}
                </span>
              )}
              {distance && (
                <span className="text-xs text-muted-foreground">{distance} km away</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          {hasBooking ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Online booking available
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground">Enquire to book</div>
          )}
          <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View availability →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
