import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "glow";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-[#0D1117] border border-[#1c2128]",
  elevated: "bg-[#161b22] border border-[#30363d] shadow-xl",
  bordered: "bg-[#0D1117] border-2 border-[#30363d]",
  glow: "bg-[#0D1117] border border-indigo-500/30 shadow-[0_0_24px_rgba(99,102,241,0.1)]",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-colors",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

// ── Sub-components ────────────────────────────────────────────────────────────

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

function CardHeader({ title, description, action, icon, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 mb-4", className)}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="shrink-0 text-indigo-400">{icon}</span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-slate-300", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-4 mt-4 border-t border-[#1c2128]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardBody, CardFooter };
