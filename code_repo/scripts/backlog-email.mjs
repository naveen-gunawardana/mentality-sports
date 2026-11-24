// One-off email to athletes who signed up but were never matched with a mentor.
//
//   node --env-file=.env.local scripts/backlog-email.mjs            # dry run: count + preview, sends nothing
//   node --env-file=.env.local scripts/backlog-email.mjs --test you@example.com   # send one copy to an address
//   node --env-file=.env.local scripts/backlog-email.mjs --send     # send to every waiting athlete
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const FROM = "Mentality Sports <hello@mentalitysports.com>";
const BASE = "https://mentalitysports.com";
const args = process.argv.slice(2);
const mode = args.includes("--send") ? "send" : args.includes("--test") ? "test" : "dry";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const SUBJECT = "Your mentor request, and something you can use today";

export function render(firstName) {
  const name = esc(firstName || "there");
  const text = `Hi ${firstName || "there"},

You signed up for Mentality Sports to get a mentor, and we haven't matched you yet. That's on us. More athletes signed up than we had volunteer mentors, and we should have told you sooner.

Two things changed:

1. You don't have to wait anymore. We built Mental Reps: 2-minute guided exercises for before and after games (a Pre-Game Reset, a Post-Game Debrief, and a Bad Day Reset). They're in your Locker Room now and they track your confidence over time.
Try the Pre-Game Reset: ${BASE}/reps/pregame

2. If you still want a mentor, tell us what you want help with in your Locker Room. We're matching people who do that first.
${BASE}/dashboard

If you don't want a mentor anymore, you don't need to do anything.

Naveen and the Mentality Sports team`;
  const html = `<p>Hi ${name},</p>
<p>You signed up for Mentality Sports to get a mentor, and we haven't matched you yet. That's on us. More athletes signed up than we had volunteer mentors, and we should have told you sooner.</p>
<p>Two things changed:</p>
<p><strong>1. You don't have to wait anymore.</strong> We built Mental Reps: 2-minute guided exercises for before and after games (a Pre-Game Reset, a Post-Game Debrief, and a Bad Day Reset). They're in your Locker Room now and they track your confidence over time.<br><a href="${BASE}/reps/pregame">Try the Pre-Game Reset →</a></p>
<p><strong>2. If you still want a mentor,</strong> tell us what you want help with in your <a href="${BASE}/dashboard">Locker Room</a>. We're matching people who do that first.</p>
<p>If you don't want a mentor anymore, you don't need to do anything.</p>
<p>Naveen and the Mentality Sports team</p>`;
  return { text, html };
}

async function recipients() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: players }, { data: matches }] = await Promise.all([
    db.from("profiles").select("id, name").eq("role", "player"),
    db.from("matches").select("player_id"),
  ]);
  const matched = new Set((matches ?? []).map((m) => m.player_id));
  const waiting = (players ?? []).filter((p) => !matched.has(p.id));
  const out = [];
  for (const p of waiting) {
    const { data } = await db.auth.admin.getUserById(p.id);
    if (data?.user?.email && data.user.email_confirmed_at) out.push({ email: data.user.email, first: (p.name ?? "").trim().split(/\s+/)[0] });
  }
  return out;
}

if (mode === "test") {
  const to = args[args.indexOf("--test") + 1];
  if (!to?.includes("@")) throw new Error("--test needs an email address");
  const { text, html } = render("Alex");
  const res = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject: SUBJECT, text, html });
  console.log(res.error ? res.error : `test sent to ${to}`);
} else {
  const list = await recipients();
  console.log(`${list.length} waiting athletes with confirmed emails`);
  if (mode === "dry") {
    console.log(`\nSubject: ${SUBJECT}\n\n${render("Alex").text}`);
  } else {
    const resend = new Resend(process.env.RESEND_API_KEY);
    let ok = 0, failed = 0;
    for (let i = 0; i < list.length; i += 50) {
      const batch = list.slice(i, i + 50).map((r) => ({ from: FROM, to: r.email, subject: SUBJECT, ...render(r.first) }));
      const res = await resend.batch.send(batch);
      if (res.error) { failed += batch.length; console.error(res.error); } else ok += batch.length;
    }
    console.log(`sent ${ok}, failed ${failed}`);
  }
}
