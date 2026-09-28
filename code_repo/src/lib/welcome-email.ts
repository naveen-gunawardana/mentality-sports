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
  ? `<p>Our team is reviewing your mentor profile. We'll reach out when we have an athlete for you.</p>`
  : `<p>You're on the list — our team will match you with a mentor soon. We'll reach out by email when you're matched.</p>`}
<p>In the meantime, check out the <a href="${BASE_URL}/advice">resource library</a>.</p>
<p>— The Mentality Sports Team</p>`,
  });
}
