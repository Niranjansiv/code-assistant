import type { AuthSession, GitHubUser } from "@/types";

// ─── Token Storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = "deeptrace_access_token";
const SESSION_KEY = "deeptrace_session";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setStoredToken(session.accessToken);
}

export function clearSession(): void {
  clearStoredToken();
}

export function isAuthenticated(): boolean {
  const session = getSession();
  if (!session) return false;
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    clearSession();
    return false;
  }
  return true;
}

// ─── GitHub OAuth Flow ────────────────────────────────────────────────────────

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";
const GITHUB_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI ?? `${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback`;

export function buildGitHubOAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo read:user user:email",
    state: state ?? crypto.randomUUID(),
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function initiateGitHubLogin(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);
  window.location.href = buildGitHubOAuthUrl(state);
}

export function validateOAuthState(returnedState: string): boolean {
  const stored = sessionStorage.getItem("oauth_state");
  sessionStorage.removeItem("oauth_state");
  return stored === returnedState;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────

export function getCurrentUser(): GitHubUser | null {
  return getSession()?.user ?? null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Server-Side (API Routes) ─────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string; token_type: string; scope: string }> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) throw new Error("Failed to exchange GitHub code for token");
  return res.json();
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch GitHub user");
  const data = await res.json();

  return {
    id: data.id,
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    publicRepos: data.public_repos,
    privateRepos: data.total_private_repos ?? 0,
  };
}
