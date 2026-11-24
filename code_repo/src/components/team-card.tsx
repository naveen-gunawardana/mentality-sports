"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PENDING_TEAM_KEY, friendlyTeamError, isTeamCode, normalizeTeamCode } from "@/lib/teams";

interface Team { id: string; name: string; sport: string | null }

/** Athlete side of teams: redeem a pending code, show teams, join by code. */
export function TeamCard({ playerId }: { playerId: string }) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: rows } = await supabase.from("team_members").select("team_id").eq("player_id", playerId);
    const ids = (rows ?? []).map((r) => r.team_id);
    if (!ids.length) return setTeams([]);
    const { data } = await supabase.from("teams").select("id, name, sport").in("id", ids);
    setTeams(data ?? []);
  }

  async function join(raw: string) {
    const c = normalizeTeamCode(raw);
    if (!isTeamCode(c)) return setMessage("Team codes are 6 letters and numbers.");
    setJoining(true);
    setMessage("");
    const { data, error } = await createClient().rpc("join_team", { p_code: c });
    setJoining(false);
    if (error || !data?.[0]) return setMessage(friendlyTeamError(error?.message));
    setCode("");
    setMessage(`You're on ${data[0].team_name}.`);
    load();
  }

  useEffect(() => {
    let pending: string | null = null;
    try {
      pending = localStorage.getItem(PENDING_TEAM_KEY);
      if (pending) localStorage.removeItem(PENDING_TEAM_KEY);
    } catch {}
    if (pending) join(pending);
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  if (teams === null) return null;

  return (
    <section className="rounded-lg border border-offWhite-300 bg-white p-5">
      <p className="flex items-center gap-2 text-xs font-bold text-navy/50">
        <Users className="h-3.5 w-3.5" /> {teams.length ? "Your team" : "On a team?"}
      </p>
      {teams.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {teams.map((t) => (
            <li key={t.id} className="text-base font-semibold text-navy">
              {t.name}
              {t.sport && <span className="ml-2 text-xs font-normal text-muted-foreground">{t.sport}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">If your coach gave you a team code, enter it here.</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Your coach only sees team totals, like how many routines the team did. Never your answers.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          join(code);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(normalizeTeamCode(e.target.value))}
          placeholder={teams.length ? "Join another team" : "Team code"}
          aria-label="Team code"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button disabled={joining || code.length !== 6} className="rounded-md bg-navy px-4 text-sm font-semibold text-white disabled:opacity-40">
          {joining ? "…" : "Join"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-navy">{message}</p>}
    </section>
  );
}
