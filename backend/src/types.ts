// ─── JWT ──────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  /** Internal user ID (UUID or DB primary key). */
  sub: string;
  email: string;
  /** GitHub username, set after OAuth. */
  login?: string;
  name?: string | null;
  avatarUrl?: string;
}

// ─── Shared user shape returned by API responses ──────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  login: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  isPrivate: boolean;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export type AnalysisStatus =
  | "queued"
  | "cloning"
  | "parsing"
  | "analysing"
  | "complete"
  | "error";

export interface AnalysisJob {
  jobId: string;
  repoId: string;
  status: AnalysisStatus;
  progress: number;        // 0–100
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface FileMetrics {
  path: string;
  language: string;
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  duplicateLines: number;
  bugProbability: number;
}

export interface BugReport {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  message: string;
  explanation: string;
  suggestedFix?: string;
  confidence: number;
}

export interface AnalysisResult {
  jobId: string;
  repoId: string;
  status: AnalysisStatus;
  qualityScore: number;       // 0–100
  summary: {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    avgComplexity: number;
    bugCount: number;
    criticalBugs: number;
    languages: Record<string, number>;
  };
  files: FileMetrics[];
  bugs: BugReport[];
  completedAt: string | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface LanguageBreakdown {
  language: string;
  lines: number;
  files: number;
  percentage: number;
}

export interface ComplexityMetric {
  file: string;
  language: string;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  linesOfCode: number;
}

export interface ChurnDataPoint {
  date: string;           // ISO date string
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  commitCount: number;
}

export interface HeatmapCell {
  file: string;
  directory: string;
  complexity: number;     // 0–100 normalised
  bugProbability: number; // 0–1
  linesOfCode: number;
  lastModified: string;
}

// ─── Generic API envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  hasNext: boolean;
}

// ─── Express augmentation ─────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the auth middleware after JWT verification. */
      user?: JWTPayload;
    }
  }
}
