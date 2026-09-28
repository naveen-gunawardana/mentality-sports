"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { ArrowRight, CheckCircle } from "lucide-react";
import { SPORTS, PLAYER_GRADES, MIDDLE_SCHOOL_GRADES } from "@/lib/athlete-options";

const inputClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const selectClass = `${inputClass} h-[38px]`;

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-16 text-center text-muted-foreground">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Mentorship CTAs link here with ?role=mentor to pre-select intent.
  const [role, setRole] = useState<"player" | "mentor">(
    searchParams.get("role") === "mentor" ? "mentor" : "player",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sport, setSport] = useState("");
  const [grade, setGrade] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const needsParent = role === "player" && MIDDLE_SCHOOL_GRADES.has(grade);

  // Supabase surfaces raw auth errors that mean nothing to a signup visitor
  // ("Email rate limit exceeded"). Map the ones users actually hit to copy that
  // tells them what to do next; anything unrecognised falls through as-is.
  function friendlyAuthError(message: string) {
    const m = message.toLowerCase();
    if (m.includes("rate limit") || m.includes("too many requests")) {
      return "We're sending more emails than usual right now. Wait a minute and try again — if it keeps happening, email hello@mentalitysports.com and we'll get you set up.";
    }
    if (m.includes("already registered") || m.includes("already been registered")) {
      return "That email already has an account. Try signing in instead, or reset your password if you've forgotten it.";
    }
    if (m.includes("invalid email") || (m.includes("email address") && m.includes("invalid"))) {
      return "That email address doesn't look right. Double-check it and try again.";
    }
    if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("weak"))) {
      return "Please pick a password with at least 6 characters.";
    }
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        // Land on the callback so the confirm link signs them straight in.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(friendlyAuthError(error.message));
      setLoading(false);
      return;
    }
    // With confirmations on, an already-registered email "succeeds" with no
    // identities instead of erroring.
    if (!data.user || data.user.identities?.length === 0) {
      setError(friendlyAuthError("already registered"));
      setLoading(false);
      return;
    }

    // Create the member profile now, before the email is confirmed, so
    // signing up is the whole commitment — no second application step.
    const res = await fetch("/api/create-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.user.id,
        name,
        role,
        sport: sport ? [sport] : null,
        playerProfile: role === "player" ? { grade, parent_email: needsParent ? parentEmail : null } : null,
        mentorProfile: role === "mentor" ? {} : null,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json?.error ?? "Something went wrong creating your account. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    if (!data.session) {
      router.push("/verify-email");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <Logo href="/" size="md" variant="dark" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-1.5">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          One quick form and you&apos;re in. Free, always.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="I want to">
          {([
            ["player", "Get a mentor"],
            ["mentor", "Be a mentor"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={role === value}
              onClick={() => setRole(value)}
              className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors ${
                role === value
                  ? "border-navy bg-navy text-white"
                  : "border-input bg-background text-navy hover:border-navy/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="Your full name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="your@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        <div className={role === "player" ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Sport</label>
            <select
              value={sport} onChange={(e) => setSport(e.target.value)} required
              className={selectClass}
            >
              <option value="" disabled>Choose…</option>
              {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {role === "player" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Grade</label>
              <select
                value={grade} onChange={(e) => setGrade(e.target.value)} required
                className={selectClass}
              >
                <option value="" disabled>Choose…</option>
                {PLAYER_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
        </div>

        {needsParent && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Parent or guardian email</label>
            <input
              type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required
              placeholder="parent@email.com"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Because you&apos;re in middle school, we keep a parent in the loop.
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-navy"
          />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="font-medium text-navy underline underline-offset-2 hover:text-orange-500 transition-colors">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" className="font-medium text-navy underline underline-offset-2 hover:text-orange-500 transition-colors">Privacy Policy</a>
          </span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit" disabled={loading || !agreedToTerms}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-offWhite border border-offWhite-300 p-4">
        <p className="text-xs font-semibold text-navy mb-2 flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-orange-500" /> What happens next
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {role === "player"
            ? <>Confirm your email and you&apos;re in. We&apos;ll <strong className="text-navy/80">match you with a mentor</strong> who plays your sport and reach out by email.</>
            : <>Confirm your email and you&apos;re in. We&apos;ll <strong className="text-navy/80">review your profile</strong> and reach out when we have an athlete for you.</>}
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-navy hover:text-orange-500 transition-colors underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
