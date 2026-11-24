import {
  Target,
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
    key: "reps",
    label: "Game Day",
    title: "Game Day",
    tagline: "Two minutes before and after you compete",
    description:
      "Guided routines you run on your own: a pre-game reset, a post-game debrief, and a bad day reset. Track your confidence game to game. Free, no waiting.",
    href: "/game-day",
    Icon: Target,
    status: "new",
  },
  {
    key: "mentorship",
    label: "1-on-1 Mentorship",
    title: "Mentors",
    tagline: "Matched with a mentor who's lived it",
    description:
      "Ask for a current or former athlete in your sport. Four weeks of weekly check-ins and messages in between. Mentors volunteer, so matching can take a few weeks.",
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
      "Articles on confidence, nerves, motivation, identity and the other parts of the mental game, written by people who've been there.",
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
      "One practical idea for the mental game, a couple of times a month. Free.",
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
      "Conversations with athletes, mentors and experts about the mental side of competing.",
    href: "/podcast",
    Icon: Mic,
    status: "new",
  },
];

export const PROGRAMS_BY_KEY: Record<string, Program> = Object.fromEntries(
  PROGRAMS.map((p) => [p.key, p]),
);
