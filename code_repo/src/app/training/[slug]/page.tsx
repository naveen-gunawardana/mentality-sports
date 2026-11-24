"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import {
  ArrowLeft,
  PlayCircle,
  Clock,
  User,
  Check,
  CircleCheck,
  Circle,
  Loader2,
  Lock,
  Dumbbell,
} from "lucide-react";

interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  level: string | null;
  category: string | null;
  sport: string | null;
  cover_url: string | null;
  instructor: string | null;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  video_url: string | null;
  duration: string | null;
  sort_order: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const { data: courseRow } = await supabase
        .from("courses")
        .select("id,slug,title,summary,description,level,category,sport,cover_url,instructor")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!active) return;

      if (!courseRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const c = courseRow as unknown as Course;
      setCourse(c);

      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("id,title,slug,content,video_url,duration,sort_order")
        .eq("course_id", c.id)
        .order("sort_order", { ascending: true });

      if (!active) return;

      const ls = (lessonRows ?? []) as unknown as Lesson[];
      setLessons(ls);
      if (ls.length > 0) setActiveId(ls[0].id);

      // Progress (graceful — only if signed in)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (user) {
        setUserId(user.id);
        const { data: progressRows } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id);
        if (!active) return;
        const done = new Set<string>(
          ((progressRows ?? []) as unknown as { lesson_id: string }[]).map((r) => r.lesson_id),
        );
        setCompleted(done);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeId) ?? null,
    [lessons, activeId],
  );

  const completedCount = useMemo(
    () => lessons.filter((l) => completed.has(l.id)).length,
    [lessons, completed],
  );
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  async function toggleComplete(lesson: Lesson) {
    if (!userId || savingId) return;
    const supabase = createClient();
    const isDone = completed.has(lesson.id);
    setSavingId(lesson.id);

    // Optimistic update
    const next = new Set(completed);
    if (isDone) next.delete(lesson.id);
    else next.add(lesson.id);
    setCompleted(next);

    try {
      if (isDone) {
        await supabase
          .from("lesson_progress")
          .delete()
          .eq("user_id", userId)
          .eq("lesson_id", lesson.id);
      } else {
        await supabase.from("lesson_progress").insert({ user_id: userId, lesson_id: lesson.id });
      }
    } catch {
      // Revert on failure
      setCompleted(completed);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-navy/40 text-sm">Loading…</div>;
  }

  if (notFound || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-navy/60 mb-4">This course couldn&apos;t be found.</p>
        <Link href="/training" className="text-sm font-semibold text-orange-600 hover:text-orange-500">
          ← All courses
        </Link>
      </div>
    );
  }

  const activeDone = activeLesson ? completed.has(activeLesson.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/training"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All courses
      </Link>

      {/* Course header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {course.level && (
            <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-navy/8 text-navy">{course.level}</span>
          )}
          {course.category && (
            <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600">{course.category}</span>
          )}
          {course.sport && course.sport !== "General" && (
            <span className="rounded-sm px-2.5 py-0.5 text-xs font-medium bg-navy/8 text-navy">{course.sport}</span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-navy/40">
            <PlayCircle className="h-3 w-3" /> {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-navy font-condensed tracking-tight leading-tight mb-4">
          {course.title}
        </h1>

        {course.instructor && (
          <p className="text-sm text-navy/55 mb-6 inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Taught by <span className="font-semibold text-navy">{course.instructor}</span>
          </p>
        )}

        {course.description ? (
          <div className="prose-content max-w-3xl">{renderMarkdown(course.description)}</div>
        ) : course.summary ? (
          <p className="text-navy/65 leading-relaxed max-w-3xl">{course.summary}</p>
        ) : null}

        {/* Progress bar (signed in) */}
        {userId && lessons.length > 0 && (
          <div className="mt-8 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-navy/40">Your progress</span>
              <span className="text-xs font-bold text-navy">
                {completedCount}/{lessons.length} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-sm bg-offWhite-300 overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-sm border border-dashed border-offWhite-400 bg-offWhite p-10 text-center">
          <PlayCircle className="h-8 w-8 text-navy/20 mx-auto mb-3" />
          <p className="text-navy/55 text-sm font-medium">Lessons are being added to this course.</p>
          <p className="text-navy/40 text-xs mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Lesson list */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-black text-navy font-condensed tracking-widest uppercase">Lessons</h2>
            </div>
            <ol className="space-y-1.5">
              {lessons.map((l, idx) => {
                const isActive = l.id === activeId;
                const isDone = completed.has(l.id);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(l.id)}
                      className={`group flex w-full items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors ${
                        isActive
                          ? "border-orange-300 bg-white"
                          : "border-offWhite-300 bg-offWhite hover:border-orange-300 hover:bg-white"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CircleCheck className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Circle className={`h-4 w-4 ${isActive ? "text-orange-400" : "text-navy/25"}`} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold leading-snug ${
                            isActive ? "text-orange-600" : "text-navy group-hover:text-orange-600"
                          } transition-colors`}
                        >
                          <span className="text-navy/35 tabular-nums">{idx + 1}.</span> {l.title}
                        </span>
                        {l.duration && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-navy/40">
                            <Clock className="h-3 w-3" /> {l.duration}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Active lesson */}
          <div className="min-w-0">
            {activeLesson && (
              <div>
                {activeLesson.video_url ? (
                  <div className="aspect-video w-full overflow-hidden rounded-sm border border-offWhite-300 bg-navy">
                    <iframe
                      src={activeLesson.video_url}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full flex items-center justify-center rounded-sm border border-offWhite-300 bg-[#0c1628]">
                    <div className="text-center">
                      <PlayCircle className="h-10 w-10 text-orange-400/70 mx-auto mb-2" />
                      <p className="text-xs text-white/40 uppercase tracking-widest">Read-along lesson</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    {activeLesson.duration && (
                      <span className="inline-flex items-center gap-1 text-xs text-navy/40 mb-1.5">
                        <Clock className="h-3 w-3" /> {activeLesson.duration}
                      </span>
                    )}
                    <h2 className="text-2xl font-black text-navy font-condensed tracking-tight leading-tight">
                      {activeLesson.title}
                    </h2>
                  </div>

                  {userId ? (
                    <button
                      type="button"
                      onClick={() => toggleComplete(activeLesson)}
                      disabled={savingId === activeLesson.id}
                      className={`inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition-colors shrink-0 disabled:opacity-60 ${
                        activeDone
                          ? "border border-orange-300 bg-orange-50 text-orange-600 hover:bg-white"
                          : "bg-orange-500 hover:bg-orange-400 text-white"
                      }`}
                    >
                      {savingId === activeLesson.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : activeDone ? (
                        <>
                          <Check className="h-4 w-4" /> Completed
                        </>
                      ) : (
                        "Mark complete"
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/signin"
                      className="inline-flex items-center gap-2 rounded-sm border border-offWhite-400 bg-offWhite px-4 py-2.5 text-xs font-medium text-navy/60 hover:text-navy hover:border-navy/20 transition-colors shrink-0"
                    >
                      <Lock className="h-3.5 w-3.5" /> Sign in to track your progress
                    </Link>
                  )}
                </div>

                {activeLesson.content && (
                  <div className="prose-content mt-6 border-t border-offWhite-300 pt-6">
                    {renderMarkdown(activeLesson.content)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
