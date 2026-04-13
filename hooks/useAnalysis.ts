"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analysisApi } from "@/lib/api";
import type { AnalysisResult, AnalysisStatus, BugReport, FlowGraph } from "@/types";

interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  result: AnalysisResult | null;
  bugs: BugReport[];
  graph: FlowGraph | null;
  error: string | null;
}

const INITIAL_STATE: AnalysisState = {
  status: "idle",
  progress: 0,
  result: null,
  bugs: [],
  graph: null,
  error: null,
};

const POLL_INTERVAL_MS = 1500;

export function useAnalysis(repositoryId: string | null) {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const jobIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadExistingResult = useCallback(async (repoId: string) => {
    try {
      const result = await analysisApi.getResult(repoId);
      setState((prev) => ({
        ...prev,
        status: "complete",
        result,
        bugs: result.bugs,
        graph: result.graph,
        progress: 100,
      }));
    } catch {
      // No prior result — stay idle
    }
  }, []);

  useEffect(() => {
    if (!repositoryId) return;
    loadExistingResult(repositoryId);
  }, [repositoryId, loadExistingResult]);

  const startAnalysis = useCallback(async () => {
    if (!repositoryId) return;
    stopPolling();

    setState({ ...INITIAL_STATE, status: "cloning" });

    try {
      const { jobId } = await analysisApi.start(repositoryId);
      jobIdRef.current = jobId;

      pollRef.current = setInterval(async () => {
        try {
          const { status, progress } = await analysisApi.getStatus(jobId);
          setState((prev) => ({ ...prev, status, progress }));

          if (status === "complete") {
            stopPolling();
            const result = await analysisApi.getResult(repositoryId);
            setState((prev) => ({
              ...prev,
              status: "complete",
              result,
              bugs: result.bugs,
              graph: result.graph,
              progress: 100,
            }));
          } else if (status === "error") {
            stopPolling();
            setState((prev) => ({ ...prev, error: "Analysis failed on the server" }));
          }
        } catch (err) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err instanceof Error ? err.message : "Unknown polling error",
          }));
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to start analysis",
      }));
    }
  }, [repositoryId, stopPolling]);

  const fetchGraph = useCallback(
    async (filePath?: string) => {
      if (!repositoryId) return;
      try {
        const graph = await analysisApi.getFlowGraph(repositoryId, filePath);
        setState((prev) => ({ ...prev, graph }));
      } catch (err) {
        console.error("Failed to fetch flow graph", err);
      }
    },
    [repositoryId]
  );

  const reset = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
    jobIdRef.current = null;
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    ...state,
    isRunning: state.status !== "idle" && state.status !== "complete" && state.status !== "error",
    startAnalysis,
    fetchGraph,
    reset,
  };
}
