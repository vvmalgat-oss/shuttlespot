import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── DELETE /api/coaches/[id]/my-thread ──────────────────────────────────────
// Player clears their own thread with a specific coach.
// Uses service-role so the delete always works regardless of RLS policies.
export async function DELETE(
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
  await sb
    .from("coach_messages")
    .delete()
    .eq("coach_id", coachId)
    .eq("thread_user_id", user.id);

  return NextResponse.json({ ok: true });
}
