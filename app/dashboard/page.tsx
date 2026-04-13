"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileExplorer } from "@/components/dashboard/FileExplorer";
import { CodePanel } from "@/components/dashboard/CodePanel";
import { FlowGraph } from "@/components/dashboard/FlowGraph";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { AIPanel } from "@/components/ai/AIPanel";
import { Button } from "@/components/ui/Button";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useRepository } from "@/hooks/useRepository";
import { cn } from "@/lib/utils";
import type { FileNode, PanelLayout } from "@/types";

const LAYOUT_ICONS: Record<PanelLayout, React.ReactNode> = {
  split: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4m6-18h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M9 3v18" />
    </svg>
  ),
  graph: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  code: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  metrics: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export default function DashboardPage() {
  const [layout, setLayout] = useState<PanelLayout>("split");
  const [showAI, setShowAI] = useState(false);

  const {
    activeRepository,
    repositories,
    fileTree,
    activeFile,
    fileContent,
    fileLanguage,
    openFile,
    selectRepository,
  } = useRepository();

  const {
    result,
    graph,
    bugs,
    status,
    progress,
    qualityScore,
    isRunning,
    startAnalysis,
  } = useAnalysis(activeRepository?.id ?? null) as ReturnType<typeof useAnalysis> & { qualityScore?: number };

  function handleFileSelect(node: FileNode) {
    if (node.type === "file") openFile(node);
  }

  const fileBugs = bugs.filter((b) => b.file === activeFile?.path);

  return (
    <div className="flex flex-col h-screen bg-[#050810] overflow-hidden">
      <Navbar />

      {/* Metrics bar */}
      <MetricsBar
        summary={result?.summary ?? null}
        qualityScore={result?.qualityScore ?? 0}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        {/* File explorer */}
        <div className="w-56 shrink-0 border-r border-[#1c2128] flex flex-col overflow-hidden">
          {/* Repo selector */}
          <div className="px-2 py-2 border-b border-[#1c2128] shrink-0">
            <select
              value={activeRepository?.id ?? ""}
              onChange={(e) => e.target.value && selectRepository(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#1c2128] text-xs text-slate-400 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              <option value="">Select repository…</option>
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <FileExplorer
              tree={fileTree}
              activeFilePath={activeFile?.path ?? null}
              onFileSelect={handleFileSelect}
              className="h-full"
            />
          </div>

          {/* Analyse button */}
          <div className="p-2 border-t border-[#1c2128] shrink-0">
            <Button
              variant={isRunning ? "secondary" : "primary"}
              size="sm"
              className="w-full"
              isLoading={isRunning}
              disabled={!activeRepository || isRunning}
              onClick={startAnalysis}
            >
              {isRunning
                ? `Analysing… ${Math.round(progress)}%`
                : result
                ? "Re-analyse"
                : "Start Analysis"}
            </Button>
          </div>
        </div>

        {/* Main workspace */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1c2128] shrink-0 bg-[#0D1117]">
            <div className="flex bg-[#050810] border border-[#1c2128] rounded-lg p-0.5 gap-0.5">
              {(Object.keys(LAYOUT_ICONS) as PanelLayout[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLayout(l)}
                  title={l}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    layout === l
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {LAYOUT_ICONS[l]}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <Button
              variant={showAI ? "primary" : "ghost"}
              size="xs"
              onClick={() => setShowAI((v) => !v)}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714" />
                </svg>
              }
            >
              AI Assistant
            </Button>
          </div>

          {/* Panel area */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Code / Graph panels */}
            <div className="flex-1 min-w-0 flex overflow-hidden">
              {(layout === "split" || layout === "code") && (
                <div
                  className={cn(
                    "min-w-0 border-r border-[#1c2128]",
                    layout === "split" ? "w-1/2" : "flex-1"
                  )}
                >
                  <CodePanel
                    file={activeFile}
                    content={fileContent}
                    language={fileLanguage}
                    bugs={fileBugs}
                    className="h-full"
                    onExplain={() => setShowAI(true)}
                    onFixBug={() => setShowAI(true)}
                  />
                </div>
              )}

              {(layout === "split" || layout === "graph") && (
                <div className={cn("min-w-0", layout === "split" ? "w-1/2" : "flex-1")}>
                  <FlowGraph graph={graph} className="h-full" />
                </div>
              )}

              {layout === "metrics" && (
                <div className="flex-1 p-6 overflow-y-auto">
                  <p className="text-slate-500 text-sm">
                    Select Analytics from the navigation for full metrics.
                  </p>
                </div>
              )}
            </div>

            {/* AI panel */}
            {showAI && (
              <div className="w-80 shrink-0 border-l border-[#1c2128]">
                <AIPanel
                  context={{
                    currentFile: activeFile?.path,
                    selectedCode: fileContent ?? undefined,
                    analysisResult: result ?? undefined,
                  }}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
