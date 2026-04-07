import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Venue = {
  id: number;
  name: string;
  address: string;
  suburb: string;
  state: string;
  place_id: string | null;
};

type PlaceResult = {
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
};

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.json();
}

async function lookupPlaceId(venue: Venue): Promise<string | null> {
  const query = `${venue.name} ${venue.suburb} ${venue.state} Australia`;
  const data = await fetchJson(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_KEY}`
  );
  if (data.status !== "OK" || !data.results?.[0]) return null;
  return data.results[0].place_id ?? null;
}

async function fetchRating(placeId: string): Promise<{ rating: number | null; review_count: number | null }> {
  const data = await fetchJson(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${MAPS_KEY}`
  );
  if (data.status !== "OK" || !data.result) return { rating: null, review_count: null };
  const r = data.result as PlaceResult;
  return {
    rating: r.rating ?? null,
    review_count: r.user_ratings_total ?? null,
  };
}

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>
  // Manual calls can pass ?secret=... or x-cron-secret header
  const authHeader = req.headers.get("authorization");
  const secret =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ??
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch all venues
  const { data: venues, error } = await sb
    .from("venues")
    .select("id, name, address, suburb, state, place_id")
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: number; name: string; place_id?: string; rating?: number | null; review_count?: number | null; status: string }[] = [];

  // Rate limit: Places API allows ~10 QPS; we add a small delay between calls
  for (const venue of (venues as Venue[])) {
    let placeId = venue.place_id;

    // Step 1: resolve place_id if missing
    if (!placeId) {
      placeId = await lookupPlaceId(venue);
      if (!placeId) {
        results.push({ id: venue.id, name: venue.name, status: "not_found" });
        continue;
      }
      await sb.from("venues").update({ place_id: placeId }).eq("id", venue.id);
    }

    // Step 2: fetch latest rating
    const { rating, review_count } = await fetchRating(placeId);

    // Step 3: update DB
    await sb.from("venues").update({
      place_id: placeId,
      google_rating: rating,
      google_review_count: review_count,
    }).eq("id", venue.id);

    results.push({ id: venue.id, name: venue.name, place_id: placeId, rating, review_count, status: "ok" });

    // Avoid hitting rate limits (100ms between calls)
    await new Promise((r) => setTimeout(r, 100));
  }

  const updated = results.filter((r) => r.status === "ok").length;
  const notFound = results.filter((r) => r.status === "not_found").length;

  return NextResponse.json({ updated, not_found: notFound, results });
}
