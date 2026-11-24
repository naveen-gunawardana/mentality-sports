import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;
  if (!role || !["admin", "outreach", "operations"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const routineTitles = ["Pre-Game Reset", "Post-Game Debrief", "Bad Day Reset"];
  const [profilesRes, matchesRes, sessionsRes, articlesRes, routinesWeekRes, routinesAllRes, teamsRes, membersRes] = await Promise.all([
    admin.from("profiles").select(`
      id, name, role, sport, created_at,
      player_profiles(age, school, grade, level, location, challenges, goal, availability, parent_name, parent_email, parent_phone),
      mentor_profiles(institution, playing_level, location, years_played, skills, why, bio, mentee_age_pref, availability, approved)
    `).order("created_at", { ascending: false }),
    admin.from("matches").select("id, status, created_at, meeting_url, player:player_id(id, name, role, sport, created_at), mentor:mentor_id(id, name, role, sport, created_at)").order("created_at", { ascending: false }),
    admin.from("sessions").select("id, flagged, flag_reason, match_id, date"),
    admin.from("resources").select("id, title, category, excerpt, content, submitted_by_name, created_at").eq("status", "pending").order("created_at", { ascending: true }),
    admin.from("reflections").select("player_id").in("title", routineTitles).gte("created_at", weekAgo),
    admin.from("reflections").select("id", { count: "exact", head: true }).in("title", routineTitles),
    admin.from("teams").select("id", { count: "exact", head: true }),
    admin.from("team_members").select("player_id", { count: "exact", head: true }),
  ]);

  const weekRows = routinesWeekRes.data ?? [];
  const gameDay = {
    routinesThisWeek: weekRows.length,
    athletesThisWeek: new Set(weekRows.map((r) => r.player_id)).size,
    routinesAllTime: routinesAllRes.count ?? 0,
    teams: teamsRes.count ?? 0,
    teamMembers: membersRes.count ?? 0,
  };

  return NextResponse.json({
    profiles: profilesRes.data ?? [],
    matches: matchesRes.data ?? [],
    sessions: sessionsRes.data ?? [],
    articles: articlesRes.data ?? [],
    gameDay,
  });
}
