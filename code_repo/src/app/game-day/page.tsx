import type { Metadata } from "next";
import Link from "next/link";
import { REPS } from "@/lib/reps";

export const metadata: Metadata = {
  title: "Game Day — 2-minute mental routines for athletes | Mentality Sports",
  description:
    "Free guided Game Day routines for athletes: a pre-game reset, a post-game debrief, and a bad day reset. No account needed to try one.",
  alternates: { canonical: "/game-day" },
};

export default function GameDayPage() {
  return (
    <>
      <section className="bg-turf text-chalk">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
          <h1 className="type-display max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)]">Game Day</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-chalk/85">
            Short routines for the moments that decide how you play: before you compete, after, and after the rough
            nights. Pick one and go. No account needed to try.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-20">
        <ul>
          {REPS.map((rep) => (
            <li key={rep.key} className="border-t border-line last:border-b">
              <Link href={`/game-day/${rep.key}`} className="group grid items-center gap-4 py-8 md:grid-cols-[1fr_1.5fr_auto] md:gap-10">
                <div>
                  <p className="text-sm font-semibold text-turf">{rep.when}</p>
                  <h2 className="type-heading mt-1 text-3xl text-ink group-hover:text-turf">{rep.title}</h2>
                </div>
                <p className="text-base leading-relaxed text-ink/75">{rep.blurb}</p>
                <span className="justify-self-start rounded-md bg-ink px-5 py-3 text-sm font-semibold text-chalk group-hover:bg-turf md:justify-self-end">
                  Start, {rep.minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.5rem)] text-ink">Why a routine?</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">
              Confidence isn&apos;t something you have or don&apos;t. You build it one game at a time. Do a reset before
              you compete and a debrief after, and in a few weeks your Locker Room shows your confidence trend instead
              of you guessing at it.
            </p>
          </div>
          <div className="rounded-xl bg-ink p-7 text-chalk">
            <h2 className="type-heading text-2xl">Coaches: put the whole roster on it.</h2>
            <p className="mt-3 text-base leading-relaxed text-chalk/75">
              Share one team code. Your players do Game Day routines, and you see team totals and confidence trends.
              Never what any one player wrote.
            </p>
            <Link href="/signup?role=coach" className="mt-6 inline-block rounded-md bg-whistle px-5 py-3 font-semibold text-ink hover:bg-whistle-300">
              Create a team
            </Link>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-6xl px-5 py-12 text-sm text-ink/65 sm:px-8">
        Game Day routines are not therapy. If you&apos;re struggling with something serious or feel unsafe, call or text{" "}
        <a href="tel:988" className="font-semibold text-turf underline">988</a> to reach someone right now.
      </p>
    </>
  );
}
