"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAI } from "@/hooks/useAI";
import type { AIContext, AIMessage } from "@/types";

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-[#1c2128] text-indigo-400 border border-[#30363d]"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600/20 text-slate-100 border border-indigo-500/30 rounded-tr-sm"
            : "bg-[#0D1117] text-slate-200 border border-[#1c2128] rounded-tl-sm"
        )}
      >
        {/* Render code blocks */}
        {message.content.split(/(```[\s\S]*?```)/g).map((part, i) => {
          if (part.startsWith("```")) {
            const lines = part.split("\n");
            const lang = lines[0].replace("```", "").trim();
            const code = lines.slice(1, -1).join("\n");
            return (
              <pre key={i} className="mt-2 mb-2 bg-[#050810] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs font-mono overflow-x-auto text-slate-300">
                {lang && <span className="text-[10px] text-slate-600 block mb-1">{lang}</span>}
                <code>{code}</code>
              </pre>
            );
          }
          // Bold
          return (
            <span key={i}>
              {part.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
                chunk.startsWith("**") ? (
                  <strong key={j} className="font-semibold text-slate-100">
                    {chunk.slice(2, -2)}
                  </strong>
                ) : chunk
              )}
            </span>
          );
        })}

        <span className="block text-[10px] text-slate-700 mt-1.5">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Explain the overall architecture of this codebase",
  "What are the most complex functions?",
  "Are there any security vulnerabilities?",
  "How can I improve test coverage?",
];

// ── AIPanel ───────────────────────────────────────────────────────────────────

interface AIPanelProps {
  context?: AIContext;
  className?: string;
}

export function AIPanel({ context, className }: AIPanelProps) {
  const { messages, isLoading, error, sendMessage, clearMessages, updateContext } = useAI(context);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context) updateContext(context);
  }, [context, updateContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#050810]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2128] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-slate-200">DeepTrace AI</span>
        </div>
        <Button variant="ghost" size="xs" onClick={clearMessages}>
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">Ask anything about your codebase</p>
              <p className="text-xs text-slate-600 mt-1">AI-powered code archaeology & analysis</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => { setInput(prompt); }}
                  className="text-left text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg bg-[#0D1117] border border-[#1c2128] hover:border-[#30363d] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center text-xs text-indigo-400">
              AI
            </div>
            <div className="bg-[#0D1117] border border-[#1c2128] rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-[#1c2128]">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the codebase… (Enter to send)"
            resize="none"
            rows={2}
            className="flex-1 text-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={isLoading}
            disabled={!input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
