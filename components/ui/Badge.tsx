import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { BugSeverity } from "@/types";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

export type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#1c2128] text-slate-300 border border-[#30363d]",
  primary: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border border-red-500/30",
  info: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  muted: "bg-white/5 text-slate-500 border border-white/10",
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "h-4 px-1.5 text-[10px] gap-1 rounded",
  sm: "h-5 px-2 text-xs gap-1.5 rounded-md",
  md: "h-6 px-2.5 text-xs gap-1.5 rounded-md",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  primary: "bg-indigo-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  muted: "bg-slate-600",
};

function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium leading-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("rounded-full shrink-0", dotColors[variant], {
            "w-1.5 h-1.5": size !== "xs",
            "w-1 h-1": size === "xs",
          })}
        />
      )}
      {children}
    </span>
  );
}

// ── Severity Badge helper ─────────────────────────────────────────────────────

const severityVariant: Record<BugSeverity, BadgeVariant> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
  info: "muted",
};

interface SeverityBadgeProps extends Omit<BadgeProps, "variant"> {
  severity: BugSeverity;
}

function SeverityBadge({ severity, ...props }: SeverityBadgeProps) {
  return (
    <Badge variant={severityVariant[severity]} dot {...props}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export { Badge, SeverityBadge };
