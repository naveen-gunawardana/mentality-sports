"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Entry {
  id: string;
  date: string;
  minutes: number;
  notes: string | null;
}

interface Props {
  matchId: string;
  userId: string;
}

export function LogHoursForm({ matchId, userId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedList, setExpandedList] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("service_hours")
      .select("id, date, minutes, notes")
      .eq("match_id", matchId)
      .eq("mentor_id", userId)
      .order("date", { ascending: false });
    setEntries((data ?? []) as Entry[]);
  }

  useEffect(() => { load(); }, [matchId, userId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) { setError("Enter minutes greater than 0."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("service_hours").insert({
      mentor_id: userId,
      match_id: matchId,
      date,
      minutes: m,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setMinutes(""); setNotes("");
    await load();
  }

  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const remMin = totalMinutes % 60;

  const inputClass = "w-full rounded-lg bg-offWhite/40 ring-1 ring-offWhite-300 focus:ring-navy/30 focus:bg-white px-3 py-2 text-[13px] outline-none transition-all text-navy placeholder:text-navy/35";

  return (
    <div className="space-y-3">
      {/* Total */}
      <div className="flex items-baseline justify-between rounded-xl bg-navy/5 px-3.5 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">Total logged</p>
        <p className="text-[15px] font-bold text-navy tabular-nums">
          {totalHrs}<span className="text-navy/50 text-xs font-medium ml-0.5">h</span>
          {remMin > 0 && <> {remMin}<span className="text-navy/50 text-xs font-medium ml-0.5">m</span></>}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass + " mt-1"} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">Minutes</label>
            <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="30" className={inputClass + " mt-1"} />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you cover?" className={inputClass + " mt-1"} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" size="sm" disabled={saving} className="w-full bg-navy hover:bg-navy/85 text-white">
          {saving ? "Logging…" : "Log hours"}
        </Button>
      </form>

      {entries.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setExpandedList(!expandedList)}
            className="text-[12px] text-navy/60 hover:text-navy transition-colors flex items-center gap-1.5 font-medium"
          >
            {expandedList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expandedList ? "Hide" : "View"} {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
          </button>
          {expandedList && (
            <ul className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1 -mr-1">
              {entries.map(e => (
                <li key={e.id} className="rounded-lg ring-1 ring-offWhite-300 bg-white px-3 py-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-navy font-semibold">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="text-navy/55 tabular-nums">{e.minutes} min</span>
                  </div>
                  {e.notes && <p className="text-[11px] text-navy/55 mt-0.5 leading-snug">{e.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
