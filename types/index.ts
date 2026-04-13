// ─── Repository & File System ────────────────────────────────────────────────

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

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  extension?: string;
  size?: number;
  language?: string;
  children?: FileNode[];
  content?: string;
  metrics?: FileMetrics;
}

export interface FileMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  duplicateLines: number;
  commentRatio: number;
  bugProbability: number;
}

// ─── Flow Graph ───────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  label: string;
  type: "function" | "class" | "module" | "entry" | "exit" | "branch" | "loop";
  file: string;
  line: number;
  column: number;
  calledBy: string[];
  calls: string[];
  complexity: number;
  isAsync: boolean;
  isExported: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: "call" | "import" | "extends" | "implements" | "conditional";
  label?: string;
  weight: number;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryPoints: string[];
  cycles: string[][];
}

// ─── Analysis & Metrics ──────────────────────────────────────────────────────

export interface AnalysisResult {
  repositoryId: string;
  timestamp: string;
  status: AnalysisStatus;
  summary: AnalysisSummary;
  files: FileNode[];
  graph: FlowGraph;
  bugs: BugReport[];
  dependencies: Dependency[];
  qualityScore: number;
}

export type AnalysisStatus =
  | "idle"
  | "cloning"
  | "parsing"
  | "analysing"
  | "complete"
  | "error";

export interface AnalysisSummary {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  totalClasses: number;
  avgComplexity: number;
  maxComplexity: number;
  bugCount: number;
  criticalBugs: number;
  duplicateBlocks: number;
  testCoverage: number | null;
  languages: Record<string, number>;
}

export interface Dependency {
  name: string;
  version: string;
  type: "runtime" | "dev" | "peer";
  isOutdated: boolean;
  hasVulnerabilities: boolean;
  vulnerabilityCount?: number;
  latestVersion?: string;
}

// ─── Bug Detection ────────────────────────────────────────────────────────────

export type BugSeverity = "critical" | "high" | "medium" | "low" | "info";
export type BugCategory =
  | "null-dereference"
  | "memory-leak"
  | "race-condition"
  | "security"
  | "logic-error"
  | "performance"
  | "style"
  | "dead-code"
  | "type-error"
  | "unhandled-exception";

export interface BugReport {
  id: string;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: BugSeverity;
  category: BugCategory;
  message: string;
  explanation: string;
  suggestedFix?: string;
  confidence: number;
  ruleId: string;
  codeSnippet: string;
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────

export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  metadata?: AIMessageMetadata;
}

export interface AIMessageMetadata {
  codeReferences?: CodeReference[];
  suggestedActions?: SuggestedAction[];
  confidence?: number;
  model?: string;
  tokensUsed?: number;
}

export interface CodeReference {
  file: string;
  startLine: number;
  endLine: number;
  snippet: string;
  relevance: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  type: "fix" | "refactor" | "explain" | "test" | "optimize";
  payload: Record<string, unknown>;
}

export interface AISession {
  id: string;
  repositoryId: string;
  messages: AIMessage[];
  context: AIContext;
  createdAt: string;
  updatedAt: string;
}

export interface AIContext {
  currentFile?: string;
  selectedCode?: string;
  analysisResult?: AnalysisResult;
  focusedBug?: BugReport;
}

// ─── Charts & Visualisation ──────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  meta?: Record<string, unknown>;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  label?: string;
}

// ─── GitHub Auth ──────────────────────────────────────────────────────────────

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
  privateRepos: number;
}

export interface AuthSession {
  user: GitHubUser;
  accessToken: string;
  expiresAt: string | null;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
}

export type PanelLayout = "split" | "graph" | "code" | "metrics";
export type SidebarTab = "files" | "bugs" | "dependencies" | "search";
