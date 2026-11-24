"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Clock, Users, Video, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/client";

interface SessionDetail {
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
  meeting_url: string | null;
  capacity: number | null;
  rsvpCount: number;
  spotsLeft: number | null;
  isFull: boolean;
  isPast: boolean;
}

function RsvpForm({ session }: { session: SessionDetail }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  // RSVP requires sign-in — prefill name + lock to the account email.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) { setAuthChecked(true); return; }
      setLoggedIn(true);
      if (user.email) setEmail(user.email);
      const metaName = (user.user_metadata?.name as string | undefined) ?? "";
      if (metaName) {
        setName(metaName);
      } else {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
        if (profile?.name) setName(profile.name);
      }
      setAuthChecked(true);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/group-sessions/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, name: name.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Could not save your RSVP. Try again.");
        return;
      }
      setStatus("done");
      setMessage(data?.alreadyRsvped ? "You're already on the list — confirmation re-sent." : "You're in! Check your email for the join link.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-sm bg-navy p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-6 w-6 text-orange-400 shrink-0" />
          <p className="font-bold text-lg font-condensed tracking-wide">YOU&apos;RE IN</p>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mb-4">{message}</p>
        {session.meeting_url && (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 px-5 py-3 text-sm font-bold text-white transition-colors"
          >
            <Video className="h-4 w-4" /> Join link <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  if (!authChecked) {
    return <div className="rounded-sm border border-offWhite-300 bg-offWhite p-6 text-sm text-navy/40">Loading…</div>;
  }

  if (!loggedIn) {
    return (
      <div className="rounded-sm border border-offWhite-300 bg-offWhite p-6">
        <p className="font-bold text-navy text-lg font-condensed tracking-wide mb-1">RSVP — IT&apos;S FREE</p>
        <p className="text-xs text-navy/50 mb-4">Sign in to your free account to RSVP. We&apos;ll RSVP you with your account email and send the join link there.</p>
        <Link
          href={`/signin?redirect=/group-sessions/${session.slug}`}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 px-6 py-3 text-sm font-bold text-white transition-colors"
        >
          Sign in to RSVP <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-navy/45 mt-3 text-center">
          New here? <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-500">Create a free account</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-sm border border-offWhite-300 bg-offWhite p-6">
      <p className="font-bold text-navy text-lg font-condensed tracking-wide mb-1">RSVP — IT&apos;S FREE</p>
      <p className="text-xs text-navy/50 mb-4">You&apos;re signed in — we&apos;ll RSVP you with your account email.</p>
      <div className="space-y-3">
        <input
          type="text" required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 text-sm rounded-sm border border-offWhite-400 bg-white text-navy placeholder-navy/35 outline-none focus:border-orange-400 transition-colors"
        />
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com" readOnly={loggedIn}
          className={`w-full px-4 py-3 text-sm rounded-sm border outline-none transition-colors ${
            loggedIn
              ? "border-offWhite-300 bg-offWhite text-navy/60 cursor-not-allowed"
              : "border-offWhite-400 bg-white text-navy placeholder-navy/35 focus:border-orange-400"
          }`}
        />
        <button
          type="submit" disabled={status === "loading"}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 px-6 py-3 text-sm font-bold text-white transition-colors"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reserve my spot"}
        </button>
        {status === "error" && <p className="text-xs text-orange-600">{message}</p>}
      </div>
    </form>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/group-sessions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { setSession(d.session ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-navy/40 text-sm">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-navy/60 mb-4">This session couldn&apos;t be found.</p>
        <Link href="/group-sessions" className="text-sm font-semibold text-orange-600 hover:text-orange-500">← All group sessions</Link>
      </div>
    );
  }

  const d = new Date(session.starts_at);
  const fullDate = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/group-sessions" className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" /> All group sessions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {session.topic && <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600">{session.topic}</span>}
            {session.sport && session.sport !== "General" && <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-navy/8 text-navy">{session.sport}</span>}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-navy/40"><Video className="h-3 w-3" /> Online</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-navy font-condensed tracking-tight leading-tight mb-5">
            {session.title}
          </h1>

          {session.isPast && (
            <div className="rounded-sm bg-navy/5 border border-navy/10 px-4 py-3 mb-6 text-sm text-navy/60">
              This session has ended. Catch the next one — they run regularly.
            </div>
          )}

          {session.host_name && (
            <p className="text-sm text-navy/55 mb-8">
              Hosted by <span className="font-semibold text-navy">{session.host_name}</span>
              {session.host_title ? ` — ${session.host_title}` : ""}
            </p>
          )}

          {session.description && (
            <div className="prose-content">{renderMarkdown(session.description)}</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-sm border border-offWhite-300 bg-white p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div><p className="text-xs text-navy/40 uppercase tracking-wider font-semibold">Date</p><p className="text-sm text-navy font-medium">{fullDate}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div><p className="text-xs text-navy/40 uppercase tracking-wider font-semibold">Time</p><p className="text-sm text-navy font-medium">{time} · {session.duration_min} min</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div><p className="text-xs text-navy/40 uppercase tracking-wider font-semibold">Going</p><p className="text-sm text-navy font-medium">{session.rsvpCount}{session.spotsLeft != null ? ` · ${session.spotsLeft} spots left` : ""}</p></div>
            </div>
          </div>

          {!session.isPast && (session.isFull
            ? <div className="rounded-sm border border-offWhite-300 bg-offWhite p-6 text-center text-sm text-navy/55">This session is full. Join the <Link href="/newsletter" className="font-semibold text-orange-600">newsletter</Link> to hear about the next one.</div>
            : <RsvpForm session={session} />
          )}
        </div>
      </div>
    </div>
  );
}
