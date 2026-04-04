import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COMING_SOON = process.env.COMING_SOON === "true";

export function middleware(request: NextRequest) {
  if (!COMING_SOON) return NextResponse.next();

  // Allow Vercel deploy bot and health checks
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
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

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
