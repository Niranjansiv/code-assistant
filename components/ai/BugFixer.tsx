"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SeverityBadge } from "@/components/ui/Badge";
import { useAI } from "@/hooks/useAI";
import type { BugReport } from "@/types";

interface BugFixerProps {
  bugs: BugReport[];
  getCodeForBug?: (bug: BugReport) => Promise<string> | string;
  onFixApplied?: (bug: BugReport, fix: string) => void;
  className?: string;
}

interface FixResult {
  bugId: string;
  fix: string;
  explanation: string;
}

export function BugFixer({ bugs, getCodeForBug, onFixApplied, className }: BugFixerProps) {
  const { fixBug, isLoading } = useAI();
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<Map<string, FixResult>>(new Map());
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BugReport["severity"] | "all">("all");

  const filteredBugs = bugs.filter(
    (b) => filter === "all" || b.severity === filter
  );

  const severityCounts = bugs.reduce<Record<string, number>>((acc, b) => {
    acc[b.severity] = (acc[b.severity] ?? 0) + 1;
    return acc;
  }, {});

  async function handleFix(bug: BugReport) {
    setActiveBugId(bug.id);
    const code = getCodeForBug ? await getCodeForBug(bug) : bug.codeSnippet;
    const result = await fixBug(bug, code);
    if (result) {
      setFixResults((prev) =>
        new Map(prev).set(bug.id, { bugId: bug.id, ...result })
      );
    }
    setActiveBugId(null);
  }

  function handleApply(bug: BugReport) {
    const result = fixResults.get(bug.id);
    if (result) onFixApplied?.(bug, result.fix);
  }

  const selectedBug = bugs.find((b) => b.id === selectedBugId) ?? null;
  const selectedFix = selectedBugId ? fixResults.get(selectedBugId) : null;

  return (
    <div className={cn("flex gap-4 h-full", className)}>
      {/* Bug list */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded transition-colors",
                filter === s
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {s === "all" ? `All (${bugs.length})` : `${s} (${severityCounts[s] ?? 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0">
          {filteredBugs.length === 0 ? (
            <div className="text-xs text-slate-600 text-center py-8">No bugs found</div>
          ) : (
            filteredBugs.map((bug) => {
              const isSelected = bug.id === selectedBugId;
              const hasResult = fixResults.has(bug.id);

              return (
                <button
                  key={bug.id}
                  type="button"
                  onClick={() => setSelectedBugId(isSelected ? null : bug.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                    isSelected
                      ? "border-indigo-500/40 bg-indigo-500/8"
                      : "border-[#1c2128] bg-[#0D1117] hover:border-[#30363d]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={bug.severity} />
                    {hasResult && (
                      <span className="text-[10px] text-emerald-400 ml-auto">Fixed ✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{bug.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">
                    {bug.file}:{bug.line}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {selectedBug ? (
          <>
            {/* Bug details */}
            <div className="bg-[#0D1117] border border-[#1c2128] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={selectedBug.severity} />
                  <span className="text-xs text-slate-500 capitalize">{selectedBug.category}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">
                  {selectedBug.file}:{selectedBug.line}
                </span>
              </div>
              <p className="text-sm text-slate-200 font-medium mb-2">{selectedBug.message}</p>
              <p className="text-xs text-slate-500">{selectedBug.explanation}</p>

              {/* Code snippet */}
              <pre className="mt-3 bg-[#050810] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{selectedBug.codeSnippet}</code>
              </pre>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={activeBugId === selectedBug.id && isLoading}
                  onClick={() => handleFix(selectedBug)}
                >
                  Generate Fix
                </Button>
                <span className="text-[10px] text-slate-600">
                  Confidence: {Math.round(selectedBug.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Fix result */}
            {selectedFix && (
              <div className="bg-[#0D1117] border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">Suggested Fix</span>
                  <Button variant="outline" size="xs" onClick={() => handleApply(selectedBug)}>
                    Apply Fix
                  </Button>
                </div>
                <p className="text-xs text-slate-400">{selectedFix.explanation}</p>
                <pre className="bg-[#050810] border border-emerald-500/20 rounded-lg px-3 py-2.5 text-xs font-mono text-emerald-300 overflow-x-auto">
                  <code>{selectedFix.fix}</code>
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs">Select a bug to see details and generate a fix</p>
          </div>
        )}
      </div>
    </div>
  );
}
