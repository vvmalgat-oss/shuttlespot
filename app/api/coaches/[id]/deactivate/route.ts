import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── POST /api/coaches/[id]/deactivate ───────────────────────────────────────
// Soft-deletes (active = false) the coach profile.
// Verifies ownership by user_id OR email — works even if user_id was never set.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const coachId = parseInt(id);
  if (isNaN(coachId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await createClient(URL_, ANON).auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createClient(URL_, SVC);
  const { data: coach } = await sb
    .from("coaches")
    .select("id, user_id, email")
    .eq("id", coachId)
    .single();

  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const byId    = coach.user_id && coach.user_id === user.id;
  const byEmail = coach.email?.toLowerCase() === (user.email ?? "").toLowerCase();
  if (!byId && !byEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await sb
    .from("coaches")
    .update({ active: false })
    .eq("id", coachId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log(`[coaches] DEACTIVATED id=${coachId} by=${user.email}`);
  return NextResponse.json({ ok: true });
}
