import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM   = process.env.RESEND_FROM_EMAIL ?? "ShuttleSpot <notifications@shuttlespot.com.au>";

// In dev, fetch from localhost. In prod, use the deployed domain.
const SELF_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://shuttlespot.vercel.app");

/**
 * Fetch the logo PNG from our own /api/email-logo endpoint and return it
 * as a base64 data URI so it is embedded directly in the email HTML.
 * Gmail and every other client renders data URIs reliably — no external fetch needed.
 */
async function logoDataUri(): Promise<string | null> {
  try {
    const res = await fetch(`${SELF_URL}/api/email-logo`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const coachId = parseInt(id);
  if (isNaN(coachId)) return NextResponse.json({ ok: false }, { status: 400 });

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: { user } } = await createClient(URL_, ANON).auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  if (!resend) return NextResponse.json({ ok: true, skipped: "email not configured" });

  const sb = createClient(URL_, SVC);
  const { data: coach } = await sb
    .from("coaches")
    .select("name, email")
    .eq("id", coachId)
    .single();

  if (!coach?.email) return NextResponse.json({ ok: true, skipped: "no coach email" });

  let body: { playerName?: string; message?: string } = {};
  try { body = await req.json(); } catch { /* optional */ }

  const playerName = body.playerName ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "A player";
  const preview    = body.message ? `"${body.message.slice(0, 120)}${body.message.length > 120 ? "…" : ""}"` : "";

  // Fetch logo as base64 — embedded directly so no external image request needed
  const logo = await logoDataUri();
  const logoHtml = logo
    ? `<img src="${logo}" alt="ShuttleSpot" width="160" height="44" style="display:block;border:0;" />`
    : `<span style="font-size:16px;font-weight:700;font-family:-apple-system,sans-serif;color:#0f172a;">Shuttle<span style="color:#2563eb;">Spot</span></span>`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shuttlespot.vercel.app";

  try {
    await resend.emails.send({
      from: FROM,
      to: coach.email,
      subject: `${playerName} sent you a message on ShuttleSpot`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e2e8f0">
          ${logoHtml}
        </td></tr>
        <tr><td style="padding:28px">
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a">
            New message from ${playerName}
          </h2>
          <p style="margin:0 0 16px;font-size:14px;color:#64748b">
            Someone just sent you a coaching enquiry via ShuttleSpot.
          </p>
          ${preview ? `
          <div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#334155;line-height:1.6">${preview}</p>
          </div>` : ""}
          <a href="${appUrl}/coaches"
             style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none">
            View &amp; reply in ShuttleSpot →
          </a>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">
            Open ShuttleSpot → Coaches → View messages from players
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:11px;color:#94a3b8">
            You're receiving this because you have a coaching profile on ShuttleSpot.<br>
            Questions? <a href="mailto:hello.shuttlespot@gmail.com" style="color:#64748b">hello.shuttlespot@gmail.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[notify] Email sent to ${coach.email} from ${playerName}`);
  } catch (err) {
    console.error("[notify] Email send failed:", err);
  }

  return NextResponse.json({ ok: true });
}
