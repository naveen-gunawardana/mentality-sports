"use client";

import { useEffect, useState } from "react";
import { Lightbulb, EyeOff } from "lucide-react";
import { pickMenteePrompts, pickMentorPrompts } from "@/lib/conversation-prompts";

interface Props {
  userId: string;
  role: "mentor" | "mentee";
  challenges?: string[] | null;
  rotateKey: number;
  onPick: (text: string) => void;
}

export function StarterChips({ userId, role, challenges, rotateKey, onPick }: Props) {
  const storageKey = `starters_hidden_${userId}`;
  const [hidden, setHidden] = useState(false);
  const [chips, setChips] = useState<string[]>([]);

  useEffect(() => {
    try { setHidden(localStorage.getItem(storageKey) === "1"); } catch {}
  }, [storageKey]);

  useEffect(() => {
    setChips(role === "mentee" ? pickMenteePrompts(challenges, 3) : pickMentorPrompts(3));
  }, [role, challenges, rotateKey]);

  function hide() {
    setHidden(true);
    try { localStorage.setItem(storageKey, "1"); } catch {}
  }

  function show() {
    setHidden(false);
    try { localStorage.removeItem(storageKey); } catch {}
  }

  if (hidden) {
    return (
      <div className="px-5 pb-2 shrink-0">
        <button
          type="button"
          onClick={show}
          className="inline-flex items-center gap-1.5 text-[12px] text-navy/50 hover:text-navy transition-colors font-medium"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Show suggestions
        </button>
      </div>
    );
  }

  if (chips.length === 0) return null;

  return (
    <div className="px-5 pt-3 pb-2 shrink-0 bg-gradient-to-b from-transparent to-white">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45 flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-orange-500" />
          Start with…
        </p>
        <button
          type="button"
          onClick={hide}
          aria-label="Hide suggestions"
          className="text-navy/30 hover:text-navy/70 transition-colors"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {chips.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(c)}
            className="shrink-0 max-w-[280px] truncate rounded-full ring-1 ring-offWhite-300 bg-white hover:ring-navy/25 hover:bg-offWhite/30 px-4 py-2 text-[12px] text-navy/75 transition-all font-medium shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            title={c}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
