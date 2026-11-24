import Link from "next/link";
import type { Metadata } from "next";
import { PROGRAMS } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Everything we do | Mentality Sports",
  description: "Game Day routines, mentors, articles, a newsletter and a podcast for the mental side of sport. All free.",
  alternates: { canonical: "https://mentalitysports.com/programs" },
};

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 md:py-28">
      <h1 className="type-display text-[clamp(2.5rem,6vw,4.5rem)] text-ink">Everything we do</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
        Start with a Game Day routine. Add a mentor when you want a person in your corner. Read and listen for the rest.
        All of it is free.
      </p>
      <ul className="mt-14">
        {PROGRAMS.map((p) => (
          <li key={p.key} className="border-t border-line last:border-b">
            <Link href={p.href} className="group grid gap-2 py-8 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
              <h2 className="type-heading text-2xl text-ink group-hover:text-turf sm:text-3xl">{p.title}</h2>
              <div>
                <p className="font-semibold text-ink">{p.tagline}</p>
                <p className="mt-1.5 text-base leading-relaxed text-ink/70">{p.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
