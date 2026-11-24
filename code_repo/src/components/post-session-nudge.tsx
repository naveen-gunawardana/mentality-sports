"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { followUpPromptForTopics } from "@/lib/conversation-prompts";

interface Props {
  sessionId: string;
  topics: string[];
  role: "mentor" | "mentee";
  onPick: (text: string) => void;
}

export function PostSessionNudge({ sessionId, topics, role, onPick }: Props) {
  const storageKey = `nudge_dismissed_${sessionId}`;
  const [dismissed, setDismissed] = useState(true);
  const [followUp, setFollowUp] = useState<string | null>(null);

  useEffect(() => {
    let shouldShow = true;
    try { shouldShow = localStorage.getItem(storageKey) !== "1"; } catch {}
    setDismissed(!shouldShow);
    if (shouldShow) {
      setFollowUp(followUpPromptForTopics(topics, role));
    }
  }, [storageKey, topics, role]);

  if (dismissed || !followUp) return null;

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(storageKey, "1"); } catch {}
  }

  const summary = topics.slice(0, 2).join(" · ");

  return (
    <div className="px-5 pt-3 shrink-0">
      <div className="flex items-start gap-2.5 rounded-xl bg-orange-50/60 ring-1 ring-orange-200 px-3.5 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500 shrink-0 mt-0.5">
          <Lightbulb className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/50">
            Last session: {summary}
          </p>
          <button
            type="button"
            onClick={() => { onPick(followUp); dismiss(); }}
            className="text-left text-[13px] text-navy mt-0.5 hover:text-orange-600 transition-colors leading-snug"
          >
            {followUp}
          </button>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-navy/30 hover:text-navy/70 transition-colors shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
