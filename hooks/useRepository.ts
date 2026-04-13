"use client";

import { useCallback, useEffect, useState } from "react";
import { fileApi, repositoryApi } from "@/lib/api";
import type { FileNode, Repository } from "@/types";

interface RepositoryState {
  repositories: Repository[];
  activeRepository: Repository | null;
  fileTree: FileNode[];
  activeFile: FileNode | null;
  fileContent: string | null;
  fileLanguage: string | null;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
}

const INITIAL_STATE: RepositoryState = {
  repositories: [],
  activeRepository: null,
  fileTree: [],
  activeFile: null,
  fileContent: null,
  fileLanguage: null,
  isLoading: false,
  isImporting: false,
  error: null,
};

export function useRepository() {
  const [state, setState] = useState<RepositoryState>(INITIAL_STATE);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false, isImporting: false }));
  }, []);

  // ── Fetch all repositories ─────────────────────────────────────────────────

  const fetchRepositories = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const repositories = await repositoryApi.list();
      setState((prev) => ({ ...prev, repositories, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    }
  }, [setError]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // ── Select repository ──────────────────────────────────────────────────────

  const selectRepository = useCallback(
    async (repositoryId: string) => {
      const cached = state.repositories.find((r) => r.id === repositoryId);
      setState((prev) => ({
        ...prev,
        activeRepository: cached ?? null,
        fileTree: [],
        activeFile: null,
        fileContent: null,
        isLoading: true,
        error: null,
      }));

      try {
        const repo = cached ?? (await repositoryApi.get(repositoryId));
        setState((prev) => ({
          ...prev,
          activeRepository: repo,
          isLoading: false,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repository");
      }
    },
    [state.repositories, setError]
  );

  // ── Import from GitHub ─────────────────────────────────────────────────────

  const importRepository = useCallback(
    async (url: string, branch?: string): Promise<Repository | null> => {
      setState((prev) => ({ ...prev, isImporting: true, error: null }));
      try {
        const repo = await repositoryApi.importFromGitHub(url, branch);
        setState((prev) => ({
          ...prev,
          repositories: [repo, ...prev.repositories],
          activeRepository: repo,
          isImporting: false,
        }));
        return repo;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import repository");
        return null;
      }
    },
    [setError]
  );

  // ── Delete repository ──────────────────────────────────────────────────────

  const deleteRepository = useCallback(
    async (repositoryId: string) => {
      try {
        await repositoryApi.delete(repositoryId);
        setState((prev) => ({
          ...prev,
          repositories: prev.repositories.filter((r) => r.id !== repositoryId),
          activeRepository:
            prev.activeRepository?.id === repositoryId ? null : prev.activeRepository,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete repository");
      }
    },
    [setError]
  );

  // ── File operations ────────────────────────────────────────────────────────

  const openFile = useCallback(
    async (file: FileNode) => {
      if (!state.activeRepository || file.type !== "file") return;
      setState((prev) => ({ ...prev, activeFile: file, isLoading: true }));
      try {
        const { content, language } = await fileApi.getContent(
          state.activeRepository.id,
          file.path
        );
        setState((prev) => ({
          ...prev,
          fileContent: content,
          fileLanguage: language,
          isLoading: false,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      }
    },
    [state.activeRepository, setError]
  );

  const searchFiles = useCallback(
    async (query: string) => {
      if (!state.activeRepository) return [];
      try {
        return await fileApi.search(state.activeRepository.id, query);
      } catch {
        return [];
      }
    },
    [state.activeRepository]
  );

  return {
    ...state,
    fetchRepositories,
    selectRepository,
    importRepository,
    deleteRepository,
    openFile,
    searchFiles,
  };
}
