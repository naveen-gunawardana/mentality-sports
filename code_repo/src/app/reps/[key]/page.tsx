import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REPS, REPS_BY_KEY, isRepKey } from "@/lib/reps";
import { RepSession } from "./rep-session";

export function generateStaticParams() {
  return REPS.map((r) => ({ key: r.key }));
}

export function generateMetadata({ params }: { params: { key: string } }): Metadata {
  if (!isRepKey(params.key)) return {};
  const rep = REPS_BY_KEY[params.key];
  return {
    title: `${rep.title} — Mental Reps | Mentality Sports`,
    description: rep.blurb,
    alternates: { canonical: `/reps/${rep.key}` },
  };
}

export default function RepPage({ params }: { params: { key: string } }) {
  if (!isRepKey(params.key)) notFound();
  return (
    <div className="px-4 py-10 sm:py-14">
      <RepSession repKey={params.key} />
    </div>
  );
}
