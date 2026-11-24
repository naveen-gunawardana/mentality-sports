"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, Heart, Mic } from "lucide-react";
import { motion, useInView } from "framer-motion";
import dynamic from "next/dynamic";

const Marquee = dynamic(() => import("react-fast-marquee"), { ssr: false });

function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const marqueeWords = [
  "JOIN US",
  "BECOME A MENTOR",
  "VOLUNTEER",
  "SUMMER 2026",
  "INTERNSHIPS",
  "PARTNERSHIPS",
  "PODCAST GUESTS",
  "GIVE BACK",
  "MAKE AN IMPACT",
];

const roles = [
  { title: "Social Media Intern", desc: "Grow our presence, create content, and tell the Mentality story across platforms." },
  { title: "Finance Intern", desc: "Support nonprofit financials, grant tracking, and operational budgeting." },
  { title: "Software Engineer Intern", desc: "Build and improve the Mentality platform used by athletes and mentors." },
  { title: "Outreach Intern", desc: "Connect with schools, coaches, and athletes to expand our reach." },
];

export default function JoinUsPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0a1628] pt-32 pb-20 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "300px",
          }}
        />
        <div
          aria-hidden
          className="absolute right-0 bottom-0 font-bold text-white/[0.025] leading-none select-none pointer-events-none"
          style={{ fontSize: "clamp(10rem, 20vw, 20rem)", lineHeight: 1 }}
        >
          JOIN
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <span className="h-px w-8 bg-orange-400/50" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-400/80">
              Volunteer · Mentor · Partner
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="font-bold leading-[0.92] tracking-tight text-[#f5f0e8] mb-6"
            style={{ fontSize: "clamp(3.2rem, 8vw, 6.5rem)" }}
          >
            Join
            <br />
            <span className="text-[#e8703a] italic">Us</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="text-[15px] text-white/55 leading-relaxed max-w-[460px]"
          >
            Mentor a young athlete, intern with our team, or partner with us — or just tell us you&apos;re interested in helping and we&apos;ll find the right fit. Every role builds the mental health infrastructure athletes never had.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="mailto:officialmentalitysports@gmail.com?subject=Interested in volunteering with Mentality Sports"
              className="group inline-flex items-center gap-2.5 rounded-sm bg-[#e8703a] px-7 py-3.5 text-sm font-bold text-white hover:bg-white hover:text-[#0a1628] transition-colors"
            >
              <Mail className="h-4 w-4" />
              Interested in volunteering? Get in touch
              <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
            <Link
              href="/signup?role=mentor"
              className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-[#f5f0e8] hover:bg-white/10 transition-colors"
            >
              <Heart className="h-4 w-4" /> Become a mentor
            </Link>
            <Link
              href="/podcast/apply"
              className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-[#f5f0e8] hover:bg-white/10 transition-colors"
            >
              <Mic className="h-4 w-4" /> Get on the podcast
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── MARQUEE ──────────────────────────────────────────────────────── */}
      <div className="bg-[#e8703a] py-[10px]">
        <Marquee speed={50} gradient={false}>
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <span
              key={i}
              className="mx-8 inline-flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
            >
              {word}
              <span className="h-1 w-1 rounded-full bg-white/40 shrink-0" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ─── BECOME A MENTOR (featured) ───────────────────────────────────── */}
      <section className="relative bg-[#f5f0e8] py-24 px-6 sm:px-8 overflow-hidden">
        <div
          aria-hidden
          className="absolute right-0 top-0 font-bold text-[#0a1628]/[0.04] leading-none select-none pointer-events-none"
          style={{ fontSize: "clamp(8rem, 16vw, 16rem)", lineHeight: 1 }}
        >
          MENTOR
        </div>

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e8703a] flex items-center gap-3">
              <span className="h-px w-8 bg-[#e8703a]" />
              The #1 Way to Help
            </p>
          </Reveal>

          <Reveal delay={0.05} className="mb-6">
            <h2 className="font-bold text-[#0a1628] tracking-tight" style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)" }}>
              Become a Mentor
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <Reveal delay={0.08} className="space-y-5">
              <p className="text-[16px] text-[#0a1628]/75 leading-relaxed">
                You&apos;ve been through it — the pressure, the doubt, the setbacks. That&apos;s the kind of experience that actually helps a young athlete who&apos;s stuck in the same place you once were.
              </p>
              <p className="text-[15px] text-[#0a1628]/65 leading-relaxed">
                One conversation a week. Real mentorship, not advice from a stranger. We match you with a player whose path looks like yours did.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {["1:1 Match", "Weekly Check-ins", "Flexible", "Lasting Impact"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-sm bg-white border border-[#0a1628]/10 text-[11px] font-bold uppercase tracking-wider text-[#0a1628]/50">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-2">
                <Link
                  href="/signup?role=mentor"
                  className="group inline-flex items-center gap-3 rounded-sm bg-[#e8703a] px-8 py-4 text-sm font-bold text-white hover:bg-[#0a1628] transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Apply to Mentor
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.14} className="space-y-3">
              {[
                { n: "01", title: "Share what you wish you'd known", desc: "Your scars are someone else's shortcut. Talk through pressure, recruiting, injuries, identity — whatever shaped you." },
                { n: "02", title: "Show up consistently", desc: "A short check-in each week. Presence matters more than perfect advice." },
                { n: "03", title: "Help build something bigger", desc: "Every mentor is part of the mental health infrastructure athletes never had — and you're building it with us." },
              ].map((item) => (
                <div key={item.n} className="bg-white border border-[#0a1628]/8 rounded-sm p-5 hover:border-[#e8703a]/30 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-bold text-[#e8703a]/70 mt-0.5 tabular-nums">{item.n}</span>
                    <div>
                      <p className="font-bold text-[#0a1628] text-[14px] mb-1">{item.title}</p>
                      <p className="text-[13px] text-[#0a1628]/55 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="bg-[#f5f0e8] px-6 sm:px-8">
        <div className="mx-auto max-w-7xl border-t border-[#0a1628]/10" />
      </div>

      {/* ─── INTERNSHIP ───────────────────────────────────────────────────── */}
      <section className="bg-[#f5f0e8] py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">

          <Reveal className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e8703a] flex items-center gap-3">
              <span className="h-px w-8 bg-[#e8703a]" />
              Other Ways to Get Involved · Now Accepting Applications
            </p>
          </Reveal>

          <Reveal delay={0.05} className="mb-16">
            <h2 className="font-bold text-[#0a1628] tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
              Summer Internship 2026
            </h2>
          </Reveal>

          {/* Two-col layout: description + roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

            {/* Left: about + apply */}
            <Reveal className="space-y-5">
              <p className="text-[15px] text-[#0a1628]/70 leading-relaxed">
                Mentality Sports is a one-on-one mentorship platform for young athletes — a nonprofit focused on giving back through shared experience. Interns get first-hand experience in a high-speed, team-based, fast-growing organization.
              </p>
              <p className="text-[15px] text-[#0a1628]/70 leading-relaxed">
                At the end of the summer, you&apos;ll receive a personalized letter of recommendation from our CEO.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {["High School Students", "Summer 2026", "Remote-Friendly", "Letter of Rec"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-sm bg-white border border-[#0a1628]/10 text-[11px] font-bold uppercase tracking-wider text-[#0a1628]/50">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-2">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdihrhdqEz2DzImPsV2Ywu0wXM5i27hCpO-wuzrA4tOzrDeWw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-sm bg-[#0a1628] px-8 py-4 text-sm font-bold text-[#f5f0e8] hover:bg-[#e8703a] transition-colors"
                >
                  Apply Now
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </Reveal>

            {/* Right: roles */}
            <Reveal delay={0.1} className="space-y-3">
              {roles.map((role, i) => (
                <div key={role.title} className="bg-white border border-[#0a1628]/8 rounded-sm p-5 hover:border-[#0a1628]/20 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-bold text-[#e8703a]/60 mt-0.5 tabular-nums">0{i + 1}</span>
                    <div>
                      <p className="font-bold text-[#0a1628] text-[14px] mb-1">{role.title}</p>
                      <p className="text-[13px] text-[#0a1628]/50 leading-relaxed">{role.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>

        </div>
      </section>

      {/* ─── PODCAST GUEST ───────────────────────────────────────────────── */}
      <section className="bg-[#f5f0e8] pb-24 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl border-t border-[#0a1628]/10 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Reveal className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e8703a] flex items-center gap-3">
                  <span className="h-px w-8 bg-[#e8703a]" />
                  Share Your Story
                </p>
              </Reveal>
              <Reveal delay={0.05} className="mb-6">
                <h2 className="font-bold text-[#0a1628] tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
                  Get on the Podcast
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-[15px] text-[#0a1628]/70 leading-relaxed max-w-xl">
                  We&apos;re looking for athletes, coaches, and mental performance experts with a story worth telling — the doubt, the pressure, the comebacks. Apply to be a guest and we&apos;ll reach out.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.12} className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/podcast/apply"
                className="group inline-flex items-center gap-3 rounded-sm bg-[#e8703a] px-8 py-4 text-sm font-bold text-white hover:bg-[#0a1628] transition-colors"
              >
                <Mic className="h-4 w-4" />
                Apply to Be a Guest
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                href="/podcast"
                className="inline-flex items-center gap-2 rounded-sm border border-[#0a1628]/15 bg-white px-8 py-4 text-sm font-bold text-[#0a1628] hover:border-[#0a1628]/30 transition-colors"
              >
                Listen to episodes
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── PARTNERSHIPS ─────────────────────────────────────────────────── */}
      <section className="bg-[#0a1628] py-24 px-6 sm:px-8">
        <div
          aria-hidden
          className="absolute pointer-events-none opacity-[0.03] inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "300px",
          }}
        />
        <div className="relative mx-auto max-w-7xl">

          <Reveal className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-400/70 flex items-center gap-3">
              <span className="h-px w-8 bg-orange-400/40" />
              Partner With Us
            </p>
          </Reveal>

          <Reveal delay={0.05} className="mb-6">
            <h2 className="font-bold text-[#f5f0e8] tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
              Let&apos;s build something together.
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mb-12 max-w-xl">
            <p className="text-[15px] text-white/50 leading-relaxed">
              We work with schools, teams, coaches, and organizations who care about athlete mental health. If you&apos;re interested in a partnership — whether that&apos;s bringing Mentality to your program, co-hosting an event, or something else — reach out.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <a
              href="mailto:officialmentalitysports@gmail.com"
              className="group inline-flex items-center gap-3 rounded-sm border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-[#f5f0e8] hover:bg-white/10 transition-colors"
            >
              <Mail className="h-4 w-4" />
              officialmentalitysports@gmail.com
              <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          </Reveal>

        </div>
      </section>

    </div>
  );
}
