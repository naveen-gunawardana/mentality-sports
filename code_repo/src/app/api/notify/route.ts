import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { EMAIL_FROM as FROM, BASE_URL } from "@/lib/email";
import { escapeHtml as esc } from "@/lib/email-html";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const STAFF_ROLES = ["admin", "outreach", "operations"];

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await getAdmin().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { type } = payload;
  const resend = getResend();
  // TODO: add RESEND_API_KEY to .env.local to enable email notifications
  if (!resend) return NextResponse.json({ ok: true, skipped: "no api key" });

  // Every type except forgot_password acts on behalf of the signed-in caller,
  // so nobody can use this route to send our emails to arbitrary addresses.
  const { data: { user } } = await (await createSessionClient()).auth.getUser();
  const isStaff = STAFF_ROLES.includes(user?.app_metadata?.role);
  const forbidden = () => NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (type !== "forgot_password" && !user) return forbidden();
  if (["match_created", "mentor_approved", "article_approved"].includes(type) && !isStaff) return forbidden();

  try {
    if (type === "forgot_password") {
      const { email } = payload;
      const admin = getAdmin();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${BASE_URL}/reset-password` },
      });
      if (error || !data.properties?.action_link) {
        return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
      }
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Reset your Mentality Sports password",
        html: `<p>Hi,</p>
<p>Click the link below to reset your password. This link expires in 1 hour.</p>
<p><a href="${data.properties.action_link}">Reset password</a></p>
<p>If you didn't request this, you can ignore this email.</p>
<p>— The Mentality Sports Team</p>`,
      });

    } else if (type === "match_created") {
      const { playerEmail, playerName, mentorEmail, mentorName } = payload;
      await Promise.all([
        resend.emails.send({
          from: FROM,
          to: playerEmail,
          subject: "You've been matched with a mentor",
          html: `<p>Hi ${esc(playerName)},</p>
<p>Great news — you've been matched with <strong>${esc(mentorName)}</strong> on Mentality Sports.</p>
<p>Head to your <a href="${BASE_URL}/dashboard">Locker Room</a> to send your first message and get started.</p>
<p>— The Mentality Sports Team</p>`,
        }),
        resend.emails.send({
          from: FROM,
          to: mentorEmail,
          subject: "You've been matched with an athlete",
          html: `<p>Hi ${esc(mentorName)},</p>
<p>You've been matched with <strong>${esc(playerName)}</strong> on Mentality Sports.</p>
<p>Head to your <a href="${BASE_URL}/dashboard">Locker Room</a> to introduce yourself and review their profile.</p>
<p>— The Mentality Sports Team</p>`,
        }),
      ]);

    } else if (type === "mentor_approved") {
      const { email, name } = payload;
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Your Mentality Sports application has been approved",
        html: `<p>Hi ${esc(name)},</p>
<p>Your application to become a mentor on Mentality Sports has been approved!</p>
<p>We're now working on finding the right athlete for you. Once matched, you'll get another email and your mentee will appear in your <a href="${BASE_URL}/dashboard">Locker Room</a>.</p>
<p>Thanks for giving back to the next generation of athletes.</p>
<p>— The Mentality Sports Team</p>`,
      });

    } else if (type === "call_scheduled") {
      const { matchId, scheduledAt, proposedById, note } = payload;
      if (proposedById !== user!.id) return forbidden();
      const admin = getAdmin();

      const { data: match } = await admin
        .from("matches")
        .select("mentor_id, player_id")
        .eq("id", matchId)
        .single();
      if (!match) return NextResponse.json({ ok: true });
      if (user!.id !== match.mentor_id && user!.id !== match.player_id) return forbidden();

      const recipientId = proposedById === match.mentor_id ? match.player_id : match.mentor_id;

      const [{ data: proposerProfile }, { data: recipientProfile }, recipientEmail] = await Promise.all([
        admin.from("profiles").select("name").eq("id", proposedById).single(),
        admin.from("profiles").select("name").eq("id", recipientId).single(),
        getUserEmail(recipientId),
      ]);

      if (!recipientEmail) return NextResponse.json({ ok: true });

      const d = new Date(scheduledAt);
      const formatted = d.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      await resend.emails.send({
        from: FROM,
        to: recipientEmail,
        subject: `Call scheduled for ${formatted}`,
        html: `<p>Hi ${esc(recipientProfile?.name ?? "there")},</p>
<p><strong>${esc(proposerProfile?.name ?? "Your match")}</strong> has scheduled a call with you for <strong>${formatted}</strong>.</p>
${note ? `<p>Note: ${esc(String(note))}</p>` : ""}
<p>See it in your <a href="${BASE_URL}/dashboard">Locker Room</a>.</p>
<p>— The Mentality Sports Team</p>`,
      });

    } else if (type === "new_message") {
      const { matchId, senderId } = payload;
      if (senderId !== user!.id) return forbidden();
      const admin = getAdmin();

      const { data: match } = await admin
        .from("matches")
        .select("mentor_id, player_id")
        .eq("id", matchId)
        .single();
      if (!match) return NextResponse.json({ ok: true });
      if (user!.id !== match.mentor_id && user!.id !== match.player_id) return forbidden();

      const recipientId = senderId === match.mentor_id ? match.player_id : match.mentor_id;

      // Only notify if the conversation has been quiet for 30+ minutes
      // to avoid flooding when both parties are actively chatting
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentMessages } = await admin
        .from("messages")
        .select("id")
        .eq("match_id", matchId)
        .neq("sender_id", senderId)
        .gte("created_at", thirtyMinsAgo)
        .limit(1);

      // If the recipient sent a message in the last 30 min, they're likely active
      if (recentMessages && recentMessages.length > 0) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const [{ data: senderProfile }, { data: recipientProfile }, recipientEmail] = await Promise.all([
        admin.from("profiles").select("name").eq("id", senderId).single(),
        admin.from("profiles").select("name").eq("id", recipientId).single(),
        getUserEmail(recipientId),
      ]);

      if (!recipientEmail) return NextResponse.json({ ok: true });

      await resend.emails.send({
        from: FROM,
        to: recipientEmail,
        subject: `New message from ${senderProfile?.name ?? "your match"}`,
        html: `<p>Hi ${esc(recipientProfile?.name ?? "there")},</p>
<p>You have a new message from <strong>${esc(senderProfile?.name ?? "your match")}</strong> on Mentality Sports.</p>
<p><a href="${BASE_URL}/dashboard">Go to your Locker Room</a> to read and reply.</p>
<p>— The Mentality Sports Team</p>`,
      });

    } else if (type === "article_approved") {
      const { submittedBy, authorName, title, slug } = payload;
      if (!submittedBy) return NextResponse.json({ ok: true });

      const authorEmail = await getUserEmail(submittedBy);
      if (!authorEmail) return NextResponse.json({ ok: true });

      await resend.emails.send({
        from: FROM,
        to: authorEmail,
        subject: `Your article is now live on Mentality Sports`,
        html: `<p>Hi ${esc(authorName ?? "there")},</p>
<p>Your article <strong>"${esc(title)}"</strong> has been approved and is now live in the advice library.</p>
<p><a href="${BASE_URL}/advice/${slug}">Read it here</a></p>
<p>Thank you for contributing to the community.</p>
<p>— The Mentality Sports Team</p>`,
      });

    } else if (type === "certificate_request") {
      const { userId, role, programInfo } = payload;
      if (userId !== user!.id) return forbidden();
      const admin = getAdmin();
      const { data: profile } = await admin.from("profiles").select("name").eq("id", userId).single();
      const userEmail = await getUserEmail(userId);
      const isMentor = role === "mentor";
      const certName = isMentor ? "Certificate of Mentorship" : "Certificate of Completion";

      // Notify the team to issue + send the certificate.
      await resend.emails.send({
        from: FROM,
        to: "officialmentalitysports@gmail.com",
        subject: `Certificate request — ${isMentor ? "Mentor" : "Athlete"}: ${profile?.name ?? userEmail ?? userId}`,
        html: `<p>A ${isMentor ? "mentor" : "athlete"} has requested their ${certName}.</p>
<ul>
  <li><strong>Name:</strong> ${esc(profile?.name ?? "—")}</li>
  <li><strong>Email:</strong> ${userEmail ?? "—"}</li>
  <li><strong>Role:</strong> ${esc(String(role))}</li>
  ${programInfo ? `<li><strong>Program:</strong> ${esc(String(programInfo))}</li>` : ""}
</ul>
<p>Please issue and send their ${certName}.</p>`,
      });

      // Confirm to the requester.
      if (userEmail) {
        await resend.emails.send({
          from: FROM,
          to: userEmail,
          subject: "We got your certificate request",
          html: `<p>Hi ${esc((profile?.name ?? "there").split(" ")[0])},</p>
<p>Thanks for completing your ${isMentor ? "mentorship" : "1-month program"}! We've received your request and our team will email you your <strong>${certName}</strong> shortly.</p>
<p>— The Mentality Sports Team</p>`,
        });
      }

    } else {
      return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
