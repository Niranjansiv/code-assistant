"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BugReport, FileNode } from "@/types";

interface CodePanelProps {
  file: FileNode | null;
  content: string | null;
  language?: string | null;
  bugs?: BugReport[];
  highlightLines?: number[];
  onExplain?: (code: string) => void;
  onFixBug?: (bug: BugReport) => void;
  className?: string;
}

function lineHasBug(line: number, bugs: BugReport[]): BugReport | undefined {
  return bugs.find((b) => b.line === line);
}

const BUG_SEVERITY_GUTTER: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-sky-400",
  info: "bg-slate-500",
};

export function CodePanel({
  file,
  content,
  language,
  bugs = [],
  highlightLines = [],
  onExplain,
  onFixBug,
  className,
}: CodePanelProps) {
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [hoveredBug, setHoveredBug] = useState<BugReport | null>(null);

  const lines = useMemo(() => content?.split("\n") ?? [], [content]);

  const highlightSet = new Set(highlightLines);

  function toggleLine(n: number) {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function getSelectedCode(): string {
    if (selectedLines.size === 0) return content ?? "";
    const sorted = [...selectedLines].sort((a, b) => a - b);
    return sorted.map((n) => lines[n - 1]).join("\n");
  }

  if (!file || !content) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full text-slate-600 gap-3",
          className
        )}
      >
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <p className="text-sm">Select a file to view its code</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#050810]", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1c2128] shrink-0">
        <span className="text-xs text-slate-400 font-mono truncate flex-1">
          {file.path}
        </span>

        {language && (
          <Badge variant="muted" size="xs">
            {language}
          </Badge>
        )}

        {bugs.length > 0 && (
          <Badge variant="danger" size="xs" dot>
            {bugs.length} {bugs.length === 1 ? "issue" : "issues"}
          </Badge>
        )}

        <div className="flex items-center gap-1.5">
          {onExplain && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onExplain(getSelectedCode())}
            >
              Explain
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigator.clipboard.writeText(content)}
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Code body */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse font-mono text-xs">
          <tbody>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const bug = lineHasBug(lineNum, bugs);
              const isHighlighted = highlightSet.has(lineNum);
              const isSelected = selectedLines.has(lineNum);

              return (
                <tr
                  key={lineNum}
                  onClick={() => toggleLine(lineNum)}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isHighlighted && "bg-indigo-500/10",
                    isSelected && "bg-indigo-500/15",
                    bug && "bg-red-500/5 hover:bg-red-500/10",
                    !isHighlighted && !isSelected && !bug && "hover:bg-white/[0.03]"
                  )}
                >
                  {/* Bug gutter */}
                  <td className="w-1 p-0">
                    {bug && (
                      <div
                        className={cn("w-1 h-full min-h-[20px]", BUG_SEVERITY_GUTTER[bug.severity])}
                        onMouseEnter={() => setHoveredBug(bug)}
                        onMouseLeave={() => setHoveredBug(null)}
                      />
                    )}
                  </td>

                  {/* Line number */}
                  <td className="select-none text-right pr-4 pl-3 text-slate-700 w-12 align-top leading-6">
                    {lineNum}
                  </td>

                  {/* Code */}
                  <td className="pr-4 pl-1 text-slate-300 leading-6 whitespace-pre">
                    {line || " "}
                  </td>

                  {/* Bug action */}
                  {bug && onFixBug && (
                    <td className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFixBug(bug);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Fix
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bug tooltip */}
      {hoveredBug && (
        <div className="shrink-0 px-4 py-2 border-t border-[#1c2128] bg-[#0D1117]">
          <p className="text-xs text-red-300">
            <span className="font-semibold">[{hoveredBug.severity.toUpperCase()}]</span>{" "}
            {hoveredBug.message}
          </p>
        </div>
      )}
    </div>
  );
}
