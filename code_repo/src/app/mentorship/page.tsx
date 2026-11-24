import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, ArrowUpRight, UserPlus, ClipboardList, Users, TrendingUp,
  MessageCircle, PenLine, Target, BookOpen, Heart, Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "1-on-1 Mentorship | Mentality Sports",
  description:
    "Get matched with a current or former athlete who's lived the same mental battles. A free, focused 1-month 1-on-1 mentorship — four weekly sessions on confidence, pressure, identity, and more.",
  alternates: { canonical: "https://mentalitysports.com/mentorship" },
};

const steps = [
  { n: "01", title: "Create an account", desc: "Sign up in under a minute — just your name and email. That's all it takes to get in the door.", Icon: UserPlus },
  { n: "02", title: "Apply to be matched", desc: "Once you're in, tell us your sport, level, and what you're working through. This is your application — the more honest, the better the match.", Icon: ClipboardList },
  { n: "03", title: "We review & match", desc: "A real person reads every application and pairs you with a mentor whose background fits yours. You'll get an email when you're matched.", Icon: Users },
  { n: "04", title: "Work the month", desc: "Four weekly 1-on-1 sessions. You'll pick one mental goal and work it together — messaging between calls, logging reflections, tracking progress. When the month's done, you can re-enroll.", Icon: TrendingUp },
];

const features = [
  { title: "A real mentor", desc: "Matched with a current or former athlete whose experience fits yours. Four weekly sessions over a month — not a one-time call.", Icon: Users },
  { title: "Private messaging", desc: "A direct line to your mentor between sessions. Ask questions and work through things as they happen.", Icon: MessageCircle },
  { title: "Reflection journal", desc: "Log your mental state, wins, and struggles. Share what you want — your mentor follows up accordingly.", Icon: PenLine },
  { title: "Weekly mental goals", desc: "Set and track effort, focus, and attitude goals with your mentor — the stuff that never shows up in box scores.", Icon: Target },
  { title: "Session tracking", desc: "Every check-in logged with topics and follow-ups, so nothing gets lost between conversations.", Icon: BookOpen },
  { title: "Always free", desc: "Mentors volunteer their time. No cost, no subscriptions, no algorithm — built to give back.", Icon: Heart },
];

export default function MentorshipPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        1-on-1 Mentorship is <span className="text-white font-semibold">100% free</span> — one month, four weekly sessions, athlete to athlete.
      </div>

      {/* Hero */}
      <section className="relative bg-[#0c1628] overflow-hidden">
        <div aria-hidden className="absolute top-1/2 right-[-2rem] -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed" style={{ fontSize: "clamp(10rem, 22vw, 26rem)" }}>MENTOR</div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="block bg-orange-400 w-10 h-px" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">The flagship program</span>
          </div>
          <h1 className="font-black text-white font-condensed tracking-tight leading-[0.9] mb-6" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
            1-ON-1<br />MENTORSHIP
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed mb-9">
            Get paired with a current or former athlete who played through the same mental battles you&apos;re facing right now — anxiety, confidence, identity, playing time, coming back from injury. Real people. Real experience. Free. One focused month — four weekly 1-on-1 sessions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup?role=player" className="group inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-400 px-7 py-4 font-bold text-white text-sm transition-colors" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              Apply to be matched <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/signup?role=mentor" className="group inline-flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.12] px-7 py-4 border border-white/20 font-bold text-white text-sm transition-colors" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              Become a mentor <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-offWhite py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-14">
            <p className="mb-3 font-bold text-[11px] text-orange-500 uppercase tracking-[0.22em]">How it works</p>
            <h2 className="font-black text-navy font-condensed leading-none" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}>
              FROM SIGNUP TO<br />A REAL RELATIONSHIP.
            </h2>
            <p className="mt-4 max-w-xl text-navy/55 leading-relaxed">
              Creating an account and applying are two separate steps — signing up just gets you in the door. The application is where you tell us about yourself so we can match you well.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="relative flex flex-col bg-white border border-offWhite-300 rounded-sm p-7 overflow-hidden">
                <div aria-hidden className="absolute top-0 right-2 font-black text-navy/[0.05] leading-none select-none pointer-events-none font-condensed" style={{ fontSize: "5rem" }}>{s.n}</div>
                <div className="relative z-10 flex items-center justify-center bg-orange-500/10 rounded-lg w-11 h-11 mb-5">
                  <s.Icon className="w-5 h-5 text-orange-500" />
                </div>
                <p className="relative z-10 mb-1 font-bold text-[10px] text-navy/30 uppercase tracking-widest">Step {s.n}</p>
                <h3 className="relative z-10 mb-2 font-black text-navy text-lg font-condensed tracking-wide">{s.title.toUpperCase()}</h3>
                <p className="relative z-10 text-[13px] text-navy/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-white py-24 border-t border-offWhite-300">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-12">
            <p className="mb-3 font-bold text-[11px] text-orange-500 uppercase tracking-[0.22em]">What you get</p>
            <h2 className="font-black text-navy font-condensed leading-none" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}>
              MORE THAN A CALL.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-sm border border-offWhite-300 bg-offWhite p-7">
                <div className="flex items-center justify-center bg-navy/8 rounded-lg w-11 h-11 mb-5">
                  <f.Icon className="w-5 h-5 text-navy" />
                </div>
                <h3 className="mb-2 font-black text-navy text-lg font-condensed tracking-wide">{f.title.toUpperCase()}</h3>
                <p className="text-[13px] text-navy/55 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor CTA band */}
      <section className="relative bg-navy overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 24px)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16">
          <div className="flex items-start gap-6">
            <div className="flex items-center justify-center bg-orange-500/15 border border-orange-500/20 rounded-xl w-14 h-14 shrink-0">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="mb-1.5 font-bold text-[11px] text-orange-400 uppercase tracking-[0.22em]">Came through it?</p>
              <h2 className="mb-2 font-black text-white font-condensed" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>BECOME A MENTOR</h2>
              <p className="max-w-md text-[14px] text-white/45 leading-relaxed">About 15 minutes a week. Your experience is the most valuable thing you can give the next athlete coming up.</p>
            </div>
          </div>
          <Link href="/signup?role=mentor" className="group inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 px-7 py-3.5 font-bold text-white text-sm transition-colors shrink-0" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
            Apply to mentor <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-orange-500">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16 text-center">
          <h2 className="font-black text-white italic font-condensed leading-[0.9] mb-6" style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}>
            FIND YOUR TEAMMATE.
          </h2>
          <Link href="/signup?role=player" className="inline-flex items-center gap-2 bg-white px-7 py-4 font-bold text-orange-600 text-sm hover:bg-white/90 transition-colors">
            Get started — it&apos;s free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
