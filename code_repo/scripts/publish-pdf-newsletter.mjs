// Publish a PDF newsletter issue to mentalitysports.com/newsletter.
// Uploads the PDF to the public `newsletters` storage bucket and inserts a
// `sent` newsletter_issues row whose content embeds it via [pdf:URL].
// Inserting as `sent` means the admin composer will never email it again.
//
// Usage (from code_repo/):
//   node --env-file=.env.local scripts/publish-pdf-newsletter.mjs <file.pdf> --title "..." --excerpt "..." \
//     [--subject "..."] [--slug my-slug] [--content-file text-version.md] [--recipients 35]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "newsletters";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const pdfPath = args.find((a) => a.toLowerCase().endsWith(".pdf"));
const title = flag("--title");
const excerpt = flag("--excerpt");
if (!pdfPath || !title || !excerpt) {
  console.error('Usage: node --env-file=.env.local scripts/publish-pdf-newsletter.mjs <file.pdf> --title "..." --excerpt "..." [--subject "..."] [--slug s] [--content-file f.md] [--recipients n]');
  process.exit(1);
}
const slug = flag("--slug") ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const textVersion = flag("--content-file") ? readFileSync(flag("--content-file"), "utf8").trim() : null;
const recipients = flag("--recipients");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: existing } = await supabase.from("newsletter_issues").select("id").eq("slug", slug).maybeSingle();
if (existing) {
  console.error(`An issue with slug "${slug}" already exists — pass a different --slug.`);
  process.exit(1);
}

const { data: bucket } = await supabase.storage.getBucket(BUCKET);
if (!bucket) {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ["application/pdf"] });
  if (error) { console.error(`createBucket: ${error.message}`); process.exit(1); }
}

const path = `${slug}.pdf`;
const { error: upErr } = await supabase.storage
  .from(BUCKET)
  .upload(path, readFileSync(pdfPath), { contentType: "application/pdf", upsert: true });
if (upErr) { console.error(`upload: ${upErr.message}`); process.exit(1); }
const pdfUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

const content = [excerpt, `[pdf:${pdfUrl}]`, textVersion].filter(Boolean).join("\n\n");
const { error: insErr } = await supabase.from("newsletter_issues").insert({
  slug,
  subject: flag("--subject") ?? title,
  title,
  preview_text: excerpt,
  excerpt,
  content,
  status: "sent",
  sent_at: new Date().toISOString(),
  ...(recipients && { recipient_count: Number(recipients) }),
});
if (insErr) { console.error(`insert: ${insErr.message}`); process.exit(1); }

console.log(`PDF:   ${pdfUrl}`);
console.log(`Issue: https://mentalitysports.com/newsletter/${slug}`);
