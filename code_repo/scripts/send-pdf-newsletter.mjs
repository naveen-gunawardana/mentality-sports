// Email a PDF newsletter to every subscribed address in newsletter_subscribers.
// Skips the site composer entirely — no issue page is created.
//
// Usage (from code_repo/):
//   node --env-file=.env.local scripts/send-pdf-newsletter.mjs <file.pdf> --subject "..." [--message "..."] [--to you@x.com] [--send]
//
//   no flags      dry run: prints who would get it, sends nothing
//   --to <email>  send a single test copy to that address
//   --send        send to the full subscriber list
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const EMAIL_FROM = "Mentality Sports <hello@mentalitysports.com>";
const BASE_URL = "https://mentalitysports.com";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const pdfPath = args.find((a) => a.toLowerCase().endsWith(".pdf"));
const subject = flag("--subject");
const message = flag("--message") ?? "This edition of The Mental Rep is attached as a PDF. Give it a read — and reply anytime, we read every one.";
const testTo = flag("--to");
const sendAll = args.includes("--send");

if (!pdfPath || !subject) {
  console.error('Usage: node --env-file=.env.local scripts/send-pdf-newsletter.mjs <file.pdf> --subject "..." [--message "..."] [--to email] [--send]');
  process.exit(1);
}

const pdf = readFileSync(pdfPath);
const filename = basename(pdfPath);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = (unsubscribeUrl) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="color:#14213D;font-size:22px;margin:0 0 14px;">${esc(subject)}</h2>
  ${message.split(/\n+/).map((p) => `<p style="color:#3f4a5c;font-size:16px;line-height:1.6;margin:0 0 14px;">${esc(p)}</p>`).join("")}
  <p style="color:#3f4a5c;font-size:16px;line-height:1.6;margin:0 0 14px;">— The Mentality Sports Team</p>
  <p style="color:#8a93a3;font-size:12px;margin-top:32px;">You're getting this because you subscribed at mentalitysports.com. <a href="${unsubscribeUrl}" style="color:#8a93a3;">Unsubscribe</a></p>
</div>`;

async function sendOne(email, token) {
  const unsubscribeUrl = token ? `${BASE_URL}/api/newsletter/unsubscribe?token=${token}` : `${BASE_URL}/newsletter`;
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject,
    html: html(unsubscribeUrl),
    attachments: [{ filename, content: pdf }],
    ...(token && {
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (error) throw new Error(error.message);
}

if (testTo) {
  await sendOne(testTo, null);
  console.log(`Test sent to ${testTo}`);
  process.exit(0);
}

const { data: subs, error } = await supabase
  .from("newsletter_subscribers")
  .select("email, unsubscribe_token")
  .eq("status", "subscribed");
if (error) { console.error(error.message); process.exit(1); }

console.log(`${filename} (${(pdf.length / 1024).toFixed(0)} KB) → ${subs.length} subscribers`);
if (!sendAll) {
  subs.forEach((s) => console.log("  " + s.email));
  console.log("\nDry run. Add --to <email> for a test, or --send to send for real.");
  process.exit(0);
}

// Resend's default rate limit is 2 req/s, and attachments rule out the batch API.
let sent = 0;
const failed = [];
for (const s of subs) {
  try {
    await sendOne(s.email, s.unsubscribe_token);
    sent++;
  } catch (e) {
    failed.push(s.email);
    console.error(`  ✗ ${s.email}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 600));
}
console.log(`Sent ${sent}/${subs.length}${failed.length ? ` — failed: ${failed.join(", ")}` : ""}`);
