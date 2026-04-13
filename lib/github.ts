import type { Repository } from "@/types";

// ─── GitHub REST Client ───────────────────────────────────────────────────────

const GITHUB_API = "https://api.github.com";

function githubHeaders(token?: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubFetch<T>(
  path: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(token),
    ...options,
  });

  if (res.status === 404) throw new Error(`GitHub resource not found: ${path}`);
  if (res.status === 403) throw new Error("GitHub API rate limit exceeded or access denied");
  if (res.status === 401) throw new Error("GitHub authentication required");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  return res.json() as Promise<T>;
}

// ─── Repository Operations ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRepo(raw: any): Repository {
  return {
    id: String(raw.id),
    name: raw.name,
    fullName: raw.full_name,
    owner: raw.owner.login,
    url: raw.html_url,
    description: raw.description,
    language: raw.language,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    defaultBranch: raw.default_branch,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    size: raw.size,
    isPrivate: raw.private,
  };
}

export async function getRepository(
  owner: string,
  repo: string,
  token?: string
): Promise<Repository> {
  const raw = await githubFetch<unknown>(`/repos/${owner}/${repo}`, token);
  return mapRepo(raw);
}

export async function getUserRepositories(
  token: string,
  page = 1,
  perPage = 30
): Promise<Repository[]> {
  const data = await githubFetch<unknown[]>(
    `/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
    token
  );
  return data.map(mapRepo);
}

export async function searchRepositories(
  query: string,
  token?: string,
  page = 1
): Promise<{ items: Repository[]; total: number }> {
  const data = await githubFetch<{ items: unknown[]; total_count: number }>(
    `/search/repositories?q=${encodeURIComponent(query)}&page=${page}&per_page=20`,
    token
  );
  return {
    items: data.items.map(mapRepo),
    total: data.total_count,
  };
}

// ─── File & Tree Operations ───────────────────────────────────────────────────

export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch = "HEAD",
  token?: string
): Promise<GitTreeItem[]> {
  const data = await githubFetch<{ tree: GitTreeItem[]; truncated: boolean }>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token
  );
  if (data.truncated) {
    console.warn("Repository tree was truncated — repo may be very large");
  }
  return data.tree;
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch = "HEAD",
  token?: string
): Promise<{ content: string; encoding: string; sha: string }> {
  const data = await githubFetch<{
    content: string;
    encoding: string;
    sha: string;
  }>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, token);

  const content =
    data.encoding === "base64"
      ? Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8")
      : data.content;

  return { content, encoding: data.encoding, sha: data.sha };
}

// ─── Branch & Commit ─────────────────────────────────────────────────────────

export async function getBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<{ name: string; sha: string }[]> {
  const data = await githubFetch<{ name: string; commit: { sha: string } }[]>(
    `/repos/${owner}/${repo}/branches`,
    token
  );
  return data.map((b) => ({ name: b.name, sha: b.commit.sha }));
}

export async function getCommits(
  owner: string,
  repo: string,
  branch = "HEAD",
  perPage = 20,
  token?: string
): Promise<{ sha: string; message: string; author: string; date: string }[]> {
  const data = await githubFetch<
    { sha: string; commit: { message: string; author: { name: string; date: string } } }[]
  >(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`, token);

  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

// ─── URL Parsing ──────────────────────────────────────────────────────────────

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const [, owner, repo] = u.pathname.split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export function buildCloneUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}.git`;
}

export function buildRawUrl(
  owner: string,
  repo: string,
  path: string,
  branch = "main"
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}
