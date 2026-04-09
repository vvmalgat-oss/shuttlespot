// In-memory sliding-window rate limiter for API routes.
// Resets per serverless instance. For distributed rate limiting, swap the
// store for Upstash Redis (@upstash/ratelimit).

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

/** Prune expired entries when the store grows large */
function prune() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

/**
 * Check whether a given key has exceeded its rate limit.
 * @param key     - Unique identifier (e.g. IP + route)
 * @param limit   - Max requests allowed within the window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  if (store.size > 10_000) prune();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count += 1;
  const allowed = entry.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    retryAfterMs: allowed ? 0 : entry.resetAt - now,
  };
}

/** Returns a 429 NextResponse with Retry-After header */
export function tooManyRequests(retryAfterMs: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}
