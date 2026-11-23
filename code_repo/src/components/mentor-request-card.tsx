"use client";

import { useState } from "react";
import { CheckCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MENTAL_CHALLENGES } from "@/lib/athlete-options";

interface Props {
  playerId: string;
  initialChallenges: string[] | null;
  initialGoal: string | null;
}

/**
 * Mentors are an add-on, not the front door. This card is honest about the
 * wait and collects what the team needs to make a good match.
 */
export function MentorRequestCard({ playerId, initialChallenges, initialGoal }: Props) {
  const alreadyRequested = !!initialChallenges?.length;
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>((initialChallenges ?? []).filter((c) => MENTAL_CHALLENGES.includes(c)));
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(alreadyRequested);
  const [error, setError] = useState("");

  function toggle(c: string) {
    setPicked((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : prev.length >= 3 ? prev : [...prev, c]));
  }

  async function submit() {
    setSaving(true);
    setError("");
    const { error } = await createClient()
      .from("player_profiles")
      .update({ challenges: picked, goal: goal.trim() || null })
      .eq("id", playerId);
    setSaving(false);
    if (error) return setError("That didn't save. Try again in a moment.");
    setSaved(true);
    setEditing(false);
  }

  if (saved && !editing) {
    return (
      <section className="rounded-lg border border-sage-300 bg-sage-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-navy">
          <CheckCircle className="h-4 w-4 text-sage-600" /> You&apos;re on the mentor list
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mentors are volunteers, so matches happen as spots open up, and it can take a few weeks. We&apos;ll email you the
          moment you&apos;re matched. Until then, your reps count: when you get a mentor, you can share them so they know
          where you&apos;re at.
        </p>
        <button onClick={() => setEditing(true)} className="mt-3 text-xs font-semibold text-navy underline underline-offset-2">
          Edit what I asked for
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-offWhite-300 bg-white p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-navy/50">
        <Users className="h-3.5 w-3.5" /> Optional
      </p>
      <h2 className="mt-1 text-xl font-bold text-navy">Want a mentor too?</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        A current or former athlete you can message and call. Pick up to three things you&apos;d want help with.
      </p>
      <div className="flex flex-wrap gap-2">
        {MENTAL_CHALLENGES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            aria-pressed={picked.includes(c)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              picked.includes(c) ? "border-navy bg-navy text-white" : "border-offWhite-300 text-navy hover:border-navy/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Anything else? (optional) e.g. I play great in practice and freeze in games"
        className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <button
        onClick={submit}
        disabled={saving || picked.length === 0}
        className="mt-3 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40"
      >
        {saving ? "Saving…" : "Request a mentor"}
      </button>
    </section>
  );
}
