import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentors | Mentality Sports",
  description:
    "Ask for a free mentor: a current or former athlete in your sport. Four weeks of weekly check-ins and messages on confidence, pressure, playing time and more.",
  alternates: { canonical: "https://mentalitysports.com/mentorship" },
};

const steps = [
  {
    title: "Make a free account",
    body: "Name, email, sport and grade. Your Locker Room opens straight away with Game Day routines you can use while you wait.",
  },
  {
    title: "Ask for a mentor",
    body: "In your Locker Room, pick up to three things you want help with, like playing scared, playing time or talking to your coach.",
  },
  {
    title: "Get matched",
    body: "A person on our team reads every request and pairs you with a mentor whose sport and story fit. Mentors are volunteers, so this can take a few weeks. We email you when it happens.",
  },
  {
    title: "Four weeks together",
    body: "One check-in a week and messages in between. Share your Game Day routines if you want, so your mentor knows how your games are going.",
  },
];

const topics = [
  "Playing scared in games",
  "Getting stuck on mistakes",
  "Nerves before competing",
  "Playing time and your role",
  "Talking to your coach",
  "Coming back from injury",
  "Motivation and burnout",
  "Sport and school",
  "Recruiting and what's next",
];

export default function MentorshipPage() {
  return (
    <>
      <section className="bg-ink text-chalk">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div>
            <h1 className="type-display text-[clamp(2.75rem,7vw,5.5rem)]">Someone who&apos;s been there.</h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-chalk/80">
              A mentor is a current or former athlete in your sport who dealt with the same pressure you&apos;re
              dealing with now. Not a coach, not a therapist. Someone a few steps ahead who gets it.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup?role=player" className="rounded-md bg-whistle px-6 py-3.5 font-semibold text-ink hover:bg-whistle-300">
                Ask for a mentor
              </Link>
              <Link href="/signup?role=mentor" className="rounded-md px-6 py-3.5 font-semibold text-chalk ring-1 ring-inset ring-chalk/40 hover:bg-chalk/10">
                Become a mentor
              </Link>
            </div>
          </div>
          <div className="self-end">
            <p className="text-sm font-semibold text-chalk/60">What people ask mentors about</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t} className="rounded-full border border-chalk/25 px-3.5 py-1.5 text-sm text-chalk/90">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">How it works</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-5">
              <p className="type-display text-4xl text-turf">{i + 1}</p>
              <h3 className="type-heading mt-3 text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink/75">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">What you get</h2>
            <ul className="mt-8 space-y-5 text-base leading-relaxed text-ink/80">
              <li className="border-b border-line pb-5"><strong className="text-ink">A weekly check-in.</strong> Video or phone, scheduled around school and practice.</li>
              <li className="border-b border-line pb-5"><strong className="text-ink">Messages in between.</strong> For the night before a game or the drive home after.</li>
              <li className="border-b border-line pb-5"><strong className="text-ink">One goal you work on together.</strong> Small and specific, like taking the first open shot.</li>
              <li><strong className="text-ink">Another four weeks if you want them.</strong> Re-enroll with the same mentor when the program ends.</li>
            </ul>
          </div>
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Want to mentor?</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
              If you competed in high school or college and remember how loud it got in your head, you&apos;re who we
              need. About 15 minutes a week for four weeks. We review every mentor before matching, and we especially
              need soccer and golf mentors right now.
            </p>
            <Link href="/signup?role=mentor" className="mt-8 inline-block rounded-md bg-turf px-6 py-3.5 font-semibold text-chalk hover:bg-turf-600">
              Apply to mentor
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="max-w-2xl text-base text-ink/70">
          Mentors are peer support, not counselors. If you&apos;re struggling with something serious or feel unsafe,
          call or text <a href="tel:988" className="font-semibold text-turf underline">988</a> any time.
        </p>
      </section>
    </>
  );
}
