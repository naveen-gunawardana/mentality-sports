"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Mail, ArrowRight, X, Archive } from "lucide-react";

interface Issue {
  slug: string;
  subject: string;
  title: string;
  excerpt: string | null;
  sent_at: string | null;
}

function fmtSentDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsletterPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribed, setUnsubscribed] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("unsubscribed") === "1") {
      setUnsubscribed(true);
    }

    const supabase = createClient();
    supabase
      .from("newsletter_issues")
      .select("slug, subject, title, excerpt, sent_at")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .then(({ data }) => {
        setIssues((data ?? []) as unknown as Issue[]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        The Mental Rep is <span className="text-white font-semibold">free</span> — a couple emails a month, unsubscribe anytime.
      </div>

      {unsubscribed && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-navy/70">
              You&apos;ve been unsubscribed. Sorry to see you go.
            </p>
            <button
              type="button"
              onClick={() => setUnsubscribed(false)}
              aria-label="Dismiss"
              className="shrink-0 text-navy/40 hover:text-navy transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-[#0c1628] overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 right-[-2rem] -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed whitespace-nowrap"
          style={{ fontSize: "clamp(7rem, 18vw, 20rem)" }}
        >
          MENTAL REP
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="block bg-orange-400 w-8 h-px" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">The newsletter</span>
          </div>
          <h1
            className="font-black text-white font-condensed tracking-tight leading-none mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            THE MENTAL REP
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed mb-8">
            One practical idea for the mental game, a couple times a month — written by athletes who&apos;ve trained it for real. No fluff, no spam. Just something you can use before your next rep.
          </p>

          {/* Signup card */}
          <div className="max-w-xl rounded-sm border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Mail className="h-4 w-4 text-orange-400" />
              <p className="font-bold text-white text-sm font-condensed tracking-widest uppercase">Join the list</p>
            </div>
            <NewsletterSignup source="newsletter_page" theme="dark" showName />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Archive className="h-5 w-5 text-orange-500" />
          <h2 className="text-2xl font-black text-navy font-condensed tracking-wide">PAST ISSUES</h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-navy/40 text-sm">Loading issues…</div>
        ) : issues.length === 0 ? (
          <div className="rounded-sm border border-dashed border-offWhite-400 bg-offWhite p-10 text-center">
            <Mail className="h-8 w-8 text-navy/20 mx-auto mb-3" />
            <p className="text-navy/55 text-sm font-medium">First issue coming soon.</p>
            <p className="text-navy/40 text-xs mt-1">Subscribe above and you&apos;ll be the first to read it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <Link
                key={issue.slug}
                href={`/newsletter/${issue.slug}`}
                className="group flex flex-col rounded-sm border border-offWhite-300 bg-offWhite p-6 hover:border-orange-300 hover:bg-white transition-colors"
              >
                {issue.sent_at && (
                  <span className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-2">
                    {fmtSentDate(issue.sent_at)}
                  </span>
                )}
                <h3 className="font-bold text-navy text-base leading-snug mb-2 group-hover:text-orange-600 transition-colors">
                  {issue.title}
                </h3>
                {issue.excerpt && (
                  <p className="text-sm text-navy/55 leading-relaxed mb-4 line-clamp-2">{issue.excerpt}</p>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy/40 group-hover:text-orange-500 transition-colors mt-auto">
                  Read issue <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
