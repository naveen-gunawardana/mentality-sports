"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PENDING_TEAM_KEY, friendlyTeamError, isTeamCode, normalizeTeamCode } from "@/lib/teams";

type State = { kind: "loading" } | { kind: "guest" } | { kind: "joined"; team: string } | { kind: "error"; message: string };

export default function JoinTeamPage({ params }: { params: { code: string } }) {
  const code = normalizeTeamCode(params.code);
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!isTeamCode(code)) return setState({ kind: "error", message: "That link doesn't have a valid team code." });
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try { localStorage.setItem(PENDING_TEAM_KEY, code); } catch {}
        return setState({ kind: "guest" });
      }
      const { data, error } = await supabase.rpc("join_team", { p_code: code });
      if (error || !data?.[0]) return setState({ kind: "error", message: friendlyTeamError(error?.message) });
      setState({ kind: "joined", team: data[0].team_name });
      setTimeout(() => router.push("/dashboard"), 1800);
    })();
  }, [code, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
        <Users className="h-6 w-6 text-orange-500" />
      </div>
      {state.kind === "loading" && <p className="text-muted-foreground">Joining team {code}…</p>}
      {state.kind === "joined" && (
        <>
          <h1 className="mb-2 text-2xl font-bold text-navy">You&apos;re on {state.team}.</h1>
          <p className="text-muted-foreground">Taking you to your Locker Room…</p>
        </>
      )}
      {state.kind === "error" && (
        <>
          <h1 className="mb-2 text-2xl font-bold text-navy">Hmm.</h1>
          <p className="mb-6 text-muted-foreground">{state.message}</p>
          <Link href="/dashboard" className="font-semibold text-navy underline">Go to my Locker Room</Link>
        </>
      )}
      {state.kind === "guest" && (
        <>
          <p className="mb-2 text-xs font-bold text-orange-500">Team code {code}</p>
          <h1 className="mb-3 text-2xl font-bold text-navy">Your coach added you to Mentality Sports.</h1>
          <p className="mb-8 text-muted-foreground">
            Free 2-minute Game Day routines before and after games. Your answers stay private. Your coach only sees
            team-wide numbers.
          </p>
          <Link href="/signup?role=player&from=team" className="block rounded-md bg-orange-500 px-4 py-3 font-bold text-white hover:bg-orange-400">
            Create my account
          </Link>
          <Link href="/signin?redirect=/dashboard" className="mt-3 block text-sm text-muted-foreground hover:text-navy">
            I already have an account
          </Link>
        </>
      )}
    </div>
  );
}
