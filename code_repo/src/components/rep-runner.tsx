"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Rep, RepStep } from "@/lib/reps";

interface Props {
  rep: Rep;
  onComplete: (answers: Record<string, string>) => void;
  onExit?: () => void;
}

export function RepRunner({ rep, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const step = rep.steps[index];
  const value = answers[step.id] ?? "";
  const isLast = index === rep.steps.length - 1;
  const canContinue = step.kind === "breathe" || value.trim().length > 0;

  function set(v: string) {
    setAnswers((prev) => ({ ...prev, [step.id]: v }));
  }

  function next() {
    if (!canContinue) return;
    if (isLast) onComplete(answers);
    else setIndex((i) => i + 1);
  }

  function back() {
    if (index === 0) onExit?.();
    else setIndex((i) => i - 1);
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          aria-label={index === 0 ? "Exit" : "Back"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-offWhite-300 text-navy hover:bg-offWhite transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {rep.steps.map((s, i) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? "bg-orange-500" : "bg-offWhite-300"}`} />
          ))}
        </div>
        <span className="text-xs font-semibold text-navy/40 tabular-nums">
          {index + 1}/{rep.steps.length}
        </span>
      </div>

      <p className="mb-2 text-xs font-bold text-orange-500">{rep.title}</p>
      <h2 className="mb-2 text-2xl font-bold text-navy leading-tight">{step.prompt}</h2>
      {"help" in step && step.help && <p className="mb-6 text-sm text-muted-foreground">{step.help}</p>}

      <div className="mt-6 min-h-[220px]">
        <StepInput key={step.id} step={step} value={value} onChange={set} onDone={next} />
      </div>

      <button
        type="button"
        onClick={next}
        disabled={!canContinue}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-40"
      >
        {step.kind === "breathe" ? "Done breathing" : isLast ? "Finish" : "Next"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function StepInput({ step, value, onChange, onDone }: { step: RepStep; value: string; onChange: (v: string) => void; onDone: () => void }) {
  switch (step.kind) {
    case "breathe":
      return <BoxBreathing rounds={step.rounds} />;
    case "scale":
      return (
        <div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-pressed={value === n}
                className={`h-12 rounded-md border text-base font-bold tabular-nums transition-colors ${
                  value === n ? "border-orange-500 bg-orange-500 text-white" : "border-offWhite-300 text-navy hover:border-navy/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>Low</span>
            <span>Locked in</span>
          </div>
        </div>
      );
    case "choice":
      return <ChoiceInput options={step.options} allowCustom={step.allowCustom} value={value} onChange={onChange} />;
    case "text":
      return (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onDone();
          }}
          rows={4}
          maxLength={500}
          placeholder={step.placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      );
  }
}

function ChoiceInput({ options, allowCustom, value, onChange }: { options: string[]; allowCustom?: boolean; value: string; onChange: (v: string) => void }) {
  const isCustom = value !== "" && !options.includes(value);
  const [custom, setCustom] = useState(isCustom ? value : "");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              value === o ? "border-orange-500 bg-orange-500 text-white" : "border-offWhite-300 text-navy hover:border-navy/40"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {allowCustom && (
        <input
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            onChange(e.target.value);
          }}
          maxLength={80}
          placeholder="Or write your own"
          className={`mt-4 w-full rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isCustom ? "border-orange-500" : "border-input"
          }`}
        />
      )}
    </div>
  );
}

const PHASES = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;
const PHASE_SECONDS = 4;

function BoxBreathing({ rounds }: { rounds: number }) {
  const total = rounds * PHASES.length * PHASE_SECONDS;
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);
  const done = elapsed >= total;

  // Start small, then grow on the first inhale so the square visibly moves.
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setElapsed((e) => e + 1), 1000);
    return () => clearTimeout(t);
  }, [elapsed, done]);

  const phaseIndex = Math.floor(elapsed / PHASE_SECONDS) % PHASES.length;
  const secondInPhase = (elapsed % PHASE_SECONDS) + 1;
  const round = Math.min(rounds, Math.floor(elapsed / (PHASES.length * PHASE_SECONDS)) + 1);
  const expanded = mounted && !done && (phaseIndex === 0 || phaseIndex === 1);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div
          className="absolute rounded-2xl border-2 border-orange-400 bg-orange-50 transition-all ease-linear"
          style={{
            width: expanded ? "100%" : "55%",
            height: expanded ? "100%" : "55%",
            transitionDuration: `${PHASE_SECONDS}s`,
          }}
        />
        <div className="relative text-center">
          <p className="text-lg font-bold text-navy">{done ? "Nice." : PHASES[phaseIndex]}</p>
          {!done && <p className="text-3xl font-black text-orange-500 tabular-nums">{secondInPhase}</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {done ? "Body's slower. Mind follows." : `Round ${round} of ${rounds} · skip whenever you're ready`}
      </p>
    </div>
  );
}
