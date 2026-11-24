"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Users, Video, ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SessionItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  host_name: string | null;
  host_title: string | null;
  sport: string | null;
  topic: string | null;
  starts_at: string;
  duration_min: number;
  capacity: number | null;
  rsvpCount: number;
  spotsLeft: number | null;
  isFull: boolean;
  isPast: boolean;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function SessionCard({ s }: { s: SessionItem }) {
  const d = fmtDate(s.starts_at);
  return (
    <Link
      href={`/group-sessions/${s.slug}`}
      className="group flex flex-col rounded-sm border border-offWhite-300 bg-offWhite p-6 hover:border-orange-300 hover:bg-white transition-colors"
    >
      <div className="flex items-start gap-5">
        {/* Date block */}
        <div className="flex flex-col items-center justify-center rounded-sm bg-navy text-white w-16 h-16 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{d.month}</span>
          <span className="text-2xl font-black font-condensed leading-none">{d.day}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/50">{d.weekday}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {s.topic && (
              <span className="rounded-sm px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-600">{s.topic}</span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-navy/40">
              <Clock className="h-3 w-3" /> {d.time} · {s.duration_min} min
            </span>
          </div>
          <h3 className="font-bold text-navy text-base leading-snug mb-1 group-hover:text-orange-600 transition-colors">
            {s.title}
          </h3>
          {s.host_name && (
            <p className="text-xs text-navy/50">
              Hosted by {s.host_name}
              {s.host_title ? ` · ${s.host_title}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-offWhite-300">
        <span className="inline-flex items-center gap-1.5 text-xs text-navy/45">
          <Users className="h-3.5 w-3.5" />
          {s.isFull ? (
            <span className="text-orange-600 font-semibold">Full</span>
          ) : s.spotsLeft != null ? (
            `${s.spotsLeft} spots left`
          ) : (
            `${s.rsvpCount} going`
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy/40 group-hover:text-orange-500 transition-colors">
          {s.isFull ? "View" : "RSVP"} <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export default function GroupSessionsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const isAuthed = !!data.user;
      setAuthed(isAuthed);
      if (!isAuthed) {
        setLoading(false);
        return;
      }
      fetch("/api/group-sessions")
        .then((r) => r.json())
        .then((d) => {
          setSessions(d.sessions ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  const upcoming = sessions.filter((s) => !s.isPast);
  const past = sessions.filter((s) => s.isPast).reverse();

  return (
    <div>
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        Group Sessions are <span className="text-white font-semibold">live and free for members</span> — sign in to RSVP and join.
      </div>

      {/* Hero */}
      <div className="relative bg-[#0c1628] overflow-hidden">
        <div aria-hidden className="absolute top-1/2 right-[-2rem] -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed" style={{ fontSize: "clamp(10rem, 24vw, 26rem)" }}>LIVE</div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="block bg-orange-400 w-8 h-px" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">Live · Virtual · Members</span>
          </div>
          <h1 className="font-black text-white font-condensed tracking-tight leading-none mb-5" style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}>
            GROUP SESSIONS
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed">
            Live virtual workshops on the mental side of sport — confidence, pressure, identity, coming back from injury. Hosted by athletes who&apos;ve been there. Drop in, listen, ask questions. Free for members.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {authed === null ? (
          <div className="text-center py-20 text-navy/40 text-sm">Loading…</div>
        ) : !authed ? (
          /* Logged-out gate — must sign up / in to see and RSVP */
          <div className="rounded-sm border border-offWhite-300 bg-offWhite p-10 sm:p-14 text-center max-w-xl mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 mx-auto mb-5">
              <Lock className="h-5 w-5 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-navy font-condensed tracking-wide mb-2">MEMBERS ONLY</h2>
            <p className="text-navy/55 text-sm mb-7 max-w-md mx-auto">
              Group Sessions are free, but you&apos;ll need an account to see the schedule and RSVP. Creating one takes under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-orange-500 transition-colors">
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/signin?redirect=/group-sessions" className="inline-flex items-center justify-center gap-2 border border-navy/15 px-6 py-3 text-sm font-bold text-navy hover:border-navy/30 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-navy/40 text-sm">Loading sessions…</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Video className="h-5 w-5 text-orange-500" />
              <h2 className="text-2xl font-black text-navy font-condensed tracking-wide">UPCOMING</h2>
            </div>

            {upcoming.length === 0 ? (
              <div className="rounded-sm border border-dashed border-offWhite-400 bg-offWhite p-10 text-center">
                <Calendar className="h-8 w-8 text-navy/20 mx-auto mb-3" />
                <p className="text-navy/55 text-sm mb-1 font-medium">No live sessions on the calendar right now.</p>
                <p className="text-navy/40 text-xs">More sessions are coming soon — join the newsletter to be the first to know.</p>
                <Link href="/newsletter" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  Get notified <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((s) => <SessionCard key={s.id} s={s} />)}
              </div>
            )}

            {past.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-16 mb-6">
                  <h2 className="text-lg font-bold text-navy/40 uppercase tracking-widest">Past sessions</h2>
                  <div className="flex-1 h-px bg-offWhite-300" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {past.map((s) => (
                    <Link key={s.id} href={`/group-sessions/${s.slug}`} className="group flex flex-col rounded-sm border border-offWhite-300 bg-white p-5 opacity-75 hover:opacity-100 transition-opacity">
                      {s.topic && <span className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1.5">{s.topic}</span>}
                      <h3 className="text-sm font-bold text-navy leading-snug group-hover:text-orange-600 transition-colors">{s.title}</h3>
                      <span className="text-[11px] text-navy/40 mt-2">{new Date(s.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
