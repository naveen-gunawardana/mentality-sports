import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { EMAIL_FROM, BASE_URL } from "@/lib/email";
import { getResend } from "@/lib/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUEST_TYPES = ["athlete", "coach", "expert", "other"] as const;
const TEAM_INBOX = "hello@mentalitysports.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed === "" ? null : trimmed;
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  if (clean(payload.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200)?.toLowerCase() ?? null;
  const story = clean(payload.story, 4000);
  const guestType = GUEST_TYPES.includes(payload.guest_type as (typeof GUEST_TYPES)[number])
    ? (payload.guest_type as string)
    : "other";

  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!story || story.length < 20) {
    return NextResponse.json({ error: "Tell us a bit more about your story." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const application = {
    name,
    email,
    phone: clean(payload.phone, 40),
    guest_type: guestType,
    sport: clean(payload.sport, 120),
    affiliation: clean(payload.affiliation, 200),
    social_links: clean(payload.social_links, 1000),
    story,
    topics: clean(payload.topics, 2000),
  };

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { error } = await admin.from("podcast_guest_applications").insert(application);
  if (error) {
    console.error("podcast guest application insert error:", error);
    return NextResponse.json({ error: "Could not submit. Try again." }, { status: 500 });
  }

  // Best-effort heads-up to the team; the admin panel is the source of truth.
  const resend = getResend();
  if (resend) {
    const rows = [
      ["Name", application.name],
      ["Email", application.email],
      ["Phone", application.phone],
      ["Guest type", application.guest_type],
      ["Sport", application.sport],
      ["Team / school / org", application.affiliation],
      ["Links", application.social_links],
      ["Their story", application.story],
      ["Topics", application.topics],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<p><strong>${k}:</strong><br>${escapeHtml(v!).replace(/\n/g, "<br>")}</p>`)
      .join("");
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: TEAM_INBOX,
        replyTo: application.email,
        subject: `New podcast guest application: ${application.name}`,
        html: `${rows}<p><a href="${BASE_URL}/admin/podcast">Review in the admin panel</a></p>`,
      });
    } catch (err) {
      console.error("podcast application notification failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
