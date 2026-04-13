import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import type {
  LanguageBreakdown,
  ComplexityMetric,
  ChurnDataPoint,
  HeatmapCell,
  ApiResponse,
} from "../types.js";

const router = Router();

// ─── Shared guard ─────────────────────────────────────────────────────────────

// TODO: extract into a helper once DB is wired so every analytics endpoint
//       can do: const repo = await assertRepoAccess(repoId, req.user!.sub);

function assertRepoId(id: string | undefined): asserts id is string {
  if (!id) throw new AppError("repoId is required", 400);
}

// ─── GET /api/analytics/:repoId/languages ────────────────────────────────────
// Auth:          required
// Path params:   repoId
// Response 200:
//   {
//     data: {
//       languages: [
//         { language: string, lines: number, files: number, percentage: number }
//       ]
//     }
//   }
// Response 404:  { error: "No analysis found for this repository" }
//
// TODO: query language_metrics table WHERE repo_id = :repoId AND analysis_id = latest
// TODO: derive percentages server-side from raw line counts
// TODO: collapse languages with < 1% share into an "Other" bucket

router.get("/:repoId/languages", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    assertRepoId(repoId);

    // TODO: verify repo belongs to req.user!.sub
    // TODO: const rows = await db.languageMetric.findMany({ where: { repoId }, orderBy: { lines: "desc" } });

    const mock: LanguageBreakdown[] = [
      { language: "TypeScript", lines: 3200, files: 22, percentage: 66.4 },
      { language: "CSS",        lines:  900, files:  5, percentage: 18.7 },
      { language: "JSON",       lines:  721, files:  7, percentage: 15.0 },
    ];

    const body: ApiResponse<{ languages: LanguageBreakdown[] }> = {
      data: { languages: mock },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/:repoId/complexity ───────────────────────────────────
// Auth:          required
// Path params:   repoId
// Query params:
//   sort?:     "cyclomatic" | "cognitive" | "maintainability" (default "cyclomatic")
//   order?:    "asc" | "desc" (default "desc")
//   limit?:    number (default 50, max 200)
//   language?: string — filter to a specific language
// Response 200:
//   {
//     data: {
//       files: [
//         {
//           file:                   string,
//           language:               string,
//           cyclomaticComplexity:   number,
//           cognitiveComplexity:    number,
//           maintainabilityIndex:   number,  // 0–100 (higher = better)
//           linesOfCode:            number
//         }
//       ]
//     }
//   }
// Response 404:  { error: "No analysis found for this repository" }
//
// TODO: query file_metrics table with parameterised ORDER BY and LIMIT
// TODO: support filtering by directory prefix (query param: dir)

router.get("/:repoId/complexity", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId }  = req.params;
    assertRepoId(repoId);

    const sort     = (req.query.sort     as string  | undefined) ?? "cyclomatic";
    const order    = (req.query.order    as string  | undefined) ?? "desc";
    const limit    = Math.min(200, Number(req.query.limit) || 50);
    const language = req.query.language as string | undefined;

    // Validate sort field to prevent injection
    const VALID_SORTS = ["cyclomatic", "cognitive", "maintainability"] as const;
    type SortField = typeof VALID_SORTS[number];
    if (!VALID_SORTS.includes(sort as SortField)) {
      throw new AppError(`Invalid sort field. Must be one of: ${VALID_SORTS.join(", ")}`, 400);
    }

    void language; // TODO: pass to DB query

    // TODO:
    // const files = await db.fileMetric.findMany({
    //   where:   { repoId, ...(language ? { language } : {}) },
    //   orderBy: { [sortColumn]: order },
    //   take:    limit,
    // });

    const mock: ComplexityMetric[] = [
      {
        file: "src/auth.ts", language: "TypeScript",
        cyclomaticComplexity: 14, cognitiveComplexity: 18,
        maintainabilityIndex: 62, linesOfCode: 140,
      },
      {
        file: "src/api/handlers.ts", language: "TypeScript",
        cyclomaticComplexity: 11, cognitiveComplexity: 14,
        maintainabilityIndex: 71, linesOfCode: 98,
      },
      {
        file: "src/utils/helpers.ts", language: "TypeScript",
        cyclomaticComplexity: 5, cognitiveComplexity: 6,
        maintainabilityIndex: 84, linesOfCode: 55,
      },
    ]
      .sort((a, b) => {
        const key = sort === "cyclomatic" ? "cyclomaticComplexity"
                  : sort === "cognitive"  ? "cognitiveComplexity"
                  :                         "maintainabilityIndex";
        return order === "desc" ? b[key] - a[key] : a[key] - b[key];
      })
      .slice(0, limit);

    const body: ApiResponse<{ files: ComplexityMetric[] }> = { data: { files: mock } };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/:repoId/churn ────────────────────────────────────────
// Auth:          required
// Path params:   repoId
// Query params:
//   since?:  ISO date string (default: 90 days ago)
//   until?:  ISO date string (default: now)
//   bucket?: "day" | "week" | "month" (default "week")
// Response 200:
//   {
//     data: {
//       churn: [
//         {
//           date:         string,   // ISO date (start of bucket)
//           linesAdded:   number,
//           linesRemoved: number,
//           filesChanged: number,
//           commitCount:  number
//         }
//       ]
//     }
//   }
//
// TODO: call GitHub API GET /repos/:owner/:repo/stats/code_frequency for raw data
//       or compute from commit history stored in our DB after import
// TODO: bucket the raw commit-level data into day/week/month buckets in SQL
//       e.g. DATE_TRUNC('week', committed_at)
// TODO: cache the result — GitHub code-frequency stats can take 60s on first load

router.get("/:repoId/churn", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    assertRepoId(repoId);

    const bucket = (req.query.bucket as string | undefined) ?? "week";
    if (!["day", "week", "month"].includes(bucket)) {
      throw new AppError("bucket must be 'day', 'week', or 'month'", 400);
    }

    // TODO: const commits = await db.commit.findMany({ where: { repoId }, orderBy: { committedAt: "asc" } });
    // TODO: group by bucket and aggregate linesAdded / linesRemoved / filesChanged

    const now    = Date.now();
    const mock: ChurnDataPoint[] = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now - (11 - i) * 7 * 24 * 60 * 60 * 1000);
      return {
        date:         d.toISOString().slice(0, 10),
        linesAdded:   Math.floor(Math.random() * 400) + 50,
        linesRemoved: Math.floor(Math.random() * 200) + 10,
        filesChanged: Math.floor(Math.random() * 15)  + 1,
        commitCount:  Math.floor(Math.random() * 20)  + 1,
      };
    });

    const body: ApiResponse<{ churn: ChurnDataPoint[] }> = { data: { churn: mock } };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/:repoId/heatmap ──────────────────────────────────────
// Auth:          required
// Path params:   repoId
// Query params:
//   metric?: "complexity" | "bugs" | "churn" (default "complexity")
//            Controls which score drives the cell colour in the frontend
// Response 200:
//   {
//     data: {
//       heatmap: [
//         {
//           file:          string,   // full path
//           directory:     string,   // parent directory
//           complexity:    number,   // 0–100 normalised
//           bugProbability: number,  // 0–1
//           linesOfCode:   number,
//           lastModified:  string    // ISO date
//         }
//       ]
//     }
//   }
//
// TODO: join file_metrics + bug_reports + commit_history on repoId
//       and return one row per file
// TODO: normalise complexity to 0–100 range using MIN/MAX across the repo
//       so the heatmap colours are relative to this codebase, not absolute
// TODO: for the "churn" metric, join commit_files and compute files changed
//       in the last N days — hotspots with high churn + high complexity are risky

router.get("/:repoId/heatmap", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    assertRepoId(repoId);

    const metric = (req.query.metric as string | undefined) ?? "complexity";
    if (!["complexity", "bugs", "churn"].includes(metric)) {
      throw new AppError("metric must be 'complexity', 'bugs', or 'churn'", 400);
    }

    // TODO: replace with actual DB query
    const mock: HeatmapCell[] = [
      {
        file: "src/auth.ts",           directory: "src",
        complexity: 82, bugProbability: 0.43,
        linesOfCode: 140, lastModified: "2024-11-01",
      },
      {
        file: "src/api/handlers.ts",   directory: "src/api",
        complexity: 68, bugProbability: 0.21,
        linesOfCode: 98,  lastModified: "2024-11-03",
      },
      {
        file: "src/utils/helpers.ts",  directory: "src/utils",
        complexity: 31, bugProbability: 0.05,
        linesOfCode: 55,  lastModified: "2024-10-28",
      },
      {
        file: "src/middleware.ts",     directory: "src",
        complexity: 54, bugProbability: 0.14,
        linesOfCode: 77,  lastModified: "2024-10-30",
      },
    ];

    const body: ApiResponse<{ heatmap: HeatmapCell[]; metric: string }> = {
      data: { heatmap: mock, metric },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
