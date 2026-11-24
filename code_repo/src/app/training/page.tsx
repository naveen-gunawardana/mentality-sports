"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, PlayCircle, ArrowRight, User } from "lucide-react";
import { NewsletterSignup } from "@/components/newsletter-signup";

interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string | null;
  category: string | null;
  sport: string | null;
  cover_url: string | null;
  instructor: string | null;
}

function CourseCard({ c, lessonCount }: { c: Course; lessonCount?: number }) {
  return (
    <Link
      href={`/training/${c.slug}`}
      className="group flex flex-col rounded-sm border border-offWhite-300 bg-offWhite hover:border-orange-300 hover:bg-white transition-colors overflow-hidden"
    >
      {/* Cover / placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-navy">
        {c.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.cover_url}
            alt={c.title}
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-[#0c1628]">
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center font-black text-white/[0.04] leading-none select-none pointer-events-none font-condensed"
              style={{ fontSize: "clamp(4rem, 16vw, 9rem)" }}
            >
              TRAIN
            </div>
            <Dumbbell className="relative h-9 w-9 text-orange-400/80" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-navy/0 group-hover:bg-navy/20 transition-colors">
          <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {c.level && (
            <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-navy/8 text-navy">{c.level}</span>
          )}
          {c.category && (
            <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600">{c.category}</span>
          )}
        </div>

        <h3 className="font-black text-navy font-condensed tracking-tight text-xl leading-tight mb-2 group-hover:text-orange-600 transition-colors">
          {c.title}
        </h3>

        {c.summary && (
          <p className="text-sm text-navy/55 leading-relaxed mb-4 line-clamp-3">{c.summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-offWhite-300">
          <div className="flex items-center gap-3 min-w-0">
            {c.instructor && (
              <span className="inline-flex items-center gap-1.5 text-xs text-navy/50 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.instructor}</span>
              </span>
            )}
            {typeof lessonCount === "number" && lessonCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-navy/40 shrink-0">
                <PlayCircle className="h-3.5 w-3.5" /> {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy/40 group-hover:text-orange-500 transition-colors shrink-0">
            Start <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,slug,title,summary,level,category,sport,cover_url,instructor")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

      if (!active) return;
      const list = (data ?? []) as unknown as Course[];
      setCourses(list);

      if (list.length > 0) {
        const { data: lessonRows } = await supabase
          .from("lessons")
          .select("course_id")
          .in("course_id", list.map((c) => c.id));

        if (!active) return;
        const counts = new Map<string, number>();
        ((lessonRows ?? []) as unknown as { course_id: string }[]).forEach((row) => {
          counts.set(row.course_id, (counts.get(row.course_id) ?? 0) + 1);
        });
        setLessonCounts(counts);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
        Courses are <span className="text-white font-semibold">launching soon</span> — free, self-paced, and built for athletes. Join the list to hear first.
      </div>

      {/* Hero */}
      <div className="relative bg-[#0c1628] overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 right-[-2rem] -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed"
          style={{ fontSize: "clamp(10rem, 24vw, 26rem)" }}
        >
          TRAIN
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="block bg-orange-400 w-8 h-px" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">Train the body &amp; the mind</span>
          </div>
          <h1
            className="font-black text-white font-condensed tracking-tight leading-none mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            TRAINING &amp; COURSES
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed">
            Self-paced video courses and training plans that build the body and the mind together — confidence reps, pressure routines, strength blocks, and recovery. Watch anytime, move at your own pace, and track every lesson you finish.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Dumbbell className="h-5 w-5 text-orange-500" />
          <h2 className="text-2xl font-black text-navy font-condensed tracking-wide">COURSES</h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-navy/40 text-sm">Loading courses…</div>
        ) : courses.length === 0 ? (
          /* Coming-soon centerpiece */
          <div className="relative overflow-hidden rounded-sm bg-[#0c1628] px-6 py-16 sm:px-12 sm:py-20 text-center">
            <div
              aria-hidden
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed whitespace-nowrap"
              style={{ fontSize: "clamp(7rem, 20vw, 18rem)" }}
            >
              SOON
            </div>
            <div className="relative z-10 mx-auto max-w-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-orange-500/15 border border-orange-500/20 mb-6">
                <Dumbbell className="h-7 w-7 text-orange-400" />
              </div>
              <p className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em] mb-4">Coming soon</p>
              <h3 className="font-black text-white font-condensed tracking-tight leading-none mb-5" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
                COURSES ARE<br />ON THE WAY
              </h3>
              <p className="text-white/55 text-[15px] leading-relaxed mb-8">
                We&apos;re building self-paced video courses on the mental and physical game — confidence reps, pressure routines, strength blocks, and recovery. The first drop is coming soon.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-9">
                {["Confidence reps", "Pressure routines", "Pre-game prep", "Strength blocks", "Recovery & sleep"].map((t) => (
                  <span key={t} className="bg-white/5 px-3 py-1 border border-white/8 rounded-full text-[11px] text-white/45 uppercase tracking-wider">{t}</span>
                ))}
              </div>
              <div className="max-w-md mx-auto text-left">
                <p className="text-white/70 text-sm font-semibold mb-3 text-center">Be first to know when courses launch</p>
                <NewsletterSignup source="training" showName theme="dark" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <CourseCard key={c.id} c={c} lessonCount={lessonCounts.get(c.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
