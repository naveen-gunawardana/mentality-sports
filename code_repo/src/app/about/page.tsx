"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import dynamic from "next/dynamic";

const Marquee = dynamic(() => import("react-fast-marquee"), { ssr: false });

// ── Scroll reveal ─────────────────────────────────────────────────────────────
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

// ── 3-D tilt card ─────────────────────────────────────────────────────────────
function TiltCard({
  src,
  name,
  role,
  badge,
  delay,
}: {
  src: string;
  name: string;
  role: string;
  badge?: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const cardRef = useRef(null);
  const inView = useInView(cardRef, { once: true, margin: "-40px" });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        whileHover={{ scale: 1.03 }}
        transition={{ scale: { duration: 0.25 } }}
        className="group cursor-default"
      >
        <div
          className={`relative aspect-[3/4] overflow-hidden ${badge ? "ring-2 ring-orange-400 ring-offset-2" : ""}`}
          style={{ borderRadius: 2 }}
        >
          <Image
            src={src}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          {badge && (
            <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 px-0.5">
          <p className="font-bold text-navy text-sm tracking-tight">{name}</p>
          <p className="text-xs text-navy/45 uppercase tracking-[0.1em] font-semibold mt-0.5">{role}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const team = [
  { src: "/team/reid.png",   name: "Reid",   role: "Head of Outreach",  badge: ""           },
  { src: "/team/tj.png",     name: "TJ",     role: "CFO",              badge: ""            },
  { src: "/team/naveen.png", name: "Naveen", role: "CEO",              badge: "Founder"     },
  { src: "/team/juli.png",   name: "Juli",   role: "CMO",              badge: "Co-Founder"  },
  { src: "/team/peter.png",  name: "Peter",  role: "COO",              badge: ""            },
  { src: "/team/logan.png",  name: "Logan",  role: "President",        badge: ""            },
];

const values = [
  {
    n: "01",
    title: "Athlete to athlete",
    body: "Every mentor on this platform is a current or former athlete. That's not a marketing line — it's the only reason any of this works.",
  },
  {
    n: "02",
    title: "Real relationships, not programs",
    body: "We don't sell a curriculum or a coaching module. We create conditions for a real relationship between two people who share something important.",
  },
  {
    n: "03",
    title: "The mental game is the game",
    body: "Confidence, identity, anxiety, resilience — these aren't soft skills. They're the difference between an athlete who thrives and one who disappears.",
  },
  {
    n: "04",
    title: "Give back, no strings",
    body: "Our mentors volunteer their time. No pay, no perks. They're here because someone should have been there for them — and often wasn't.",
  },
];

const strip = [
  "Athlete to Athlete", "Nonprofit", "Mental Performance", "No Cost Ever",
  "All Sports", "Real Relationships", "Giving Back", "Built by Athletes",
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO / MISSION ──────────────────────────────────────────────────── */}
      <section className="relative bg-navy overflow-hidden">
        {/* Grain */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "300px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — mission */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400/80 mb-6 flex items-center gap-3"
              >
                <span className="h-px w-6 bg-orange-400/50" />
                Who we are
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black text-white leading-[0.95] tracking-tight"
              >
                Built by<br />
                athletes.<br />
                <span className="text-orange-400">For athletes.</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/signup?role=player"
                  className="group inline-flex items-center gap-2 bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
                >
                  Find a Mentor
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/signup?role=mentor"
                  className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-bold text-white/70 hover:text-white hover:border-white/40 transition-colors"
                >
                  Apply to Mentor
                </Link>
              </motion.div>
            </div>

            {/* Right — story pull-quote */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="border-l-2 border-orange-500/40 pl-8 space-y-5"
            >
              <p className="text-white/80 text-lg leading-relaxed font-medium">
                The best conversations athletes have about the mental side of sport don&apos;t happen in a therapist&apos;s office or a team meeting.
              </p>
              <p className="text-white/45 text-base leading-relaxed">
                They happen between athletes — after a loss, in a locker room, on a long drive home. We built Mentality Sports to create those conversations at scale.
              </p>
              <p className="text-white/45 text-base leading-relaxed">
                Every mentor is someone who competed at the level above, lived through the same pressures, and chose to come back and help the next generation navigate it. No cost to athletes. No curriculum. No corporate script.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STRIP ───────────────────────────────────────────────────────────── */}
      <div className="bg-orange-500 py-3 overflow-hidden">
        <Marquee speed={38} gradient={false} pauseOnHover>
          {strip.map((s) => (
            <span key={s} className="mx-8 text-[11px] font-black uppercase tracking-[0.18em] text-white/90">
              {s} <span className="mx-4 opacity-40">·</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── TEAM ────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-16 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-500 mb-3 flex items-center gap-3">
                <span className="h-px w-6 bg-orange-400" />
                The people behind it
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tight leading-tight">
                The Team
              </h2>
              <p className="text-navy/40 mt-3 text-sm max-w-sm leading-relaxed">
                Former athletes, operators, and people who believe the mental side of sport deserves more than it gets.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8 items-end">
            {team.map((member, i) => (
              <div key={member.name} className={member.name === "Naveen" ? "sm:-mt-8" : ""}>
                <TiltCard
                  src={member.src}
                  name={member.name}
                  role={member.role}
                  badge={member.badge}
                  delay={i * 0.08}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-offWhite">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-500 mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-orange-400" />
              What drives us
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tight">What we believe</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-offWhite-300">
            {values.map((v, i) => (
              <Reveal key={v.n} delay={i * 0.07}>
                <div className="bg-white p-8 lg:p-10 h-full group hover:bg-navy transition-colors duration-300">
                  <p className="text-5xl font-black text-offWhite-400 group-hover:text-white/10 transition-colors leading-none mb-6 select-none">
                    {v.n}
                  </p>
                  <h3 className="text-lg font-bold text-navy group-hover:text-white transition-colors mb-3">
                    {v.title}
                  </h3>
                  <p className="text-sm text-navy/55 group-hover:text-white/60 transition-colors leading-relaxed">
                    {v.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-navy">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400 mb-5 flex items-center gap-3">
                <span className="h-px w-6 bg-orange-400/50" />
                Get involved
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                You belong here.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Whether you&apos;re an athlete who needs this, or a former athlete who wants to give back — the door is open.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="space-y-3">
              <Link
                href="/signup?role=player"
                className="group flex items-center justify-between bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-400 transition-colors text-sm"
              >
                I&apos;m an athlete — find me a mentor
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/signup?role=mentor"
                className="group flex items-center justify-between bg-white/8 border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/12 transition-colors text-sm"
              >
                I want to be a mentor
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  );
}
