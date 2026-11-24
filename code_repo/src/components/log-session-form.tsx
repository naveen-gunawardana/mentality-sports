"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Save, AlertTriangle, ArrowLeft, BookOpen } from "lucide-react";
import { SessionReflectionEditor } from "@/components/session-reflection-editor";

const allTopics = [
  "Confidence", "Team dynamics", "Pre-game anxiety", "Goal setting",
  "Leadership", "Handling pressure", "Academic balance", "Communication",
  "Resilience", "Self-talk", "Focus & concentration", "Dealing with losses",
  "Time management", "Motivation", "Injury recovery mindset",
];

interface Props {
  matchId: string;
  userId: string;
  otherPersonName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LogSessionForm({ matchId, userId, otherPersonName, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<"details" | "reflection">("details");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Step 1 state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("15");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTopic(topic: string) {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data, error: insertError } = await supabase.from("sessions").insert({
      match_id: matchId,
      logged_by: userId,
      date: new Date(date).toISOString(),
      duration: parseInt(duration),
      topics: selectedTopics.length > 0 ? selectedTopics : null,
      notes: notes || null,
      flagged,
      flag_reason: flagged ? flagReason || null : null,
    }).select("id").single();

    setSaving(false);
    if (insertError || !data) { setError(insertError?.message ?? "Something went wrong."); return; }

    setSavedSessionId(data.id);
    setStep("reflection");
  }

  // ── Step 1: Session Details ───────────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <button type="button" onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Locker Room
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-navy">Log a Session</h2>
          {otherPersonName && (
            <p className="text-muted-foreground mt-1">
              Recording your session with <span className="font-medium text-navy">{otherPersonName}</span>.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" /> Session Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Duration (minutes)</label>
                  <div className="flex gap-2">
                    {["15", "30", "45", "60"].map((d) => (
                      <button key={d} type="button" onClick={() => setDuration(d)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          duration === d ? "bg-navy text-white border-navy" : "bg-white text-muted-foreground hover:bg-muted"
                        }`}>
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topics Discussed</CardTitle>
              <CardDescription>Select all topics covered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTopics.map((topic) => (
                  <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedTopics.includes(topic) ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"
                    }`}>
                    {topic}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shared Notes</CardTitle>
              <CardDescription>
                Both you and {otherPersonName || "your counterpart"} can see these — key takeaways, action items, anything worth remembering together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What did you talk about? Any breakthroughs, action items, or follow-up topics?" />
            </CardContent>
          </Card>

          <Card className={flagged ? "border-red-200" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${flagged ? "text-red-500" : "text-muted-foreground"}`} />
                Flag for Follow-up
              </CardTitle>
              <CardDescription>Flag if something concerning came up</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <button type="button" onClick={() => setFlagged(!flagged)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${flagged ? "bg-red-500" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${flagged ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-sm text-muted-foreground">{flagged ? "Flagged for review" : "No flag"}</span>
              </div>
              {flagged && (
                <Input label="Reason for flag" placeholder="Brief description of the concern..."
                  value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Session"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step 2: Personal Reflection ───────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-orange-500 mb-3">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Session logged</span>
        </div>
        <h2 className="text-2xl font-bold text-navy">Add your reflection</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          How did this session feel for you? What are you taking away?
          This is private by default — you can share it with {otherPersonName} if you want.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SessionReflectionEditor
            sessionId={savedSessionId!}
            userId={userId}
            otherPersonName={otherPersonName}
            existing={null}
            onSave={onSuccess}
            onCancel={onSuccess}
          />
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <button type="button" onClick={onSuccess}
          className="text-sm text-muted-foreground hover:text-navy transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  );
}
