"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowUp, CalendarClock, Video, Smile } from "lucide-react";
import { usePresence } from "@/hooks/use-presence";

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string | null;
  read_at: string | null;
}

interface ScheduledCallRow {
  id: string;
  scheduled_at: string;
  note: string | null;
  proposed_by: string;
  created_at: string | null;
}

interface ReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

type TimelineItem =
  | { kind: "msg"; key: string; at: number; data: Message }
  | { kind: "call"; key: string; at: number; data: ScheduledCallRow }
  | { kind: "divider"; key: string; at: number; label: string };

interface ChatWindowProps {
  matchId: string;
  currentUserId: string;
  otherUserId?: string | null;
  otherPersonName: string;
  otherPersonAvatarUrl?: string | null;
  fullHeight?: boolean;
  onUnreadChange?: (count: number) => void;
  onMessageSent?: () => void;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  readOnly?: boolean;
}

export interface ChatWindowHandle {
  setDraft: (text: string) => void;
}

const REACTION_EMOJIS = ["👍", "❤️", "🔥", "🙌", "😂", "😮"];

function dayLabel(d: Date): string {
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  const sevenAgo = new Date(); sevenAgo.setDate(today.getDate() - 6);
  if (d > sevenAgo) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export const ChatWindow = forwardRef<ChatWindowHandle, ChatWindowProps>(function ChatWindow(
  { matchId, currentUserId, otherUserId, otherPersonName, otherPersonAvatarUrl, fullHeight, onUnreadChange, onMessageSent, topSlot, bottomSlot, readOnly },
  ref
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<ScheduledCallRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const { otherOnline } = usePresence(matchId, currentUserId, otherUserId ?? null);

  useImperativeHandle(ref, () => ({
    setDraft: (text: string) => {
      setInput(text);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(text.length, text.length);
        const el = inputRef.current;
        if (el) {
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 140) + "px";
        }
      });
    },
  }), []);

  async function markIncomingAsRead(msgs: Message[]) {
    const unread = msgs.filter(m => m.sender_id !== currentUserId && !m.read_at);
    if (unread.length === 0) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() } as never)
      .in("id", unread.map(m => m.id));
    setMessages(prev => prev.map(m =>
      unread.some(u => u.id === m.id) ? { ...m, read_at: new Date().toISOString() } : m
    ));
    onUnreadChange?.(0);
  }

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        const msgs = (data ?? []) as Message[];
        setMessages(msgs);
        markIncomingAsRead(msgs);
        // Load reactions for these messages
        const ids = msgs.map(m => m.id);
        if (ids.length > 0) {
          supabase
            .from("message_reactions" as never)
            .select("id, message_id, user_id, emoji")
            .in("message_id", ids)
            .then(({ data }) => setReactions((data ?? []) as unknown as ReactionRow[]));
        }
      });

    supabase
      .from("scheduled_calls")
      .select("id, scheduled_at, note, proposed_by, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setCalls((data ?? []) as ScheduledCallRow[]));

    const msgChannel = supabase
      .channel(`messages:${matchId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg];
            if (newMsg.sender_id !== currentUserId) markIncomingAsRead([newMsg]);
            return updated;
          });
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m));
        }
      )
      .subscribe();

    const callChannel = supabase
      .channel(`scheduled_calls:${matchId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "scheduled_calls", filter: `match_id=eq.${matchId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string };
            setCalls(prev => prev.filter(c => c.id !== oldRow.id));
            return;
          }
          const row = payload.new as ScheduledCallRow;
          setCalls(prev => {
            const idx = prev.findIndex(c => c.id === row.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = row; return next; }
            return [...prev, row];
          });
        }
      )
      .subscribe();

    const reactionChannel = supabase
      .channel(`reactions:${matchId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ReactionRow;
            setReactions(prev => prev.some(r => r.id === row.id) ? prev : [...prev, row]);
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string };
            setReactions(prev => prev.filter(r => r.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(callChannel);
      supabase.removeChannel(reactionChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const m of messages) {
      const at = m.created_at ? new Date(m.created_at).getTime() : Date.now();
      items.push({ kind: "msg", key: `m-${m.id}`, at, data: m });
    }
    for (const c of calls) {
      const at = c.created_at ? new Date(c.created_at).getTime() : new Date(c.scheduled_at).getTime();
      items.push({ kind: "call", key: `c-${c.id}`, at, data: c });
    }
    items.sort((a, b) => a.at - b.at);

    const out: TimelineItem[] = [];
    let lastDay = "";
    for (const it of items) {
      const d = new Date(it.at);
      const dayKey = d.toDateString();
      if (dayKey !== lastDay) {
        out.push({ kind: "divider", key: `d-${dayKey}`, at: it.at, label: dayLabel(d) });
        lastDay = dayKey;
      }
      out.push(it);
    }
    return out;
  }, [messages, calls]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      setInput(content);
    } else {
      onMessageSent?.();
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new_message", matchId, senderId: currentUserId }),
      }).catch(() => {});
    }
    setSending(false);
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji);
    if (existing) {
      // Optimistic remove
      setReactions(prev => prev.filter(r => r.id !== existing.id));
      await supabase.from("message_reactions" as never).delete().eq("id", existing.id);
    } else {
      const tempId = `tmp-${Date.now()}`;
      setReactions(prev => [...prev, { id: tempId, message_id: messageId, user_id: currentUserId, emoji }]);
      const { data, error } = await supabase
        .from("message_reactions" as never)
        .insert({ message_id: messageId, user_id: currentUserId, emoji } as never)
        .select("id, message_id, user_id, emoji")
        .single();
      if (error) {
        setReactions(prev => prev.filter(r => r.id !== tempId));
      } else if (data) {
        const newRow = data as unknown as ReactionRow;
        setReactions(prev => prev.map(r => r.id === tempId ? newRow : r));
      }
    }
    setReactionPickerFor(null);
  }

  function reactionsFor(messageId: string) {
    const subset = reactions.filter(r => r.message_id === messageId);
    const groups: Record<string, { count: number; mine: boolean }> = {};
    for (const r of subset) {
      if (!groups[r.emoji]) groups[r.emoji] = { count: 0, mine: false };
      groups[r.emoji].count++;
      if (r.user_id === currentUserId) groups[r.emoji].mine = true;
    }
    return Object.entries(groups);
  }

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  const firstName = otherPersonName.split(" ")[0];
  const myMessages = messages.filter(m => m.sender_id === currentUserId);
  const lastReadMsgId = [...myMessages].reverse().find(m => m.read_at)?.id ?? null;

  function isGrouped(idx: number): boolean {
    const item = timeline[idx];
    if (item.kind !== "msg") return false;
    for (let i = idx - 1; i >= 0; i--) {
      const prev = timeline[i];
      if (prev.kind === "divider") return false;
      if (prev.kind === "call") return false;
      if (prev.kind === "msg") {
        return prev.data.sender_id === item.data.sender_id && (item.at - prev.at) < 4 * 60 * 1000;
      }
    }
    return false;
  }

  return (
    <div className={`flex flex-col bg-white rounded-2xl ring-1 ring-offWhite-300 overflow-hidden ${fullHeight ? "flex-1 min-h-0" : "h-[520px]"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-offWhite-200 shrink-0 bg-white">
        <div className="relative">
          {otherPersonAvatarUrl ? (
            <img src={otherPersonAvatarUrl} alt={otherPersonName} className="h-10 w-10 rounded-full object-cover ring-2 ring-offWhite-200" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold ring-2 ring-offWhite-200">
              {initials(otherPersonName)}
            </div>
          )}
          {otherOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-sage-500 ring-2 ring-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-navy leading-tight tracking-tight">{otherPersonName}</p>
          <p className={`text-[10px] uppercase tracking-[0.14em] font-semibold mt-0.5 ${otherOnline ? "text-sage-600" : "text-navy/40"}`}>
            {otherOnline ? "Online now" : "Locker room chat"}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 min-h-0 bg-gradient-to-b from-offWhite/30 to-white">
        {topSlot}
        {timeline.length === 0 && !topSlot && (
          <div className="flex flex-col items-center justify-center h-full pt-16 px-6">
            {otherPersonAvatarUrl ? (
              <img src={otherPersonAvatarUrl} alt={otherPersonName} className="h-20 w-20 rounded-full object-cover mb-4 ring-4 ring-white shadow-md" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xl font-bold mb-4 ring-4 ring-white shadow-md">
                {initials(otherPersonName)}
              </div>
            )}
            <p className="text-base font-semibold text-navy">{otherPersonName}</p>
            <p className="text-sm text-navy/40 text-center mt-1.5 max-w-xs">No messages yet — say hi to {firstName} when you&apos;re ready.</p>
          </div>
        )}

        <div>
          {timeline.map((item, idx) => {
            if (item.kind === "divider") {
              return (
                <div key={item.key} className="flex justify-center py-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/35 bg-white/80 backdrop-blur px-3 py-1 rounded-full ring-1 ring-offWhite-300">
                    {item.label}
                  </span>
                </div>
              );
            }

            if (item.kind === "call") {
              const c = item.data;
              const at = new Date(c.scheduled_at);
              const isPast = at.getTime() < Date.now();
              const proposedByMe = c.proposed_by === currentUserId;
              return (
                <div key={item.key} className="flex justify-center py-2.5">
                  <div className={`max-w-md w-full rounded-2xl ${isPast ? "bg-white ring-1 ring-offWhite-300" : "bg-orange-50/70 ring-1 ring-orange-200"} px-4 py-3.5 flex items-start gap-3.5 shadow-sm`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${isPast ? "bg-slate-100" : "bg-orange-500"}`}>
                      {isPast ? <Video className="h-4 w-4 text-slate-500" /> : <CalendarClock className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">
                        {isPast ? "Past call" : proposedByMe ? "You scheduled a call" : `${firstName} scheduled a call`}
                      </p>
                      <p className="text-[15px] font-semibold text-navy leading-tight mt-1 tracking-tight">
                        {at.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-navy/55 mt-0.5">
                        {at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                      </p>
                      {c.note && <p className="text-xs text-navy/60 mt-2 leading-snug italic">&ldquo;{c.note}&rdquo;</p>}
                    </div>
                  </div>
                </div>
              );
            }

            const msg = item.data;
            const isMe = msg.sender_id === currentUserId;
            const grouped = isGrouped(idx);
            const showSeen = isMe && msg.id === lastReadMsgId;
            const time = msg.created_at ? timeLabel(new Date(msg.created_at)) : "";
            const reactionGroups = reactionsFor(msg.id);
            const showPicker = reactionPickerFor === msg.id;

            return (
              <div key={item.key} className={`group flex flex-col w-full ${isMe ? "items-end" : "items-start"} ${grouped ? "mt-1" : "mt-4"}`}>
                <div className={`flex items-end gap-2.5 w-full ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div className="shrink-0 w-7">
                      {!grouped && (
                        otherPersonAvatarUrl ? (
                          <img src={otherPersonAvatarUrl} alt={otherPersonName} className="h-7 w-7 rounded-full object-cover ring-1 ring-offWhite-200" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {initials(otherPersonName)}
                          </div>
                        )
                      )}
                    </div>
                  )}
                  <div className="flex flex-col max-w-[75%]">
                    <div className="relative">
                      <div
                        className={`px-4 py-2.5 text-[14px] leading-[1.45] break-words ${
                          isMe
                            ? `bg-navy text-white shadow-[0_1px_2px_rgba(27,46,75,0.2)] ${grouped ? "rounded-2xl rounded-br-lg" : "rounded-2xl rounded-br-md"}`
                            : `bg-white text-navy ring-1 ring-offWhite-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${grouped ? "rounded-2xl rounded-bl-lg" : "rounded-2xl rounded-bl-md"}`
                        }`}
                        title={msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                      >
                        {msg.content}
                      </div>
                      {/* Reaction trigger */}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setReactionPickerFor(showPicker ? null : msg.id)}
                          aria-label="React"
                          className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-8" : "-right-8"} h-7 w-7 rounded-full bg-white ring-1 ring-offWhite-300 shadow-sm flex items-center justify-center text-navy/55 hover:text-navy hover:ring-navy/25 opacity-0 group-hover:opacity-100 transition-all`}
                        >
                          <Smile className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {/* Picker */}
                      {showPicker && (
                        <div
                          className={`absolute z-10 ${isMe ? "right-0" : "left-0"} -top-12 bg-white rounded-full shadow-lg ring-1 ring-offWhite-300 px-2 py-1.5 flex items-center gap-1`}
                          onMouseLeave={() => setReactionPickerFor(null)}
                        >
                          {REACTION_EMOJIS.map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => toggleReaction(msg.id, e)}
                              className="text-base hover:scale-125 transition-transform px-1"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {reactionGroups.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                        {reactionGroups.map(([emoji, info]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                              info.mine
                                ? "bg-orange-50 ring-1 ring-orange-300 text-navy"
                                : "bg-white ring-1 ring-offWhite-300 text-navy/65 hover:ring-navy/25"
                            }`}
                          >
                            <span className="text-xs leading-none">{emoji}</span>
                            <span className="tabular-nums">{info.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <span className={`text-[10px] text-navy/35 mt-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "text-right" : "text-left"}`}>
                      {time}
                    </span>
                  </div>
                </div>
                {showSeen && (
                  <p className="text-[10px] text-navy/40 mt-1 mr-2 font-medium">Seen</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {bottomSlot}

      {/* Composer */}
      {readOnly ? (
        <div className="border-t border-offWhite-200 px-4 py-4 shrink-0 bg-white text-center">
          <p className="text-xs font-medium text-navy/45">This program has ended — the conversation is read-only.</p>
        </div>
      ) : (
        <div className="border-t border-offWhite-200 px-4 pt-3 pb-4 shrink-0 bg-white">
          <div className="flex items-end gap-2.5 rounded-2xl bg-offWhite/40 ring-1 ring-offWhite-300 focus-within:ring-navy/30 focus-within:bg-white transition-all px-4 py-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 140) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${firstName}…`}
              className="flex-1 resize-none bg-transparent text-[14px] outline-none placeholder:text-navy/35 leading-[1.45] py-1 max-h-[140px] text-navy"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-all hover:bg-navy/85 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
