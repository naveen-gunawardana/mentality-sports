"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Flame, Lock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RepRunner } from "@/components/rep-runner";
import {
  REPS_BY_KEY,
  PENDING_REP_KEY,
  encodeRep,
  repStreak,
  type PendingRep,
  type RepKey,
} from "@/lib/reps";

type Viewer = { kind: "loading" } | { kind: "guest" } | { kind: "player"; id: string; matched: boolean } | { kind: "other" };

type Finish =
  | { state: "saving" }
  | { state: "saved"; reflectionId: string; streak: number; shared: boolean }
  | { state: "guest" }
  | { state: "error"; message: string };

export function RepSession({ repKey }: { repKey: RepKey }) {
  const rep = REPS_BY_KEY[repKey];
  const router = useRouter();
  const [viewer, setViewer] = useState<Viewer>({ kind: "loading" });
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  const [finish, setFinish] = useState<Finish | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setViewer({ kind: "guest" });
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "player") return setViewer({ kind: "other" });
      const { data: match } = await supabase
        .from("matches").select("id").eq("player_id", user.id).eq("status", "active").maybeSingle();
      setViewer({ kind: "player", id: user.id, matched: !!match });
    })();
  }, []);

  async function complete(a: Record<string, string>) {
    setAnswers(a);
    if (viewer.kind !== "player") {
      if (viewer.kind === "guest" || viewer.kind === "loading") {
        const pending: PendingRep = { key: repKey, answers: a, finishedAt: new Date().toISOString() };
        try { localStorage.setItem(PENDING_REP_KEY, JSON.stringify(pending)); } catch {}
      }
      setFinish({ state: "guest" });
      return;
    }
    setFinish({ state: "saving" });
    const supabase = createClient();
    const shared = viewer.matched;
    const { data, error } = await supabase
      .from("reflections")
      .insert({ player_id: viewer.id, shared_with_mentor: shared, ...encodeRep(rep, a) })
      .select("id")
      .single();
    if (error || !data) {
      setFinish({ state: "error", message: "We couldn't save that. Check your connection and try again." });
      return;
    }
    const { data: recent } = await supabase
      .from("reflections").select("created_at").eq("player_id", viewer.id)
      .order("created_at", { ascending: false }).limit(60);
    setFinish({ state: "saved", reflectionId: data.id, streak: repStreak((recent ?? []).map((r) => r.created_at)), shared });
  }

  async function toggleShare() {
    if (finish?.state !== "saved") return;
    const next = !finish.shared;
    setFinish({ ...finish, shared: next });
    await createClient().from("reflections").update({ shared_with_mentor: next }).eq("id", finish.reflectionId);
  }

  if (!answers || !finish) {
    return <RepRunner rep={rep} onComplete={complete} onExit={() => router.push(viewer.kind === "player" ? "/dashboard" : "/game-day")} />;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-6">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-600">
          <CheckCircle className="h-4 w-4" /> {rep.title} done
        </p>
        <p className="text-xl font-bold leading-snug text-navy">{rep.takeaway(answers)}</p>
      </div>

      {finish.state === "saving" && <p className="mt-6 text-sm text-muted-foreground">Saving…</p>}
      {finish.state === "error" && (
        <div className="mt-6">
          <p className="text-sm text-red-500">{finish.message}</p>
          <button onClick={() => complete(answers)} className="mt-2 text-sm font-semibold text-navy underline">Try again</button>
        </div>
      )}

      {finish.state === "saved" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-offWhite-300 p-4">
            <Flame className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-bold text-navy">{finish.streak}-day streak</p>
              <p className="text-xs text-muted-foreground">Saved to your Locker Room. Come back after your next game.</p>
            </div>
          </div>
          {viewer.kind === "player" && viewer.matched && (
            <button onClick={toggleShare} className="flex w-full items-center gap-3 rounded-lg border border-offWhite-300 p-4 text-left hover:bg-offWhite">
              {finish.shared ? <Users className="h-5 w-5 text-sage-600" /> : <Lock className="h-5 w-5 text-navy/40" />}
              <span className="text-sm text-navy">
                {finish.shared ? "Shared with your mentor. Tap to make it private." : "Private to you. Tap to share with your mentor."}
              </span>
            </button>
          )}
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1 rounded-md bg-navy px-4 py-3 text-center text-sm font-semibold text-white hover:bg-navy/90">
              Go to Locker Room
            </Link>
            <Link href="/game-day" className="flex-1 rounded-md border border-offWhite-300 px-4 py-3 text-center text-sm font-semibold text-navy hover:bg-offWhite">
              Another routine
            </Link>
          </div>
        </div>
      )}

      {finish.state === "guest" && viewer.kind !== "other" && (
        <div className="mt-6 rounded-lg border border-offWhite-300 p-6">
          <p className="mb-1 text-lg font-bold text-navy">Save this.</p>
          <p className="mb-5 text-sm text-muted-foreground">
            Make a free account and we&apos;ll save it, track your confidence game to game, and keep your streak going.
            You can also ask for a mentor who played your sport.
          </p>
          <Link href="/signup?role=player&from=gameday" className="block rounded-md bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white hover:bg-orange-400">
            Save it, free
          </Link>
          <Link href="/game-day" className="mt-3 block text-center text-sm text-muted-foreground hover:text-navy">
            Not now
          </Link>
        </div>
      )}

      {finish.state === "guest" && viewer.kind === "other" && (
        <Link href="/game-day" className="mt-6 block text-center text-sm font-semibold text-navy">Back to Game Day</Link>
      )}
    </div>
  );
}
