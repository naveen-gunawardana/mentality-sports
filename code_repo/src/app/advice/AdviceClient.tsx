"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, PenLine } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  sport: string | null;
  media_type: string | null;
  read_time: string | null;
  published_at: string | null;
}

const ALL_SPORTS = [
  "Basketball", "Soccer", "Football", "Baseball", "Softball",
  "Volleyball", "Track & Field", "Cross-Country", "Swimming", "Wrestling",
  "Tennis", "Golf", "Lacrosse",
];

const ALL_ISSUES = [
  "Confidence", "Resilience", "Motivation", "Goal Setting",
  "Pressure & Anxiety", "Coach Communication", "Identity", "Injury Recovery", "Other",
];

const ALL_MEDIA_TYPES = ["Article", "Video", "Podcast", "Guide", "Infographic"];

export function AdviceClient({ articles }: { articles: Article[] }) {
  const [activeSport, setActiveSport] = useState("All");
  const [activeIssue, setActiveIssue] = useState("All");
  const [activeType, setActiveType] = useState("All");

  const filtered = articles.filter(a => {
    if (activeSport !== "All" && a.sport !== activeSport) return false;
    if (activeIssue !== "All" && a.category !== activeIssue) return false;
    if (activeType !== "All" && a.media_type !== activeType) return false;
    return true;
  });

  const availableSports = ALL_SPORTS.filter(s => articles.some(a => a.sport === s));
  const availableIssues = ALL_ISSUES.filter(i => articles.some(a => a.category === i));
  const availableTypes = ALL_MEDIA_TYPES.filter(t => articles.some(a => a.media_type === t));

  return (
    <div>
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        Mentality Sports is <span className="text-white font-semibold">100% free</span> — built by athletes giving back to the next generation of competitors.
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">The library</p>
            <h1 className="text-4xl font-bold text-navy mb-3">Advice</h1>
            <p className="text-navy/55 max-w-xl leading-relaxed">
              Articles on the mental side of sport — written by athletes, coaches, and mental performance experts. Free, always.
            </p>
          </div>
          <Link
            href="/advice/submit"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-sm border border-navy/20 px-4 py-2.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors"
          >
            <PenLine className="h-3.5 w-3.5" />Give Advice
          </Link>
        </div>

        <div className="space-y-3 mb-8">
          {availableSports.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 w-14 shrink-0">Sport</span>
              <button type="button" onClick={() => setActiveSport("All")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeSport === "All" ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                All
              </button>
              {availableSports.map(s => (
                <button key={s} type="button" onClick={() => setActiveSport(activeSport === s ? "All" : s)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeSport === s ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {availableIssues.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 w-14 shrink-0">Issue</span>
              <button type="button" onClick={() => setActiveIssue("All")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeIssue === "All" ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                All
              </button>
              {availableIssues.map(i => (
                <button key={i} type="button" onClick={() => setActiveIssue(activeIssue === i ? "All" : i)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeIssue === i ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                  {i}
                </button>
              ))}
            </div>
          )}

          {availableTypes.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 w-14 shrink-0">Type</span>
              <button type="button" onClick={() => setActiveType("All")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeType === "All" ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                All
              </button>
              {availableTypes.map(t => (
                <button key={t} type="button" onClick={() => setActiveType(activeType === t ? "All" : t)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${activeType === t ? "bg-navy text-white" : "bg-offWhite border border-offWhite-300 text-navy/60 hover:text-navy hover:border-navy/20"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Nothing here yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(article => (
              <Link
                key={article.id}
                href={`/advice/${article.slug}`}
                className="group flex flex-col rounded-sm border border-offWhite-300 bg-offWhite p-6 hover:border-offWhite-400 hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {article.category && (
                    <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-navy/8 text-navy">
                      {article.category}
                    </span>
                  )}
                  {article.sport && article.sport !== "General" && (
                    <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600">
                      {article.sport}
                    </span>
                  )}
                  {article.read_time && (
                    <div className="flex items-center gap-1 text-xs text-navy/35">
                      <BookOpen className="h-3 w-3" />
                      {article.read_time}
                    </div>
                  )}
                </div>
                <h2 className="font-bold text-navy text-sm leading-snug mb-2 flex-1 group-hover:text-orange-600 transition-colors">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-xs text-navy/55 leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-1 text-xs font-semibold text-navy/40 group-hover:text-orange-500 transition-colors mt-auto">
                  Read <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
