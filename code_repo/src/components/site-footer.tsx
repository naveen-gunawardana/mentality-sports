import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "For athletes",
    links: [
      { href: "/game-day", label: "Game Day routines" },
      { href: "/mentorship", label: "Get a mentor" },
      { href: "/advice", label: "Articles" },
      { href: "/dashboard", label: "Locker Room" },
    ],
  },
  {
    title: "For coaches",
    links: [
      { href: "/signup?role=coach", label: "Create a team" },
      { href: "/signin", label: "Coach sign in" },
    ],
  },
  {
    title: "Listen and read",
    links: [
      { href: "/podcast", label: "Podcast" },
      { href: "/newsletter", label: "The Mental Rep newsletter" },
    ],
  },
  {
    title: "Mentality Sports",
    links: [
      { href: "/about", label: "About us" },
      { href: "/signup?role=mentor", label: "Become a mentor" },
      { href: "/opportunities", label: "Work with us" },
      { href: "mailto:hello@mentalitysports.com", label: "hello@mentalitysports.com" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-chalk">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-xs">
            <Logo href="/" variant="light" size="sm" />
            <p className="mt-5 text-sm leading-relaxed text-chalk/70">
              A nonprofit for the mental side of sport. Free for every athlete, in every sport.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-chalk/70">
              Not a crisis service. If you&apos;re in danger or thinking about hurting yourself, call or text{" "}
              <a href="tel:988" className="font-semibold text-whistle underline-offset-4 hover:underline">988</a>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title}>
                <p className="mb-4 text-sm font-semibold text-chalk">{c.title}</p>
                <ul className="space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="break-words text-chalk/65 transition-colors hover:text-whistle">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-chalk/15 pt-6 text-xs text-chalk/50">
          <p>&copy; {new Date().getFullYear()} Mentality Sports</p>
          <div className="flex gap-5">
            <a href="https://www.instagram.com/mentalitysports" target="_blank" rel="noopener noreferrer" className="hover:text-chalk">Instagram</a>
            <a href="https://www.tiktok.com/@mentalitysports.com" target="_blank" rel="noopener noreferrer" className="hover:text-chalk">TikTok</a>
            <Link href="/terms" className="hover:text-chalk">Terms</Link>
            <Link href="/privacy" className="hover:text-chalk">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
