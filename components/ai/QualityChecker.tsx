"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SeverityBadge } from "@/components/ui/Badge";
import { useAI } from "@/hooks/useAI";
import type { BugReport } from "@/types";

interface QualityResult {
  score: number;
  issues: BugReport[];
  suggestions: string[];
}

interface QualityCheckerProps {
  code?: string;
  language?: string;
  filePath?: string;
  className?: string;
}

function ScoreDial({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const color =
    score >= 80 ? "#34d399" : score >= 60 ? "#f59e0b" : score >= 40 ? "#fb923c" : "#f87171";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={100} height={100} className="-rotate-[135deg]">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#1c2128" strokeWidth={6} />
        <circle
          cx={50} cy={50} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-slate-600 text-xs">/100</span>
        <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

export function QualityChecker({
  code: initialCode,
  language: initialLang = "typescript",
  filePath,
  className,
}: QualityCheckerProps) {
  const { checkQuality, isLoading, error } = useAI();
  const [code, setCode] = useState(initialCode ?? "");
  const [language, setLanguage] = useState(initialLang);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [activeIssue, setActiveIssue] = useState<BugReport | null>(null);

  async function handleCheck() {
    if (!code.trim()) return;
    const res = await checkQuality(code, language);
    if (res) setResult(res);
  }

  const LANGUAGES = ["typescript", "javascript", "python", "go", "rust", "java"];

  return (
    <div className={cn("flex flex-col h-full bg-[#050810]", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2128] shrink-0">
        <span className="text-sm font-semibold text-slate-200">Quality Checker</span>
        {filePath && (
          <span className="text-xs text-slate-600 font-mono truncate flex-1">{filePath}</span>
        )}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-[#0D1117] border border-[#1c2128] text-xs text-slate-400 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleCheck} disabled={!code.trim()}>
          Check Quality
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Code input */}
        <div className="w-1/2 border-r border-[#1c2128] flex flex-col min-h-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code to analyse quality…"
            className="flex-1 bg-transparent text-xs font-mono text-slate-300 p-4 resize-none outline-none placeholder:text-slate-700 leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <div className="w-1/2 overflow-y-auto p-4 flex flex-col gap-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 h-full">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">Paste code and click Check Quality</p>
            </div>
          ) : (
            <>
              {/* Score */}
              <div className="flex items-center gap-6 bg-[#0D1117] border border-[#1c2128] rounded-xl p-4">
                <ScoreDial score={result.score} />
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Issues Found</p>
                    <p className="text-lg font-semibold text-slate-100">{result.issues.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Suggestions</p>
                    <p className="text-lg font-semibold text-slate-100">{result.suggestions.length}</p>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Issues</h4>
                  <div className="flex flex-col gap-1.5">
                    {result.issues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() =>
                          setActiveIssue(activeIssue?.id === issue.id ? null : issue)
                        }
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-all",
                          activeIssue?.id === issue.id
                            ? "border-indigo-500/40 bg-indigo-500/8"
                            : "border-[#1c2128] bg-[#0D1117] hover:border-[#30363d]"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <SeverityBadge severity={issue.severity} />
                          <span className="text-[10px] text-slate-600 font-mono ml-auto">
                            L{issue.line}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{issue.message}</p>
                        {activeIssue?.id === issue.id && (
                          <p className="text-xs text-slate-500 mt-1">{issue.explanation}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Suggestions</h4>
                  <ul className="flex flex-col gap-1.5">
                    {result.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-400 px-3 py-2 bg-[#0D1117] border border-[#1c2128] rounded-lg"
                      >
                        <span className="text-indigo-400 shrink-0 mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
