import { NextResponse } from "next/server";

// After OAuth sign-in, Supabase redirects here.
// The Supabase JS client handles the session automatically from the URL fragment/code.
// Just redirect the user back to the home page.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(origin);
}
