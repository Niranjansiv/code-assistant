"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useAI } from "@/hooks/useAI";

interface CodeExplainerProps {
  code?: string;
  language?: string;
  filePath?: string;
  className?: string;
}

type ExplanationSection = {
  title: string;
  content: string;
};

function parseExplanation(raw: string): ExplanationSection[] {
  // Split on markdown h2/h3 headings
  const parts = raw.split(/(?=#{2,3}\s)/);
  return parts
    .map((p) => {
      const lines = p.split("\n");
      const titleLine = lines[0].replace(/^#{2,3}\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();
      return { title: titleLine || "Overview", content: content || p.trim() };
    })
    .filter((s) => s.content || s.title);
}

export function CodeExplainer({
  code: initialCode,
  language: initialLang,
  filePath,
  className,
}: CodeExplainerProps) {
  const { explainCode, isLoading, error } = useAI();
  const [code, setCode] = useState(initialCode ?? "");
  const [language, setLanguage] = useState(initialLang ?? "typescript");
  const [explanation, setExplanation] = useState<ExplanationSection[] | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "explanation">("code");

  async function handleExplain() {
    if (!code.trim()) return;
    const raw = await explainCode(code, language);
    if (raw) {
      setExplanation(parseExplanation(raw));
      setActiveTab("explanation");
    }
  }

  const LANGUAGES = ["typescript", "javascript", "python", "go", "rust", "java", "c", "cpp", "css", "html"];

  return (
    <div className={cn("flex flex-col h-full bg-[#050810]", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2128] shrink-0">
        <div className="flex bg-[#0D1117] border border-[#1c2128] rounded-lg p-0.5">
          {(["code", "explanation"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors capitalize",
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {filePath && (
          <span className="text-xs text-slate-600 font-mono truncate flex-1">{filePath}</span>
        )}

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-[#0D1117] border border-[#1c2128] text-xs text-slate-400 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <Button
          variant="primary"
          size="sm"
          isLoading={isLoading}
          onClick={handleExplain}
          disabled={!code.trim()}
        >
          Explain
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "code" ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste ${language} code here to get an AI explanation…`}
            className="w-full h-full bg-transparent text-xs font-mono text-slate-300 p-4 resize-none outline-none placeholder:text-slate-700 leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-y-auto px-4 py-4">
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}
            {!explanation ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-xs">Paste code and click Explain</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {explanation.map((section, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-slate-200 mb-2">{section.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
