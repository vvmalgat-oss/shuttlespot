import { NextResponse } from "next/server";

// After OAuth / magic-link sign-in, Supabase redirects here.
// We read the `next` query param (set by AuthModal before starting OAuth)
// and send the user back to the page they came from.

const ALLOWED_PREFIXES = ["/", "/venue/", "/social", "/search", "/venues", "/coaches", "/saved", "/admin"];

function isSafePath(path: string): boolean {
  // Must be a relative path (no protocol, no double-slash, no backslash)
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  // Must start with a known route prefix
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + "/") || path.startsWith(prefix + "?"));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";

  const safePath = isSafePath(next) ? next : "/";

  if (safePath !== next && next !== "/") {
    console.warn(`[auth/callback] Blocked open-redirect attempt: next="${next}"`);
  }

  return NextResponse.redirect(url.origin + safePath);
}
