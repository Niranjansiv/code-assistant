import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import type { Repository, ApiResponse, PaginatedResponse } from "../types.js";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportBody {
  /** Full GitHub URL: https://github.com/owner/repo */
  url: string;
  /** Branch to analyse; defaults to the repo's default branch. */
  branch?: string;
}

interface ImportResponse {
  repoId:  string;
  status:  "imported" | "already_exists";
  repo:    Repository;
}

interface FileTreeNode {
  path:     string;
  type:     "blob" | "tree";
  sha:      string;
  size?:    number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse owner/repo out of a GitHub URL or "owner/repo" shorthand. */
function parseGitHubUrl(raw: string): { owner: string; repo: string } {
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(`https://github.com/${raw}`);
    if (url.hostname !== "github.com") throw new Error();
    const [, owner, repo] = url.pathname.split("/");
    if (!owner || !repo) throw new Error();
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    throw new AppError(`Invalid GitHub URL: "${raw}"`, 400);
  }
}

// ─── GET /api/repos ───────────────────────────────────────────────────────────
// Auth:          required
// Query params:  page?: number (default 1), perPage?: number (default 30)
// Response 200:  PaginatedResponse<Repository>
//   {
//     data:    Repository[],
//     page:    number,
//     perPage: number,
//     total:   number,
//     hasNext: boolean
//   }
// Response 401:  { error: "Authentication required" }
//
// TODO: call GitHub API GET /user/repos?sort=updated&per_page=N&page=N using the
//       user's stored GitHub access token (looked up from DB via req.user.sub)
// TODO: cache responses in Redis with a short TTL (e.g. 60s) to avoid GH rate limits
// TODO: return repos the user has previously imported (from our own DB) alongside GH repos

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page    = Math.max(1, Number(req.query.page)    || 1);
    const perPage = Math.min(100, Number(req.query.perPage) || 30);

    // TODO: const ghToken = await db.githubToken.findByUserId(req.user!.sub);
    // TODO: const repos   = await getUserRepositories(ghToken, page, perPage);

    // Mock — replace with real DB/GitHub call
    const mockRepos: Repository[] = [];

    const body: PaginatedResponse<Repository> = {
      data:    mockRepos,
      page,
      perPage,
      total:   0,
      hasNext: false,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/repos/import ───────────────────────────────────────────────────
// Auth:          required
// Request body:  { url: string, branch?: string }
// Response 201:  { data: ImportResponse }
//   {
//     repoId:  string,
//     status:  "imported" | "already_exists",
//     repo:    Repository
//   }
// Response 400:  { error: "url is required" }
// Response 400:  { error: "Invalid GitHub URL: ..." }
// Response 404:  { error: "Repository not found on GitHub" }
//
// TODO: call GitHub API GET /repos/:owner/:repo to verify the repo exists
//       and the user has access (pass their stored OAuth token for private repos)
// TODO: upsert a row in the repos table (link to user via userId)
// TODO: if repo is large (> 50k files), warn the user and start analysis asynchronously
// TODO: kick off an analysis job immediately after import (POST /api/analysis internally)

router.post("/import", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, branch } = req.body as ImportBody;

    if (!url) throw new AppError("url is required", 400);

    const { owner, repo: repoName } = parseGitHubUrl(url);

    // TODO: const ghToken = await db.githubToken.findByUserId(req.user!.sub);
    // TODO: const ghRepo  = await getRepository(owner, repoName, ghToken);
    // TODO: const [record, created] = await db.repo.upsert({ where: { fullName: ghRepo.fullName, userId: req.user!.sub }, ... });

    // Mock — remove once DB is wired
    const mockRepo: Repository = {
      id:            `repo_${owner}_${repoName}`,
      name:          repoName,
      fullName:      `${owner}/${repoName}`,
      owner,
      url:           `https://github.com/${owner}/${repoName}`,
      description:   null,
      language:      null,
      stars:         0,
      forks:         0,
      openIssues:    0,
      defaultBranch: branch ?? "main",
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      size:          0,
      isPrivate:     false,
    };

    const body: ApiResponse<ImportResponse> = {
      data: { repoId: mockRepo.id, status: "imported", repo: mockRepo },
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:id ───────────────────────────────────────────────────────
// Auth:          required
// Path params:   id — the internal repo ID stored in our DB
// Response 200:  { data: { repo: Repository } }
// Response 404:  { error: "Repository not found" }
//
// TODO: look up repo by ID in the DB, verify it belongs to req.user.sub
// TODO: optionally refresh metadata from GitHub (if updatedAt is stale)

router.get("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // TODO: const repo = await db.repo.findFirst({ where: { id, userId: req.user!.sub } });
    // if (!repo) throw new AppError("Repository not found", 404);

    // Mock
    if (!id) throw new AppError("Repository not found", 404);
    const mockRepo: Repository = {
      id,
      name:          id,
      fullName:      `demo/${id}`,
      owner:         "demo",
      url:           `https://github.com/demo/${id}`,
      description:   "Mock repository",
      language:      "TypeScript",
      stars:         42,
      forks:         7,
      openIssues:    3,
      defaultBranch: "main",
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      size:          1024,
      isPrivate:     false,
    };

    res.json({ data: { repo: mockRepo } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/repos/:id/tree ──────────────────────────────────────────────────
// Auth:          optional (public repos accessible without auth)
// Path params:   id
// Query params:  branch?: string (default: repo's default branch)
// Response 200:  { data: { tree: FileTreeNode[], branch: string } }
// Response 404:  { error: "Repository not found" }
//
// TODO: look up repo in DB to get owner/name, then call getRepositoryTree()
// TODO: cache the tree in Redis/DB — it rarely changes within a branch
// TODO: for large repos (> 10k files) return a shallow tree and paginate deeper levels

router.get("/:id/tree", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id }     = req.params;
    const branch     = (req.query.branch as string | undefined) ?? "main";

    // TODO: const repo   = await db.repo.findById(id);
    // TODO: const ghToken = req.user ? await db.githubToken.findByUserId(req.user.sub) : undefined;
    // TODO: const tree    = await getRepositoryTree(repo.owner, repo.name, branch, ghToken);

    const mockTree: FileTreeNode[] = [
      { path: "src/index.ts",    type: "blob", sha: "abc1", size: 1024 },
      { path: "src/auth.ts",     type: "blob", sha: "abc2", size: 2048 },
      { path: "src/utils/",      type: "tree", sha: "abc3"             },
      { path: "src/utils/helpers.ts", type: "blob", sha: "abc4", size: 512 },
    ];

    res.json({ data: { tree: mockTree, branch } });
  } catch (err) {
    next(err);
  }
});

export default router;
