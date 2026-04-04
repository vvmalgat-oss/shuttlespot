import { Metadata } from "next";
import { supabase } from "../../../supabase";
import VenueDetail from "./VenueDetail";

type Venue = { id: number; name: string; suburb: string; address: string; city: string; state: string; courts: number; price: string; booking_url: string; lat: number; lng: number; photo_url?: string | null; opening_hours?: string | null; open_hour?: number | null; close_hour?: number | null };
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: venue } = await supabase.from("venues").select("*").eq("id", parseInt(id)).single();

  if (!venue) return { title: "Venue Not Found" };

  const location = venue.city || venue.suburb;
  const title = `${venue.name} — Badminton Courts in ${location}`;
  const description = `Book badminton courts at ${venue.name} in ${venue.address}. ${venue.courts} court${venue.courts !== 1 ? "s" : ""} available${venue.price ? `, from ${venue.price}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://shuttlespot.vercel.app/venue/${id}`,
    },
    twitter: { title, description },
  };
}

type Review = { id: number; reviewer_name: string; rating: number; comment: string; created_at: string };

export default async function VenueDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ data: venue }, { data: reviews }, { data: stats }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", parseInt(id)).single(),
    supabase.from("venue_reviews").select("id, reviewer_name, rating, comment, created_at").eq("venue_id", parseInt(id)).order("created_at", { ascending: false }),
    supabase.from("venue_rating_stats").select("avg_rating, review_count").eq("venue_id", parseInt(id)).single(),
  ]);

  const jsonLd = venue
    ? {
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        name: venue.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: venue.address,
          addressLocality: venue.city || venue.suburb,
          addressRegion: venue.state,
          addressCountry: "AU",
        },
        ...(venue.lat && venue.lng ? { geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng } } : {}),
        ...(venue.booking_url ? { url: venue.booking_url } : {}),
        sport: "Badminton",
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <VenueDetail
        venue={venue as Venue | null}
        initialReviews={(reviews as Review[]) ?? []}
        avgRating={stats?.avg_rating ?? null}
        reviewCount={stats?.review_count ?? 0}
      />
    </>
  );
}
