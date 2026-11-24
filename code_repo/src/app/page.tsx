import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { BreathingField } from "@/components/breathing-field";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const revalidate = 3600;

interface Article { title: string; slug: string; excerpt: string | null; category: string | null; read_time: string | null }
interface Episode { title: string; slug: string | null; episode_number: number | null }

async function getLatest() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const [{ data: articles }, { data: episodes }] = await Promise.all([
      db.from("resources").select("title, slug, excerpt, category, read_time").eq("status", "published").order("published_at", { ascending: false }).limit(3),
      db.from("podcast_episodes").select("title, slug, episode_number").eq("status", "published").order("published_at", { ascending: false }).limit(1),
    ]);
    return { articles: (articles ?? []) as Article[], episode: ((episodes ?? [])[0] ?? null) as Episode | null };
  } catch {
    return { articles: [] as Article[], episode: null };
  }
}

const gap = [
  ["Takes the open shot", "Passes it up"],
  ["Tries the new move", "Sticks to what's safe"],
  ["Shakes off a miss", "Replays it for three possessions"],
  ["Talks the whole time", "Goes quiet"],
];

const timeline = [
  {
    when: "Before the game",
    title: "Pre-Game Reset",
    minutes: 2,
    body: "Slow your breathing, pick the one thing you control today, and choose the word you'll say after a mistake.",
    href: "/game-day/pregame",
  },
  {
    when: "After the final whistle",
    title: "Post-Game Debrief",
    minutes: 3,
    body: "Rate how freely you played. Then name one thing that went well, one thing you're letting go, and one thing to work on.",
    href: "/game-day/postgame",
  },
  {
    when: "After a rough one",
    title: "Bad Day Reset",
    minutes: 3,
    body: "Benched, cut, or just a bad night. Write what happened, talk to yourself like a teammate would, and pick one move for tomorrow.",
    href: "/game-day/reset",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes, for every athlete, always. Mentors volunteer, and we're a nonprofit funded by grants and donations, not by athletes.",
  },
  {
    q: "Do I need an account to try a routine?",
    a: "No. You can do any Game Day routine right now. Make a free account if you want to save it and see your confidence trend over time.",
  },
  {
    q: "Is this therapy?",
    a: "No. Game Day routines and mentors are peer support for the mental side of sport, not treatment. If you're struggling with something serious or feel unsafe, call or text 988 to reach someone right away.",
  },
  {
    q: "Who are the mentors, and how long does a match take?",
    a: "Current and former competitive athletes, most of them college players, who we review before matching. They're volunteers, so a match can take a few weeks. Game Day routines are there from the first day.",
  },
  {
    q: "What can a coach see?",
    a: "Team totals only: how many routines the team did this week, how many athletes took part, and the team's average confidence once at least three athletes have logged. Coaches never see what an individual athlete wrote.",
  },
  {
    q: "Which sports?",
    a: "All of them. We started with high school basketball in San Francisco. Athletes from soccer, golf, football, track, swimming, lacrosse and more use it now.",
  },
];

// An illustrative season of post-game confidence scores, not a real athlete's data.
const exampleScores = [4, 5, 3, 5, 6, 5, 7, 6, 7, 8, 7, 8];

export default async function Home() {
  const { articles, episode } = await getLatest();

  return (
    <>
      {/* ── Hero: the field ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-turf text-chalk">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #F4F7F1 0 64px, transparent 64px 128px)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 md:grid-cols-[1.15fr_1fr] md:pb-24 md:pt-20">
          <div>
            <h1 className="type-display text-[clamp(3.25rem,9vw,7rem)] text-chalk">
              Play like you practice.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-chalk/85">
              Nerves, mistakes you can&apos;t shake, playing scared. Two-minute routines for before and after every
              game, and a mentor who&apos;s been there when you want one. Free.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/game-day/pregame" className="rounded-md bg-whistle px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-whistle-300">
                Start the Pre-Game Reset
              </Link>
              <Link href="/signup?role=coach" className="rounded-md px-6 py-3.5 text-base font-semibold text-chalk ring-1 ring-inset ring-chalk/50 transition-colors hover:bg-chalk/10">
                I coach a team
              </Link>
            </div>
            <p className="mt-5 text-sm text-chalk/70">No account needed to try it.</p>
          </div>
          <BreathingField />
        </div>
      </section>

      {/* ── The gap ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">
              You can do it in practice. Then the game starts.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
              When we talked to players and coaches, almost nobody said the problem was skill. It was fear of mistakes,
              being too hard on yourself, and a head that gets loud when it counts.
            </p>
            <figure className="mt-10 border-l-4 border-whistle pl-5">
              <blockquote className="text-xl font-medium leading-snug text-ink">
                &ldquo;I&apos;ve seen students who I know can do stuff that they&apos;re not even trying.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm text-ink/60">High school freshman coach, San Francisco</figcaption>
            </figure>
          </div>

          <div>
            <div className="grid grid-cols-2 border-b-2 border-ink pb-3 text-sm font-semibold text-ink/60">
              <p>In practice</p>
              <p className="pl-6">In the game</p>
            </div>
            <ul>
              {gap.map(([practice, game]) => (
                <li key={practice} className="grid grid-cols-2 border-b border-line py-5">
                  <p className="type-heading pr-4 text-[clamp(1.1rem,2.2vw,1.5rem)] text-turf">{practice}</p>
                  <p className="type-heading border-l border-line pl-6 text-[clamp(1.1rem,2.2vw,1.5rem)] text-ink/45">{game}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base text-ink/70">That gap is mental, and it can be trained like anything else.</p>
          </div>
        </div>
      </section>

      {/* ── Game Day timeline ──────────────────────────────────────────── */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
          <div className="max-w-2xl">
            <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">Game Day</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              Three short routines, built around the moments that matter: before you compete, after, and after the
              hard nights. Do them on your phone in the locker room or the car.
            </p>
          </div>

          <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-line md:hidden" />
            <div aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-0.5 bg-line md:block" />
            {timeline.map((t) => (
              <li key={t.title} className="relative pl-8 md:pl-0 md:pt-10">
                <span aria-hidden className="absolute left-0 top-1 h-4 w-4 rounded-full border-[3px] border-turf bg-white md:top-0" />
                <p className="text-sm font-semibold text-turf">{t.when}</p>
                <h3 className="type-heading mt-2 text-2xl text-ink">{t.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink/75">{t.body}</p>
                <Link href={t.href} className="mt-5 inline-block font-semibold text-ink underline decoration-whistle decoration-[3px] underline-offset-[6px] hover:text-turf">
                  Start, {t.minutes} minutes
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── See it build ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="type-heading text-[clamp(2rem,4.2vw,3.25rem)] text-ink">Watch your confidence change over a season.</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
              Every routine ends with one question: how confident did you feel, from 1 to 10. Your Locker Room keeps
              the line, so after a few weeks you can see what&apos;s working instead of guessing.
            </p>
            <Link href="/signup" className="mt-8 inline-block rounded-md bg-turf px-6 py-3.5 font-semibold text-chalk hover:bg-turf-600">
              Make a free account
            </Link>
          </div>
          <figure className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <figcaption className="flex items-baseline justify-between">
              <span className="font-semibold text-ink">Post-game confidence</span>
              <span className="text-sm text-ink/60">Example season</span>
            </figcaption>
            <ConfidenceExample scores={exampleScores} />
            <div className="mt-2 flex justify-between text-xs text-ink/55">
              <span>Game 1</span>
              <span>Game 12</span>
            </div>
          </figure>
        </div>
      </section>

      {/* ── Mentors and coaches ────────────────────────────────────────── */}
      <section className="bg-ink text-chalk">
        <div className="mx-auto grid max-w-6xl md:grid-cols-2">
          <div className="border-b border-chalk/15 px-5 py-16 sm:px-8 md:border-b-0 md:border-r md:py-24 md:pr-14">
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)]">Want a person in your corner?</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-chalk/75">
              Ask for a mentor: a current or former athlete in your sport who&apos;s dealt with the same pressure. You
              message between games and check in once a week for four weeks.
            </p>
            <p className="mt-4 max-w-md text-base text-chalk/60">
              Mentors are volunteers, so matches can take a few weeks.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/mentorship" className="font-semibold text-whistle underline-offset-[6px] hover:underline">How mentorship works</Link>
              <Link href="/signup?role=mentor" className="font-semibold text-chalk underline-offset-[6px] hover:underline">Become a mentor</Link>
            </div>
          </div>

          <div className="px-5 py-16 sm:px-8 md:py-24 md:pl-14">
            <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)]">Coaches: one code for the whole roster.</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-chalk/75">
              Create a team and drop the join link in your group chat. You see how many players did their routines and
              how the team&apos;s confidence is moving. Never what any one player wrote.
            </p>
            <div className="mt-8 flex max-w-sm items-center justify-between rounded-lg border border-chalk/20 px-5 py-4">
              <div>
                <p className="text-sm text-chalk/60">Your team code</p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-whistle">K7RW4Q</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-chalk/60">This week</p>
                <p className="mt-0.5 text-lg font-semibold">11 of 14 players</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-chalk/50">Example team</p>
            <Link href="/signup?role=coach" className="mt-8 inline-block rounded-md bg-whistle px-6 py-3.5 font-semibold text-ink hover:bg-whistle-300">
              Create a team
            </Link>
          </div>
        </div>
      </section>

      {/* ── Read and listen ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">For the bus ride</h2>
          <Link href="/advice" className="font-semibold text-turf underline-offset-[6px] hover:underline">All articles</Link>
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-2 md:grid-cols-[2fr_1fr]">
          <ul>
            {articles.map((a) => (
              <li key={a.slug} className="border-t border-line">
                <Link href={`/advice/${a.slug}`} className="group block py-6">
                  <p className="text-sm text-ink/60">
                    {[a.category, a.read_time ? `${a.read_time} read` : null].filter(Boolean).join(", ")}
                  </p>
                  <h3 className="type-heading mt-1.5 text-xl text-ink group-hover:text-turf sm:text-2xl">{a.title}</h3>
                  {a.excerpt && <p className="mt-2 line-clamp-2 max-w-2xl text-base text-ink/70">{a.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-8 md:border-l md:border-line md:pl-10">
            <div className="border-t border-line pt-6 md:border-t-0">
              <p className="font-semibold text-ink">The podcast</p>
              <p className="mt-2 text-base text-ink/70">
                {episode ? `Latest: ${episode.title}` : "Conversations with athletes about the mental side of competing."}
              </p>
              <Link href="/podcast" className="mt-3 inline-block font-semibold text-turf underline-offset-[6px] hover:underline">Listen</Link>
            </div>
            <div className="border-t border-line pt-6">
              <p className="font-semibold text-ink">The Mental Rep newsletter</p>
              <p className="mt-2 text-base text-ink/70">One idea you can use, a couple of times a month.</p>
              <div className="mt-4">
                <NewsletterSignup source="home" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[1fr_2fr] md:py-28">
          <h2 className="type-heading text-[clamp(1.75rem,3.4vw,2.6rem)] text-ink">Questions</h2>
          <div>
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-line py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-2xl font-normal text-turf transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ──────────────────────────────────────────────────────── */}
      <section className="bg-turf text-chalk">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 py-16 sm:px-8 md:py-20">
          <h2 className="type-display max-w-2xl text-[clamp(2.25rem,5.5vw,4.25rem)]">Got a game this week?</h2>
          <Link href="/game-day/pregame" className="rounded-md bg-whistle px-7 py-4 text-lg font-semibold text-ink hover:bg-whistle-300">
            Do the 2-minute reset
          </Link>
        </div>
      </section>
    </>
  );
}

function ConfidenceExample({ scores }: { scores: number[] }) {
  const w = 480, h = 200, px = 8, py = 12;
  const x = (i: number) => px + (i * (w - px * 2)) / (scores.length - 1);
  const y = (v: number) => h - py - ((v - 1) * (h - py * 2)) / 9;
  const d = scores.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-6 w-full" role="img" aria-label="Example: confidence rising from 4 out of 10 to 8 out of 10 over twelve games">
      {[1, 5, 10].map((v) => (
        <g key={v}>
          <line x1={px} x2={w - px} y1={y(v)} y2={y(v)} stroke="#D7E0D3" strokeDasharray={v === 5 ? "4 4" : undefined} />
          <text x={w - px} y={y(v) - 5} textAnchor="end" fontSize="11" fill="#40607F">{v}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#0B6E4F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {scores.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === scores.length - 1 ? 6 : 3.5} fill={i === scores.length - 1 ? "#FFC23D" : "#0B6E4F"} stroke={i === scores.length - 1 ? "#12263A" : "none"} strokeWidth="2" />
      ))}
    </svg>
  );
}
