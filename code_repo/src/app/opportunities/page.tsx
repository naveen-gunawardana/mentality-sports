import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work with us | Mentality Sports",
  description: "Mentor an athlete, intern with our student team, come on the podcast, or partner with Mentality Sports.",
  alternates: { canonical: "https://mentalitysports.com/opportunities" },
};

const roles = [
  { title: "Social media", body: "Make content and tell athletes' stories across Instagram and TikTok." },
  { title: "Finance", body: "Grant tracking, budgeting and nonprofit operations." },
  { title: "Software", body: "Build the Game Day routines, Locker Room and coach tools on this site." },
  { title: "Outreach", body: "Bring schools, coaches and clubs onto Mentality Sports." },
];

const INTERNSHIP_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSdihrhdqEz2DzImPsV2Ywu0wXM5i27hCpO-wuzrA4tOzrDeWw/viewform";

export default function OpportunitiesPage() {
  return (
    <>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
          <h1 className="type-display max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)]">Work with us.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-chalk/80">
            Mentality Sports runs on athletes and students who give their time. Here&apos;s where you can help.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="grid gap-10 border-b border-line py-16 md:grid-cols-[1fr_1.3fr] md:py-20">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Mentor an athlete</h2>
            <p className="mt-3 text-base text-ink/65">The most useful thing you can do. We especially need soccer and golf mentors.</p>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-ink/80">
              If you competed in high school or college, you&apos;ve already been through what a younger athlete is
              stuck in right now. One check-in a week for four weeks, plus messages in between. We review every mentor
              and match you with an athlete whose sport and story fit yours.
            </p>
            <Link href="/signup?role=mentor" className="mt-7 inline-block rounded-md bg-turf px-6 py-3.5 font-semibold text-chalk hover:bg-turf-600">
              Apply to mentor
            </Link>
          </div>
        </section>

        <section className="grid gap-10 border-b border-line py-16 md:grid-cols-[1fr_1.3fr] md:py-20">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Intern with the team</h2>
            <p className="mt-3 text-base text-ink/65">For high school and college students. Remote friendly.</p>
          </div>
          <div>
            <ul>
              {roles.map((r) => (
                <li key={r.title} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <p className="font-semibold text-ink">{r.title}</p>
                  <p className="text-base text-ink/75">{r.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-base text-ink/70">Interns get real responsibility and a letter of recommendation from our CEO.</p>
            <a href={INTERNSHIP_FORM} target="_blank" rel="noopener noreferrer" className="mt-7 inline-block rounded-md bg-ink px-6 py-3.5 font-semibold text-chalk hover:bg-turf">
              Apply for an internship
            </a>
          </div>
        </section>

        <section className="grid gap-10 border-b border-line py-16 md:grid-cols-[1fr_1.3fr] md:py-20">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Come on the podcast</h2>
            <p className="mt-3 text-base text-ink/65">Athletes, coaches and mental performance experts.</p>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-ink/80">
              Got a story about doubt, pressure, a comeback, or what it takes to stay in the game? Tell us about it.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/podcast/apply" className="rounded-md bg-turf px-6 py-3.5 font-semibold text-chalk hover:bg-turf-600">Apply to be a guest</Link>
              <Link href="/podcast" className="self-center font-semibold text-ink underline decoration-whistle decoration-[3px] underline-offset-[6px] hover:text-turf">Listen to episodes</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-10 py-16 md:grid-cols-[1fr_1.3fr] md:py-20">
          <div>
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Partner with us</h2>
            <p className="mt-3 text-base text-ink/65">Schools, clubs, leagues and organizations.</p>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-ink/80">
              Bring Game Day to your teams, co-host an event, or support the work. Coaches can start on their own by
              creating a team.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <a href="mailto:hello@mentalitysports.com?subject=Partnering%20with%20Mentality%20Sports" className="rounded-md bg-ink px-6 py-3.5 font-semibold text-chalk hover:bg-turf">
                Email hello@mentalitysports.com
              </a>
              <Link href="/signup?role=coach" className="self-center font-semibold text-ink underline decoration-whistle decoration-[3px] underline-offset-[6px] hover:text-turf">Create a team</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
