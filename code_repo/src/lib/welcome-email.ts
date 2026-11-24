import { EMAIL_FROM, BASE_URL } from "@/lib/email";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/email-html";

/**
 * Sent once the signup email is confirmed. Called directly from the auth
 * callback rather than through /api/notify, so it can't be triggered by
 * outside callers.
 */
export async function sendWelcomeEmail({ email, name, role }: { email: string; name: string; role?: string }) {
  const resend = getResend();
  if (!resend) return;
  const firstName = escapeHtml(name.split(" ")[0] || "there");
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Welcome to Mentality Sports",
    html: `<p>Hi ${firstName},</p>
<p>Welcome to Mentality Sports — your account is all set.</p>
${role === "mentor"
  ? `<p>Our team is reviewing your mentor profile. We'll reach out when we have an athlete for you.</p>
<p>In the meantime, check out the <a href="${BASE_URL}/advice">resource library</a>.</p>`
  : role === "coach"
  ? `<p>Create your team from your <a href="${BASE_URL}/dashboard">dashboard</a> and share the join code with your roster. Ask them to do a <a href="${BASE_URL}/reps/pregame">2-minute Pre-Game Reset</a> before your next game.</p>`
  : `<p>Your first <a href="${BASE_URL}/reps/pregame">mental rep</a> takes two minutes. Do one before your next game and a debrief after, and your Locker Room starts tracking your confidence.</p>
<p>Want a mentor too? Ask for one from your <a href="${BASE_URL}/dashboard">Locker Room</a>. Mentors are volunteers, so matching can take a few weeks.</p>`}
<p>— The Mentality Sports Team</p>`,
  });
}
