"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, ExternalLink, Navigation } from "lucide-react";
import VenueMap from "../../components/VenueMap";

type Venue = { id: number; name: string; suburb: string; address: string; city: string; state: string; courts: number; price: string; booking_url: string; lat: number; lng: number };

export default function VenueDetail({ venue }: { venue: Venue | null }) {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-16 sm:px-6">
      <Link href="/venues" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to venues
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{venue.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {venue.address}
          </div>
          {venue.city && <Badge variant="secondary">{venue.city}</Badge>}
          {venue.state && <Badge variant="outline">{venue.state}</Badge>}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {venue.courts && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{venue.courts}</p>
              <p className="mt-1 text-xs text-muted-foreground">Court{venue.courts !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        )}
        {venue.price && (
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{venue.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">Typical rate</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">Indoor</p>
            <p className="mt-1 text-xs text-muted-foreground">Facility type</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        {venue.booking_url && (
          <a href={venue.booking_url} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2">Book Now <ExternalLink className="h-3.5 w-3.5" /></Button>
          </a>
        )}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2"><Navigation className="h-3.5 w-3.5" /> Get Directions</Button>
        </a>
      </div>

      <Separator className="mb-8" />

      {/* Map */}
      {venue.lat && venue.lng && (
        <div className="h-80 overflow-hidden rounded-xl border sm:h-96">
          <VenueMap venues={[venue]} center={{ lat: venue.lat, lng: venue.lng }} fullHeight className="h-full" />
        </div>
      )}
    </div>
  );
}
