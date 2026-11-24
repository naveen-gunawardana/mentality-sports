"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

interface NewsletterSignupProps {
  source?: string;
  /** Visual treatment for placement on light vs. dark backgrounds. */
  theme?: "light" | "dark";
  /** Collect an optional name field alongside email. */
  showName?: boolean;
  className?: string;
}

export function NewsletterSignup({
  source = "site",
  theme = "light",
  showName = false,
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const dark = theme === "dark";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("done");
      setMessage(data?.alreadySubscribed ? "You're already on the list — see you in your inbox." : "You're in. Check your inbox for a hello.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        className={`flex items-center gap-3 rounded-sm px-5 py-4 ${
          dark ? "bg-white/10 text-white" : "bg-orange-50 text-navy"
        } ${className}`}
      >
        <CheckCircle className={`h-5 w-5 shrink-0 ${dark ? "text-orange-400" : "text-orange-500"}`} />
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  }

  const inputBase =
    "w-full px-4 py-3 text-sm rounded-sm border outline-none transition-colors";
  const inputStyle = dark
    ? "bg-white/5 border-white/15 text-white placeholder-white/35 focus:border-orange-400"
    : "bg-white border-offWhite-400 text-navy placeholder-navy/35 focus:border-orange-400";

  return (
    <form onSubmit={onSubmit} className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        {showName && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className={`${inputBase} ${inputStyle} sm:max-w-[180px]`}
            autoComplete="given-name"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={`${inputBase} ${inputStyle} flex-1`}
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 px-6 py-3 text-sm font-bold text-white transition-colors shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
      {status === "error" && (
        <p className={`text-xs ${dark ? "text-orange-300" : "text-orange-600"}`}>{message}</p>
      )}
      <p className={`text-[11px] ${dark ? "text-white/35" : "text-navy/40"}`}>
        Free. A couple emails a month. Unsubscribe anytime.
      </p>
    </form>
  );
}
