/**
 * Progress strip for the 1-month / 4-session mentorship program.
 * `done` = number of logged sessions; the program is 4 sessions over 4 weeks.
 */
export function ProgramArc({
  done,
  programEnd,
  className = "",
}: {
  done: number;
  programEnd: string | null;
  className?: string;
}) {
  const total = 4;
  const completed = Math.min(done, total);
  const current = Math.min(done + 1, total);
  const isComplete = completed >= total;
  const endLabel = programEnd
    ? new Date(programEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  return (
    <div className={`rounded-lg border border-offWhite-300 bg-white px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-500 shrink-0">1-month program</span>
          <span className="text-sm font-semibold text-navy truncate">
            {isComplete ? "All 4 sessions complete" : `Session ${current} of ${total}`}
          </span>
        </div>
        {endLabel && (
          <span className="text-xs text-muted-foreground shrink-0">
            {isComplete ? "Wrapped up" : `Ends ${endLabel}`}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < completed ? "bg-orange-500" : "bg-offWhite-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
