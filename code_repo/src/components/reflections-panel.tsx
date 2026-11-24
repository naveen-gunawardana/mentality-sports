"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, Lock, Eye, Trash2, PenLine, Sparkles } from "lucide-react";
import { MOODS, moodFor, pickReflectionPrompts } from "@/lib/reflection-prompts";

interface Reflection {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  shared_with_mentor: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Props {
  playerId: string;
  mentorFirstName: string;
}

function previewFrom(content: string): string {
  const words = content.trim().split(/\s+/);
  return words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
}

function formatDate(d: Date): string {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return "Today, " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

type Mode = { kind: "list" } | { kind: "edit"; reflection: Reflection | null };

export function ReflectionsPanel({ playerId, mentorFirstName }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("reflections")
      .select("id, title, content, mood, shared_with_mentor, created_at, updated_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false });
    setReflections((data ?? []) as unknown as Reflection[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [playerId]);

  if (mode.kind === "edit") {
    return (
      <Editor
        playerId={playerId}
        mentorFirstName={mentorFirstName}
        existing={mode.reflection}
        onCancel={() => setMode({ kind: "list" })}
        onSaved={() => { setMode({ kind: "list" }); load(); }}
        onDelete={() => { setMode({ kind: "list" }); load(); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-orange-400" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/45">Reflections</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px] -mt-1.5" onClick={() => setMode({ kind: "edit", reflection: null })}>
          <Plus className="h-3 w-3 mr-1" /> New
        </Button>
      </div>

      {loading ? (
        <p className="text-[12px] text-navy/40">Loading…</p>
      ) : reflections.length === 0 ? (
        <button
          type="button"
          onClick={() => setMode({ kind: "edit", reflection: null })}
          className="w-full rounded-xl ring-1 ring-dashed ring-offWhite-400 bg-white hover:bg-offWhite/30 hover:ring-navy/25 px-4 py-5 transition-all text-left"
        >
          <p className="text-[13px] font-semibold text-navy flex items-center gap-2">
            <PenLine className="h-3.5 w-3.5 text-orange-500" />
            Write your first reflection
          </p>
          <p className="text-[11px] text-navy/55 mt-1 leading-snug">A note to yourself about how things are going. Private unless you share it.</p>
        </button>
      ) : (
        <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 -mr-1">
          {reflections.map(r => {
            const mood = moodFor(r.mood);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setMode({ kind: "edit", reflection: r })}
                  className="w-full text-left rounded-xl ring-1 ring-offWhite-300 bg-white hover:ring-navy/25 hover:bg-offWhite/30 px-3.5 py-3 transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    {mood && <span className="text-base leading-none mt-0.5" title={mood.label}>{mood.emoji}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-navy leading-snug truncate">
                        {r.title?.trim() || previewFrom(r.content) || "Untitled"}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[10px] text-navy/45 font-medium">
                          {r.created_at ? formatDate(new Date(r.created_at)) : ""}
                        </span>
                        <span className="text-[10px] flex items-center gap-1 text-navy/40 font-medium">
                          {r.shared_with_mentor ? <><Eye className="h-2.5 w-2.5" />Shared</> : <><Lock className="h-2.5 w-2.5" />Private</>}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Editor({
  playerId,
  mentorFirstName,
  existing,
  onCancel,
  onSaved,
  onDelete,
}: {
  playerId: string;
  mentorFirstName: string;
  existing: Reflection | null;
  onCancel: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [shared, setShared] = useState(existing?.shared_with_mentor ?? false);
  const [mood, setMood] = useState<string | null>(existing?.mood ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptList, setPromptList] = useState<string[]>([]);

  function loadPrompts() {
    setPromptList(pickReflectionPrompts(5));
    setShowPrompts(true);
  }

  async function save() {
    if (!content.trim()) { setError("Write something first."); return; }
    setError("");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      player_id: playerId,
      title: title.trim() || null,
      content: content.trim(),
      mood: mood,
      shared_with_mentor: shared,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error: e } = await supabase.from("reflections").update(payload as never).eq("id", existing.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from("reflections").insert(payload as never);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  }

  async function destroy() {
    if (!existing) return;
    if (!confirm("Delete this reflection?")) return;
    const supabase = createClient();
    await supabase.from("reflections").delete().eq("id", existing.id);
    onDelete();
  }

  const inputClass = "w-full rounded-lg bg-offWhite/40 ring-1 ring-offWhite-300 focus:ring-navy/30 focus:bg-white px-3 py-2 text-[13px] outline-none transition-all text-navy placeholder:text-navy/35";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-[11px] text-navy/55 hover:text-navy transition-colors font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Reflections
        </button>
        {existing && (
          <button type="button" onClick={destroy} aria-label="Delete" className="text-navy/30 hover:text-red-500 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Mood chips */}
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45 mb-1.5">Feeling</p>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map(m => {
            const active = mood === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(active ? null : m.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  active
                    ? "bg-navy text-white ring-1 ring-navy"
                    : "bg-white ring-1 ring-offWhite-300 text-navy/65 hover:ring-navy/25"
                }`}
              >
                <span className="text-sm leading-none">{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={80}
          className={inputClass + " font-semibold"}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus={!existing}
          rows={8}
          placeholder="What's on your mind?"
          className={inputClass + " resize-none leading-relaxed"}
        />

        {/* Prompts helper */}
        {!showPrompts ? (
          <button
            type="button"
            onClick={loadPrompts}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-navy/55 hover:text-orange-600 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-orange-500" />
            Need a starting point?
          </button>
        ) : (
          <div className="rounded-xl bg-orange-50/60 ring-1 ring-orange-200 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/55">Try one</p>
              <button type="button" onClick={() => setShowPrompts(false)} className="text-[10px] text-navy/40 hover:text-navy">Hide</button>
            </div>
            <ul className="space-y-1">
              {promptList.map((p, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => { setContent(prev => prev ? prev + "\n\n" + p : p); }}
                    className="text-left text-[12px] text-navy/75 hover:text-navy transition-colors leading-snug"
                  >
                    · {p}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={loadPrompts} className="text-[10px] text-navy/45 hover:text-navy/70 font-medium transition-colors">Shuffle</button>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <label className="flex items-center gap-2 text-[12px] text-navy/65 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
            className="rounded border-offWhite-300"
          />
          <span className="flex items-center gap-1.5">
            {shared ? <Eye className="h-3 w-3 text-orange-500" /> : <Lock className="h-3 w-3 text-navy/40" />}
            Share with {mentorFirstName}
          </span>
        </label>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="ghost" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1 bg-navy hover:bg-navy/85 text-white" onClick={save} disabled={saving}>
            {saving ? "Saving…" : existing ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
