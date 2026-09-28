import { BASE_URL } from "@/lib/email";

/**
 * Minimal markdown → inline-styled HTML for emails. Mirrors the subset our
 * renderer supports (## / ### headings, **bold**, - bullets, [text](url),
 * paragraphs). Email clients require inline styles, so everything is inlined.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#C4633A;text-decoration:underline;">$1</a>',
  );
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#14213D;">$1</strong>');
  return out;
}

export function markdownToEmailHtml(content: string): string {
  const lines = (content ?? "").split("\n");
  const parts: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length === 0) return;
    parts.push(
      `<ul style="margin:12px 0;padding-left:20px;color:#3f4a5c;font-size:16px;line-height:1.6;">${list
        .map((li) => `<li style="margin:6px 0;">${inline(li)}</li>`)
        .join("")}</ul>`,
    );
    list = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("- ")) {
      list.push(t.slice(2));
      continue;
    }
    flush();
    if (/^\[pdf:https:\/\/[^\s\]]+\.pdf\]$/.test(t)) {
      parts.push(`<p style="margin:14px 0;"><a href="${t.slice(5, -1)}" style="color:#C4633A;font-weight:600;text-decoration:underline;">Read this issue as a PDF →</a></p>`);
    } else if (line.startsWith("### ")) {
      parts.push(`<h3 style="color:#14213D;font-size:18px;margin:22px 0 8px;">${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      parts.push(`<h2 style="color:#14213D;font-size:22px;margin:26px 0 10px;">${inline(line.slice(3))}</h2>`);
    } else if (t.startsWith("**") && t.endsWith("**") && t.length > 4) {
      parts.push(`<p style="color:#14213D;font-weight:600;font-size:16px;margin:14px 0 4px;">${inline(t.slice(2, -2))}</p>`);
    } else if (t === "") {
      // skip
    } else {
      parts.push(`<p style="color:#3f4a5c;font-size:16px;line-height:1.6;margin:0 0 14px;">${inline(line)}</p>`);
    }
  }
  flush();
  return parts.join("\n");
}

/**
 * Wrap newsletter body in the branded Mentality Sports email shell.
 * `unsubscribeUrl` may be a real URL (direct sends) or a Resend merge tag
 * like `{{{RESEND_UNSUBSCRIBE_URL}}}` (broadcasts).
 */
export function buildIssueHtml(opts: {
  title: string;
  contentMd: string;
  unsubscribeUrl?: string;
}): string {
  const body = markdownToEmailHtml(opts.contentMd);
  const unsub = opts.unsubscribeUrl
    ? `<a href="${opts.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F6F3EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#14213D;padding:28px 32px;">
      <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:0.5px;">MENTALITY<span style="color:#C4633A;">SPORTS</span></span>
    </div>
    <div style="height:3px;background:#C4633A;"></div>
    <div style="padding:32px;">
      <h1 style="color:#14213D;font-size:26px;margin:0 0 18px;line-height:1.2;">${escapeHtml(opts.title)}</h1>
      ${body}
    </div>
    <div style="padding:24px 32px;border-top:1px solid #EDE8DB;background:#FAF8F4;">
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;">
        You're getting this because you subscribed to The Mental Rep at <a href="${BASE_URL}" style="color:#C4633A;text-decoration:none;">mentalitysports.com</a>.
      </p>
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        Mentality Sports — built by athletes, for athletes. ${unsub}
      </p>
    </div>
  </div>
</body>
</html>`;
}
