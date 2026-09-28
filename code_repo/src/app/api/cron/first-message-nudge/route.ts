import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import type { Database } from "@/lib/supabase/types";
import { EMAIL_FROM as FROM, BASE_URL } from "@/lib/email";

// Runs daily. Finds active matches that:
//   - were created more than 24 hours ago
//   - have zero messages sent by either party
// Sends a one-time nudge email to both the mentor and athlete.

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

  // Matches created between 24h and 48h ago (so we only nudge once)
  const cutoffStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const cutoffEnd   = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: matches, error } = await admin
    .from("matches")
    .select("id, mentor_id, player_id, created_at")
    .eq("status", "active")
    .gte("created_at", cutoffStart)
    .lte("created_at", cutoffEnd);

  if (error) {
    console.error("first-message-nudge query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;

  for (const match of matches) {
    // Check if any messages exist in this match
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", match.id);

    if ((count ?? 0) > 0) continue; // already talking — skip

    const [{ data: mentorProfile }, { data: playerProfile }] = await Promise.all([
      admin.from("profiles").select("name").eq("id", match.mentor_id).single(),
      admin.from("profiles").select("name").eq("id", match.player_id).single(),
    ]);

    const [mentorRes, playerRes] = await Promise.all([
      admin.auth.admin.getUserById(match.mentor_id),
      admin.auth.admin.getUserById(match.player_id),
    ]);

    const mentorEmail = mentorRes.data?.user?.email;
    const playerEmail = playerRes.data?.user?.email;
    const mentorName  = mentorProfile?.name ?? "Mentor";
    const playerName  = playerProfile?.name ?? "Athlete";

    const dashboardUrl = `${BASE_URL}/dashboard`;

    const emails = [
      mentorEmail ? {
        to: mentorEmail,
        subject: `Say hi to ${playerName} — they're waiting to hear from you`,
        html: `<p>Hi ${mentorName.split(" ")[0]},</p>
<p>You were matched with <strong>${playerName}</strong> on Mentality Sports yesterday, but neither of you has sent a message yet.</p>
<p>A quick intro goes a long way — even just "Hey, excited to connect!" is a great start.</p>
<p><a href="${dashboardUrl}">Send your first message →</a></p>
<p>— The Mentality Sports Team</p>`,
      } : null,
      playerEmail ? {
        to: playerEmail,
        subject: `Your mentor ${mentorName.split(" ")[0]} is waiting — say hi`,
        html: `<p>Hi ${playerName.split(" ")[0]},</p>
<p>You were matched with your mentor <strong>${mentorName}</strong> yesterday — but the conversation hasn't started yet.</p>
<p>All it takes is one message to get going. Your mentor is there for you.</p>
<p><a href="${dashboardUrl}">Start the conversation →</a></p>
<p>— The Mentality Sports Team</p>`,
      } : null,
    ].filter(Boolean) as { to: string; subject: string; html: string }[];

    await Promise.all(
      emails.map(({ to, subject, html }) =>
        resend.emails.send({ from: FROM, to, subject, html })
      )
    );

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
