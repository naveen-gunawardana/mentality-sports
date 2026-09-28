import {
  Users,
  BookOpen,
  Mail,
  Mic,
  type LucideIcon,
} from "lucide-react";

export type ProgramStatus = "live" | "new" | "soon";

export interface Program {
  key: string;
  /** Short label for nav menus. */
  label: string;
  /** Full title for hub cards and headers. */
  title: string;
  tagline: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  status: ProgramStatus;
}

/**
 * The canonical list of Mentality Sports programs. Single source of truth for
 * the Programs nav menu, the homepage programs section, and the /programs hub.
 */
export const PROGRAMS: Program[] = [
  {
    key: "mentorship",
    label: "1-on-1 Mentorship",
    title: "1-on-1 Mentorship",
    tagline: "Matched with a mentor who's lived it",
    description:
      "Get paired 1-on-1 with a current or former athlete who's been through the same mental battles. A focused 1-month program — four weekly sessions — free, the flagship.",
    href: "/mentorship",
    Icon: Users,
    status: "live",
  },
  {
    key: "resources",
    label: "Resources",
    title: "Resource Library",
    tagline: "Articles on the mental side of sport",
    description:
      "A growing library on confidence, anxiety, motivation, identity, and every mental challenge athletes face — written by people who've been there.",
    href: "/advice",
    Icon: BookOpen,
    status: "live",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    title: "The Mental Rep",
    tagline: "One idea you can use, twice a month",
    description:
      "Our newsletter for athletes who train the mental game. No fluff — one practical idea, a couple times a month. Free to join.",
    href: "/newsletter",
    Icon: Mail,
    status: "new",
  },
  {
    key: "podcast",
    label: "Podcast",
    title: "The Podcast",
    tagline: "Honest conversations on sport & mind",
    description:
      "Real talk with athletes, mentors, and experts on the mental side of competing. New episodes every month.",
    href: "/podcast",
    Icon: Mic,
    status: "new",
  },
];

export const PROGRAMS_BY_KEY: Record<string, Program> = Object.fromEntries(
  PROGRAMS.map((p) => [p.key, p]),
);
