import React from "react";

/**
 * Lightweight markdown renderer shared across the platform (advice articles,
 * group-session descriptions, course/lesson notes, newsletter issues).
 *
 * Supports: `## h2`, `### h3`, standalone `**bold**` lead-ins, `- ` bullet
 * lists, inline `**bold**`, `[text](url)` links, `[youtube:VIDEO_ID]`
 * embeds, and `[pdf:https://…/file.pdf]` embeds. Intentionally
 * dependency-free and safe to call from server components.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on bold (**..**) and links [text](url), keeping the delimiters.
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${j}`} className="font-semibold text-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const external = /^https?:\/\//.test(link[2]);
      return (
        <a
          key={`${keyPrefix}-a-${j}`}
          href={link[2]}
          className="font-medium text-orange-600 underline underline-offset-2 hover:text-orange-500 transition-colors"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${j}`}>{part}</React.Fragment>;
  });
}

export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = (text ?? "").split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    const items = listBuffer;
    listBuffer = [];
    elements.push(
      <ul key={`ul-${key}`} className="my-4 space-y-2 pl-5 list-disc marker:text-orange-400">
        {items.map((item, idx) => (
          <li key={idx} className="text-navy/75 leading-relaxed">
            {renderInline(item, `li-${key}-${idx}`)}
          </li>
        ))}
      </ul>
    );
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    flushList(String(i));

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-bold text-navy mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-navy mt-8 mb-3 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
      elements.push(
        <p key={i} className="font-semibold text-navy mt-4 mb-1">
          {trimmed.slice(2, -2)}
        </p>
      );
    } else if (trimmed === "") {
      // blank line — paragraph break
    } else if (/^\[youtube:[a-zA-Z0-9_-]+\]$/.test(trimmed)) {
      const videoId = trimmed.slice(9, -1);
      elements.push(
        <div key={i} className="my-8 rounded-xl overflow-hidden aspect-video w-full shadow-sm border border-offWhite-300">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    } else if (/^\[pdf:https:\/\/[^\s\]]+\.pdf\]$/.test(trimmed)) {
      // Mobile browsers (iOS especially) only render the first page of an
      // iframed PDF, so the open/download buttons are the real fallback.
      const pdfUrl = trimmed.slice(5, -1);
      elements.push(
        <div key={i} className="my-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-sm bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Open PDF
            </a>
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center rounded-sm border border-offWhite-300 px-4 py-2 text-sm font-semibold text-navy hover:border-orange-300 transition-colors"
            >
              Download
            </a>
          </div>
          <iframe
            src={pdfUrl}
            title="Newsletter PDF"
            className="w-full h-[80vh] min-h-[500px] rounded-sm border border-offWhite-300 bg-offWhite"
          />
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-navy/75 leading-relaxed mb-3">
          {renderInline(line, String(i))}
        </p>
      );
    }
  });

  flushList("end");
  return elements;
}

/** Convenience component wrapper. */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return <div className={className}>{renderMarkdown(content)}</div>;
}
