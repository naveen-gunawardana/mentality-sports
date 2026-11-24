import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { REPS } from "@/lib/reps";

export const metadata: Metadata = {
  title: "Game Day — 2-minute mental routines for athletes | Mentality Sports",
  description:
    "Free guided Game Day routines for athletes: a pre-game reset, a post-game debrief, and a bad day reset. No account needed to try one.",
  alternates: { canonical: "/game-day" },
};

export default function RepsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">Game Day</p>
      <h1 className="mb-4 font-condensed text-5xl font-black italic leading-[0.95] text-navy sm:text-6xl">
        TRAIN YOUR HEAD LIKE YOU TRAIN YOUR BODY.
      </h1>
      <p className="mb-10 max-w-xl text-base text-muted-foreground">
        Short guided exercises built from what athletes told us actually gets in their way: playing scared, getting
        stuck on mistakes, and carrying a bad game into the next one. Pick one and go. No account needed to try.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {REPS.map((rep) => (
          <Link
            key={rep.key}
            href={`/game-day/${rep.key}`}
            className="group flex flex-col rounded-lg border border-offWhite-300 bg-white p-6 transition-colors hover:border-orange-400"
          >
            <p className="mb-1 text-xs font-semibold text-orange-500">{rep.when}</p>
            <h2 className="mb-2 text-xl font-bold text-navy">{rep.title}</h2>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">{rep.blurb}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-navy/50">
                <Clock className="h-3.5 w-3.5" /> {rep.minutes} min
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-navy group-hover:text-orange-600">
                Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/signup?role=coach"
        className="group mt-10 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-navy p-6 text-white"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-400">For coaches</p>
          <p className="mt-1 text-lg font-bold">Put your whole roster on it.</p>
          <p className="text-sm text-white/60">
            Share one team code. Your athletes do Game Day routines before games, and you see team confidence trends. Never their private answers.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 font-semibold group-hover:text-orange-300">
          Create a team <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      <div className="mt-12 rounded-lg bg-offWhite p-6 text-sm text-muted-foreground">
        <p className="mb-1 font-semibold text-navy">Why a routine?</p>
        <p>
          Confidence isn&apos;t something you have or don&apos;t. It&apos;s something you build, one game at a time. Do a
          pre-game reset before you compete and a debrief after, and in a few weeks you&apos;ll see your own confidence
          trend instead of guessing at it. Want a real person in your corner too? Members can request a mentor who
          played your sport.
        </p>
        <p className="mt-3 text-xs">
          Game Day routines are not therapy. If you&apos;re struggling with something serious or feel unsafe, call or text 988
          (US) to reach someone right now.
        </p>
      </div>
    </div>
  );
}
