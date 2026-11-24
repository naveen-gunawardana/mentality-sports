"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { ArrowLeft, Mail } from "lucide-react";

interface Issue {
  slug: string;
  subject: string;
  title: string;
  content: string;
  sent_at: string | null;
}

export default function NewsletterIssuePage() {
  const params = useParams();
  const slug = String(params.slug);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("newsletter_issues")
      .select("slug, subject, title, content, sent_at")
      .eq("slug", slug)
      .eq("status", "sent")
      .maybeSingle()
      .then(({ data }) => {
        setIssue((data ?? null) as unknown as Issue | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-navy/40 text-sm">Loading…</div>;
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-navy/60 mb-4">This issue couldn&apos;t be found.</p>
        <Link href="/newsletter" className="text-sm font-semibold text-orange-600 hover:text-orange-500">
          ← The Mental Rep
        </Link>
      </div>
    );
  }

  const sentDate = issue.sent_at
    ? new Date(issue.sent_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> The Mental Rep
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600">
          <Mail className="h-3 w-3" /> The Mental Rep
        </span>
        {sentDate && <span className="text-xs text-navy/40">{sentDate}</span>}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-navy leading-tight mb-8">{issue.title}</h1>

      <div className="prose-content">{renderMarkdown(issue.content)}</div>

      {/* Subscribe CTA */}
      <div className="mt-14 rounded-sm border border-offWhite-300 bg-offWhite p-6 sm:p-8">
        <p className="font-bold text-navy text-lg font-condensed tracking-wide mb-1">GET THE NEXT ONE</p>
        <p className="text-sm text-navy/55 mb-5">
          One practical idea for the mental game, a couple times a month. Free, written by athletes.
        </p>
        <NewsletterSignup source="newsletter_issue" />
      </div>

      <div className="mt-8">
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All issues
        </Link>
      </div>
    </div>
  );
}
