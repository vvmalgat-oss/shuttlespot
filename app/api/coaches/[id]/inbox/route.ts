import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Verify the JWT and return the Supabase user, or null. */
async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await createClient(URL_, ANON).auth.getUser(token);
  return user ?? null;
}

/**
 * Verify that `userId`/`userEmail` own the coach row.
 * Uses the service-role client so coaches table RLS doesn't interfere.
 * Also auto-heals user_id = null rows on first access.
 */
async function verifyCoachOwner(coachId: number, userId: string, userEmail: string) {
  const sb = createClient(URL_, SVC);
  const { data: coach } = await sb
    .from("coaches")
    .select("id, user_id, email")
    .eq("id", coachId)
    .single();
  if (!coach) return false;

  const byId    = coach.user_id && coach.user_id === userId;
  const byEmail = coach.email?.toLowerCase() === userEmail.toLowerCase();
  if (!byId && !byEmail) return false;

  // Auto-heal: stamp user_id so future RLS-based ops work
  if (!coach.user_id) {
    await sb.from("coaches").update({ user_id: userId }).eq("id", coachId);
  }
  return true;
}

// ── GET /api/coaches/[id]/inbox ─────────────────────────────────────────────
// Returns all coach_messages for this coach. Uses service-role — bypasses RLS.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const coachId = parseInt(id);
  if (isNaN(coachId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await verifyCoachOwner(coachId, user.id, user.email ?? "");
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createClient(URL_, SVC);
  const { data, error } = await sb
    .from("coach_messages")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// ── DELETE /api/coaches/[id]/inbox?thread=<threadUserId> ───────────────────
// Coach clears one player thread. Uses service-role.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const coachId = parseInt(id);
  if (isNaN(coachId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const threadUserId = req.nextUrl.searchParams.get("thread");
  if (!threadUserId) return NextResponse.json({ error: "Missing thread" }, { status: 400 });

  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await verifyCoachOwner(coachId, user.id, user.email ?? "");
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createClient(URL_, SVC);
  await sb
    .from("coach_messages")
    .delete()
    .eq("coach_id", coachId)
    .eq("thread_user_id", threadUserId);

  return NextResponse.json({ ok: true });
}
