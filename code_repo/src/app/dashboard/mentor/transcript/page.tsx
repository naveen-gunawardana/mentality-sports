"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Award, Printer, ArrowLeft } from "lucide-react";

interface Row {
  id: string;
  status: string | null;
  program_start: string | null;
  program_end: string | null;
  created_at: string | null;
  player: { name: string } | null;
  sessions: number;
}

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d.length <= 10 ? d + "T00:00:00" : d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MentorTranscriptPage() {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
      setName(profile?.name ?? "");

      const { data: matches } = await supabase
        .from("matches")
        .select("id, status, program_start, program_end, created_at, player:player_id(name)")
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: true });

      const list = (matches ?? []) as unknown as Row[];
      const withCounts: Row[] = [];
      for (const m of list) {
        const { count } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("match_id", m.id);
        withCounts.push({ ...m, sessions: count ?? 0 });
      }
      setRows(withCounts);
      setLoading(false);
    })();
  }, []);

  const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
  const completed = rows.filter((r) => r.status === "completed").length;
  const generated = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground text-sm">Loading transcript…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Controls (hidden when printing) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-navy/55 hover:text-navy transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Locker Room
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-sm bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
        >
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>

      {/* Document */}
      <div className="rounded-sm border border-offWhite-300 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 border-b border-offWhite-300 pb-5 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-navy text-orange-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">Mentality Sports</p>
            <h1 className="font-condensed text-2xl font-black uppercase tracking-tight text-navy leading-none">Mentorship Transcript</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-7 sm:grid-cols-4">
          <Stat label="Mentor" value={name || "—"} />
          <Stat label="Mentorships" value={String(rows.length)} />
          <Stat label="Completed" value={String(completed)} />
          <Stat label="Total sessions" value={String(totalSessions)} />
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-navy/50 py-8 text-center">No mentorships on record yet.</p>
        ) : (
          <div className="overflow-hidden rounded-sm border border-offWhite-300">
            <table className="w-full text-left text-sm">
              <thead className="bg-offWhite text-[10px] font-bold uppercase tracking-wider text-navy/45">
                <tr>
                  <th className="px-4 py-2.5">Athlete</th>
                  <th className="px-4 py-2.5">Started</th>
                  <th className="px-4 py-2.5">Sessions</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-offWhite-300">
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-offWhite/30" : ""}>
                    <td className="px-4 py-3 font-medium text-navy">{r.player?.name ?? "Athlete"}</td>
                    <td className="px-4 py-3 text-navy/65">{fmt(r.program_start ?? r.created_at)}</td>
                    <td className="px-4 py-3 text-navy/65 tabular-nums">{r.sessions} of 4</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${r.status === "completed" ? "text-sage-600" : "text-orange-600"}`}>
                        {r.status === "completed" ? "Completed" : r.status === "active" ? "In progress" : (r.status ?? "—")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-navy/40 mt-6 leading-relaxed">
          Generated {generated} · This transcript reflects volunteer mentorship completed through Mentality Sports, a nonprofit
          mental-health platform for young athletes. Official certificates are issued by the Mentality Sports team.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/40">{label}</p>
      <p className="text-base font-bold text-navy mt-0.5 truncate">{value}</p>
    </div>
  );
}
