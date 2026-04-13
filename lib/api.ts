import type {
  AnalysisResult,
  AnalysisStatus,
  BugReport,
  FlowGraph,
  Repository,
} from "@/types";

// ─── Base Config ──────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`, body);
  }

  return res.json() as Promise<T>;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const repositoryApi = {
  list(): Promise<Repository[]> {
    return request<Repository[]>("/repositories");
  },

  get(id: string): Promise<Repository> {
    return request<Repository>(`/repositories/${id}`);
  },

  importFromGitHub(url: string, branch?: string): Promise<Repository> {
    return request<Repository>("/repositories/import", {
      method: "POST",
      body: JSON.stringify({ url, branch }),
    });
  },

  delete(id: string): Promise<void> {
    return request<void>(`/repositories/${id}`, { method: "DELETE" });
  },
};

// ─── Analysis ─────────────────────────────────────────────────────────────────

export const analysisApi = {
  start(repositoryId: string): Promise<{ jobId: string }> {
    return request<{ jobId: string }>(`/analysis`, {
      method: "POST",
      body: JSON.stringify({ repositoryId }),
    });
  },

  getStatus(jobId: string): Promise<{ status: AnalysisStatus; progress: number }> {
    return request(`/analysis/${jobId}/status`);
  },

  getResult(repositoryId: string): Promise<AnalysisResult> {
    return request<AnalysisResult>(`/analysis/${repositoryId}/result`);
  },

  getFlowGraph(repositoryId: string, filePath?: string): Promise<FlowGraph> {
    const params = filePath ? `?file=${encodeURIComponent(filePath)}` : "";
    return request<FlowGraph>(`/analysis/${repositoryId}/graph${params}`);
  },

  getBugs(repositoryId: string): Promise<BugReport[]> {
    return request<BugReport[]>(`/analysis/${repositoryId}/bugs`);
  },
};

// ─── AI Assistant ─────────────────────────────────────────────────────────────

export const aiApi = {
  chat(
    sessionId: string,
    message: string,
    context?: Record<string, unknown>
  ): Promise<{ reply: string; metadata: Record<string, unknown> }> {
    return request(`/ai/chat`, {
      method: "POST",
      body: JSON.stringify({ sessionId, message, context }),
    });
  },

  explainCode(code: string, language: string): Promise<{ explanation: string }> {
    return request(`/ai/explain`, {
      method: "POST",
      body: JSON.stringify({ code, language }),
    });
  },

  fixBug(bug: BugReport, code: string): Promise<{ fix: string; explanation: string }> {
    return request(`/ai/fix`, {
      method: "POST",
      body: JSON.stringify({ bug, code }),
    });
  },

  checkQuality(
    code: string,
    language: string
  ): Promise<{ score: number; issues: BugReport[]; suggestions: string[] }> {
    return request(`/ai/quality`, {
      method: "POST",
      body: JSON.stringify({ code, language }),
    });
  },
};

// ─── File Content ─────────────────────────────────────────────────────────────

export const fileApi = {
  getContent(repositoryId: string, path: string): Promise<{ content: string; language: string }> {
    return request(`/repositories/${repositoryId}/file?path=${encodeURIComponent(path)}`);
  },

  search(
    repositoryId: string,
    query: string
  ): Promise<{ file: string; line: number; snippet: string }[]> {
    return request(
      `/repositories/${repositoryId}/search?q=${encodeURIComponent(query)}`
    );
  },
};

export { ApiError };
