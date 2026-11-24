"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, PenLine, X, CalendarClock, FileText } from "lucide-react";
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

interface PlayerProfile { grade: string | null; school: string | null; level: string[] | null; challenges: string[] | null; goal: string | null }
interface Mentee { id: string; name: string; sport: string[] | null; avatar_url: string | null; player_profiles: PlayerProfile | null }
interface Match { id: string; meeting_url: string | null; created_at: string; program_start: string | null; program_end: string | null; status: string | null; player: Mentee }
interface SessionRecord { id: string; date: string | null; topics: string[] | null }
interface ShareArticle { slug: string; title: string; read_time: string | null }

export default function MentorDashboard() {
  const [logOpen, setLogOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentorName, setMentorName] = useState("");
  const [mentorSport, setMentorSport] = useState<string | null>(null);
  const [mentorLevel, setMentorLevel] = useState<string | null>(null);
  const [mentorAvatarUrl, setMentorAvatarUrl] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [programEnd, setProgramEnd] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [shareArticles, setShareArticles] = useState<ShareArticle[]>([]);
  const [, setMessageCount] = useState(0);
  const [scheduledCallCount, setScheduledCallCount] = useState(0);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [chipRotateKey, setChipRotateKey] = useState(0);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [refreshSessionsKey, setRefreshSessionsKey] = useState(0);

  const chatRef = useRef<ChatWindowHandle | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles").select("name, sport, avatar_url").eq("id", user.id).single();
      setMentorName(profile?.name ?? "");
      setMentorAvatarUrl(profile?.avatar_url ?? null);
      setMentorSport(profile?.sport?.[0] ?? null);

      const { data: mentorProfile } = await supabase
        .from("mentor_profiles").select("approved, playing_level").eq("id", user.id).single();
      setApproved(mentorProfile?.approved ?? false);
      setMentorLevel(mentorProfile?.playing_level?.[0] ?? null);

      const { data: matchData } = await supabase
        .from("matches")
        .select("id, meeting_url, created_at, program_start, program_end, status, player:player_id(id, name, sport, avatar_url, player_profiles(grade, school, level, challenges, goal))")
        .eq("mentor_id", user.id)
        .eq("status", "active");

      const typedMatches = (matchData ?? []) as unknown as Match[];
      setMatches(typedMatches);

      if (typedMatches.length > 0) {
        const firstMatchId = typedMatches[0].id;
        setProgramEnd(typedMatches[0].program_end);

        const { data: sessionData } = await supabase
          .from("sessions")
          .select("id, date, topics")
          .eq("match_id", firstMatchId)
          .order("date", { ascending: false })
          .limit(5);
        setRecentSessions((sessionData ?? []) as SessionRecord[]);

        const { count: doneCount } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("match_id", firstMatchId);
        setSessionCount(doneCount ?? 0);

        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", firstMatchId);
        setMessageCount(msgCount ?? 0);

        const { count: callCount } = await supabase
          .from("scheduled_calls")
          .select("id", { count: "exact", head: true })
          .eq("match_id", firstMatchId)
          .gte("scheduled_at", new Date().toISOString());
        setScheduledCallCount(callCount ?? 0);
      }

      const { data: articleData } = await supabase
        .from("resources")
        .select("slug, title, read_time")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      setShareArticles((articleData ?? []) as ShareArticle[]);

      setLoading(false);
    }
    load();
  }, []);

  const activeMatch = matches.find(m => m.player != null) ?? null;

  const { startCall, showPostCallBanner, dismissPostCallBanner } = useCallPresence(activeMatch?.id ?? null);

  const recentSession = recentSessions.find(s => {
    if (!s.date || !s.topics || s.topics.length === 0) return false;
    const ageDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 7;
  }) ?? null;

  useEffect(() => {
    if (!activeMatch || !approved) return;
    let seen = false;
    try { seen = localStorage.getItem(`icebreaker_seen_${activeMatch.id}`) === "1"; } catch {}
    if (!seen) setShowIcebreaker(true);
  }, [activeMatch, approved]);

  const needsFirstCall = activeMatch != null && scheduledCallCount === 0 && recentSessions.length === 0;

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Entering the locker room...</div>;
  }

  if (logOpen && selectedMatchId && userId) {
    const mentee = matches.find(m => m.id === selectedMatchId)?.player;
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LogSessionForm
          matchId={selectedMatchId}
          userId={userId}
          otherPersonName={mentee?.name ?? ""}
          onCancel={() => { setLogOpen(false); setSelectedMatchId(null); }}
          onSuccess={() => { setLogOpen(false); setSelectedMatchId(null); setRefreshSessionsKey(k => k + 1); }}
        />
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-navy">Locker Room</h1>
          <p className="text-muted-foreground mt-1">Hey {mentorName.split(" ")[0]}.</p>
        </div>
        <div className="rounded-lg border-2 border-gold-200 bg-gold-50 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 shrink-0">
            <Clock className="h-5 w-5 text-gold-500" />
          </div>
          <div>
            <p className="font-semibold text-navy">Application under review</p>
            <p className="text-sm text-muted-foreground mt-1">Our team reviews every mentor before they&apos;re matched with an athlete. You&apos;ll get an email once you&apos;re approved — usually within a few days.</p>
          </div>
        </div>
        <div className="space-y-3">
          {shareArticles.map((res) => (
            <Link key={res.slug} href={`/advice/${res.slug}`}
              className="flex items-start gap-3 rounded-lg border p-4 hover:bg-offWhite transition-colors">
              <BookOpen className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-navy leading-snug">{res.title}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!activeMatch?.player) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-navy">Locker Room</h1>
          <p className="text-muted-foreground mt-1">Hey {mentorName.split(" ")[0]}.</p>
        </div>
        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 shrink-0">
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-navy">You&apos;re approved — waiting on a match</p>
            <p className="text-sm text-muted-foreground mt-1">We&apos;re looking for the right athlete for you. Once matched, you&apos;ll see your mentee here.</p>
          </div>
        </div>
        <div className="rounded-lg border border-offWhite-300 bg-white p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-navy text-sm">Share your experience with the community</p>
            <p className="text-xs text-muted-foreground mt-0.5">Submit an article to the advice library.</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/advice/submit"><PenLine className="h-3.5 w-3.5 mr-1.5" />Give Advice</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      key={refreshSessionsKey}
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 flex flex-col h-[calc(100dvh-3.5rem)] pb-6 bg-offWhite/20"
    >
      {showIcebreaker && userId && (
        <IcebreakerOverlay
          matchId={activeMatch.id}
          currentUserId={userId}
          role="mentor"
          myFirstName={mentorName.split(" ")[0] || "there"}
          otherFirstName={activeMatch.player.name.split(" ")[0]}
          mySport={mentorSport}
          myLevel={mentorLevel}
          onSent={() => { setShowIcebreaker(false); setMessageCount(c => c + 1); }}
          onSkip={() => setShowIcebreaker(false)}
        />
      )}

      <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-3.5">
          {userId && (
            <AvatarUpload userId={userId} name={mentorName} avatarUrl={mentorAvatarUrl} />
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">Locker room</p>
            <h1 className="text-xl font-bold text-navy tracking-tight leading-tight mt-0.5">Welcome back, {mentorName.split(" ")[0]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            aria-label="Schedule a call"
            className="md:hidden inline-flex items-center gap-1.5 rounded-full ring-1 ring-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 h-9 text-[12px] font-bold uppercase tracking-[0.1em] transition-all"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Call
          </button>
          <Button size="sm" variant="outline" className="hidden sm:flex" asChild>
            <Link href="/dashboard/mentor/transcript"><FileText className="h-3.5 w-3.5 mr-1.5" />Transcript</Link>
          </Button>
          <Button size="sm" variant="outline" className="hidden sm:flex" asChild>
            <Link href="/advice/submit"><PenLine className="h-3.5 w-3.5 mr-1.5" />Give Advice</Link>
          </Button>
        </div>
      </div>

      <ProgramArc done={sessionCount} programEnd={programEnd} className="mb-4 shrink-0" />

      {sessionCount >= 4 && activeMatch && userId && (
        <CertificateRequest userId={userId} role="mentor" matchId={activeMatch.id} programInfo={`Mentored ${activeMatch.player.name}`} className="mb-4 shrink-0" />
      )}

      {showPostCallBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-sage-300 bg-sage-50 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-sage-800">Just finished your call? Log it while it&apos;s fresh.</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white h-7 text-xs"
              onClick={() => { dismissPostCallBanner(); setSelectedMatchId(activeMatch.id); setLogOpen(true); }}>
              Log session
            </Button>
            <button type="button" onClick={dismissPostCallBanner} className="text-sage-500 hover:text-sage-700 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      {showScheduleModal && userId && (
        <ScheduleCallModal
          matchId={activeMatch.id}
          currentUserId={userId}
          otherPersonId={activeMatch.player.id}
          otherPersonName={activeMatch.player.name}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => { setScheduleRefreshKey(k => k + 1); setScheduledCallCount(c => c + 1); }}
        />
      )}

      {/* Main: chat + right panel */}
      {userId && (
        <div className="flex-1 flex gap-6 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <ChatWindow
              ref={chatRef}
              matchId={activeMatch.id}
              currentUserId={userId}
              otherUserId={activeMatch.player.id}
              otherPersonName={activeMatch.player.name}
              otherPersonAvatarUrl={activeMatch.player.avatar_url}
              fullHeight
              onMessageSent={() => { setChipRotateKey(k => k + 1); setMessageCount(c => c + 1); }}
              topSlot={needsFirstCall ? <FirstCallCard onSchedule={() => setShowScheduleModal(true)} /> : undefined}
              bottomSlot={
                <>
                  {recentSession && recentSession.topics && (
                    <PostSessionNudge
                      sessionId={recentSession.id}
                      topics={recentSession.topics}
                      role="mentor"
                      onPick={(text) => chatRef.current?.setDraft(text)}
                    />
                  )}
                  <StarterChips
                    userId={userId}
                    role="mentor"
                    rotateKey={chipRotateKey}
                    onPick={(text) => chatRef.current?.setDraft(text)}
                  />
                </>
              }
            />
          </div>
          <aside className="hidden md:block w-[340px] shrink-0 overflow-y-auto pr-1">
            <DashboardRightPanel
              role="mentor"
              matchId={activeMatch.id}
              currentUserId={userId}
              scheduleRefreshKey={scheduleRefreshKey}
              onScheduleClick={() => setShowScheduleModal(true)}
              onJoinCall={() => startCall()}
              onLogSession={() => { setSelectedMatchId(activeMatch.id); setLogOpen(true); }}
              needsFirstCall={needsFirstCall}
              mentee={{
                id: activeMatch.player.id,
                name: activeMatch.player.name,
                sport: activeMatch.player.sport,
                avatar_url: activeMatch.player.avatar_url,
                grade: activeMatch.player.player_profiles?.grade ?? null,
                school: activeMatch.player.player_profiles?.school ?? null,
                challenges: activeMatch.player.player_profiles?.challenges ?? null,
                goal: activeMatch.player.player_profiles?.goal ?? null,
              }}
            />
          </aside>
        </div>
      )}

      {mobileInfoOpen && userId && (
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
                role="mentor"
                matchId={activeMatch.id}
                currentUserId={userId}
                scheduleRefreshKey={scheduleRefreshKey}
                onScheduleClick={() => { setShowScheduleModal(true); setMobileInfoOpen(false); }}
                onJoinCall={() => { startCall(); setMobileInfoOpen(false); }}
                onLogSession={() => { setSelectedMatchId(activeMatch.id); setLogOpen(true); setMobileInfoOpen(false); }}
                needsFirstCall={needsFirstCall}
                mentee={{
                  id: activeMatch.player.id,
                  name: activeMatch.player.name,
                  sport: activeMatch.player.sport,
                  avatar_url: activeMatch.player.avatar_url,
                  grade: activeMatch.player.player_profiles?.grade ?? null,
                  school: activeMatch.player.player_profiles?.school ?? null,
                  challenges: activeMatch.player.player_profiles?.challenges ?? null,
                  goal: activeMatch.player.player_profiles?.goal ?? null,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
