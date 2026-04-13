"use client";

import { cn } from "@/lib/utils";
import type { AnalysisSummary } from "@/types";

interface MetricTileProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

function MetricTile({ label, value, sub, trend, highlight }: MetricTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-4 py-3 border-r border-[#1c2128] last:border-r-0 min-w-[100px]",
        highlight && "bg-indigo-500/5"
      )}
    >
      <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="flex items-end gap-1.5">
        <span
          className={cn(
            "text-lg font-semibold leading-none",
            highlight ? "text-indigo-400" : "text-slate-100"
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-[10px] mb-0.5",
              trend === "up" && "text-red-400",
              trend === "down" && "text-emerald-400",
              trend === "neutral" && "text-slate-600"
            )}
          >
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
    </div>
  );
}

function QualityRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 80 ? "#34d399" : score >= 60 ? "#f59e0b" : "#f87171";

  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-r border-[#1c2128]">
      <svg width={52} height={52} className="-rotate-90">
        <circle cx={26} cy={26} r={r} fill="none" stroke="#1c2128" strokeWidth={4} />
        <circle
          cx={26} cy={26} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Quality</span>
        <span className="text-lg font-semibold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-slate-600">/ 100</span>
      </div>
    </div>
  );
}

interface MetricsBarProps {
  summary: AnalysisSummary | null;
  qualityScore?: number;
  className?: string;
}

export function MetricsBar({ summary, qualityScore = 0, className }: MetricsBarProps) {
  if (!summary) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 h-16 px-4 bg-[#0D1117] border-b border-[#1c2128]",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded bg-[#1c2128] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-stretch bg-[#0D1117] border-b border-[#1c2128] overflow-x-auto",
        className
      )}
    >
      <QualityRing score={qualityScore} />
      <MetricTile label="Files" value={summary.totalFiles.toLocaleString()} />
      <MetricTile label="Lines" value={summary.totalLines.toLocaleString()} />
      <MetricTile label="Functions" value={summary.totalFunctions.toLocaleString()} />
      <MetricTile
        label="Avg Complexity"
        value={summary.avgComplexity.toFixed(1)}
        sub={`max ${summary.maxComplexity}`}
        trend={summary.avgComplexity > 10 ? "up" : "neutral"}
      />
      <MetricTile
        label="Bugs"
        value={summary.bugCount}
        sub={`${summary.criticalBugs} critical`}
        trend={summary.bugCount > 0 ? "up" : "neutral"}
        highlight={summary.criticalBugs > 0}
      />
      <MetricTile
        label="Duplicates"
        value={summary.duplicateBlocks}
        sub="code blocks"
      />
      {summary.testCoverage !== null && (
        <MetricTile
          label="Coverage"
          value={`${summary.testCoverage.toFixed(1)}%`}
          trend={summary.testCoverage >= 80 ? "neutral" : "down"}
        />
      )}

      {/* Language breakdown */}
      <div className="flex items-center gap-2 px-4 py-3 ml-auto">
        {Object.entries(summary.languages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([lang, pct]) => (
            <div key={lang} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[10px] text-slate-500">{lang}</span>
              <span className="text-[10px] text-slate-700">{pct}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}
