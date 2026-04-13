"use client";

import { useCallback, useRef, useState } from "react";
import { aiApi } from "@/lib/api";
import type { AIContext, AIMessage, BugReport } from "@/types";

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

function newSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function buildMessage(role: AIMessage["role"], content: string): AIMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

export function useAI(initialContext?: AIContext) {
  const [state, setState] = useState<AIState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: newSessionId(),
  });

  const contextRef = useRef<AIContext>(initialContext ?? {});

  const updateContext = useCallback((updates: Partial<AIContext>) => {
    contextRef.current = { ...contextRef.current, ...updates };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg = buildMessage("user", content);

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const { reply, metadata } = await aiApi.chat(
        state.sessionId,
        content,
        contextRef.current as Record<string, unknown>
      );

      const assistantMsg: AIMessage = {
        ...buildMessage("assistant", reply),
        metadata: metadata as AIMessage["metadata"],
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
        isLoading: false,
      }));

      return assistantMsg;
    } catch (err) {
      const error = err instanceof Error ? err.message : "AI request failed";
      setState((prev) => ({ ...prev, isLoading: false, error }));
      return null;
    }
  }, [state.sessionId]);

  const explainCode = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const { explanation } = await aiApi.explainCode(code, language);
        const msg = buildMessage("assistant", explanation);
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
          isLoading: false,
        }));
        return explanation;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Explain failed";
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return null;
      }
    },
    []
  );

  const fixBug = useCallback(
    async (bug: BugReport, code: string): Promise<{ fix: string; explanation: string } | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await aiApi.fixBug(bug, code);
        const msg = buildMessage(
          "assistant",
          `**Bug Fix for \`${bug.file}:${bug.line}\`**\n\n${result.explanation}\n\n\`\`\`\n${result.fix}\n\`\`\``
        );
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
          isLoading: false,
        }));
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Fix failed";
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return null;
      }
    },
    []
  );

  const checkQuality = useCallback(
    async (code: string, language: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await aiApi.checkQuality(code, language);
        setState((prev) => ({ ...prev, isLoading: false }));
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Quality check failed";
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return null;
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      sessionId: newSessionId(),
      error: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sessionId: state.sessionId,
    sendMessage,
    explainCode,
    fixBug,
    checkQuality,
    updateContext,
    clearMessages,
  };
}
