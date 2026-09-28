import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import type { Database } from "@/lib/supabase/types";
import { EMAIL_FROM as FROM, BASE_URL } from "@/lib/email";

// This route is called by a daily cron job.
// It sends a reminder email for any calls scheduled in the next 24 hours.

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const now = Date.now();
  const windowStart = new Date(now).toISOString();
  const windowEnd = new Date(now + 24 * 60 * 60 * 1000).toISOString();

  const { data: calls, error } = await admin
    .from("scheduled_calls")
    .select("id, match_id, scheduled_at, note")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error) {
    console.error("call-reminders query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!calls || calls.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  for (const call of calls) {
    const { data: match } = await admin
      .from("matches")
      .select("mentor_id, player_id")
      .eq("id", call.match_id)
      .single();
    if (!match) continue;

    const [{ data: mentorProfile }, { data: playerProfile }] = await Promise.all([
      admin.from("profiles").select("name").eq("id", match.mentor_id).single(),
      admin.from("profiles").select("name").eq("id", match.player_id).single(),
    ]);

    const [mentorEmailRes, playerEmailRes] = await Promise.all([
      admin.auth.admin.getUserById(match.mentor_id),
      admin.auth.admin.getUserById(match.player_id),
    ]);

    const mentorEmail = mentorEmailRes.data?.user?.email;
    const playerEmail = playerEmailRes.data?.user?.email;

    const d = new Date(call.scheduled_at);
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    const noteHtml = call.note ? `<p>Note: ${call.note}</p>` : "";
    const dashboardLink = `<a href="${BASE_URL}/dashboard">Go to your Locker Room</a>`;

    const emails = [
      mentorEmail && mentorProfile
        ? { to: mentorEmail, name: mentorProfile.name, otherName: playerProfile?.name ?? "your athlete" }
        : null,
      playerEmail && playerProfile
        ? { to: playerEmail, name: playerProfile.name, otherName: mentorProfile?.name ?? "your mentor" }
        : null,
    ].filter(Boolean) as { to: string; name: string; otherName: string }[];

    await Promise.all(
      emails.map(({ to, name, otherName }) =>
        resend.emails.send({
          from: FROM,
          to,
          subject: `Reminder: call with ${otherName} on ${formatted}`,
          html: `<p>Hi ${name},</p>
<p>Just a reminder — you have a call with <strong>${otherName}</strong> on <strong>${formatted}</strong>.</p>
${noteHtml}
<p>${dashboardLink} to join when it's time.</p>
<p>— The Mentality Sports Team</p>`,
        })
      )
    );

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
