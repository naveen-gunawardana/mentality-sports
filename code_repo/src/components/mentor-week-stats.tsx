"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, CalendarClock, Clock } from "lucide-react";

interface Props {
  matchId: string;
  mentorUserId: string;
}

interface Stats {
  messages: number;
  calls: number;
  minutes: number;
}

function startOfWeek(d = new Date()): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // Monday as start
  out.setDate(out.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function MentorWeekStats({ matchId, mentorUserId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const weekStart = startOfWeek().toISOString();
      const weekStartDate = startOfWeek().toISOString().slice(0, 10);

      const [msgRes, callRes, hoursRes] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", matchId)
          .eq("sender_id", mentorUserId)
          .gte("created_at", weekStart),
        supabase
          .from("scheduled_calls")
          .select("id", { count: "exact", head: true })
          .eq("match_id", matchId)
          .gte("scheduled_at", new Date().toISOString()),
        supabase
          .from("service_hours")
          .select("minutes")
          .eq("match_id", matchId)
          .eq("mentor_id", mentorUserId)
          .gte("date", weekStartDate),
      ]);

      if (cancelled) return;
      const minutes = (hoursRes.data ?? []).reduce((s, r: { minutes: number }) => s + r.minutes, 0);
      setStats({
        messages: msgRes.count ?? 0,
        calls: callRes.count ?? 0,
        minutes,
      });
    })();
    return () => { cancelled = true; };
  }, [matchId, mentorUserId]);

  if (!stats) {
    return (
      <div className="rounded-2xl bg-navy text-white p-4 ring-1 ring-navy">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">This week</p>
        <p className="text-white/60 text-xs mt-2">Loading…</p>
      </div>
    );
  }

  const hrs = Math.floor(stats.minutes / 60);
  const rem = stats.minutes % 60;
  const hoursLabel = stats.minutes === 0 ? "0h" : hrs > 0 ? `${hrs}h${rem > 0 ? ` ${rem}m` : ""}` : `${rem}m`;

  return (
    <div className="rounded-2xl bg-navy text-white p-4 ring-1 ring-navy shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-px w-4 bg-orange-400" />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">This week</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<MessageCircle className="h-3.5 w-3.5" />} value={stats.messages} label={stats.messages === 1 ? "message" : "messages"} />
        <Stat icon={<CalendarClock className="h-3.5 w-3.5" />} value={stats.calls} label={stats.calls === 1 ? "call" : "calls"} />
        <Stat icon={<Clock className="h-3.5 w-3.5" />} valueLabel={hoursLabel} label="logged" />
      </div>
    </div>
  );
}

function Stat({ icon, value, valueLabel, label }: { icon: React.ReactNode; value?: number; valueLabel?: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-white/50 mb-1">{icon}</div>
      <p className="text-xl font-bold tracking-tight tabular-nums leading-none">
        {valueLabel ?? value}
      </p>
      <p className="text-[10px] text-white/45 mt-1 uppercase tracking-[0.14em] font-semibold">{label}</p>
    </div>
  );
}
