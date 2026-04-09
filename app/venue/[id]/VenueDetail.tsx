"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, ExternalLink, Navigation, Clock, CalendarDays, CheckCircle2, Users, ArrowRight } from "lucide-react";
import VenueMap from "../../components/VenueMap";
import VenueSlideOver from "../../components/VenueSlideOver";
import StarRating from "../../components/StarRating";
import ReviewList from "../../components/ReviewList";
import ReviewForm from "../../components/ReviewForm";

type Venue = {
  id: number;
  name: string;
  suburb: string;
  address: string;
  city: string;
  state: string;
  courts: number;
  price: string;
  booking_url: string;
  lat: number;
  lng: number;
  photo_url?: string | null;
  opening_hours?: string | null;
  open_hour?: number | null;
  close_hour?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
};

type NearbyVenue = {
  id: number;
  name: string;
  suburb: string;
  state: string;
  courts: number;
  price: string;
  photo_url?: string | null;
  lat: number;
  lng: number;
  google_rating?: number | null;
  distance: number;
};

type Review = { id: number; reviewer_name: string; rating: number; comment: string; created_at: string };

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

const GRADIENTS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700", "from-teal-500 to-teal-700",
];

function stateGradient(state?: string | null) {
  return STATE_GRADIENTS[state || ""] || "from-slate-500 to-slate-700";
}

function avatarGradient(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[h % GRADIENTS.length];
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function isOpenNow(openHour?: number | null, closeHour?: number | null): boolean {
  if (openHour == null || closeHour == null) return false;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= openHour && h < (closeHour === 24 ? 24 : closeHour);
}

type Props = {
  venue: Venue | null;
  initialReviews?: Review[];
  avgRating?: number | null;
  reviewCount?: number;
  nearbyVenues?: NearbyVenue[];
};

export default function VenueDetail({ venue, initialReviews = [], avgRating, reviewCount = 0, nearbyVenues = [] }: Props) {
  const [bookOpen, setBookOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  if (!venue) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <span className="mb-4 text-5xl">🏸</span>
        <h2 className="text-xl font-bold">Venue not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The venue you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/venues"><Button variant="outline" className="mt-4" size="sm">Browse all venues</Button></Link>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`;
  const openNow = isOpenNow(venue.open_hour, venue.close_hour);
  const socialHref = `/social?venue=${encodeURIComponent(venue.name)}`;

  return (
    <div className="mx-auto max-w-4xl pb-20 md:pb-16">

      {/* ── Hero banner ── */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72 sm:rounded-b-2xl">
        {venue.photo_url ? (
          <>
            <Image
                src={venue.photo_url}
                alt={venue.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
                unoptimized={venue.photo_url.startsWith("https://lh3.googleusercontent.com") || venue.photo_url.startsWith("https://maps.googleapis.com")}
              />
            {/* Gradient scrim so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
            {/* Name in the hero when photo present */}
            <div className="absolute bottom-5 left-5 right-20">
              <h1 className="text-2xl font-bold leading-tight text-white drop-shadow sm:text-3xl">{venue.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3 w-3 shrink-0" />
                {venue.address}
              </p>
            </div>
          </>
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${stateGradient(venue.state)}`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-5 left-5 right-20">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Badminton venue</p>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{venue.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3 w-3 shrink-0" />
                {venue.address}
              </p>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="absolute left-4 top-4">
          <Link href="/venues" className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/50">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        {/* Open/closed badge */}
        {venue.opening_hours && (
          <div className="absolute right-4 top-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
              openNow ? "bg-emerald-500/90 text-white" : "bg-black/40 text-white/80"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? "bg-white" : "bg-white/50"}`} />
              {openNow ? "Open now" : "Closed"}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 py-6 sm:px-6">

        {/* City / state badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {venue.city && <Badge variant="secondary">{venue.city}</Badge>}
          {venue.state && <Badge variant="outline">{venue.state}</Badge>}
        </div>

        {/* ── Stats ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {venue.courts ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{venue.courts}</p>
                <p className="mt-1 text-xs text-muted-foreground">Court{venue.courts !== 1 ? "s" : ""}</p>
              </CardContent>
            </Card>
          ) : null}
          {venue.price ? (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{venue.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">Typical rate</p>
              </CardContent>
            </Card>
          ) : null}
          {venue.google_rating != null && venue.google_review_count != null ? (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <p className="text-3xl font-bold">{venue.google_rating.toFixed(1)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{venue.google_review_count.toLocaleString()} Google reviews</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">Indoor</p>
                <p className="mt-1 text-xs text-muted-foreground">Facility type</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Opening hours ── */}
        {venue.opening_hours && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${openNow ? "bg-emerald-500/10" : "bg-muted"}`}>
                <Clock className={`h-4 w-4 ${openNow ? "text-emerald-600" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opening hours</p>
                <p className="mt-0.5 text-sm font-medium">{venue.opening_hours}</p>
              </div>
              {openNow ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Open now
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Closed</span>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button className="gap-2" onClick={() => setBookOpen(true)}>
            <CalendarDays className="h-4 w-4" /> Book a court
          </Button>
          {venue.booking_url && (
            <a href={venue.booking_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                Venue website <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <Navigation className="h-3.5 w-3.5" /> Get directions
            </Button>
          </a>
        </div>

        {/* ── Find partners CTA ── */}
        <Link href={socialHref}>
          <div className="mb-8 group flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] px-5 py-4 transition hover:border-primary/40 hover:bg-primary/[0.07]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Find a playing partner here</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Post your availability or join someone else&apos;s session at {venue.name}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary/40 transition group-hover:text-primary" />
          </div>
        </Link>

        <Separator className="mb-8" />

        {/* ── Map ── */}
        {venue.lat && venue.lng && (
          <div className="mb-8 h-72 overflow-hidden rounded-xl border sm:h-80">
            <VenueMap venues={[venue]} center={{ lat: venue.lat, lng: venue.lng }} fullHeight className="h-full" />
          </div>
        )}

        <Separator className="mb-8" />

        {/* ── Reviews ── */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Reviews</h2>
            {reviewCount > 0 && avgRating != null ? (
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={avgRating} count={reviewCount} size="sm" />
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">No reviews yet — be the first</p>
            )}
          </div>
        </div>
        <ReviewList reviews={reviews} isLoading={false} />
        <div className="mt-8">
          <ReviewForm
            venueId={venue.id}
            venueName={venue.name}
            onSuccess={(r) => setReviews((prev) => [r, ...prev])}
          />
        </div>

        {/* ── Nearby venues ── */}
        {nearbyVenues.length > 0 && (
          <>
            <Separator className="my-8" />
            <h2 className="mb-4 text-base font-bold">Other venues in {venue.state}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {nearbyVenues.map((v) => (
                <Link
                  key={v.id}
                  href={`/venue/${v.id}`}
                  className="group flex items-start gap-3 rounded-xl border bg-card p-3.5 transition hover:border-primary/30 hover:shadow-sm"
                >
                  {v.photo_url ? (
                    <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden">
                      <Image src={v.photo_url} alt={v.name} fill sizes="40px" className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(v.name)}`}>
                      {initials(v.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{v.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.suburb} · {v.distance.toFixed(1)} km</p>
                    {v.price && <p className="mt-0.5 text-xs font-medium text-primary">{v.price}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <VenueSlideOver venue={venue} open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
}
