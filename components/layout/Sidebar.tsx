"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderInput,
  Workflow,
  BarChart3,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import type { GitHubUser } from "@/types";

/* ── Nav definition ──────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/import",     label: "Import Repo",  Icon: FolderInput     },
  { href: "/flow",       label: "Flow Graph",   Icon: Workflow        },
  { href: "/analytics",  label: "Analytics",    Icon: BarChart3       },
  { href: "/assistant",  label: "AI Assistant", Icon: Sparkles        },
] as const;

/* ── Radar logo icon ─────────────────────────────────────────────────────── */
function RadarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className="text-[#2D7EF7] shrink-0"
    >
      <circle cx="10" cy="10" r="9"  stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      <circle cx="10" cy="10" r="6"  stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
      <circle cx="10" cy="10" r="3"  stroke="currentColor" strokeOpacity="0.65" strokeWidth="1" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" />
      <line x1="10" y1="10" x2="10" y2="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="10" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
  );
}

/* ── User initials helper ────────────────────────────────────────────────── */
function initials(user: GitHubUser | null): string {
  if (!user) return "DT";
  const name = user.name ?? user.login;
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <aside
      style={{ width: collapsed ? 56 : 220 }}
      className="relative shrink-0 flex flex-col h-full bg-[#0A0F1E] border-r border-[#1C2333] overflow-hidden transition-[width] duration-200 ease-in-out"
    >
      {/* ── Logo + collapse toggle ─────────────────────────────────────────── */}
      <div className="flex items-center h-12 px-3.5 shrink-0 border-b border-[#1C2333]">
        {/* Logo — fades out when collapsed */}
        <div className={cn(
          "flex items-center gap-2.5 flex-1 min-w-0 transition-opacity duration-150",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <RadarIcon size={18} />
          <span className="font-syne text-sm font-bold text-slate-100 whitespace-nowrap truncate">
            Deep<span className="text-[#2D7EF7]">Trace</span>
          </span>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-slate-500",
            "hover:text-slate-200 hover:bg-white/8 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft  size={14} />
          }
        </button>
      </div>

      {/* ── Main nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg text-sm transition-colors duration-150 select-none",
                collapsed ? "justify-center h-10 w-10 mx-auto px-0" : "px-3 py-2",
                isActive
                  ? "text-[#2D7EF7] bg-[#2D7EF7]/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {/* Active left-border indicator (hidden when collapsed) */}
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#2D7EF7]" />
              )}

              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.75}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-[#2D7EF7]" : "text-slate-500"
                )}
              />

              {/* Label — clipped during collapse transition */}
              <span className={cn(
                "whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150",
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#1C2333] px-2 py-3 space-y-0.5">
        {/* Settings */}
        {(() => {
          const isActive = pathname === "/settings" || pathname.startsWith("/settings/");
          return (
            <Link
              href="/settings"
              title={collapsed ? "Settings" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                collapsed ? "justify-center h-10 w-10 mx-auto px-0" : "px-3 py-2",
                isActive
                  ? "text-[#2D7EF7] bg-[#2D7EF7]/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#2D7EF7]" />
              )}
              <Settings
                size={16}
                strokeWidth={isActive ? 2 : 1.75}
                className={cn("shrink-0", isActive ? "text-[#2D7EF7]" : "text-slate-500")}
              />
              <span className={cn(
                "whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150",
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              )}>
                Settings
              </span>
            </Link>
          );
        })()}

        {/* User avatar */}
        <div className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-2 mt-1",
          "hover:bg-white/5 transition-colors cursor-default",
          collapsed && "justify-center px-0"
        )}>
          {/* Avatar circle */}
          <div className="w-7 h-7 rounded-full bg-[#2D7EF7]/20 border border-[#2D7EF7]/30 flex items-center justify-center shrink-0">
            {user?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-[#2D7EF7] font-spacemono">
                {initials(user)}
              </span>
            )}
          </div>

          {/* Name + role */}
          <div className={cn(
            "min-w-0 overflow-hidden transition-[opacity,max-width] duration-150",
            collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
          )}>
            <p className="text-xs font-medium text-slate-300 truncate whitespace-nowrap">
              {user?.name ?? user?.login ?? "Guest"}
            </p>
            <p className="text-[10px] text-slate-600 truncate whitespace-nowrap">
              {user ? "Connected" : "Not signed in"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
