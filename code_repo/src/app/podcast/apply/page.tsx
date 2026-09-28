"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Mic } from "lucide-react";

const GUEST_TYPES = [
  { value: "athlete", label: "Athlete" },
  { value: "coach", label: "Coach" },
  { value: "expert", label: "Mental performance / health expert" },
  { value: "other", label: "Other" },
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  guest_type: "athlete",
  sport: "",
  affiliation: "",
  social_links: "",
  story: "",
  topics: "",
  website: "", // honeypot
};

const FIELD =
  "w-full rounded-sm border border-offWhite-400 bg-white px-3 py-2.5 text-sm text-navy placeholder-navy/35 outline-none focus:border-orange-400 transition-colors";
const LABEL = "block text-xs font-semibold text-navy/60 mb-1.5";

export default function PodcastApplyPage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function update(key: keyof typeof EMPTY, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/podcast/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not submit. Try again.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not submit. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-[#0c1628] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14">
          <Link href="/podcast" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the podcast
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Mic className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">
              Be a guest
            </span>
          </div>
          <h1
            className="font-black text-white font-condensed tracking-tight leading-none mb-4"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
          >
            GET ON THE PODCAST
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed">
            Athletes, coaches, and mental performance experts — if you&apos;ve
            got a story about the mental side of competing, we want to hear it.
            Tell us a bit about yourself and we&apos;ll reach out.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {done ? (
          <div className="rounded-sm border border-offWhite-300 bg-offWhite p-10 text-center">
            <CheckCircle className="h-10 w-10 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-navy font-condensed tracking-wide mb-2">
              APPLICATION RECEIVED
            </h2>
            <p className="text-sm text-navy/60 leading-relaxed max-w-md mx-auto mb-6">
              Thanks for reaching out. We read every application and will get
              back to you by email if it&apos;s a fit for an upcoming episode.
            </p>
            <Link
              href="/podcast"
              className="inline-flex items-center gap-2 rounded-sm bg-navy hover:bg-navy/90 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              <Mic className="h-4 w-4 text-orange-400" /> Listen to episodes
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-sm border border-offWhite-300 bg-white p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LABEL} htmlFor="ga-name">Full name *</label>
                <input id="ga-name" type="text" required value={form.name} onChange={e => update("name", e.target.value)} className={FIELD} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ga-email">Email *</label>
                <input id="ga-email" type="email" required value={form.email} onChange={e => update("email", e.target.value)} className={FIELD} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ga-phone">Phone <span className="font-normal text-navy/35">(optional)</span></label>
                <input id="ga-phone" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className={FIELD} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ga-type">I am a… *</label>
                <select id="ga-type" value={form.guest_type} onChange={e => update("guest_type", e.target.value)} className={FIELD}>
                  {GUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="ga-sport">Sport</label>
                <input id="ga-sport" type="text" value={form.sport} onChange={e => update("sport", e.target.value)} placeholder="e.g. Basketball" className={FIELD} />
              </div>
              <div>
                <label className={LABEL} htmlFor="ga-affiliation">Team, school, or organization</label>
                <input id="ga-affiliation" type="text" value={form.affiliation} onChange={e => update("affiliation", e.target.value)} placeholder="e.g. UCLA, former pro, private practice" className={FIELD} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="ga-links">Instagram / LinkedIn / website</label>
                <input id="ga-links" type="text" value={form.social_links} onChange={e => update("social_links", e.target.value)} placeholder="@handle or links" className={FIELD} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="ga-story">Your story *</label>
                <textarea
                  id="ga-story" required minLength={20} rows={6} value={form.story}
                  onChange={e => update("story", e.target.value)}
                  placeholder="What have you been through on the mental side of your sport? What would you want listeners to take away?"
                  className={`${FIELD} resize-y leading-relaxed`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="ga-topics">Topics you&apos;d want to talk about</label>
                <textarea
                  id="ga-topics" rows={3} value={form.topics}
                  onChange={e => update("topics", e.target.value)}
                  placeholder="e.g. performance anxiety, injury comeback, life after sport"
                  className={`${FIELD} resize-y leading-relaxed`}
                />
              </div>
              {/* Honeypot — hidden from people, catches bots */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="ga-website">Website</label>
                <input id="ga-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update("website", e.target.value)} />
              </div>
            </div>

            {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

            <button
              type="submit" disabled={submitting}
              className="mt-7 inline-flex items-center gap-2 rounded-sm bg-orange-500 hover:bg-orange-400 disabled:opacity-60 px-7 py-3 text-sm font-bold text-white transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
