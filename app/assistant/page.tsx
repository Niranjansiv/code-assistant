"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIPanel } from "@/components/ai/AIPanel";
import { BugFixer } from "@/components/ai/BugFixer";
import { CodeExplainer } from "@/components/ai/CodeExplainer";
import { QualityChecker } from "@/components/ai/QualityChecker";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useRepository } from "@/hooks/useRepository";
import { cn } from "@/lib/utils";

type AssistantTab = "chat" | "bug-fixer" | "explainer" | "quality";

const TABS: { id: AssistantTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "chat",
    label: "Chat",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "bug-fixer",
    label: "Bug Fixer",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "explainer",
    label: "Code Explainer",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: "quality",
    label: "Quality Checker",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");

  const { activeRepository, fileContent, fileLanguage, activeFile } = useRepository();
  const { result, bugs } = useAnalysis(activeRepository?.id ?? null);

  return (
    <div className="flex flex-col h-screen bg-[#050810] overflow-hidden">
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        {/* Tab sidebar */}
        <div className="w-48 shrink-0 border-r border-[#1c2128] flex flex-col py-4 px-2 gap-1">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            AI Tools
          </p>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-left transition-colors",
                activeTab === tab.id
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <span className={activeTab === tab.id ? "text-indigo-400" : "text-slate-600"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Context info */}
          {activeRepository && (
            <div className="mt-auto px-2 py-3 border-t border-[#1c2128]">
              <p className="text-[10px] text-slate-700 mb-1">Context</p>
              <p className="text-xs text-slate-500 truncate">{activeRepository.name}</p>
              {activeFile && (
                <p className="text-[10px] text-slate-700 truncate font-mono mt-0.5">
                  {activeFile.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeTab === "chat" && (
            <AIPanel
              context={{
                currentFile: activeFile?.path,
                selectedCode: fileContent ?? undefined,
                analysisResult: result ?? undefined,
              }}
              className="h-full"
            />
          )}

          {activeTab === "bug-fixer" && (
            <div className="h-full p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-100">Bug Fixer</h2>
                <p className="text-xs text-slate-500">
                  {bugs.length
                    ? `${bugs.length} issues detected — click any to generate an AI fix`
                    : "Run analysis on a repository to detect bugs"}
                </p>
              </div>
              <div className="h-[calc(100%-64px)]">
                <BugFixer
                  bugs={bugs}
                  getCodeForBug={(bug) => {
                    if (activeFile?.path === bug.file && fileContent) return fileContent;
                    return bug.codeSnippet;
                  }}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {activeTab === "explainer" && (
            <CodeExplainer
              code={fileContent ?? ""}
              language={fileLanguage ?? "typescript"}
              filePath={activeFile?.path}
              className="h-full"
            />
          )}

          {activeTab === "quality" && (
            <QualityChecker
              code={fileContent ?? ""}
              language={fileLanguage ?? "typescript"}
              filePath={activeFile?.path}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
