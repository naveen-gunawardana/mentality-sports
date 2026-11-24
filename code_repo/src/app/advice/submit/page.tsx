"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "Confidence", "Resilience", "Motivation", "Goal Setting",
  "Pressure & Anxiety", "Coach Communication", "Identity", "Injury Recovery", "Other",
];

export default function GiveAdvicePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Confidence");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/signin"); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", data.user.id).single();
      setUserName(profile?.name ?? "");
      setAuthChecked(true);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !title.trim() || !content.trim()) return;
    setStatus("submitting");
    const supabase = createClient();
    const slug = title.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    const { error } = await supabase.from("resources").insert({
      title: title.trim(),
      slug: `${slug}-${Date.now()}`,
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      category,
      submitted_by: userId,
      submitted_by_name: userName,
      status: "pending",
    });
    setStatus(error ? "error" : "done");
  }

  if (!authChecked) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/advice" className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Advice
      </Link>

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Share your experience</p>
        <h1 className="text-3xl font-bold text-navy mb-2">Give Advice</h1>
        <p className="text-navy/55 text-sm leading-relaxed">
          Write something that would have helped you. Admin reviews submissions before they go live — usually within a few days.
        </p>
      </div>

      {status === "done" ? (
        <div className="rounded-lg bg-sage-50 border border-sage-200 p-8 text-center">
          <CheckCircle className="h-10 w-10 text-sage mx-auto mb-4" />
          <p className="font-semibold text-sage-700 text-lg mb-1">Submitted for review</p>
          <p className="text-sm text-sage-600 mb-6">Once approved it&apos;ll appear in the advice library.</p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/advice">View the Advice Library</Link>
            </Button>
            <Button variant="outline" onClick={() => {
              setTitle(""); setExcerpt(""); setContent(""); setStatus("idle");
            }}>
              Submit another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your article</CardTitle>
              <CardDescription>Plain text is fine. Use ## for headings, **bold** for emphasis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. How I Dealt with Losing My Starting Spot"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        category === c ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Short summary <span className="text-muted-foreground font-normal">(optional — shown in the card preview)</span>
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="One sentence about what this covers"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={16}
                  required
                  placeholder={"## Why this matters\n\nYour story here...\n\n## What helped me\n\n..."}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">Something went wrong. Try again.</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={status === "submitting" || !title.trim() || !content.trim()}>
                  {status === "submitting" ? "Submitting..." : "Submit for Review"}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/advice">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
