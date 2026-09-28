"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminOutreachView from "./outreach-view";
import Link from "next/link";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, X, Link2, BookOpen, Mail, Trash2, Activity, Clock, Video, Dumbbell, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlayerProfile {
  age: number | null; school: string | null; grade: string | null;
  level: string[] | null; location: string | null; challenges: string[] | null;
  goal: string | null; availability: string | null;
  parent_name: string | null; parent_email: string | null; parent_phone: string | null;
}
interface MentorProfile {
  institution: string | null; playing_level: string[] | null; location: string | null;
  years_played: number | null; skills: string[] | null; why: string | null;
  bio: string | null; mentee_age_pref: string | null; availability: string | null; approved: boolean;
}
interface Person {
  id: string; name: string; role: string; sport: string[] | null; created_at: string | null;
  player_profiles: PlayerProfile | null;
  mentor_profiles: MentorProfile | null;
}
interface Match { id: string; status: string; created_at: string | null; meeting_url: string | null; player: Person; mentor: Person }
interface FlaggedSession { id: string; date: string | null; flag_reason: string | null; match_id: string; player_name: string; mentor_name: string }
interface PendingArticle { id: string; title: string; category: string | null; excerpt: string | null; content: string; submitted_by_name: string | null; created_at: string | null }

type MatchFilter = "all" | "matched" | "unmatched";

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [players, setPlayers] = useState<Person[]>([]);
  const [mentors, setMentors] = useState<Person[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [flagged, setFlagged] = useState<FlaggedSession[]>([]);
  const [nudges, setNudges] = useState<{ matchId: string; playerName: string; mentorName: string; matchCreatedAt: string | null; daysSince: number | null }[]>([]);
  const [allSessions, setAllSessions] = useState<{ id: string; date: string | null; match_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [expandedMentorId, setExpandedMentorId] = useState<string | null>(null);
  const [matchingPlayer, setMatchingPlayer] = useState<Person | null>(null);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [copiedMatchId, setCopiedMatchId] = useState<string | null>(null);
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([]);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [articleAction, setArticleAction] = useState<string | null>(null);

  // Email + delete state
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filter state
  const [playerSportFilter, setPlayerSportFilter] = useState("all");
  const [mentorSportFilter, setMentorSportFilter] = useState("all");
  const [playerMatchFilter, setPlayerMatchFilter] = useState<MatchFilter>("all");
  const [mentorMatchFilter, setMentorMatchFilter] = useState<MatchFilter>("all");

  async function load() {
    const res = await fetch("/api/admin/data");
    if (!res.ok) { setLoading(false); return; }
    const { profiles, matches: rawMatches, sessions, articles } = await res.json();

    const all = (profiles ?? []) as unknown as Person[];
    setPlayers(all.filter(p => p.role === "player"));
    setMentors(all.filter(p => p.role === "mentor"));

    const typedMatches = (rawMatches ?? []) as unknown as Match[];
    setMatches(typedMatches);

    const typedSessions = (sessions ?? []) as { id: string; date: string | null; flagged: boolean; flag_reason: string | null; match_id: string }[];
    setAllSessions(typedSessions.map(s => ({ id: s.id, date: s.date, match_id: s.match_id })));
    const flaggedSessions = typedSessions.filter(s => s.flagged);
    setFlagged(flaggedSessions.map(s => {
      const match = typedMatches.find(m => m.id === s.match_id);
      return { id: s.id, date: s.date, flag_reason: s.flag_reason, match_id: s.match_id,
        player_name: match?.player?.name ?? "Unknown", mentor_name: match?.mentor?.name ?? "Unknown" };
    }));

    setPendingArticles((articles ?? []) as PendingArticle[]);

    // Nudges: active matches with no sessions or last session > 14 days ago
    const NOW = Date.now();
    const nudgeItems = typedMatches
      .filter(m => m.status === "active")
      .map(m => {
        const matchSessions = (sessions ?? []).filter((s: { match_id: string; date: string | null }) => s.match_id === m.id && s.date);
        const lastDate = matchSessions.length > 0
          ? Math.max(...matchSessions.map((s: { date: string }) => new Date(s.date).getTime()))
          : null;
        const daysSince = lastDate ? Math.floor((NOW - lastDate) / (1000 * 60 * 60 * 24)) : null;
        return { matchId: m.id, playerName: m.player?.name ?? "Unknown", mentorName: m.mentor?.name ?? "Unknown", matchCreatedAt: m.created_at, daysSince };
      })
      .filter(n => n.daysSince === null || n.daysSince > 14);
    setNudges(nudgeItems);

    setLoading(false);
  }

  async function loadEmails() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const { emails: data } = await res.json();
        setEmails(data ?? {});
      }
    } catch {
      // emails are best-effort
    }
  }

  async function reviewArticle(id: string, action: "published" | "rejected") {
    setArticleAction(id);
    const supabase = createClient();
    await supabase.from("resources").update({
      status: action,
      ...(action === "published" ? { published_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    setPendingArticles(prev => prev.filter(a => a.id !== id));
    setArticleAction(null);
    setExpandedArticleId(null);
  }

  async function deleteUser(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) {
      setPlayers(prev => prev.filter(p => p.id !== id));
      setMentors(prev => prev.filter(m => m.id !== id));
      setExpandedPlayerId(null);
      setExpandedMentorId(null);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserRole(user?.app_metadata?.role ?? null);
    });
    load();
    loadEmails();
  }, []);

  const activeMatches = matches.filter(m => m.status === "active");
  const matchedPlayerIds = new Set(activeMatches.map(m => m.player?.id));
  const matchedMentorIds = new Set(activeMatches.map(m => m.mentor?.id));
  const pendingMentors = mentors.filter(m => !m.mentor_profiles?.approved);
  const approvedMentors = mentors.filter(m => m.mentor_profiles?.approved);

  const today = Date.now();
  const inactiveMatches = activeMatches
    .map(match => {
      const matchSessions = allSessions.filter(s => s.match_id === match.id);
      if (matchSessions.length === 0) return { match, label: "No sessions yet", daysSince: null as number | null };
      const latestDate = Math.max(...matchSessions.map(s => s.date ? new Date(s.date).getTime() : 0));
      const daysSince = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
      if (daysSince > 14) return { match, label: `${daysSince} days since last session`, daysSince };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Unique sports for filter dropdowns
  const playerSports = Array.from(new Set(players.flatMap(p => p.sport ?? []).filter(Boolean))) as string[];
  const mentorSports = Array.from(new Set(mentors.flatMap(m => m.sport ?? []).filter(Boolean))) as string[];

  const daysWaiting = (p: Person) =>
    p.created_at ? Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86_400_000) : 0;
  const waitingCount = players.filter(p => !matchedPlayerIds.has(p.id)).length;

  // Filtered lists — athletes still waiting first, longest wait at the top.
  const filteredPlayers = players.filter(p => {
    if (playerSportFilter !== "all" && !p.sport?.includes(playerSportFilter)) return false;
    if (playerMatchFilter === "matched" && !matchedPlayerIds.has(p.id)) return false;
    if (playerMatchFilter === "unmatched" && matchedPlayerIds.has(p.id)) return false;
    return true;
  }).sort((a, b) => {
    const aWaiting = !matchedPlayerIds.has(a.id), bWaiting = !matchedPlayerIds.has(b.id);
    if (aWaiting !== bWaiting) return aWaiting ? -1 : 1;
    return aWaiting ? daysWaiting(b) - daysWaiting(a) : 0;
  });

  const filteredMentors = mentors.filter(m => {
    if (mentorSportFilter !== "all" && !m.sport?.includes(mentorSportFilter)) return false;
    if (mentorMatchFilter === "matched" && !matchedMentorIds.has(m.id)) return false;
    if (mentorMatchFilter === "unmatched" && matchedMentorIds.has(m.id)) return false;
    return true;
  });

  function getPlayerMatch(playerId: string) {
    return activeMatches.find(m => m.player?.id === playerId);
  }
  function getMentorMatches(mentorId: string) {
    return activeMatches.filter(m => m.mentor?.id === mentorId);
  }

  async function createMatch(mentorId: string) {
    if (!matchingPlayer) return;
    setCreating(true);
    setCreateMsg("");
    const res = await fetch("/api/admin/create-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: matchingPlayer.id, mentorId }),
    });
    const json = await res.json();
    if (!res.ok) { setCreateMsg(`Error: ${json.error}`); }
    else {
      const mentor = mentors.find(m => m.id === mentorId);
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match_created",
          playerEmail: emails[matchingPlayer.id],
          playerName: matchingPlayer.name,
          mentorEmail: emails[mentorId],
          mentorName: mentor?.name ?? "Your mentor",
        }),
      });
      setMatchingPlayer(null);
      setCreateMsg("");
      await load();
    }
    setCreating(false);
  }

  async function endMatch(matchId: string) {
    await fetch("/api/admin/create-match", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    await load();
  }

  async function approveMentor(mentorId: string) {
    setApprovingId(mentorId);
    const mentor = mentors.find(m => m.id === mentorId);
    const res = await fetch("/api/admin/approve-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, mentorName: mentor?.name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Failed to approve mentor: ${body.error ?? res.status}`);
    }
    setApprovingId(null);
    await load();
  }

  function togglePlayer(id: string) { setExpandedPlayerId(prev => prev === id ? null : id); }
  function toggleMentor(id: string) { setExpandedMentorId(prev => prev === id ? null : id); }
  function fmt(iso: string | null) { return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
  function jitsiUrl(matchId: string) { return `https://meet.jit.si/mentality-${matchId.replace(/-/g, "").slice(0, 20)}`; }
  function copyLink(matchId: string) {
    navigator.clipboard.writeText(jitsiUrl(matchId));
    setCopiedMatchId(matchId);
    setTimeout(() => setCopiedMatchId(null), 2000);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading admin...</div>;

  if (userRole === "outreach" || userRole === "operations") {
    return <AdminOutreachView players={players} mentors={mentors} matches={matches} emails={emails} role={userRole} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy text-white text-xs font-bold">A</div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Admin</h1>
            <p className="text-xs text-muted-foreground">Mentality Sports — internal only</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/analytics"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <Activity className="h-3.5 w-3.5" /> Analytics
          </Link>
          <Link href="/admin/content"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <BookOpen className="h-3.5 w-3.5" /> Content
          </Link>
          <Link href="/admin/group-sessions"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <Video className="h-3.5 w-3.5" /> Sessions
          </Link>
          <Link href="/admin/newsletter"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <Mail className="h-3.5 w-3.5" /> Newsletter
          </Link>
          <Link href="/admin/courses"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <Dumbbell className="h-3.5 w-3.5" /> Courses
          </Link>
          <Link href="/admin/podcast"
            className="inline-flex items-center gap-1.5 rounded-md border border-offWhite-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
            <Mic className="h-3.5 w-3.5" /> Podcast
          </Link>
        </div>
        <div className="flex gap-4 text-center">
          {[
            { label: "Players", value: players.length },
            { label: "Waiting", value: waitingCount },
            { label: "Mentors", value: mentors.length },
            { label: "Matches", value: activeMatches.length },
            { label: "Approvals", value: pendingMentors.length },
            { label: "Flagged", value: flagged.length },
            { label: "For Review", value: pendingArticles.length },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold text-navy">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-navy mb-2">Delete user?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete{" "}
              <span className="font-medium text-navy">
                {players.find(p => p.id === confirmDeleteId)?.name ?? mentors.find(m => m.id === confirmDeleteId)?.name ?? "this user"}
              </span>{" "}
              and log them out immediately. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-offWhite-300 px-4 py-2 text-sm font-medium text-navy hover:bg-offWhite transition-colors">
                Cancel
              </button>
              <button type="button" onClick={() => deleteUser(confirmDeleteId)} disabled={deletingId === confirmDeleteId}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match picker overlay */}
      {matchingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Matching with</p>
                <h2 className="text-lg font-bold text-navy">{matchingPlayer.name}</h2>
              </div>
              <button type="button" onClick={() => setMatchingPlayer(null)} aria-label="Close" className="p-2 hover:bg-muted rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm font-medium text-navy/60 mb-3">Select a mentor:</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {approvedMentors.map(m => {
                const playerCount = getMentorMatches(m.id).length;
                return (
                  <button key={m.id} type="button" onClick={() => createMatch(m.id)} disabled={creating}
                    className="w-full text-left rounded-lg border border-offWhite-300 p-3 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-navy">{m.name}</p>
                      {playerCount > 0 && (
                        <span className="text-xs text-muted-foreground">{playerCount} player{playerCount !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.sport?.join(", ") ?? "—"}{m.mentor_profiles?.institution ? ` · ${m.mentor_profiles.institution}` : ""}{m.mentor_profiles?.playing_level?.length ? ` · ${m.mentor_profiles.playing_level.join(", ")}` : ""}</p>
                  </button>
                );
              })}
              {approvedMentors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No approved mentors</p>
              )}
            </div>
            {createMsg && <p className="mt-3 text-sm text-red-500">{createMsg}</p>}
          </div>
        </div>
      )}

      {/* Flagged sessions */}
      {flagged.length > 0 && (
        <Card className="mb-8 border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" /> {flagged.length} Flagged Session{flagged.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-offWhite-300">
              {flagged.map(s => (
                <div key={s.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{s.player_name} <span className="text-muted-foreground font-normal">with</span> {s.mentor_name}</p>
                    {s.flag_reason && <p className="text-xs text-red-700 mt-0.5">{s.flag_reason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{fmt(s.date)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive match nudges */}
      {inactiveMatches.length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" /> {inactiveMatches.length} Match{inactiveMatches.length !== 1 ? "es" : ""} Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-offWhite-300">
              {inactiveMatches.map(({ match, label }) => (
                <div key={match.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{match.player?.name} <span className="text-muted-foreground font-normal">with</span> {match.mentor?.name}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{label}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{fmt(match.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentor nudges */}
      {nudges.length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" /> {nudges.length} Match{nudges.length !== 1 ? "es" : ""} Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-offWhite-300">
              {nudges.map(n => (
                <div key={n.matchId} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{n.playerName} <span className="text-muted-foreground font-normal">with</span> {n.mentorName}</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {n.daysSince === null ? "No sessions yet" : `${n.daysSince} days since last session`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">Matched {fmt(n.matchCreatedAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending articles */}
      {pendingArticles.length > 0 && (
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <BookOpen className="h-4 w-4" /> {pendingArticles.length} Article{pendingArticles.length !== 1 ? "s" : ""} Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingArticles.map(article => {
                const isExpanded = expandedArticleId === article.id;
                return (
                  <div key={article.id} className="rounded-lg border border-orange-100 overflow-hidden">
                    <button type="button" onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-50/50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-navy">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {article.submitted_by_name ?? "Unknown"}{article.category ? ` · ${article.category}` : ""} · {fmt(article.created_at)}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-orange-100 px-4 pb-4 pt-3 space-y-3">
                        {article.excerpt && (
                          <p className="text-sm text-navy/70 italic">{article.excerpt}</p>
                        )}
                        <div className="rounded-md bg-offWhite p-3 max-h-60 overflow-y-auto">
                          <pre className="text-xs text-navy/70 whitespace-pre-wrap font-sans leading-relaxed">{article.content}</pre>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => reviewArticle(article.id, "published")}
                            disabled={articleAction === article.id}
                            className="flex items-center gap-1.5 rounded-md bg-sage-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-700 transition-colors disabled:opacity-50">
                            <CheckCircle className="h-3.5 w-3.5" /> Publish
                          </button>
                          <button type="button" onClick={() => reviewArticle(article.id, "rejected")}
                            disabled={articleAction === article.id}
                            className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Players */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40">Players ({filteredPlayers.length}/{players.length})</p>
          </div>
          {/* Player filters */}
          <div className="flex gap-2 mb-4">
            <select value={playerSportFilter} onChange={e => setPlayerSportFilter(e.target.value)}
              className="flex-1 rounded-md border border-offWhite-300 bg-white px-2.5 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy">
              <option value="all">All sports</option>
              {playerSports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={playerMatchFilter} onChange={e => setPlayerMatchFilter(e.target.value as MatchFilter)}
              className="flex-1 rounded-md border border-offWhite-300 bg-white px-2.5 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy">
              <option value="all">All statuses</option>
              <option value="matched">Matched</option>
              <option value="unmatched">Waiting</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredPlayers.map(p => {
              const match = getPlayerMatch(p.id);
              const isExpanded = expandedPlayerId === p.id;
              const pp = p.player_profiles;
              const email = emails[p.id];
              return (
                <div key={p.id} className={`rounded-lg border transition-colors ${match ? "border-offWhite-300" : "border-orange-200"}`}>
                  <button type="button" onClick={() => togglePlayer(p.id)} className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/10 text-navy text-sm font-bold shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sport?.join(", ") ?? "—"}{pp?.grade ? ` · ${pp.grade}` : ""}{pp?.school ? ` · ${pp.school}` : ""}{pp?.location ? ` · ${pp.location}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {match
                        ? <Badge variant="default" className="text-xs">Matched</Badge>
                        : <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Waiting {daysWaiting(p)}d</Badge>
                      }
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-offWhite-300 px-4 pb-4 pt-3 space-y-3">
                      {/* Email */}
                      {email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a href={`mailto:${email}`} className="text-xs text-navy/70 hover:text-navy underline underline-offset-2 transition-colors truncate">{email}</a>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {pp?.age && <div><p className="text-xs text-muted-foreground">Age</p><p className="font-medium text-navy">{pp.age}</p></div>}
                        {pp?.grade && <div><p className="text-xs text-muted-foreground">Grade</p><p className="font-medium text-navy">{pp.grade}</p></div>}
                        {pp?.level?.length ? <div className="col-span-2"><p className="text-xs text-muted-foreground">Level(s)</p><p className="font-medium text-navy">{pp.level.join(", ")}</p></div> : null}
                        {pp?.location && <div><p className="text-xs text-muted-foreground">State</p><p className="font-medium text-navy">{pp.location}</p></div>}
                        {pp?.school && <div className="col-span-2"><p className="text-xs text-muted-foreground">School / Team</p><p className="font-medium text-navy">{pp.school}</p></div>}
                        {pp?.availability && <div className="col-span-2"><p className="text-xs text-muted-foreground">Availability</p><p className="font-medium text-navy">{pp.availability}</p></div>}
                      </div>
                      {(pp?.parent_name || pp?.parent_email || pp?.parent_phone) && (
                        <div className="rounded-md border border-orange-100 bg-orange-50/40 px-3 py-2.5 space-y-1">
                          <p className="text-xs font-semibold text-orange-700">Parent / Guardian</p>
                          {pp.parent_name && <p className="text-xs text-navy">{pp.parent_name}</p>}
                          {pp.parent_email && (
                            <a href={`mailto:${pp.parent_email}`} className="block text-xs text-navy/70 underline underline-offset-2 hover:text-navy transition-colors">{pp.parent_email}</a>
                          )}
                          {pp.parent_phone && <p className="text-xs text-navy/70">{pp.parent_phone}</p>}
                        </div>
                      )}
                      {pp?.challenges && pp.challenges.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Challenges</p>
                          <div className="flex flex-wrap gap-1.5">{pp.challenges.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div>
                        </div>
                      )}
                      {pp?.goal && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Goal</p>
                          <p className="text-sm text-navy">{pp.goal}</p>
                        </div>
                      )}
                      {match && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Video call link (auto-generated)</p>
                          <div className="flex gap-2 items-center">
                            <a href={jitsiUrl(match.id)} target="_blank" rel="noopener noreferrer"
                              className="flex-1 truncate text-xs text-navy/60 underline underline-offset-2 hover:text-navy transition-colors">
                              {jitsiUrl(match.id)}
                            </a>
                            <button type="button" onClick={() => copyLink(match.id)}
                              className="shrink-0 rounded-md border border-offWhite-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors">
                              {copiedMatchId === match.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 flex items-center gap-2">
                        {match ? (
                          <>
                            <p className="text-xs text-muted-foreground flex-1">Matched with <span className="font-medium text-navy">{match.mentor?.name}</span> since {fmt(match.created_at)}</p>
                            <button type="button" onClick={() => endMatch(match.id)}
                              className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">
                              <X className="h-3 w-3" /> End match
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setMatchingPlayer(p)}
                            className="flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/80 transition-colors">
                            <Link2 className="h-3.5 w-3.5" /> Match now
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[10px] text-muted-foreground">Joined {fmt(p.created_at)}</p>
                        <button type="button" onClick={() => setConfirmDeleteId(p.id)}
                          className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete user
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredPlayers.length === 0 && <p className="text-sm text-muted-foreground">No players match filters.</p>}
          </div>
        </div>

        {/* Mentors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40">Mentors ({filteredMentors.length}/{mentors.length})</p>
          </div>
          {/* Mentor filters */}
          <div className="flex gap-2 mb-4">
            <select value={mentorSportFilter} onChange={e => setMentorSportFilter(e.target.value)}
              className="flex-1 rounded-md border border-offWhite-300 bg-white px-2.5 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy">
              <option value="all">All sports</option>
              {mentorSports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={mentorMatchFilter} onChange={e => setMentorMatchFilter(e.target.value as MatchFilter)}
              className="flex-1 rounded-md border border-offWhite-300 bg-white px-2.5 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy">
              <option value="all">All statuses</option>
              <option value="matched">Active (matched)</option>
              <option value="unmatched">Available / Pending</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredMentors.map(m => {
              const mentorMatches = getMentorMatches(m.id);
              const isExpanded = expandedMentorId === m.id;
              const mp = m.mentor_profiles;
              const email = emails[m.id];
              return (
                <div key={m.id} className={`rounded-lg border transition-colors ${!mp?.approved ? "border-gold-300" : mentorMatches.length > 0 ? "border-offWhite-300" : "border-sage-200"}`}>
                  <button type="button" onClick={() => toggleMentor(m.id)} className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-sm font-bold shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.sport?.join(", ") ?? "—"}{mp?.institution ? ` · ${mp.institution}` : ""}{mp?.playing_level?.length ? ` · ${mp.playing_level.join(", ")}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {!mp?.approved
                        ? <Badge variant="outline" className="text-xs border-gold-400 text-gold-600">Pending</Badge>
                        : mentorMatches.length > 0
                          ? <Badge variant="default" className="text-xs">{mentorMatches.length} player{mentorMatches.length !== 1 ? "s" : ""}</Badge>
                          : <Badge variant="outline" className="text-xs border-sage-300 text-sage-600">Available</Badge>
                      }
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-offWhite-300 px-4 pb-4 pt-3 space-y-3">
                      {/* Email */}
                      {email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a href={`mailto:${email}`} className="text-xs text-navy/70 hover:text-navy underline underline-offset-2 transition-colors truncate">{email}</a>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {mp?.playing_level?.length ? <div className="col-span-2"><p className="text-xs text-muted-foreground">Playing level(s)</p><p className="font-medium text-navy">{mp.playing_level.join(", ")}</p></div> : null}
                        {mp?.years_played && <div><p className="text-xs text-muted-foreground">Years played</p><p className="font-medium text-navy">{mp.years_played}</p></div>}
                        {mp?.location && <div><p className="text-xs text-muted-foreground">State</p><p className="font-medium text-navy">{mp.location}</p></div>}
                        {mp?.mentee_age_pref && <div><p className="text-xs text-muted-foreground">Prefers mentoring</p><p className="font-medium text-navy">{mp.mentee_age_pref}</p></div>}
                        {mp?.institution && <div className="col-span-2"><p className="text-xs text-muted-foreground">School / Team</p><p className="font-medium text-navy">{mp.institution}</p></div>}
                        {mp?.availability && <div className="col-span-2"><p className="text-xs text-muted-foreground">Availability</p><p className="font-medium text-navy">{mp.availability}</p></div>}
                      </div>
                      {mp?.bio && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bio</p>
                          <p className="text-sm text-navy">{mp.bio}</p>
                        </div>
                      )}
                      {mp?.skills && mp.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Can help with</p>
                          <div className="flex flex-wrap gap-1.5">{mp.skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                        </div>
                      )}
                      {mp?.why && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Why they want to mentor</p>
                          <p className="text-sm text-navy">{mp.why}</p>
                        </div>
                      )}
                      <div className="pt-2 space-y-2">
                        {!mp?.approved ? (
                          <button type="button" onClick={() => approveMentor(m.id)} disabled={approvingId === m.id}
                            className="flex items-center gap-1.5 rounded-md bg-sage px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-600 transition-colors disabled:opacity-60">
                            <CheckCircle className="h-3.5 w-3.5" /> {approvingId === m.id ? "Approving…" : "Approve Mentor"}
                          </button>
                        ) : mentorMatches.length > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium">Current players</p>
                            {mentorMatches.map(match => (
                              <div key={match.id} className="flex items-center justify-between rounded-md bg-offWhite px-3 py-2">
                                <div>
                                  <p className="text-xs font-medium text-navy">{match.player?.name}</p>
                                  <p className="text-[10px] text-muted-foreground">since {fmt(match.created_at)}</p>
                                </div>
                                <button type="button" onClick={() => endMatch(match.id)}
                                  className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                  <X className="h-3 w-3" /> End
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-sage-600 font-medium">Available to be matched</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[10px] text-muted-foreground">Joined {fmt(m.created_at)}</p>
                        <button type="button" onClick={() => setConfirmDeleteId(m.id)}
                          className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete user
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredMentors.length === 0 && <p className="text-sm text-muted-foreground">No mentors match filters.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
