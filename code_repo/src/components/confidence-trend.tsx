/** Tiny SVG line of the last N confidence scores (1–10), oldest to newest. */
export function ConfidenceTrend({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        {scores.length === 1 ? `Last: ${scores[0]}/10. One more rep and your trend shows up here.` : "Your confidence trend shows up after two reps."}
      </p>
    );
  }
  const w = 240, h = 56, pad = 4;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (scores.length - 1);
  const y = (v: number) => h - pad - ((v - 1) * (h - pad * 2)) / 9;
  const d = scores.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const half = Math.floor(scores.length / 2);
  const delta = avg(scores.slice(half)) - avg(scores.slice(0, half));
  const last = scores[scores.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" role="img" aria-label={`Confidence trend over your last ${scores.length} reps, most recent ${last} out of 10`}>
        <line x1={pad} x2={w - pad} y1={y(5.5)} y2={y(5.5)} stroke="currentColor" className="text-offWhite-300" strokeDasharray="3 3" />
        <path d={d} fill="none" stroke="#C4633A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(scores.length - 1)} cy={y(last)} r={4} fill="#C4633A" />
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">
        Last {last}/10 ·{" "}
        {Math.abs(delta) < 0.5 ? "holding steady" : delta > 0 ? `up ${delta.toFixed(1)} lately` : `down ${Math.abs(delta).toFixed(1)} lately`}
      </p>
    </div>
  );
}
