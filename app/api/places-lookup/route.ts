import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

// Use server-only env var; falls back to the public one so both work in .env.local.
// In production, set GOOGLE_MAPS_KEY (no NEXT_PUBLIC_ prefix) to avoid bundling
// the server key into client JavaScript.
const API_KEY = process.env.GOOGLE_MAPS_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function getAdminUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sb = createClient(SUPABASE_URL, ANON_KEY);
  const {
    data: { user },
  } = await sb.auth.getUser(token);
  if (!user?.email) return null;
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) return null;
  return user;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.json();
}

export async function GET(req: NextRequest) {
  // Require admin authentication — this endpoint proxies paid Google Maps API calls.
  const user = await getAdminUser(req);
  if (!user) {
    console.warn(`[places-lookup] Unauthorized access attempt from ${req.headers.get("x-forwarded-for") ?? "unknown"}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-user rate limit: 60 lookups / minute (well within Google's free tier)
  const { allowed, retryAfterMs } = checkRateLimit(`places-lookup:${user.id}`, 60, 60_000);
  if (!allowed) return tooManyRequests(retryAfterMs) as unknown as NextResponse;

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  if (q.length > 200) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const search = await fetchJson(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${API_KEY}`
  );

  if (search.status !== "OK" || !search.results?.[0]) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const place = search.results[0];
  const placeId = place.place_id;

  const detail = await fetchJson(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,website,photos&key=${API_KEY}`
  );

  const d = detail.result;
  let photo_url: string | null = null;

  if (d.photos?.[0]) {
    const photoRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${d.photos[0].photo_reference}&key=${API_KEY}`,
      { redirect: "follow" }
    );
    photo_url = photoRes.url || null;
  }

  return NextResponse.json({
    name: d.name,
    address: d.formatted_address,
    lat: d.geometry?.location?.lat,
    lng: d.geometry?.location?.lng,
    website: d.website ?? null,
    photo_url,
  });
}
