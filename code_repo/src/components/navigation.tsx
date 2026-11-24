"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/game-day", label: "Game Day" },
  { href: "/mentorship", label: "Mentors" },
  { href: "/advice", label: "Articles" },
  { href: "/podcast", label: "Podcast" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchAvatar(userId: string) {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();
    setAvatarUrl(data?.avatar_url ?? null);
  }

  async function fetchUnread(userId: string) {
    const supabase = createClient();
    // A mentor can have several active mentees — take the most recent active
    // match for the badge rather than erroring on multiple rows.
    const { data: matchRows } = await supabase
      .from("matches")
      .select("id")
      .or(`mentor_id.eq.${userId},player_id.eq.${userId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);
    const match = matchRows?.[0];
    if (!match) return;

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", match.id)
      .neq("sender_id", userId)
      .is("read_at", null);
    setUnreadCount(count ?? 0);

    const channel = supabase
      .channel(`nav-unread:${match.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${match.id}`,
      }, (payload) => {
        if (payload.new.sender_id !== userId) setUnreadCount((n) => n + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `match_id=eq.${match.id}`,
      }, (payload) => {
        if (payload.new.read_at && !payload.old?.read_at && payload.new.sender_id !== userId) {
          setUnreadCount((n) => Math.max(0, n - 1));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  useEffect(() => {
    const supabase = createClient();
    let cleanupUnread: (() => void) | undefined;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchAvatar(data.user.id);
        fetchUnread(data.user.id).then((fn) => { cleanupUnread = fn; });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        fetchUnread(session.user.id).then((fn) => { cleanupUnread = fn; });
      } else {
        setAvatarUrl(null);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupUnread?.();
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const displayName = user?.user_metadata?.name ?? user?.email ?? "";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Main" className="sticky top-0 z-50 border-b border-line bg-chalk/95 backdrop-blur supports-[backdrop-filter]:bg-chalk/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo href="/" variant="dark" size="xs" />

        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-[15px] font-medium transition-colors",
                  isActive(item.href) ? "text-turf" : "text-ink/75 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="relative rounded-md px-3 py-2 text-[15px] font-semibold text-ink hover:text-turf"
              >
                Locker Room
                {unreadCount > 0 && (
                  <span className="absolute -right-1 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-whistle px-1 text-[11px] font-bold text-ink">
                    {unreadCount > 9 ? "9+" : unreadCount}
                    <span className="sr-only"> unread messages</span>
                  </span>
                )}
              </Link>
              <Link href="/profile" aria-label="Your profile" className="block h-9 w-9 overflow-hidden rounded-full bg-turf-100 ring-1 ring-line">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-turf">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-md px-3 py-2 text-[15px] font-medium text-ink/75 hover:text-ink">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-md bg-turf px-4 py-2 text-[15px] font-semibold text-chalk transition-colors hover:bg-turf-600">
                Join free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {!mobileOpen && unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-whistle" />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-line bg-chalk md:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn("block border-b border-line py-3.5 text-lg font-medium", isActive(item.href) ? "text-turf" : "text-ink")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 pt-5 pb-2">
              {user ? (
                <Link href="/dashboard" className="flex-1 rounded-md bg-turf py-3 text-center font-semibold text-chalk">
                  Locker Room{unreadCount > 0 ? ` (${unreadCount} new)` : ""}
                </Link>
              ) : (
                <>
                  <Link href="/signin" className="flex-1 rounded-md border border-line py-3 text-center font-semibold text-ink">Sign in</Link>
                  <Link href="/signup" className="flex-1 rounded-md bg-turf py-3 text-center font-semibold text-chalk">Join free</Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
