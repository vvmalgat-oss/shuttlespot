import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

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

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// Allowed fields for venue create/update — strips any extra keys from the body
// to prevent mass-assignment vulnerabilities.
const ALLOWED_VENUE_FIELDS = new Set([
  "name", "suburb", "state", "address", "lat", "lng",
  "courts", "surface", "lighting", "parking", "price_per_hour",
  "open_hour", "close_hour", "opening_hours", "phone", "booking_url",
  "photo_url", "place_id", "google_rating", "google_review_count",
  "description", "amenities",
]);

function sanitizeVenueBody(body: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_VENUE_FIELDS.has(k)) safe[k] = v;
  }
  return safe;
}

// POST — create venue
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`admin-venues-write:${ip}`, 30, 60_000);
  if (!allowed) return tooManyRequests(retryAfterMs) as unknown as NextResponse;

  const user = await getAdminUser(req);
  if (!user) {
    console.warn(`[admin/venues] Unauthorized POST attempt from ip=${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "string") {
    return NextResponse.json({ error: "state is required" }, { status: 400 });
  }

  const safe = sanitizeVenueBody(body);
  const sb = serviceClient();
  const { data, error } = await sb.from("venues").insert(safe).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  console.log(`[admin/venues] CREATED id=${data.id} name="${data.name}" by=${user.email}`);
  return NextResponse.json(data);
}

// PUT — update venue
export async function PUT(req: NextRequest) {
  const ip = getIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`admin-venues-write:${ip}`, 30, 60_000);
  if (!allowed) return tooManyRequests(retryAfterMs) as unknown as NextResponse;

  const user = await getAdminUser(req);
  if (!user) {
    console.warn(`[admin/venues] Unauthorized PUT attempt from ip=${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, ...rest } = body;
  if (!id || typeof id !== "number") {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  const safe = sanitizeVenueBody(rest);
  const sb = serviceClient();
  const { data, error } = await sb.from("venues").update(safe).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  console.log(`[admin/venues] UPDATED id=${id} by=${user.email}`);
  return NextResponse.json(data);
}

// DELETE — delete venue
export async function DELETE(req: NextRequest) {
  const ip = getIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`admin-venues-write:${ip}`, 10, 60_000);
  if (!allowed) return tooManyRequests(retryAfterMs) as unknown as NextResponse;

  const user = await getAdminUser(req);
  if (!user) {
    console.warn(`[admin/venues] Unauthorized DELETE attempt from ip=${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;
  if (!id || typeof id !== "number") {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  const sb = serviceClient();
  const { error } = await sb.from("venues").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  console.log(`[admin/venues] DELETED id=${id} by=${user.email}`);
  return NextResponse.json({ ok: true });
}
