"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown, ChevronRight, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, initiateGitHubLogin, clearSession } from "@/lib/auth";
import type { GitHubUser } from "@/types";

/* ── Breadcrumb config ───────────────────────────────────────────────────── */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard:  "Dashboard",
  import:     "Import Repo",
  flow:       "Flow Graph",
  analytics:  "Analytics",
  assistant:  "AI Assistant",
  settings:   "Settings",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return [{ label: "Home", href: "/" }];

  return segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href:  "/" + segments.slice(0, i + 1).join("/"),
  }));
}

/* ── User initials helper ────────────────────────────────────────────────── */
function initials(user: GitHubUser | null): string {
  if (!user) return "?";
  const name = user.name ?? user.login;
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/* ── Notification item type ──────────────────────────────────────────────── */
interface Notif {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFS: Notif[] = [
  { id: "1", text: "Analysis of vercel/next.js complete",       time: "2m ago",  unread: true  },
  { id: "2", text: "3 critical bugs detected in auth.ts",        time: "5m ago",  unread: true  },
  { id: "3", text: "Flow graph updated for main branch",         time: "12m ago", unread: false },
];

/* ── Component ───────────────────────────────────────────────────────────── */
export function Navbar() {
  const breadcrumbs = useBreadcrumbs();

  const [query,         setQuery        ] = useState("");
  const [user,          setUser         ] = useState<GitHubUser | null>(null);
  const [dropdownOpen,  setDropdownOpen ] = useState(false);
  const [notifOpen,     setNotifOpen    ] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  /* Load user once */
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  /* Close panels on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = MOCK_NOTIFS.filter((n) => n.unread).length;

  return (
    <header className="h-12 shrink-0 flex items-center bg-[#0A0F1E] border-b border-[#1C2333] px-4 gap-4">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <div key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <ChevronRight size={12} className="text-slate-600 shrink-0" />
              )}
              {isLast ? (
                <span className="text-sm font-medium text-slate-200 truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Right controls ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search
            size={13}
            className="absolute left-2.5 text-slate-600 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, symbols…"
            className={cn(
              "h-7 pl-7 pr-3 rounded-lg text-xs bg-[#111827] border border-[#1C2333] text-slate-300",
              "placeholder:text-slate-600 outline-none font-spacemono",
              "focus:border-[#2D7EF7]/40 focus:shadow-[0_0_0_2px_rgba(45,126,247,0.1)]",
              "transition-all w-44 focus:w-56"
            )}
          />
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((o) => !o); setDropdownOpen(false); }}
            className={cn(
              "relative flex items-center justify-center w-7 h-7 rounded-lg text-slate-500",
              "hover:text-slate-200 hover:bg-white/8 transition-colors",
              notifOpen && "text-slate-200 bg-white/8"
            )}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#2D7EF7]" />
            )}
          </button>

          {/* Notifications panel */}
          {notifOpen && (
            <div className="absolute right-0 top-9 w-72 rounded-xl border border-[#1C2333] bg-[#0A0F1E] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1C2333]">
                <span className="text-xs font-semibold text-slate-300">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2D7EF7]/15 text-[#2D7EF7] font-spacemono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <ul>
                {MOCK_NOTIFS.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-[#1C2333]/60 last:border-0",
                      "hover:bg-white/4 transition-colors cursor-default",
                      n.unread && "bg-[#2D7EF7]/4"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2D7EF7] shrink-0" />
                      )}
                      <div className={cn("flex-1 min-w-0", !n.unread && "pl-3.5")}>
                        <p className="text-xs text-slate-300 leading-snug">{n.text}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5 font-spacemono">{n.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => { setDropdownOpen((o) => !o); setNotifOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 h-7 pl-1 pr-2 rounded-lg transition-colors",
              "hover:bg-white/8",
              dropdownOpen && "bg-white/8"
            )}
          >
            {/* Avatar */}
            <div className="w-5 h-5 rounded-full bg-[#2D7EF7]/20 border border-[#2D7EF7]/30 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatarUrl} alt={user.login} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[9px] font-bold text-[#2D7EF7] font-spacemono">
                  {initials(user)}
                </span>
              )}
            </div>
            <span className="hidden md:block text-xs text-slate-400 max-w-[80px] truncate">
              {user?.name ?? user?.login ?? "Guest"}
            </span>
            <ChevronDown
              size={11}
              className={cn("text-slate-600 transition-transform duration-150", dropdownOpen && "rotate-180")}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-9 w-48 rounded-xl border border-[#1C2333] bg-[#0A0F1E] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1">
              {user ? (
                <>
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-[#1C2333]">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {user.name ?? user.login}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-spacemono mt-0.5">
                      @{user.login}
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <User size={13} />
                    Profile &amp; Settings
                  </Link>
                  <button
                    onClick={() => { clearSession(); setUser(null); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { initiateGitHubLogin(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
                    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign in with GitHub
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
