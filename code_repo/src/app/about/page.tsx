import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Mentality Sports",
  description:
    "Mentality Sports is a student-run nonprofit for the mental side of sport. We started by listening to high school basketball players and coaches in San Francisco.",
  alternates: { canonical: "https://mentalitysports.com/about" },
};

const team = [
  { src: "/team/naveen.png", name: "Naveen", role: "Founder and CEO" },
  { src: "/team/juli.png", name: "Juli", role: "Co-founder and CMO" },
  { src: "/team/logan.png", name: "Logan", role: "President" },
  { src: "/team/peter.png", name: "Peter", role: "COO" },
  { src: "/team/tj.png", name: "TJ", role: "CFO" },
  { src: "/team/reid.png", name: "Reid", role: "Head of Outreach" },
];

const beliefs = [
  {
    title: "The mental game is part of the game.",
    body: "Confidence, nerves and how you handle a mistake decide as many games as skill does. They can be practiced like anything else.",
  },
  {
    title: "Something you can use tonight beats something you wait for.",
    body: "That's why Game Day routines come first. They work the day you sign up, with no waitlist and no appointment.",
  },
  {
    title: "Athletes listen to athletes.",
    body: "Our mentors competed, most of them in college, and remember what it felt like. They volunteer because someone should have been there for them.",
  },
  {
    title: "It should never cost an athlete anything.",
    body: "We're a nonprofit. Every tool on this site is free for athletes, coaches and teams.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-turf text-chalk">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.1fr_1fr] md:py-28">
          <h1 className="type-display text-[clamp(2.75rem,7vw,5.5rem)]">Built by athletes, for athletes.</h1>
          <div className="space-y-5 self-end text-lg leading-relaxed text-chalk/85">
            <p>
              Mentality Sports started with interviews. We sat down with high school basketball players and their coaches
              in San Francisco and asked what was actually getting in the way.
            </p>
            <p>
              Almost nobody said skill. Players could do it in practice and froze in games. They were scared of
              mistakes and hard on themselves. Coaches were already telling them it was okay to miss, and it still
              wasn&apos;t enough.
            </p>
            <p>So we built tools for that moment, and found mentors who&apos;d lived it.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">What we believe</h2>
        <div className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {beliefs.map((b) => (
            <div key={b.title} className="border-t-2 border-ink pt-6">
              <h3 className="type-heading text-2xl text-ink">{b.title}</h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink/75">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
          <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">The team</h2>
          <p className="mt-4 max-w-xl text-lg text-ink/75">Students and athletes who run Mentality Sports.</p>
          <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {team.map((m) => (
              <li key={m.name}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-turf-50">
                  <Image src={m.src} alt={m.name} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw" className="object-cover" />
                </div>
                <p className="mt-3 font-semibold text-ink">{m.name}</p>
                <p className="text-sm text-ink/65">{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-3 md:py-24">
        {[
          { title: "Try a routine", body: "Two minutes, before your next game.", href: "/game-day/pregame", cta: "Start the Pre-Game Reset" },
          { title: "Mentor an athlete", body: "Competed in high school or college? Give a few weeks to someone coming up.", href: "/signup?role=mentor", cta: "Become a mentor" },
          { title: "Partner with us", body: "Schools, clubs and organizations that want to bring this to their athletes.", href: "mailto:hello@mentalitysports.com", cta: "Email us" },
        ].map((c) => (
          <div key={c.title} className="border-t border-line pt-6">
            <h3 className="type-heading text-xl text-ink">{c.title}</h3>
            <p className="mt-2 text-base text-ink/75">{c.body}</p>
            <Link href={c.href} className="mt-4 inline-block font-semibold text-ink underline decoration-whistle decoration-[3px] underline-offset-[6px] hover:text-turf">
              {c.cta}
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
