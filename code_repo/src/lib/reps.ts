/**
 * Mental reps: short, guided exercises an athlete can run on their own, any
 * time, with no mentor required. They give a signup value on day one instead of
 * a waitlist.
 *
 * A completed rep is stored as a row in `reflections` (already RLS-scoped to the
 * player, and visible to their mentor only when shared):
 *   title = rep title, mood = confidence 1–10 as text, content = "Q: A" lines.
 */

export type RepKey = "pregame" | "postgame" | "reset";

export type RepStep =
  | { kind: "breathe"; id: string; prompt: string; rounds: number }
  | { kind: "choice"; id: string; prompt: string; help?: string; options: string[]; allowCustom?: boolean }
  | { kind: "text"; id: string; prompt: string; help?: string; placeholder: string }
  | { kind: "scale"; id: string; prompt: string; help?: string };

export interface Rep {
  key: RepKey;
  title: string;
  when: string;
  minutes: number;
  blurb: string;
  steps: RepStep[];
  /** Line shown on the finish card, built from the answers. */
  takeaway: (a: Record<string, string>) => string;
}

export const CONFIDENCE_STEP_ID = "confidence";

export const REPS: Rep[] = [
  {
    key: "pregame",
    title: "Pre-Game Reset",
    when: "Before a game, match, or tryout",
    minutes: 2,
    blurb: "Slow your body down, pick the one thing you control, and lock in a cue word.",
    steps: [
      { kind: "breathe", id: "breathe", prompt: "Box breathing. Follow the square.", rounds: 3 },
      {
        kind: "choice",
        id: "control",
        prompt: "What's one thing you control today?",
        help: "Not the score or the minutes. Something that's 100% yours.",
        options: ["Effort", "Body language", "Talking on defense", "Energy off the bench", "Next-play mindset", "Being a great teammate"],
        allowCustom: true,
      },
      {
        kind: "choice",
        id: "cue",
        prompt: "Pick your cue word.",
        help: "Say it to yourself after a mistake or before a big moment.",
        options: ["Next", "Attack", "Free", "Trust it", "Calm", "Compete"],
        allowCustom: true,
      },
      { kind: "scale", id: CONFIDENCE_STEP_ID, prompt: "How confident do you feel right now?", help: "No right answer. Just be honest." },
    ],
    takeaway: (a) => `Today you own: ${a.control || "your effort"}. When it gets loud, say "${a.cue || "Next"}."`,
  },
  {
    key: "postgame",
    title: "Post-Game Debrief",
    when: "Within a day of competing",
    minutes: 3,
    blurb: "Three honest questions so the game teaches you something, win or lose.",
    steps: [
      { kind: "scale", id: CONFIDENCE_STEP_ID, prompt: "How confident did you play?", help: "1 = played scared, 10 = played free." },
      { kind: "text", id: "well", prompt: "One thing that went well.", help: "Even in a bad game there's one. Find it.", placeholder: "e.g. I kept talking on defense even after I missed" },
      { kind: "text", id: "letgo", prompt: "One thing you're letting go of.", help: "Name it, then drop it. It doesn't come to practice with you.", placeholder: "e.g. The turnover in the 3rd quarter" },
      { kind: "text", id: "next", prompt: "One thing to work on next.", help: "Small and specific beats big and vague.", placeholder: "e.g. Take the open shot the first time I see it" },
    ],
    takeaway: (a) => (a.next ? `Next time: ${a.next}` : "Game logged. On to the next one."),
  },
  {
    key: "reset",
    title: "Bad Day Reset",
    when: "After a rough game, a benching, or a cut",
    minutes: 3,
    blurb: "Get it out of your head, talk to yourself like a teammate would, and pick one move for tomorrow.",
    steps: [
      { kind: "text", id: "what", prompt: "What happened?", help: "Just the facts. Nobody else sees this unless you share it.", placeholder: "e.g. Coach pulled me after two misses" },
      { kind: "text", id: "teammate", prompt: "If a teammate told you this, what would you say to them?", help: "Most athletes are way harder on themselves than on anyone else.", placeholder: "e.g. Two misses doesn't change who you are as a player" },
      {
        kind: "choice",
        id: "tomorrow",
        prompt: "One thing you'll do tomorrow.",
        options: ["Get extra reps on it", "Talk to my coach", "Talk to someone I trust", "Get real sleep", "Watch film calmly", "Take a day and reset"],
        allowCustom: true,
      },
      { kind: "scale", id: CONFIDENCE_STEP_ID, prompt: "How are you feeling about your game right now?", help: "1 = really low, 10 = good to go." },
    ],
    takeaway: (a) => `Tomorrow: ${a.tomorrow || "one small step"}. One day doesn't define you.`,
  },
];

export const REPS_BY_KEY = Object.fromEntries(REPS.map((r) => [r.key, r])) as Record<RepKey, Rep>;
const REPS_BY_TITLE = Object.fromEntries(REPS.map((r) => [r.title, r])) as Record<string, Rep>;

export function isRepKey(v: unknown): v is RepKey {
  return typeof v === "string" && v in REPS_BY_KEY;
}

export function repFromTitle(title: string | null | undefined): Rep | null {
  return title ? REPS_BY_TITLE[title] ?? null : null;
}

/** Serialize answers into the reflections row shape. */
export function encodeRep(rep: Rep, answers: Record<string, string>) {
  const lines = rep.steps
    .filter((s) => s.kind !== "breathe" && s.id !== CONFIDENCE_STEP_ID && answers[s.id]?.trim())
    .map((s) => `${s.prompt} ${answers[s.id].trim()}`);
  const confidence = Number(answers[CONFIDENCE_STEP_ID]);
  return {
    title: rep.title,
    content: lines.join("\n") || rep.takeaway(answers),
    mood: Number.isInteger(confidence) && confidence >= 1 && confidence <= 10 ? String(confidence) : null,
  };
}

export function confidenceOf(mood: string | null | undefined): number | null {
  const n = Number(mood);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}

/** Consecutive days (ending today or yesterday) with at least one rep. */
export function repStreak(dates: (string | null)[], now = new Date()): number {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const days = new Set(dates.filter(Boolean).map((d) => dayKey(new Date(d as string))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * A rep finished while signed out is parked in localStorage and saved the next
 * time the athlete lands on their dashboard (after signup + email confirm).
 */
export const PENDING_REP_KEY = "mentality_pending_rep";

export interface PendingRep {
  key: RepKey;
  answers: Record<string, string>;
  finishedAt: string;
}
