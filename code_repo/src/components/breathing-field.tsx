"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PHASES = [
  { label: "Breathe in", scale: 1 },
  { label: "Hold", scale: 1 },
  { label: "Breathe out", scale: 0.74 },
  { label: "Hold", scale: 0.74 },
] as const;
const SECONDS = 4;

/**
 * The homepage's one moving thing: a field's center circle that breathes in a
 * 4-4-4-4 box pattern. Press start and follow it; with reduced motion the
 * circle stays still and the count still runs.
 */
export function BreathingField() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setTick((n) => n + 1), 1000);
    return () => clearTimeout(t);
  }, [running, tick]);

  const phase = PHASES[Math.floor(tick / SECONDS) % PHASES.length];
  const count = (tick % SECONDS) + 1;
  const rounds = Math.floor(tick / (SECONDS * PHASES.length));
  const scale = running ? phase.scale : 0.74;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* Field markings: halfway line and center circle in chalk */}
      <svg viewBox="0 0 420 420" className="absolute inset-0 h-full w-full" aria-hidden>
        <line x1="0" y1="210" x2="420" y2="210" stroke="#F4F7F1" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="210" cy="210" r="206" fill="none" stroke="#F4F7F1" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="210" cy="210" r="5" fill="#F4F7F1" fillOpacity="0.6" />
      </svg>

      <div
        className="absolute inset-[6%] rounded-full bg-turf-600 shadow-[inset_0_0_0_2px_rgba(244,247,241,0.85)] motion-safe:transition-transform motion-safe:ease-in-out"
        style={{ transform: `scale(${scale})`, transitionDuration: `${SECONDS}s` }}
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
        {running ? (
          <>
            <p className="type-heading text-2xl text-chalk sm:text-3xl">{phase.label}</p>
            <p className="type-display mt-1 text-6xl text-whistle tabular-nums sm:text-7xl" aria-hidden>{count}</p>
            {rounds >= 2 ? (
              <Link
                href="/game-day/pregame"
                className="mt-4 rounded-md bg-whistle px-4 py-2 text-sm font-semibold text-ink hover:bg-whistle-300"
              >
                Finish the Pre-Game Reset
              </Link>
            ) : (
              <button onClick={() => { setRunning(false); setTick(0); }} className="mt-4 text-sm text-chalk/75 underline-offset-4 hover:underline">
                Stop
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => setRunning(true)}
            className="group flex flex-col items-center rounded-full px-8 py-6 text-chalk"
          >
            <span className="type-heading text-2xl sm:text-3xl">Breathe with it</span>
            <span className="mt-2 max-w-[14rem] text-sm text-chalk/80">
              Sixteen seconds. In, hold, out, hold. Tap to start.
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
