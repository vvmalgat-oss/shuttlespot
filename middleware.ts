import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COMING_SOON = process.env.COMING_SOON === "true";

// ---------------------------------------------------------------------------
// Edge-compatible in-memory rate limiter (per-isolate, not distributed).
// For production multi-region deployments, replace with Upstash Redis.
// ---------------------------------------------------------------------------
type RLEntry = { count: number; resetAt: number };
const rlStore = new Map<string, RLEntry>();

function edgeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  if (rlStore.size > 20_000) {
    const now = Date.now();
    for (const [k, v] of rlStore) {
      if (v.resetAt <= now) rlStore.delete(k);
    }
  }
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rlStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

function tooManyRequestsResponse(retryAfterSec: number) {
  return new NextResponse(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Rate limit rules per route prefix
// ---------------------------------------------------------------------------
const RATE_LIMITS: Array<{
  prefix: string;
  limit: number;
  windowMs: number;
  label: string;
}> = [
  // Auth callback: 20 attempts per 5 min per IP
  { prefix: "/auth/callback", limit: 20, windowMs: 5 * 60 * 1000, label: "auth" },
  // Admin API: 60 requests per minute per IP
  { prefix: "/api/admin", limit: 60, windowMs: 60 * 1000, label: "admin-api" },
  // Places lookup (Google Maps proxy): 30 per minute per IP
  { prefix: "/api/places-lookup", limit: 30, windowMs: 60 * 1000, label: "places-lookup" },
  // All other API routes: 120 per minute per IP
  { prefix: "/api/", limit: 120, windowMs: 60 * 1000, label: "api-general" },
];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Coming-soon gate
  if (COMING_SOON) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>ShuttleSpot — Coming Soon</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
      .box{text-align:center;padding:2rem}.emoji{font-size:3rem}.h1{font-size:1.5rem;font-weight:700;margin:1rem 0 0.5rem}
      .p{color:#64748b;font-size:0.9rem}</style></head>
      <body><div class="box"><div class="emoji">🏸</div>
      <div class="h1">ShuttleSpot</div>
      <div class="p">We're getting the courts ready. Check back soon.</div>
      </div></body></html>`,
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  // Get client IP for rate limiting keys
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Apply the first matching rate limit rule
  for (const rule of RATE_LIMITS) {
    if (pathname.startsWith(rule.prefix)) {
      const rlKey = `${rule.label}:${ip}`;
      const { allowed, retryAfterSec } = edgeRateLimit(rlKey, rule.limit, rule.windowMs);
      if (!allowed) {
        console.warn(`[rate-limit] ${rule.label} blocked ip=${ip} path=${pathname}`);
        return tooManyRequestsResponse(retryAfterSec);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
