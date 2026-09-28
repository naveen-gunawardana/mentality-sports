"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Inbox, Mail, Trash2 } from "lucide-react";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  guest_type: string;
  sport: string | null;
  affiliation: string | null;
  social_links: string | null;
  story: string;
  topics: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ["new", "contacted", "scheduled", "declined"] as const;

const STATUS_STYLE: Record<string, string> = {
  new: "bg-orange-50 text-orange-600",
  contacted: "bg-navy/8 text-navy/70",
  scheduled: "bg-sage-50 text-sage-700",
  declined: "bg-red-50 text-red-600",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function GuestApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("open");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const supabase = createClient();
    const { data, error: loadErr } = await supabase
      .from("podcast_guest_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadErr) setError(loadErr.message);
    setApps((data ?? []) as Application[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function patch(id: string, values: Partial<Pick<Application, "status" | "admin_notes">>) {
    setError("");
    const supabase = createClient();
    const { error: updErr } = await supabase.from("podcast_guest_applications").update(values).eq("id", id);
    if (updErr) { setError(updErr.message); return; }
    setApps(prev => prev.map(a => (a.id === id ? { ...a, ...values } : a)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    const supabase = createClient();
    const { error: delErr } = await supabase.from("podcast_guest_applications").delete().eq("id", id);
    if (delErr) { setError(delErr.message); return; }
    setApps(prev => prev.filter(a => a.id !== id));
  }

  const newCount = apps.filter(a => a.status === "new").length;
  const visible = apps.filter(a =>
    filter === "all" ? true : filter === "open" ? a.status !== "declined" : a.status === filter,
  );

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-bold text-navy">Guest applications</h2>
          {newCount > 0 && (
            <span className="rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">
              {newCount} new
            </span>
          )}
        </div>
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-sm border border-offWhite-400 bg-white px-2.5 py-1.5 text-xs text-navy outline-none focus:border-orange-400"
        >
          <option value="open">Open</option>
          <option value="all">All</option>
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-sm border border-dashed border-offWhite-400 bg-offWhite p-8 text-center">
          <p className="text-navy/55 text-sm">No applications here yet.</p>
          <p className="text-navy/40 text-xs mt-1">Submissions from /podcast/apply show up in this list.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(a => {
            const open = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-sm border border-offWhite-300 bg-white">
                <button
                  type="button" onClick={() => setExpandedId(open ? null : a.id)}
                  className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-offWhite/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`rounded-sm px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[a.status] ?? ""}`}>
                        {a.status}
                      </span>
                      <span className="text-[11px] text-navy/45 capitalize">{a.guest_type}</span>
                      {a.sport && <span className="text-[11px] text-navy/45">· {a.sport}</span>}
                    </div>
                    <p className="text-sm font-semibold text-navy truncate">
                      {a.name}{a.affiliation ? <span className="font-normal text-navy/55"> — {a.affiliation}</span> : null}
                    </p>
                    {!open && <p className="text-xs text-navy/50 mt-0.5 line-clamp-1">{a.story}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    {fmt(a.created_at)}
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-offWhite-300 p-4 space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <p><span className="font-semibold text-navy/55">Email:</span> <a href={`mailto:${a.email}`} className="text-orange-600 hover:underline">{a.email}</a></p>
                      {a.phone && <p><span className="font-semibold text-navy/55">Phone:</span> {a.phone}</p>}
                      {a.social_links && <p className="sm:col-span-2 break-words"><span className="font-semibold text-navy/55">Links:</span> {a.social_links}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy/55 mb-1">Their story</p>
                      <p className="text-navy/80 whitespace-pre-wrap leading-relaxed">{a.story}</p>
                    </div>
                    {a.topics && (
                      <div>
                        <p className="text-xs font-semibold text-navy/55 mb-1">Topics</p>
                        <p className="text-navy/80 whitespace-pre-wrap leading-relaxed">{a.topics}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-navy/55 mb-1" htmlFor={`notes-${a.id}`}>Internal notes</label>
                      <textarea
                        id={`notes-${a.id}`} rows={2}
                        value={notes[a.id] ?? a.admin_notes ?? ""}
                        onChange={e => setNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                        onBlur={() => {
                          const next = notes[a.id];
                          if (next !== undefined && next !== (a.admin_notes ?? "")) patch(a.id, { admin_notes: next.trim() || null });
                        }}
                        placeholder="Saved when you click away"
                        className="w-full rounded-sm border border-offWhite-400 bg-white px-3 py-2 text-sm text-navy placeholder-navy/35 outline-none focus:border-orange-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={a.status} onChange={e => patch(a.id, { status: e.target.value })}
                        className="rounded-sm border border-offWhite-400 bg-white px-2.5 py-1.5 text-xs text-navy outline-none focus:border-orange-400 capitalize"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <a
                        href={`mailto:${a.email}?subject=${encodeURIComponent("Mentality Sports Podcast")}`}
                        className="inline-flex items-center gap-1 rounded-sm border border-offWhite-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                      <button
                        type="button" onClick={() => remove(a.id)}
                        className="inline-flex items-center gap-1 rounded-sm border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
