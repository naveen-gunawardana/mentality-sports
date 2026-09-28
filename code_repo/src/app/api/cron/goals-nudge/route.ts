import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import type { Database } from "@/lib/supabase/types";
import { EMAIL_FROM as FROM, BASE_URL } from "@/lib/email";

// Weekly cron job (run Thursday mornings).
// Finds active matches where neither party has set weekly goals yet
// and sends a reminder to both mentor and player.
// Schedule in vercel.json: "0 12 * * 4" (noon UTC every Thursday)

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // shift to Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0]; // YYYY-MM-DD
}

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
  const weekStart = getWeekStart();

  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select("id, mentor_id, player_id")
    .eq("status", "active");

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }
  if (!matches || matches.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Find which matches already have goals set for this week
  const { data: existingGoals } = await admin
    .from("weekly_goals")
    .select("match_id")
    .eq("week_start", weekStart)
    .in("match_id", matches.map(m => m.id));

  const matchesWithGoals = new Set((existingGoals ?? []).map(g => g.match_id));
  const needsNudge = matches.filter(m => !matchesWithGoals.has(m.id));

  if (needsNudge.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  for (const match of needsNudge) {
    const [{ data: mentorProfile }, { data: playerProfile }, mentorRes, playerRes] = await Promise.all([
      admin.from("profiles").select("name").eq("id", match.mentor_id).single(),
      admin.from("profiles").select("name").eq("id", match.player_id).single(),
      admin.auth.admin.getUserById(match.mentor_id),
      admin.auth.admin.getUserById(match.player_id),
    ]);

    const mentorEmail = mentorRes.data?.user?.email;
    const playerEmail = playerRes.data?.user?.email;

    type Recipient = { to: string; name: string; role: "mentor" | "player" };
    const recipients: Recipient[] = [
      mentorEmail && mentorProfile ? { to: mentorEmail, name: mentorProfile.name, role: "mentor" } : null,
      playerEmail && playerProfile ? { to: playerEmail, name: playerProfile.name, role: "player" } : null,
    ].filter((r): r is Recipient => r !== null);

    if (recipients.length === 0) continue;

    await Promise.all(
      recipients.map(({ to, name, role }) =>
        resend.emails.send({
          from: FROM,
          to,
          subject: "Set your mental goals for this week",
          html: `<p>Hi ${name},</p>
<p>${
  role === "mentor"
    ? "Don't forget to set this week's mental goals with your athlete — it only takes a minute."
    : "Don't forget to set your mental goals for this week. Effort, attitude, focus — just a quick check-in with yourself."
}</p>
<p>Head to your <a href="${BASE_URL}/dashboard">Locker Room</a> and tap <strong>Weekly Goals</strong> to fill them in.</p>
<p>— The Mentality Sports Team</p>`,
        })
      )
    );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
