"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionRow {
  id: string;
  date: string | null;
  duration: number | null;
  topics: string[] | null;
  match_id: string;
  player_name: string;
  player_sport: string[] | null;
}

export default function HoursReportPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      setMentorName(profile?.name ?? "");

      const { data: matches } = await supabase
        .from("matches")
        .select("id, player:player_id(name, sport)")
        .eq("mentor_id", user.id);

      if (!matches || matches.length === 0) {
        setLoading(false);
        return;
      }

      const matchIds = matches.map((m) => m.id);
      const playerByMatch: Record<string, { name: string; sport: string[] | null }> = {};
      for (const m of matches) {
        const p = (m.player as unknown) as { name: string; sport: string[] | null } | null;
        if (p) playerByMatch[m.id] = p;
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, date, duration, topics, match_id")
        .in("match_id", matchIds)
        .order("date", { ascending: true });

      const rows: SessionRow[] = (sessionData ?? []).map((s) => ({
        id: s.id,
        date: s.date,
        duration: s.duration,
        topics: s.topics,
        match_id: s.match_id,
        player_name: playerByMatch[s.match_id]?.name ?? "Athlete",
        player_sport: playerByMatch[s.match_id]?.sport ?? null,
      }));

      setSessions(rows);
      setLoading(false);
    }
    load();
  }, []);

  const sessionsDated = sessions.filter((s) => s.date);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration ?? 45), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const startDate = sessionsDated[0]?.date;
  const endDate = sessionsDated[sessionsDated.length - 1]?.date;
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function fmtPeriod() {
    if (!startDate && !endDate) return "—";
    if (startDate && endDate && startDate !== endDate)
      return `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
    return fmtDate(startDate ?? endDate ?? null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground text-sm">
        Loading report...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/dashboard/mentor"
          className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <Button
          size="sm"
          className="bg-navy hover:bg-navy/90 text-white"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>

      {/* Report document */}
      <div className="rounded-lg border border-offWhite-300 bg-white p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="border-b border-offWhite-300 pb-6 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
            Mentality Sports
          </p>
          <h1 className="text-2xl font-bold text-navy mb-1">
            Community Mentorship Service Hours
          </h1>
          <p className="text-sm text-muted-foreground">
            Verification report for athletic program service requirements
          </p>
        </div>

        {/* Mentor + period info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-1">Mentor</p>
            <p className="text-base font-semibold text-navy">{mentorName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-1">Service Period</p>
            <p className="text-base font-semibold text-navy">{fmtPeriod()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-navy">{sessions.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-orange-500">{totalHours} hrs</p>
          </div>
        </div>

        {/* Session table */}
        {sessions.length > 0 ? (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-3">Session Log</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-offWhite-300">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Athlete</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Duration</th>
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Topics</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-offWhite-200 last:border-0">
                    <td className="py-2.5 pr-4 text-navy/70 whitespace-nowrap">{fmtDate(s.date)}</td>
                    <td className="py-2.5 pr-4 text-navy font-medium">{s.player_name}</td>
                    <td className="py-2.5 pr-4 text-navy/70 whitespace-nowrap">
                      {s.duration ? `${s.duration} min` : "45 min"}
                    </td>
                    <td className="py-2.5 text-navy/60 text-xs">
                      {s.topics && s.topics.length > 0 ? s.topics.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy/20">
                  <td className="py-2.5 pr-4 font-semibold text-navy" colSpan={2}>Total</td>
                  <td className="py-2.5 pr-4 font-semibold text-navy">{totalMinutes} min ({totalHours} hrs)</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-8">No sessions logged yet.</p>
        )}

        {/* Certification */}
        <div className="rounded-sm bg-offWhite border border-offWhite-300 p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-2">Certification</p>
          <p className="text-sm text-navy/80 leading-relaxed">
            This report certifies that <strong className="text-navy">{mentorName}</strong> participated in
            the Mentality Sports community basketball mentorship program during the period above.
            Mentality Sports is a volunteer-based program pairing college and former players with high school
            athletes to provide weekly 1-on-1 mentorship focused on the mental performance side of sport.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-offWhite-200 pt-4">
          <span>mentalitysports.com</span>
          <span>Report generated {reportDate}</span>
        </div>
      </div>
    </div>
  );
}
