"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SPORTS } from "@/lib/athlete-options";
import { teamJoinUrl } from "@/lib/teams";

interface Team { id: string; name: string; sport: string | null; code: string; created_at: string }
interface Week { week: string; reps: number; athletes: number; avg_confidence: number | null }
interface TeamView extends Team { members: number; weeks: Week[] }

export default function CoachDashboard() {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState<TeamView[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    setName(profile?.name?.split(" ")[0] ?? "Coach");
    const { data: rows } = await supabase
      .from("teams").select("id, name, sport, code, created_at").eq("coach_id", user.id).order("created_at");
    const views = await Promise.all(
      (rows ?? []).map(async (t) => {
        const [{ count }, { data: weeks }] = await Promise.all([
          supabase.from("team_members").select("player_id", { count: "exact", head: true }).eq("team_id", t.id),
          supabase.rpc("team_rep_summary", { p_team: t.id }),
        ]);
        return { ...t, members: count ?? 0, weeks: (weeks ?? []) as Week[] };
      }),
    );
    setTeams(views);
    if (!views.length) setShowForm(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const { error } = await createClient().rpc("create_team", { p_name: teamName, p_sport: sport || null });
    setCreating(false);
    if (error) return setError("Couldn't create the team. Names need at least 2 characters.");
    setTeamName("");
    setSport("");
    setShowForm(false);
    load();
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (!teams) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">Loading your teams…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-orange-500">Coach</p>
          <h1 className="text-3xl font-bold text-navy">Hey {name}.</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Your athletes do 2-minute Game Day routines before and after games. You see team totals and how confident the
            team feels. Never anyone&apos;s private answers.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-2 text-sm font-semibold text-navy hover:bg-offWhite">
            <Plus className="h-4 w-4" /> New team
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createTeam} className="mb-8 rounded-lg border border-offWhite-300 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-navy">Create a team</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              value={teamName} onChange={(e) => setTeamName(e.target.value)} required minLength={2} maxLength={80}
              placeholder="e.g. UHS Freshman Boys"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select value={sport} onChange={(e) => setSport(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Sport (optional)</option>
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button disabled={creating} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </form>
      )}

      <div className="space-y-6">
        {teams.map((t) => {
          const url = teamJoinUrl(t.code, typeof window !== "undefined" ? window.location.origin : undefined);
          const thisWeek = t.weeks.find((w) => w.week === currentWeekStart());
          const shareText = `Join ${t.name} on Mentality Sports: free 2-minute Game Day routines before and after games. Your answers stay private. ${url}`;
          return (
            <section key={t.id} className="rounded-lg border border-offWhite-300 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">{t.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    {t.members} athlete{t.members === 1 ? "" : "s"} joined{t.sport ? ` · ${t.sport}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-navy/40">Join code</p>
                  <p className="font-mono text-2xl font-black text-orange-500">{t.code}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => copy(url, t.id + "url")} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white">
                  {copied === t.id + "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy join link
                </button>
                <button onClick={() => copy(shareText, t.id + "msg")} className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-2 text-sm font-semibold text-navy hover:bg-offWhite">
                  {copied === t.id + "msg" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy message for team chat
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Routines this week" value={thisWeek ? String(thisWeek.reps) : "0"} />
                <Stat label="Athletes active this week" value={thisWeek ? `${thisWeek.athletes}/${t.members}` : `0/${t.members}`} />
                <Stat
                  label="Team confidence"
                  value={thisWeek?.avg_confidence != null ? `${thisWeek.avg_confidence}/10` : "—"}
                  note={thisWeek && thisWeek.avg_confidence == null ? "Shows once 3+ athletes log routines in a week" : undefined}
                />
              </div>

              {t.weeks.length > 1 && (
                <table className="mt-6 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-navy/40">
                      <th className="py-1 font-semibold">Week of</th><th className="font-semibold">Routines</th><th className="font-semibold">Athletes</th><th className="font-semibold">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...t.weeks].reverse().map((w) => (
                      <tr key={w.week} className="border-t border-offWhite-200 text-navy">
                        <td className="py-1.5">{new Date(w.week + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td>{w.reps}</td><td>{w.athletes}</td><td>{w.avg_confidence ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {t.members === 0 && (
                <p className="mt-6 rounded-md bg-offWhite p-4 text-sm text-muted-foreground">
                  Next step: drop the join link in your team chat and ask everyone to do the{" "}
                  <Link href="/game-day/pregame" className="font-semibold text-navy underline">Pre-Game Reset</Link> before your next game.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md bg-offWhite p-4">
      <p className="text-2xl font-bold text-navy tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {note && <p className="mt-1 text-[11px] text-navy/40">{note}</p>}
    </div>
  );
}

/** Monday of the current week as YYYY-MM-DD, matching Postgres date_trunc('week'). */
function currentWeekStart() {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
