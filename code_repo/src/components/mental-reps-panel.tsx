"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfidenceTrend } from "@/components/confidence-trend";
import {
  REPS,
  REPS_BY_KEY,
  PENDING_REP_KEY,
  confidenceOf,
  encodeRep,
  isRepKey,
  repFromTitle,
  repStreak,
  type PendingRep,
} from "@/lib/reps";

interface RepRow { id: string; title: string | null; mood: string | null; content: string; created_at: string | null }

/**
 * The athlete's self-serve home: streak, confidence trend, and one-tap reps.
 * Works the same whether or not they have a mentor yet.
 */
export function MentalRepsPanel({ playerId, compact = false }: { playerId: string; compact?: boolean }) {
  const [rows, setRows] = useState<RepRow[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Save a rep finished before signup, then clear it.
      try {
        const raw = localStorage.getItem(PENDING_REP_KEY);
        if (raw) {
          localStorage.removeItem(PENDING_REP_KEY);
          const pending = JSON.parse(raw) as PendingRep;
          if (isRepKey(pending?.key) && pending.answers && typeof pending.answers === "object") {
            await supabase.from("reflections").insert({
              player_id: playerId,
              shared_with_mentor: false,
              created_at: pending.finishedAt,
              ...encodeRep(REPS_BY_KEY[pending.key], pending.answers),
            });
          }
        }
      } catch {}

      const { data } = await supabase
        .from("reflections")
        .select("id, title, mood, content, created_at")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })
        .limit(60);
      setRows((data ?? []).filter((r) => repFromTitle(r.title)));
    })();
  }, [playerId]);

  const streak = rows ? repStreak(rows.map((r) => r.created_at)) : 0;
  const scores = (rows ?? []).map((r) => confidenceOf(r.mood)).filter((n): n is number => n !== null).slice(0, 12).reverse();

  return (
    <section className="rounded-lg border border-offWhite-300 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-500">Mental Reps</p>
          <h2 className="mt-1 text-xl font-bold text-navy">{rows && rows.length ? "Keep stacking reps" : "Start your first rep"}</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-600" title="Days in a row with a rep">
          <Flame className="h-4 w-4" /> {streak}
        </div>
      </div>

      <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
        {REPS.map((rep) => (
          <Link
            key={rep.key}
            href={`/reps/${rep.key}`}
            className="group flex items-center justify-between rounded-md border border-offWhite-300 px-4 py-3 hover:border-orange-400 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-navy">{rep.title}</p>
              <p className="text-xs text-muted-foreground">{rep.minutes} min · {rep.when.toLowerCase()}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-navy/30 group-hover:text-orange-500" />
          </Link>
        ))}
      </div>

      {rows && rows.length > 0 && (
        <div className={`mt-6 grid gap-6 ${compact ? "" : "sm:grid-cols-2"}`}>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/40">Confidence</p>
            <ConfidenceTrend scores={scores} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/40">Recent</p>
            <ul className="space-y-1.5">
              {rows.slice(0, 3).map((r) => (
                <li key={r.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-navy">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    {confidenceOf(r.mood) ? ` · ${r.mood}/10` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
