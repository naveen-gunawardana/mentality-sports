"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Globe } from "lucide-react";
import { confidenceOf } from "@/lib/reps";

interface Reflection {
  id: string;
  content: string;
  created_at: string | null;
  player_id: string;
  title: string | null;
  mood: string | null;
}

interface Props {
  playerId: string;
  playerName: string;
}

export function MenteeReflections({ playerId, playerName }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("reflections")
        .select("id, content, created_at, player_id, title, mood")
        .eq("player_id", playerId)
        .eq("shared_with_mentor", true)
        .order("created_at", { ascending: false });
      setReflections(data ?? []);
      setLoading(false);
    }
    load();
  }, [playerId]);

  function formatDate(iso: string | null) {
    return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-sage-600" />
        <h3 className="text-sm font-semibold text-navy">
          {playerName.split(" ")[0]}&apos;s Shared Reflections
        </h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : reflections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-offWhite-400 p-5 text-center">
          <p className="text-xs text-muted-foreground">
            {playerName.split(" ")[0]} hasn&apos;t shared any reflections yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reflections.map((r) => (
            <div key={r.id} className="rounded-lg border border-offWhite-300 bg-white p-4">
              {r.title && (
                <p className="mb-1.5 flex items-center justify-between text-xs font-semibold text-orange-600">
                  {r.title}
                  {confidenceOf(r.mood) && <span className="text-navy/50">Confidence {r.mood}/10</span>}
                </p>
              )}
              <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{r.content}</p>
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-offWhite-200">
                {formatDate(r.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
