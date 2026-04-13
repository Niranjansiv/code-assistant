import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import type {
  AnalysisJob,
  AnalysisResult,
  AnalysisStatus,
  ApiResponse,
} from "../types.js";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface StartAnalysisBody {
  /** Internal repo ID returned by POST /api/repos/import */
  repoId: string;
  /** Branch to analyse; falls back to the repo's default branch. */
  branch?: string;
  /** If true, re-run even if a recent result exists. Default: false. */
  force?: boolean;
}

// ─── In-memory job store (replace with a proper queue: BullMQ / Inngest) ─────

const jobs = new Map<string, AnalysisJob & { result?: AnalysisResult }>();

function makeJobId(): string {
  return "job_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

// ─── POST /api/analysis ───────────────────────────────────────────────────────
// Auth:          required
// Request body:  { repoId: string, branch?: string, force?: boolean }
// Response 202:  { data: { job: AnalysisJob } }
//   {
//     jobId:       string,
//     repoId:      string,
//     status:      "queued",
//     progress:    0,
//     startedAt:   ISO string,
//     completedAt: null,
//     error:       null
//   }
// Response 400:  { error: "repoId is required" }
// Response 404:  { error: "Repository not found" }
// Response 409:  { error: "Analysis already running for this repo" }  (if force !== true)
//
// TODO: verify the repo exists and belongs to req.user.sub in the DB
// TODO: check for an in-flight job for the same repo — return 409 unless force=true
// TODO: push a job onto BullMQ/Inngest instead of the in-memory map
// TODO: the worker should:
//   1. Clone the repo (or pull latest) into a temp directory
//   2. Run the parser (tree-sitter / language-specific AST tools)
//   3. Build the call graph and compute cyclomatic/cognitive complexity
//   4. Send the code context to Claude API for bug detection + quality scoring
//   5. Persist FileMetrics[], BugReport[], and AnalysisSummary to DB
//   6. Emit SSE / WebSocket progress events back to the client

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId, branch, force = false } = req.body as StartAnalysisBody;

    if (!repoId) throw new AppError("repoId is required", 400);

    // TODO: verify repo ownership in DB
    // const repo = await db.repo.findFirst({ where: { id: repoId, userId: req.user!.sub } });
    // if (!repo) throw new AppError("Repository not found", 404);

    // Check for an existing running job
    const existing = [...jobs.values()].find(
      (j) => j.repoId === repoId && (j.status === "queued" || j.status === "cloning" || j.status === "parsing" || j.status === "analysing")
    );
    if (existing && !force) {
      res.status(409).json({ error: "Analysis already running for this repo", data: { job: existing } });
      return;
    }

    const jobId = makeJobId();
    const job: AnalysisJob = {
      jobId,
      repoId,
      status:      "queued",
      progress:    0,
      startedAt:   new Date().toISOString(),
      completedAt: null,
      error:       null,
    };
    jobs.set(jobId, job);

    // TODO: await queue.add("analyse-repo", { jobId, repoId, branch, userId: req.user!.sub });

    // Simulate progress (remove once real queue is wired)
    simulateAnalysis(jobId, repoId);

    const body: ApiResponse<{ job: AnalysisJob }> = { data: { job } };
    res.status(202).json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analysis/:jobId ─────────────────────────────────────────────────
// Auth:          required
// Path params:   jobId
// Response 200:  { data: { job: AnalysisJob, result?: AnalysisResult } }
//   While in progress: result is absent.
//   When complete:     result contains the full AnalysisResult.
// Response 404:  { error: "Job not found" }
//
// TODO: look up job from DB / Redis instead of in-memory map
// TODO: add a SSE endpoint (GET /api/analysis/:jobId/stream) for real-time progress
// TODO: restrict access so users can only retrieve their own jobs

router.get("/:jobId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const entry = jobs.get(jobId);

    if (!entry) throw new AppError("Job not found", 404);

    const { result, ...job } = entry;
    res.json({ data: { job, ...(result ? { result } : {}) } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analysis/repo/:repoId ──────────────────────────────────────────
// Auth:          required
// Path params:   repoId
// Query params:  branch?: string
// Response 200:  { data: { result: AnalysisResult } }
// Response 404:  { error: "No completed analysis found for this repository" }
//
// TODO: query the DB for the most recent completed analysis for the given repo + branch
// TODO: support listing all historical analyses (GET /api/analysis/repo/:repoId/history)

router.get("/repo/:repoId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;

    // Find the latest completed job for this repo (in-memory; replace with DB)
    const completed = [...jobs.values()]
      .filter((j) => j.repoId === repoId && j.status === "complete" && j.result)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

    if (!completed?.result) {
      throw new AppError("No completed analysis found for this repository", 404);
    }

    res.json({ data: { result: completed.result } });
  } catch (err) {
    next(err);
  }
});

export default router;

// ─── Simulation (dev only — remove when real worker is connected) ─────────────

function simulateAnalysis(jobId: string, repoId: string): void {
  const stages: { status: AnalysisStatus; progress: number; delay: number }[] = [
    { status: "cloning",   progress: 10, delay: 500  },
    { status: "parsing",   progress: 40, delay: 1500 },
    { status: "analysing", progress: 75, delay: 3000 },
    { status: "complete",  progress: 100, delay: 5000 },
  ];

  stages.forEach(({ status, progress, delay }) => {
    setTimeout(() => {
      const entry = jobs.get(jobId);
      if (!entry) return;

      entry.status   = status;
      entry.progress = progress;

      if (status === "complete") {
        entry.completedAt = new Date().toISOString();
        entry.result      = buildMockResult(jobId, repoId);
      }
    }, delay);
  });
}

function buildMockResult(jobId: string, repoId: string): AnalysisResult {
  return {
    jobId,
    repoId,
    status:       "complete",
    qualityScore: 72,
    summary: {
      totalFiles:     34,
      totalLines:     4821,
      totalFunctions: 127,
      avgComplexity:  8.4,
      bugCount:       6,
      criticalBugs:   1,
      languages:      { TypeScript: 3200, CSS: 900, JSON: 721 },
    },
    files: [
      {
        path:                  "src/auth.ts",
        language:              "TypeScript",
        linesOfCode:           140,
        cyclomaticComplexity:  14,
        cognitiveComplexity:   18,
        maintainabilityIndex:  62,
        duplicateLines:        0,
        bugProbability:        0.43,
      },
    ],
    bugs: [
      {
        id:          "bug_1",
        file:        "src/auth.ts",
        line:        47,
        column:      12,
        severity:    "critical",
        category:    "null-dereference",
        message:     "session.user may be undefined before access",
        explanation: "verify() can return null but the return value is used without a null-check",
        suggestedFix: "if (!session) throw new AuthError('Invalid session');",
        confidence:  0.91,
      },
    ],
    completedAt: new Date().toISOString(),
  };
}
