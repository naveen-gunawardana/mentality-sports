"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Mic, Eye, EyeOff,
  ExternalLink, CheckCircle, AlertTriangle, Loader2,
} from "lucide-react";
import { GuestApplications } from "./guest-applications";

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  episode_number: number | null;
  season: number | null;
  spotify_url: string | null;
  apple_url: string | null;
  youtube_url: string | null;
  audio_url: string | null;
  duration: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

type EpisodeStatus = "draft" | "published";

interface FormState {
  title: string;
  slug: string;
  description: string;
  episode_number: string;
  season: string;
  spotify_url: string;
  apple_url: string;
  youtube_url: string;
  audio_url: string;
  duration: string;
  status: EpisodeStatus;
  published_at: string; // datetime-local value
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  episode_number: "",
  season: "",
  spotify_url: "",
  apple_url: "",
  youtube_url: "",
  audio_url: "",
  duration: "",
  status: "published",
  published_at: "",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ISO string -> value for <input type="datetime-local">
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local value -> ISO (or null)
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FIELD =
  "w-full rounded-sm border border-offWhite-400 bg-white px-3 py-2 text-sm text-navy placeholder-navy/35 outline-none focus:border-orange-400 transition-colors";
const LABEL = "block text-xs font-semibold text-navy/55 mb-1";

export default function AdminPodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null); // null = no form open
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error: loadErr } = await supabase
      .from("podcast_episodes")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (loadErr) {
      // Fall back to created_at ordering if published_at ordering errors.
      const { data: fallback } = await supabase
        .from("podcast_episodes")
        .select("*")
        .order("created_at", { ascending: false });
      setEpisodes((fallback ?? []) as unknown as Episode[]);
    } else {
      setEpisodes((data ?? []) as unknown as Episode[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setError("");
    setSuccess("");
    setIsOpen(true);
  }

  function openEdit(ep: Episode) {
    setEditingId(ep.id);
    setForm({
      title: ep.title ?? "",
      slug: ep.slug ?? "",
      description: ep.description ?? "",
      episode_number: ep.episode_number != null ? String(ep.episode_number) : "",
      season: ep.season != null ? String(ep.season) : "",
      spotify_url: ep.spotify_url ?? "",
      apple_url: ep.apple_url ?? "",
      youtube_url: ep.youtube_url ?? "",
      audio_url: ep.audio_url ?? "",
      duration: ep.duration ?? "",
      status: ep.status === "draft" ? "draft" : "published",
      published_at: isoToLocalInput(ep.published_at),
    });
    setSlugTouched(true);
    setError("");
    setSuccess("");
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  }

  function parseIntOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const n = Number.parseInt(trimmed, 10);
    return Number.isNaN(n) ? null : n;
  }

  function strOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const slug = (form.slug.trim() || slugify(title));
    if (!title) { setError("Title is required."); return; }
    if (!slug) { setError("Slug is required."); return; }

    setSaving(true);

    const payload = {
      title,
      slug,
      description: strOrNull(form.description),
      episode_number: parseIntOrNull(form.episode_number),
      season: parseIntOrNull(form.season),
      spotify_url: strOrNull(form.spotify_url),
      apple_url: strOrNull(form.apple_url),
      youtube_url: strOrNull(form.youtube_url),
      audio_url: strOrNull(form.audio_url),
      duration: strOrNull(form.duration),
      status: form.status,
      published_at: localInputToIso(form.published_at),
    };

    const supabase = createClient();
    if (editingId) {
      const { error: updErr } = await supabase
        .from("podcast_episodes")
        .update(payload)
        .eq("id", editingId);
      if (updErr) {
        setError(updErr.message || "Could not save changes.");
        setSaving(false);
        return;
      }
      setSuccess(`Updated “${title}”.`);
    } else {
      const { error: insErr } = await supabase
        .from("podcast_episodes")
        .insert(payload);
      if (insErr) {
        setError(
          /duplicate|unique/i.test(insErr.message)
            ? "An episode with that slug already exists. Choose a different slug."
            : (insErr.message || "Could not create episode."),
        );
        setSaving(false);
        return;
      }
      setSuccess(`Created “${title}”.`);
    }

    setSaving(false);
    closeForm();
    await load();
  }

  async function deleteEpisode(id: string) {
    setDeletingId(id);
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase.from("podcast_episodes").delete().eq("id", id);
    if (delErr) {
      setError(delErr.message || "Could not delete episode.");
    } else {
      setSuccess("Episode deleted.");
      if (editingId === id) closeForm();
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
    await load();
  }

  const published = episodes.filter(e => e.status === "published");
  const drafts = episodes.filter(e => e.status !== "published");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading podcast…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-navy text-white shrink-0">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">Podcast</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {published.length} published · {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {!isOpen && (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Episode
            </button>
          )}
        </div>
      </div>

      <GuestApplications />

      {/* Pre-launch note */}
      <div className="mb-6 flex items-start gap-2.5 rounded-sm border border-orange-200 bg-orange-50/60 px-4 py-3">
        <Mic className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-navy/70">
          No episodes yet? The public <span className="font-semibold text-navy">/podcast</span> page shows a polished
          {" "}&ldquo;coming soon&rdquo; state until you publish the first episode.
        </p>
      </div>

      {/* Global messages */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && !isOpen && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-sage-200 bg-sage-50 px-4 py-2.5 text-sm text-sage-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {/* Editor form */}
      {isOpen && (
        <form onSubmit={save} className="mb-8 rounded-sm border border-offWhite-300 bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-navy">{editingId ? "Edit episode" : "New episode"}</h2>
            <button type="button" onClick={closeForm} aria-label="Close" className="p-1.5 rounded-sm hover:bg-offWhite transition-colors">
              <X className="h-4 w-4 text-navy/50" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ep-title">Title</label>
              <input
                id="ep-title" type="text" required value={form.title}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="Episode title"
                className={FIELD}
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ep-slug">Slug</label>
              <input
                id="ep-slug" type="text" required value={form.slug}
                onChange={e => { setSlugTouched(true); update("slug", slugify(e.target.value)); }}
                placeholder="episode-slug"
                className={`${FIELD} font-mono`}
              />
              <p className="mt-1 text-[11px] text-navy/40">Public URL: /podcast/{form.slug || "…"}</p>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ep-desc">Description <span className="font-normal text-navy/35">(Markdown)</span></label>
              <textarea
                id="ep-desc" rows={6} value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="Show notes, guests, topics covered… Markdown supported."
                className={`${FIELD} resize-y leading-relaxed`}
              />
            </div>

            {/* Episode number / Season / Duration */}
            <div>
              <label className={LABEL} htmlFor="ep-number">Episode #</label>
              <input
                id="ep-number" type="number" min={0} value={form.episode_number}
                onChange={e => update("episode_number", e.target.value)}
                placeholder="e.g. 1"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ep-season">Season</label>
              <input
                id="ep-season" type="number" min={0} value={form.season}
                onChange={e => update("season", e.target.value)}
                placeholder="e.g. 1"
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ep-duration">Duration</label>
              <input
                id="ep-duration" type="text" value={form.duration}
                onChange={e => update("duration", e.target.value)}
                placeholder='e.g. "42 min"'
                className={FIELD}
              />
            </div>

            {/* Links */}
            <div>
              <label className={LABEL} htmlFor="ep-spotify">Spotify URL</label>
              <input id="ep-spotify" type="url" value={form.spotify_url} onChange={e => update("spotify_url", e.target.value)} placeholder="https://open.spotify.com/…" className={FIELD} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ep-apple">Apple Podcasts URL</label>
              <input id="ep-apple" type="url" value={form.apple_url} onChange={e => update("apple_url", e.target.value)} placeholder="https://podcasts.apple.com/…" className={FIELD} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ep-youtube">YouTube URL</label>
              <input id="ep-youtube" type="url" value={form.youtube_url} onChange={e => update("youtube_url", e.target.value)} placeholder="https://youtube.com/…" className={FIELD} />
            </div>
            <div>
              <label className={LABEL} htmlFor="ep-audio">Audio file URL</label>
              <input id="ep-audio" type="url" value={form.audio_url} onChange={e => update("audio_url", e.target.value)} placeholder="https://…/episode.mp3" className={FIELD} />
            </div>

            {/* Status / Published at */}
            <div>
              <label className={LABEL} htmlFor="ep-status">Status</label>
              <select
                id="ep-status" value={form.status}
                onChange={e => update("status", e.target.value as EpisodeStatus)}
                className={FIELD}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="ep-published">Published at <span className="font-normal text-navy/35">(optional)</span></label>
              <input
                id="ep-published" type="datetime-local" value={form.published_at}
                onChange={e => update("published_at", e.target.value)}
                className={FIELD}
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-6 flex items-center gap-2">
            <button
              type="submit" disabled={saving}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 px-6 py-2.5 text-sm font-bold text-white transition-colors rounded-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create episode"}
            </button>
            <button
              type="button" onClick={closeForm}
              className="rounded-sm border border-offWhite-300 px-5 py-2.5 text-sm font-medium text-navy hover:bg-offWhite transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Episode list */}
      {episodes.length === 0 ? (
        <div className="rounded-sm border border-dashed border-offWhite-400 bg-offWhite p-12 text-center">
          <Mic className="h-8 w-8 text-navy/20 mx-auto mb-3" />
          <p className="text-navy/55 text-sm font-medium mb-1">No episodes yet.</p>
          <p className="text-navy/40 text-xs">Create your first episode — it stays private until you publish it.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {episodes.map(ep => {
            const isPublished = ep.status === "published";
            return (
              <div key={ep.id} className="rounded-sm border border-offWhite-300 bg-white p-4 hover:border-orange-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-sage-50 text-sage-700">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-navy/8 text-navy/60">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                      {(ep.season != null || ep.episode_number != null) && (
                        <span className="rounded-sm px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-600">
                          {ep.season != null ? `S${ep.season}` : ""}{ep.season != null && ep.episode_number != null ? " · " : ""}{ep.episode_number != null ? `E${ep.episode_number}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-navy truncate">{ep.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">/{ep.slug}</span>
                      {ep.duration ? ` · ${ep.duration}` : ""}
                      {" · "}
                      {isPublished ? `Published ${fmt(ep.published_at)}` : `Created ${fmt(ep.created_at)}`}
                    </p>
                    {(ep.spotify_url || ep.apple_url || ep.youtube_url || ep.audio_url) && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {ep.spotify_url && <a href={ep.spotify_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-navy/50 hover:text-orange-600 transition-colors">Spotify <ExternalLink className="h-3 w-3" /></a>}
                        {ep.apple_url && <a href={ep.apple_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-navy/50 hover:text-orange-600 transition-colors">Apple <ExternalLink className="h-3 w-3" /></a>}
                        {ep.youtube_url && <a href={ep.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-navy/50 hover:text-orange-600 transition-colors">YouTube <ExternalLink className="h-3 w-3" /></a>}
                        {ep.audio_url && <a href={ep.audio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-navy/50 hover:text-orange-600 transition-colors">Audio <ExternalLink className="h-3 w-3" /></a>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPublished && (
                      <Link
                        href={`/podcast/${ep.slug}`} target="_blank"
                        className="inline-flex items-center gap-1 rounded-sm border border-offWhite-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View</span>
                      </Link>
                    )}
                    <button
                      type="button" onClick={() => openEdit(ep)}
                      className="inline-flex items-center gap-1 rounded-sm border border-offWhite-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-offWhite transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button" onClick={() => setConfirmDeleteId(ep.id)}
                      className="inline-flex items-center gap-1 rounded-sm border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-navy mb-2">Delete episode?</h2>
            <p className="text-sm text-navy/60 mb-5">
              This will permanently delete{" "}
              <span className="font-medium text-navy">
                {episodes.find(e => e.id === confirmDeleteId)?.title ?? "this episode"}
              </span>. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button" onClick={() => setConfirmDeleteId(null)}
                className="rounded-sm border border-offWhite-300 px-4 py-2 text-sm font-medium text-navy hover:bg-offWhite transition-colors"
              >
                Cancel
              </button>
              <button
                type="button" onClick={() => deleteEpisode(confirmDeleteId)} disabled={deletingId === confirmDeleteId}
                className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
