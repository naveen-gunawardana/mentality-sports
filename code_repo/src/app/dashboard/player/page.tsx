"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarClock, BookOpen, X, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogSessionForm } from "@/components/log-session-form";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChatWindow, type ChatWindowHandle } from "@/components/chat-window";
import { useCallPresence } from "@/hooks/use-call-presence";
import { ScheduleCallModal } from "@/components/schedule-call-modal";
import { IcebreakerOverlay } from "@/components/icebreaker-overlay";
import { StarterChips } from "@/components/starter-chips";
import { FirstCallCard } from "@/components/first-call-card";
import { PostSessionNudge } from "@/components/post-session-nudge";
import { DashboardRightPanel } from "@/components/dashboard-right-panel";
import { ProgramArc } from "@/components/program-arc";
import { CertificateRequest } from "@/components/certificate-request";
import { MentalRepsPanel } from "@/components/mental-reps-panel";
import { MentorRequestCard } from "@/components/mentor-request-card";
import { TeamCard } from "@/components/team-card";

interface Profile { name: string; sport: string[] | null; avatar_url: string | null }
interface PlayerProfile { challenges: string[] | null; goal: string | null; grade: string | null; school: string | null; level: string[] | null }
interface MentorInfo { id: string; name: string; sport: string[] | null; avatar_url: string | null }
interface MentorExtras { bio: string | null; why: string | null; skills: string[] | null; playing_level: string[] | null }
interface MatchData { id: string; meeting_url: string | null; created_at: string; program_start: string | null; program_end: string | null; status: string | null; mentor: MentorInfo }
interface CompletedMatch { id: string; mentor: MentorInfo }
interface SessionRecord { id: string; date: string | null; topics: string[] | null }
interface RecommendedArticle { slug: string; title: string; read_time: string | null }

export default function PlayerDashboard() {
  const [logOpen, setLogOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [mentor, setMentor] = useState<MentorInfo | null>(null);
  const [mentorExtras, setMentorExtras] = useState<MentorExtras | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [programEnd, setProgramEnd] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [completedMatch, setCompletedMatch] = useState<CompletedMatch | null>(null);
  const [reenrolling, setReenrolling] = useState(false);
  const { startCall, showPostCallBanner, dismissPostCallBanner } = useCallPresence(matchId);
  const [userId, setUserId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<RecommendedArticle[]>([]);
  const [, setMessageCount] = useState(0);
  const [scheduledCallCount, setScheduledCallCount] = useState(0);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [chipRotateKey, setChipRotateKey] = useState(0);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const chatRef = useRef<ChatWindowHandle | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from("profiles").select("name, sport, avatar_url").eq("id", user.id).single();
      setProfile(profileData);

      const { data: playerProfileData } = await supabase
        .from("player_profiles").select("challenges, goal, grade, school, level").eq("id", user.id).single();
      setPlayerProfile(playerProfileData);

      const { data: matchData } = await supabase
        .from("matches")
        .select("id, meeting_url, created_at, program_start, program_end, status, mentor:mentor_id(id, name, sport, avatar_url)")
        .eq("player_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (matchData) {
        const md = matchData as unknown as MatchData;
        setMatchId(md.id);
        setMentor(md.mentor);
        setProgramEnd(md.program_end);

        const { count: doneCount } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("match_id", md.id);
        setSessionCount(doneCount ?? 0);

        const { data: extras } = await supabase
          .from("mentor_profiles")
          .select("bio, why, skills, playing_level")
          .eq("id", md.mentor.id)
          .single();
        setMentorExtras(extras as MentorExtras | null);

        const { data: sessionData } = await supabase
          .from("sessions")
          .select("id, date, topics")
          .eq("match_id", md.id)
          .order("date", { ascending: false })
          .limit(5);
        setRecentSessions((sessionData ?? []) as SessionRecord[]);

        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", md.id);
        setMessageCount(msgCount ?? 0);

        const { count: callCount } = await supabase
          .from("scheduled_calls")
          .select("id", { count: "exact", head: true })
          .eq("match_id", md.id)
          .gte("scheduled_at", new Date().toISOString());
        setScheduledCallCount(callCount ?? 0);
      } else {
        // No active program — surface a recently completed one (archive + re-enroll).
        const { data: completed } = await supabase
          .from("matches")
          .select("id, mentor:mentor_id(id, name, sport, avatar_url)")
          .eq("player_id", user.id)
          .eq("status", "completed")
          .order("program_end", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (completed) {
          setCompletedMatch(completed as unknown as CompletedMatch);
        }
      }

      const { data: articleData } = await supabase
        .from("resources")
        .select("slug, title, read_time")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      setRecommendedArticles((articleData ?? []) as RecommendedArticle[]);

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    let seen = false;
    try { seen = localStorage.getItem(`icebreaker_seen_${matchId}`) === "1"; } catch {}
    if (!seen) setShowIcebreaker(true);
  }, [matchId]);

  async function handleReenroll() {
    setReenrolling(true);
    const res = await fetch("/api/reenroll", { method: "POST" });
    if (res.ok) {
      window.location.reload();
    } else {
      setReenrolling(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Entering the locker room...</div>;
  }

  if (!matchId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-navy">Locker Room</h1>
          <p className="text-muted-foreground mt-1">Welcome, {profile?.name?.split(" ")[0]}.</p>
        </div>
        {completedMatch ? (
          <>
            <div className="rounded-lg border-2 border-sage-300 bg-sage-50 p-6 mb-4 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 shrink-0">
                <CalendarClock className="h-5 w-5 text-sage-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy">Your program with {completedMatch.mentor.name.split(" ")[0]} is complete 🎉</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Four sessions, one month — nice work. Want another month of 1-on-1 with {completedMatch.mentor.name.split(" ")[0]}? Pick up right where you left off.
                </p>
                <Button onClick={handleReenroll} disabled={reenrolling} variant="secondary" className="mt-3">
                  {reenrolling ? "Re-enrolling…" : "Re-enroll for another month"}
                </Button>
              </div>
            </div>
            {userId && (
              <CertificateRequest userId={userId} role="mentee" matchId={completedMatch.id} programInfo={`Mentored by ${completedMatch.mentor.name}`} className="mb-4" />
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-2">Your conversation</p>
            {userId && (
              <div className="mb-8">
                <ChatWindow
                  matchId={completedMatch.id}
                  currentUserId={userId}
                  otherUserId={completedMatch.mentor.id}
                  otherPersonName={completedMatch.mentor.name}
                  otherPersonAvatarUrl={completedMatch.mentor.avatar_url}
                  readOnly
                />
              </div>
            )}
          </>
        ) : null}
        {userId && (
          <div className="space-y-4 mb-10">
            <MentalRepsPanel playerId={userId} />
            <TeamCard playerId={userId} />
            {!completedMatch && (
              <MentorRequestCard
                playerId={userId}
                initialChallenges={playerProfile?.challenges ?? null}
                initialGoal={playerProfile?.goal ?? null}
              />
            )}
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-4">Reading for between games</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {recommendedArticles.map((res) => (
              <Link key={res.slug} href={`/advice/${res.slug}`}
                className="flex items-start gap-3 rounded-lg border p-4 hover:bg-offWhite transition-colors">
                <BookOpen className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-navy leading-snug">{res.title}</p>
                  {res.read_time && <p className="text-xs text-muted-foreground mt-1">{res.read_time} read</p>}
                </div>
              </Link>
            ))}
          </div>
          <Button asChild variant="secondary"><Link href="/advice">View all advice</Link></Button>
        </div>
      </div>
    );
  }

  if (logOpen && matchId && userId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LogSessionForm
          matchId={matchId}
          userId={userId}
          otherPersonName={mentor?.name ?? ""}
          onCancel={() => setLogOpen(false)}
          onSuccess={() => { setLogOpen(false); setRefreshKey(k => k + 1); }}
        />
      </div>
    );
  }

  const recentSession = recentSessions.find(s => {
    if (!s.date || !s.topics || s.topics.length === 0) return false;
    const ageDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 7;
  }) ?? null;

  const needsFirstCall = scheduledCallCount === 0 && recentSessions.length === 0;

  return (
    <div
      key={refreshKey}
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 flex flex-col h-[calc(100dvh-3.5rem)] pb-6 bg-offWhite/20"
    >
      {showIcebreaker && matchId && userId && mentor && (
        <IcebreakerOverlay
          matchId={matchId}
          currentUserId={userId}
          role="mentee"
          myFirstName={profile?.name?.split(" ")[0] ?? "there"}
          otherFirstName={mentor.name.split(" ")[0]}
          menteeChallenges={playerProfile?.challenges ?? []}
          onSent={() => { setShowIcebreaker(false); setMessageCount(c => c + 1); }}
          onSkip={() => setShowIcebreaker(false)}
        />
      )}

      <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-3.5">
          {userId && (
            <AvatarUpload userId={userId} name={profile?.name ?? ""} avatarUrl={profile?.avatar_url ?? null} />
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">Locker room</p>
            <h1 className="text-xl font-bold text-navy tracking-tight leading-tight mt-0.5">Welcome back, {profile?.name?.split(" ")[0]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Link
          href="/game-day"
          className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-navy/15 bg-white hover:bg-offWhite text-navy px-3 h-9 text-[12px] font-bold uppercase tracking-[0.1em] transition-all"
        >
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          Game Day
        </Link>
        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          aria-label="Schedule a call"
          className="md:hidden inline-flex items-center gap-1.5 rounded-full ring-1 ring-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 h-9 text-[12px] font-bold uppercase tracking-[0.1em] transition-all"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Call
        </button>
        </div>
      </div>

      <ProgramArc done={sessionCount} programEnd={programEnd} className="mb-4 shrink-0" />

      {sessionCount >= 4 && matchId && userId && (
        <CertificateRequest userId={userId} role="mentee" matchId={matchId} programInfo={mentor ? `Mentored by ${mentor.name}` : undefined} className="mb-4 shrink-0" />
      )}

      {showPostCallBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-sage-300 bg-sage-50 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-sage-800">Just finished your call? Log it while it&apos;s fresh.</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white h-7 text-xs" onClick={() => { dismissPostCallBanner(); setLogOpen(true); }}>
              Log session
            </Button>
            <button type="button" onClick={dismissPostCallBanner} className="text-sage-500 hover:text-sage-700 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      {showScheduleModal && matchId && userId && mentor && (
        <ScheduleCallModal
          matchId={matchId}
          currentUserId={userId}
          otherPersonId={mentor.id}
          otherPersonName={mentor.name}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => { setScheduleRefreshKey(k => k + 1); setScheduledCallCount(c => c + 1); }}
        />
      )}

      {matchId && userId && mentor && (
        <div className="flex-1 flex gap-6 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <ChatWindow
              ref={chatRef}
              matchId={matchId}
              currentUserId={userId}
              otherUserId={mentor.id}
              otherPersonName={mentor.name}
              otherPersonAvatarUrl={mentor.avatar_url}
              fullHeight
              onMessageSent={() => { setChipRotateKey(k => k + 1); setMessageCount(c => c + 1); }}
              topSlot={needsFirstCall ? <FirstCallCard onSchedule={() => setShowScheduleModal(true)} /> : undefined}
              bottomSlot={
                <>
                  {recentSession && recentSession.topics && (
                    <PostSessionNudge
                      sessionId={recentSession.id}
                      topics={recentSession.topics}
                      role="mentee"
                      onPick={(text) => chatRef.current?.setDraft(text)}
                    />
                  )}
                  <StarterChips
                    userId={userId}
                    role="mentee"
                    challenges={playerProfile?.challenges ?? []}
                    rotateKey={chipRotateKey}
                    onPick={(text) => chatRef.current?.setDraft(text)}
                  />
                </>
              }
            />
          </div>
          <aside className="hidden md:block w-[340px] shrink-0 overflow-y-auto pr-1">
            <DashboardRightPanel
              role="mentee"
              matchId={matchId}
              currentUserId={userId}
              scheduleRefreshKey={scheduleRefreshKey}
              onScheduleClick={() => setShowScheduleModal(true)}
              onJoinCall={() => startCall()}
              onLogSession={() => setLogOpen(true)}
              needsFirstCall={needsFirstCall}
              mentor={{
                id: mentor.id,
                name: mentor.name,
                sport: mentor.sport,
                avatar_url: mentor.avatar_url,
                bio: mentorExtras?.bio ?? null,
                why: mentorExtras?.why ?? null,
                skills: mentorExtras?.skills ?? null,
                playing_level: mentorExtras?.playing_level ?? null,
              }}
            />
          </aside>
        </div>
      )}

      {mobileInfoOpen && matchId && userId && mentor && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end" onClick={() => setMobileInfoOpen(false)}>
          <div className="absolute inset-0 bg-navy/40" />
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-offWhite-300 flex items-center justify-between px-4 py-3 z-10">
              <p className="font-bold text-navy text-sm">Match info</p>
              <button type="button" onClick={() => setMobileInfoOpen(false)} aria-label="Close" className="text-navy/40 hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <DashboardRightPanel
                role="mentee"
                matchId={matchId}
                currentUserId={userId}
                scheduleRefreshKey={scheduleRefreshKey}
                onScheduleClick={() => { setShowScheduleModal(true); setMobileInfoOpen(false); }}
                onJoinCall={() => { startCall(); setMobileInfoOpen(false); }}
                onLogSession={() => { setLogOpen(true); setMobileInfoOpen(false); }}
                needsFirstCall={needsFirstCall}
                mentor={{
                  id: mentor.id,
                  name: mentor.name,
                  sport: mentor.sport,
                  avatar_url: mentor.avatar_url,
                  bio: mentorExtras?.bio ?? null,
                  why: mentorExtras?.why ?? null,
                  skills: mentorExtras?.skills ?? null,
                  playing_level: mentorExtras?.playing_level ?? null,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
