"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Send } from "lucide-react";
import { pickMenteePrompts } from "@/lib/conversation-prompts";

interface Props {
  matchId: string;
  currentUserId: string;
  role: "mentor" | "mentee";
  myFirstName: string;
  otherFirstName: string;
  mySport?: string | null;
  myLevel?: string | null;
  menteeChallenges?: string[] | null;
  onSent: () => void;
  onSkip: () => void;
}

const flagKey = (matchId: string) => `icebreaker_seen_${matchId}`;

export function IcebreakerOverlay({
  matchId,
  currentUserId,
  role,
  myFirstName,
  otherFirstName,
  mySport,
  myLevel,
  menteeChallenges,
  onSent,
  onSkip,
}: Props) {
  const defaultMentorDraft = `Hey ${otherFirstName} — ${myFirstName} here.${mySport ? ` Played ${mySport}` : ""}${myLevel ? ` at ${myLevel}.` : "."} Glad we got matched. How's your season been going so far?`;
  const [draft, setDraft] = useState(role === "mentor" ? defaultMentorDraft : "");
  const [sending, setSending] = useState(false);
  const [chips, setChips] = useState<string[]>([]);

  useEffect(() => {
    if (role === "mentee") setChips(pickMenteePrompts(menteeChallenges, 3));
  }, [role, menteeChallenges]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: currentUserId,
      content,
    });
    if (!error) {
      try {
        localStorage.setItem(`icebreaker_sent_${matchId}`, "1");
        localStorage.setItem(flagKey(matchId), "1");
      } catch {}
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new_message", matchId, senderId: currentUserId }),
      }).catch(() => {});
      onSent();
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 ring-1 ring-white/10">
        <button
          type="button"
          onClick={() => { try { localStorage.setItem(flagKey(matchId), "1"); } catch {} onSkip(); }}
          aria-label="Close"
          className="absolute top-3 right-3 text-navy/30 hover:text-navy/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500 mb-2">
          {role === "mentor" ? "Say hi" : "Send your first message"}
        </p>
        <h2 className="text-2xl font-bold text-navy leading-tight">
          {role === "mentor" ? `Drop ${otherFirstName} a line` : `Message ${otherFirstName}`}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {role === "mentor"
            ? "Quick hello, who you are, what you played. That's it."
            : "Tell them what's been on your mind. Or pick something below to start."}
        </p>

        {role === "mentee" && chips.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">Or start with one of these</p>
            <div className="flex flex-col gap-1.5">
              {chips.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDraft(p)}
                  className="text-left text-[13px] rounded-xl ring-1 ring-offWhite-300 bg-offWhite/40 hover:bg-white hover:ring-navy/25 px-3.5 py-2.5 text-navy/80 transition-all leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          rows={4}
          placeholder={role === "mentee" ? `Message ${otherFirstName}…` : ""}
          className="mt-5 w-full rounded-xl ring-1 ring-offWhite-300 bg-offWhite/30 focus:bg-white focus:ring-navy/30 px-4 py-3 text-[14px] outline-none resize-none placeholder:text-navy/35 text-navy leading-relaxed transition-all"
        />

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { try { localStorage.setItem(flagKey(matchId), "1"); } catch {} onSkip(); }}
            className="text-[13px] font-medium text-navy/50 hover:text-navy transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 text-[13px] font-bold rounded-xl hover:bg-navy/85 disabled:opacity-30 transition-all active:scale-95"
          >
            {role === "mentor" ? "Send" : "Send message"}
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
