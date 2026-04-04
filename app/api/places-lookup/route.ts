import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.json();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

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
