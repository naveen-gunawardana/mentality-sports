"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/logo";
import { motion, AnimatePresence } from "framer-motion";
import { PROGRAMS_BY_KEY } from "@/lib/programs";

const MEDIA = [PROGRAMS_BY_KEY.podcast, PROGRAMS_BY_KEY.newsletter];

const navItems = [
  { href: "/", label: "Home" },
  { href: "/mentorship", label: "Mentorship" },
  { href: "/advice", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/opportunities", label: "Join Us" },
  { href: "/dashboard", label: "Locker Room" },
];

const statusPill: Record<string, { text: string; cls: string } | null> = {
  new: { text: "New", cls: "bg-orange-500 text-white" },
  soon: { text: "Soon", cls: "bg-navy/10 text-navy/50" },
  live: null,
};

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mobileMediaOpen, setMobileMediaOpen] = useState(false);
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
    setMediaOpen(false);
    setMobileMediaOpen(false);
  }, [pathname]);

  const displayName = user?.user_metadata?.name ?? user?.email ?? "";
  const mediaActive = MEDIA.some((p) => pathname.startsWith(p.href));

  return (
    <nav className="sticky top-0 z-50 bg-white/96 backdrop-blur-md transform-gpu">
      <div className="h-[2px] w-full bg-orange-500" />

      <div className="border-b border-offWhite-300">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left — logo + badge */}
          <div className="flex items-center gap-3">
            <Logo href="/" variant="dark" size="xs" />
            <span className="hidden sm:inline-block text-[8px] font-bold uppercase tracking-[0.15em] text-navy/25 leading-tight">
              Nonprofit
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.slice(0, 3).map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
            ))}

            {/* Media dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMediaOpen(true)}
              onMouseLeave={() => setMediaOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMediaOpen((v) => !v)}
                aria-expanded={mediaOpen}
                className={cn(
                  "relative flex flex-col items-center gap-[3px] transition-colors duration-150",
                  mediaActive ? "text-navy" : "text-navy/35 hover:text-navy/70"
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center gap-1">
                  Media
                  <ChevronDown className={cn("h-3 w-3 transition-transform", mediaOpen && "rotate-180")} />
                </span>
                {mediaActive ? (
                  <motion.span layoutId="nav-dot" className="h-[3px] w-[3px] rounded-full bg-orange-500" transition={{ type: "spring", stiffness: 400, damping: 28 }} />
                ) : (
                  <span className="h-[3px] w-[3px] rounded-full bg-transparent" />
                )}
              </button>

              <AnimatePresence>
                {mediaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-[320px]"
                  >
                    <div className="rounded-sm border border-offWhite-300 bg-white shadow-xl shadow-navy/5 overflow-hidden">
                      {MEDIA.map((p) => {
                        const pill = statusPill[p.status];
                        return (
                          <Link
                            key={p.key}
                            href={p.href}
                            className="group flex items-start gap-3 px-4 py-3 hover:bg-offWhite transition-colors border-b border-offWhite-200 last:border-0"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                              <p.Icon className="h-4 w-4 text-orange-500" />
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-navy group-hover:text-orange-600 transition-colors">{p.label}</span>
                                {pill && <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider", pill.cls)}>{pill.text}</span>}
                              </span>
                              <span className="block text-[11px] text-navy/45 leading-snug mt-0.5">{p.tagline}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remaining links */}
            {navItems.slice(3).map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} badge={item.href === "/dashboard" ? unreadCount : 0} />
            ))}
          </div>

          {/* Right — Instagram + auth */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://www.instagram.com/mentalitysports"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-navy/30 hover:text-navy/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            {user ? (
              <Link
                href="/profile"
                title="Your profile"
                className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden ring-1 ring-navy/15 hover:ring-navy/35 transition-all text-xs font-bold text-navy"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-navy/8">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy/40 hover:text-navy transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-navy px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-navy/85 transition-colors"
                >
                  Join
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-1.5 text-navy/50 hover:text-navy transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-white border-b border-offWhite-300"
          >
            <div className="px-4 pt-2 pb-4">
              {navItems.slice(0, 3).map((item) => (
                <MobileLink key={item.href} href={item.href} label={item.label} pathname={pathname} onClick={() => setMobileOpen(false)} />
              ))}

              {/* Media accordion */}
              <div className="border-b border-offWhite-300">
                <button
                  type="button"
                  onClick={() => setMobileMediaOpen((v) => !v)}
                  className={cn("flex items-center justify-between py-3.5 w-full", mediaActive ? "text-navy" : "text-navy/40")}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Media</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", mobileMediaOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {mobileMediaOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden pb-2">
                      {MEDIA.map((p) => (
                        <Link key={p.key} href={p.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2 pl-2">
                          <p.Icon className="h-4 w-4 text-orange-500 shrink-0" />
                          <span className="text-[12px] text-navy/65">{p.label}</span>
                          {statusPill[p.status] && <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase", statusPill[p.status]!.cls)}>{statusPill[p.status]!.text}</span>}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navItems.slice(3).map((item) => (
                <MobileLink key={item.href} href={item.href} label={item.label} pathname={pathname} badge={item.href === "/dashboard" ? unreadCount : 0} onClick={() => setMobileOpen(false)} />
              ))}

              {/* Mobile auth */}
              <div className="mt-4">
                {user ? (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between w-full border border-navy/15 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-navy/60 hover:text-navy hover:border-navy/30 transition-colors"
                  >
                    My Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/signin"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 flex items-center justify-center border border-navy/15 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-navy/60 hover:text-navy transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 bg-navy px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-navy/85 transition-colors"
                    >
                      Join <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ href, label, pathname, badge = 0 }: { href: string; label: string; pathname: string; badge?: number }) {
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  const showBadge = href === "/dashboard" && badge > 0;
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-[3px] transition-colors duration-150",
        isActive ? "text-navy" : "text-navy/35 hover:text-navy/70"
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</span>
      {isActive ? (
        <motion.span layoutId="nav-dot" className="h-[3px] w-[3px] rounded-full bg-orange-500" transition={{ type: "spring", stiffness: 400, damping: 28 }} />
      ) : (
        <span className="h-[3px] w-[3px] rounded-full bg-transparent" />
      )}
      {showBadge && (
        <span className="absolute -top-1.5 -right-2.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

function MobileLink({ href, label, pathname, badge = 0, onClick }: { href: string; label: string; pathname: string; badge?: number; onClick: () => void }) {
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  const showBadge = href === "/dashboard" && badge > 0;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-3.5 border-b border-offWhite-300",
        isActive ? "text-navy" : "text-navy/40"
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</span>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
      </div>
    </Link>
  );
}
