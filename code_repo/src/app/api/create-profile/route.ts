import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { getResend } from "@/lib/resend";
import { escapeHtml as esc } from "@/lib/email-html";
import { EMAIL_FROM, BASE_URL } from "@/lib/email";

const TEAM_INBOX = "officialmentalitysports@gmail.com";

const admin = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// Signup creates the profile before the email is confirmed, so there's no
// session yet. A brand-new auth user is accepted on that basis; anyone else
// must be signed in as the user they're creating a profile for.
const NEW_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const strList = (v: unknown) =>
  Array.isArray(v) && v.length > 0 ? v.filter((x): x is string => typeof x === "string") : null;
const int = (v: unknown) => (Number.isInteger(v) ? (v as number) : null);

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, name, role, sport, playerProfile, mentorProfile } = body;

  if (!userId || !str(name) || (role !== "player" && role !== "mentor")) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = admin();

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authUser?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isNewAccount = Date.now() - new Date(authUser.user.created_at).getTime() < NEW_ACCOUNT_WINDOW_MS;
  if (!isNewAccount) {
    const session = await createSessionClient();
    const { data: { user } } = await session.auth.getUser();
    if (user?.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    name: str(name)!,
    role,
    sport: strList(sport),
  });

  if (profileError) {
    // 23505 = unique violation — the profile already exists, so don't let a
    // repeat call overwrite the role-specific details either.
    if (profileError.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Explicit field lists: never spread client input into these rows (e.g. a
  // client-supplied `approved: true` would self-approve a mentor).
  if (role === "player") {
    const p = playerProfile ?? {};
    await supabase.from("player_profiles").insert({
      id: userId,
      age: int(p.age),
      school: str(p.school),
      grade: str(p.grade),
      level: strList(p.level),
      location: str(p.location),
      challenges: strList(p.challenges),
      goal: str(p.goal),
      availability: str(p.availability),
      parent_name: str(p.parent_name),
      parent_email: str(p.parent_email),
      parent_phone: str(p.parent_phone),
    });
  } else {
    const m = mentorProfile ?? {};
    await supabase.from("mentor_profiles").insert({
      id: userId,
      playing_level: strList(m.playing_level),
      institution: str(m.institution),
      location: str(m.location),
      years_played: int(m.years_played),
      skills: strList(m.skills),
      why: str(m.why),
      bio: str(m.bio),
      mentee_age_pref: str(m.mentee_age_pref),
      availability: str(m.availability),
      approved: false,
    });
  }

  // Tell the team right away — matching is manual, so a signup nobody sees is
  // a signup that waits forever.
  const resend = getResend();
  if (resend) {
    const p = playerProfile ?? {};
    const details = [
      strList(sport)?.join(", "),
      role === "player" ? str(p.grade) : null,
      role === "player" && str(p.parent_email) ? `parent: ${str(p.parent_email)}` : null,
    ].filter(Boolean).join(" · ");
    await resend.emails
      .send({
        from: EMAIL_FROM,
        to: TEAM_INBOX,
        subject: `New ${role === "player" ? "athlete" : "mentor"}: ${str(name)}`,
        html: `<p><strong>${esc(str(name)!)}</strong> (${authUser.user.email ?? "no email"}) just signed up as ${role === "player" ? "an athlete" : "a mentor"}.</p>
${details ? `<p>${esc(details)}</p>` : ""}
<p><a href="${BASE_URL}/admin">${role === "player" ? "Match them" : "Review them"} in the admin dashboard →</a></p>`,
      })
      .catch((err) => console.error("signup alert failed:", err));
  }

  return NextResponse.json({ ok: true });
}
