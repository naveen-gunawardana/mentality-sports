import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PROGRAMS, type Program } from "@/lib/programs";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const metadata = {
  title: "Programs · Mentality Sports",
  description:
    "Every part of the mental game, in one place — 1-on-1 mentorship, resources, a newsletter, and a podcast. All free.",
};

function statusPill(status: Program["status"], dark: boolean) {
  if (status === "new") {
    return (
      <span className="inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-semibold bg-orange-500 text-white tracking-wide">
        New
      </span>
    );
  }
  if (status === "soon") {
    return (
      <span
        className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${
          dark ? "bg-white/10 text-white/55" : "bg-navy/8 text-navy/45"
        }`}
      >
        Coming soon
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${
        dark ? "bg-white/10 text-white/70" : "bg-navy/8 text-navy"
      }`}
    >
      Available now
    </span>
  );
}

function ctaLabel(status: Program["status"]) {
  if (status === "soon") return "Get notified";
  if (status === "new") return "Join";
  return "Explore";
}

/** Flagship card — navy fill, spans two columns on larger screens. */
function FeatureCard({ p }: { p: Program }) {
  const Icon = p.Icon;
  return (
    <Link
      href={p.href}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-navy bg-navy p-7 sm:p-8 transition-colors hover:border-orange-400 md:col-span-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-10 select-none font-condensed font-black leading-none text-white/[0.04]"
        style={{ fontSize: "clamp(7rem, 16vw, 13rem)" }}
      >
        01
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-orange-500/15 text-orange-400">
            <Icon className="h-6 w-6" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
            <Sparkles className="h-3 w-3" /> Flagship
          </span>
          <div className="ml-auto">{statusPill(p.status, true)}</div>
        </div>

        <h3 className="font-condensed text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          {p.title}
        </h3>
        <p className="mt-1.5 text-sm font-semibold text-orange-400">{p.tagline}</p>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">{p.description}</p>

        <span className="mt-7 inline-flex w-fit items-center gap-2 bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-orange-400">
          {ctaLabel(p.status)}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ProgramCard({ p, index }: { p: Program; index: number }) {
  const Icon = p.Icon;
  return (
    <Link
      href={p.href}
      className="group relative flex flex-col rounded-sm border border-offWhite-300 bg-offWhite p-6 transition-colors hover:border-orange-300 hover:bg-white"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
        {statusPill(p.status, false)}
      </div>

      <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-navy/30">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="font-condensed text-2xl font-black uppercase leading-none tracking-tight text-navy transition-colors group-hover:text-orange-600">
        {p.title}
      </h3>
      <p className="mt-1.5 text-sm font-semibold text-orange-600">{p.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/55">{p.description}</p>

      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-navy/45 transition-colors group-hover:text-orange-500">
        {ctaLabel(p.status)}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function ProgramsPage() {
  const [flagship, ...rest] = PROGRAMS;

  return (
    <div>
      {/* Announcement bar */}
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        Mentality Sports is now a <span className="text-white font-semibold">full platform</span> — mentorship, resources, a newsletter, and a podcast.{" "}
        <span className="text-orange-400 font-semibold">All free.</span>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0c1628]">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-[-2rem] -translate-y-1/2 select-none font-condensed font-black leading-none text-white/[0.03]"
          style={{ fontSize: "clamp(9rem, 22vw, 24rem)" }}
        >
          PROGRAMS
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
          <div className="mb-5 flex items-center gap-3">
            <span className="block h-px w-8 bg-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400">
              One platform · Every part of the mental game
            </span>
          </div>
          <h1
            className="mb-6 font-condensed font-black uppercase leading-none tracking-tight text-white"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            Everything We Do
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-white/55">
            We started with one thing: pairing athletes 1-on-1 with mentors who&apos;ve lived the
            same mental battles. It worked — so we kept building. Today Mentality Sports is a home
            for the whole mental side of sport: a resource library, a newsletter, a podcast, and
            more on the way. Pick a door below. Every one of them is free.
          </p>
        </div>
      </div>

      {/* Programs grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <h2 className="font-condensed text-2xl font-black tracking-wide text-navy">
            THE PROGRAMS
          </h2>
          <div className="h-px flex-1 bg-offWhite-300" />
          <span className="text-xs font-medium text-navy/40">{PROGRAMS.length} ways in</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flagship && <FeatureCard p={flagship} />}
          {rest.map((p, i) => (
            <ProgramCard key={p.key} p={p} index={i + 2} />
          ))}
        </div>
      </div>

      {/* Closing CTA band */}
      <div className="bg-navy">
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
          <div className="mb-5 flex items-center gap-3">
            <span className="block h-px w-8 bg-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400">
              Stay close
            </span>
          </div>
          <h2 className="font-condensed text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl">
            New programs drop regularly
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            Join the newsletter and you&apos;ll be the first to hear when a new session, course, or
            program goes live — plus one practical idea for the mental game, a couple times a month.
          </p>
          <div className="mt-7 max-w-xl">
            <NewsletterSignup source="programs" theme="dark" showName />
          </div>
        </div>
      </div>
    </div>
  );
}
