"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ChevronDown, ChevronUp, Calendar, AlertTriangle } from "lucide-react";
import { UpcomingCalls } from "@/components/upcoming-calls";
import { WeeklyGoals } from "@/components/weekly-goals";

interface CommonProps {
  matchId: string;
  currentUserId: string;
  scheduleRefreshKey: number;
  onScheduleClick: () => void;
  onJoinCall: () => void;
  onLogSession: () => void;
  needsFirstCall: boolean;
}

interface MentorPanelProps extends CommonProps {
  role: "mentor";
  mentee: {
    id: string;
    name: string;
    sport: string[] | null;
    avatar_url: string | null;
    grade?: string | null;
    school?: string | null;
    challenges?: string[] | null;
    goal?: string | null;
  };
}

interface MenteePanelProps extends CommonProps {
  role: "mentee";
  mentor: {
    id: string;
    name: string;
    sport: string[] | null;
    avatar_url: string | null;
    bio?: string | null;
    why?: string | null;
    skills?: string[] | null;
    playing_level?: string[] | null;
  };
}

type Props = MentorPanelProps | MenteePanelProps;

interface SessionRecord {
  id: string;
  date: string | null;
  topics: string[] | null;
  notes: string | null;
  flagged: boolean | null;
  flag_reason: string | null;
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {accent && <span className="h-px w-4 bg-orange-400" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/45">{children}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-offWhite-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function DashboardRightPanel(props: Props) {
  const { matchId, currentUserId, scheduleRefreshKey, onScheduleClick, onJoinCall, onLogSession, needsFirstCall } = props;
  const isMentor = props.role === "mentor";
  const personName = isMentor ? props.mentee.name : props.mentor.name;
  const personAvatar = isMentor ? props.mentee.avatar_url : props.mentor.avatar_url;
  const personSport = isMentor ? props.mentee.sport : props.mentor.sport;

  const [infoOpen, setInfoOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  async function loadSessions() {
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .select("id, date, topics, notes, flagged, flag_reason")
      .eq("match_id", matchId)
      .order("date", { ascending: false })
      .limit(20);
    setSessions((data ?? []) as SessionRecord[]);
  }

  useEffect(() => { loadSessions(); }, [matchId]);

  function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-3">
      {/* Mentor: how-to-mentor playbook */}
      {isMentor && <MentorPlaybook />}

      {/* Upcoming calls */}
      <Card className="p-5">
        <SectionLabel accent>Upcoming calls</SectionLabel>
        <UpcomingCalls
          matchId={matchId}
          currentUserId={currentUserId}
          onJoin={onJoinCall}
          refreshKey={scheduleRefreshKey}
        />
        {needsFirstCall ? (
          <div className="mt-3 rounded-xl bg-orange-50 ring-1 ring-orange-200 p-3.5">
            <p className="text-[13px] font-semibold text-navy">Start with a 15-min intro call</p>
            <p className="text-[11px] text-navy/55 mt-0.5 leading-snug">No pressure — just a chance to meet.</p>
            <Button size="sm" className="w-full mt-2.5 bg-orange-500 hover:bg-orange-600 text-white" onClick={onScheduleClick}>
              Schedule
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onScheduleClick}>
            <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Schedule a call
          </Button>
        )}
      </Card>

      {/* Goals */}
      <WeeklyGoals matchId={matchId} userId={currentUserId} />

      {/* Person info */}
      <Card>
        <button
          type="button"
          onClick={() => setInfoOpen(!infoOpen)}
          className="w-full flex items-center justify-between gap-3 p-4 hover:bg-offWhite/30 transition-colors rounded-2xl"
        >
          <div className="flex items-center gap-3 min-w-0">
            {personAvatar ? (
              <img src={personAvatar} alt={personName} className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-offWhite-200" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs font-bold shrink-0">
                {initials(personName)}
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-500">
                {isMentor ? "Your athlete" : "Your mentor"}
              </p>
              <p className="text-[14px] font-semibold text-navy truncate leading-tight mt-0.5">{personName}</p>
            </div>
          </div>
          {infoOpen ? <ChevronUp className="h-4 w-4 text-navy/40 shrink-0" /> : <ChevronDown className="h-4 w-4 text-navy/40 shrink-0" />}
        </button>
        {infoOpen && (
          <div className="border-t border-offWhite-200 px-4 py-4 space-y-3 text-sm">
            {personSport && personSport.length > 0 && <Field label="Sport" value={personSport.join(", ")} />}
            {isMentor ? (
              <>
                {props.mentee.grade && <Field label="Grade" value={props.mentee.grade} />}
                {props.mentee.school && <Field label="School" value={props.mentee.school} />}
                {props.mentee.challenges && props.mentee.challenges.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/40 mb-1.5">Working through</p>
                    <div className="flex flex-wrap gap-1.5">
                      {props.mentee.challenges.map(c => (
                        <span key={c} className="rounded-full bg-offWhite/70 ring-1 ring-offWhite-300 px-2.5 py-0.5 text-[11px] text-navy/75 font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {props.mentee.goal && <Field label="Their goal" value={props.mentee.goal} />}
              </>
            ) : (
              <>
                {props.mentor.playing_level && props.mentor.playing_level.length > 0 && (
                  <Field label="Played at" value={props.mentor.playing_level.join(", ")} />
                )}
                {props.mentor.bio && <Field label="Bio" value={props.mentor.bio} />}
                {props.mentor.why && <Field label="Why they mentor" value={props.mentor.why} />}
                {props.mentor.skills && props.mentor.skills.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/40 mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {props.mentor.skills.map(s => (
                        <span key={s} className="rounded-full bg-offWhite/70 ring-1 ring-offWhite-300 px-2.5 py-0.5 text-[11px] text-navy/75 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Sessions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Sessions</SectionLabel>
          {isMentor && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] -mt-1.5" onClick={onLogSession}>
              <Calendar className="h-3 w-3 mr-1" /> Log
            </Button>
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="text-[12px] text-navy/50">No sessions yet.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPastOpen(!pastOpen)}
              className="text-[12px] text-navy/65 hover:text-navy flex items-center gap-1.5 transition-colors font-medium"
            >
              {pastOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {pastOpen ? "Hide" : "Show"} {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </button>
            {pastOpen && (
              <ul className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1 -mr-1">
                {sessions.map(s => {
                  const isOpen = expandedSessionId === s.id;
                  return (
                    <li key={s.id} className="rounded-xl ring-1 ring-offWhite-300 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId(isOpen ? null : s.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-offWhite/30 transition-colors ${s.flagged ? "bg-red-50/30" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-navy">
                            {s.date ? new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                          {s.topics && s.topics.length > 0 && (
                            <p className="text-[11px] text-navy/50 mt-0.5 truncate">{s.topics.slice(0, 2).join(" · ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {s.flagged && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-navy/40" /> : <ChevronDown className="h-3.5 w-3.5 text-navy/40" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-offWhite-200 bg-offWhite/20 px-3 py-3 space-y-2.5 text-[12px]">
                          {s.topics && s.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {s.topics.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                            </div>
                          )}
                          {s.notes && <p className="text-navy/75 leading-relaxed">{s.notes}</p>}
                          {s.flagged && s.flag_reason && (
                            <div className="flex items-start gap-1.5 rounded-lg bg-red-50 ring-1 ring-red-200 px-2.5 py-2">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                              <p className="text-[11px] text-red-700 leading-relaxed">{s.flag_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function MentorPlaybook() {
  const [open, setOpen] = useState(true);
  const steps = [
    { n: "1", t: "Meet & set the goal", d: "Get to know your athlete. Pick one mental goal to work on together this month." },
    { n: "2", t: "Dig in", d: "Share how you handled the same thing. Leave them with one thing to try this week." },
    { n: "3", t: "Check progress", d: "What worked, what didn't? Adjust together — real games, real reps." },
    { n: "4", t: "Lock it in", d: "Turn the month into habits. Celebrate the wins and set them up to keep going." },
  ];
  return (
    <Card className="p-5 bg-gradient-to-br from-navy/[0.03] to-white">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <SectionLabel accent>Your 4-session playbook</SectionLabel>
        {open ? <ChevronUp className="h-4 w-4 text-navy/40" /> : <ChevronDown className="h-4 w-4 text-navy/40" />}
      </button>
      {open && (
        <div className="mt-1 space-y-2.5">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[11px] font-bold text-orange-600">{s.n}</span>
              <div>
                <p className="text-[12.5px] font-semibold text-navy leading-tight">{s.t}</p>
                <p className="text-[11.5px] text-navy/55 leading-snug mt-0.5">{s.d}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-navy/45 leading-snug pt-2 border-t border-offWhite-200 mt-1">
            Listen more than you talk. Be consistent — showing up matters more than perfect advice. No scripts.
          </p>
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/40 mb-1">{label}</p>
      <p className="text-[13px] text-navy/85 leading-snug">{value}</p>
    </div>
  );
}
