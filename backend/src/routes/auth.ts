import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import type { UserProfile, ApiResponse } from "../types.js";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: UserProfile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Set the JWT as an HttpOnly cookie (complement to the JSON response body). */
function setAuthCookie(res: Response, token: string): void {
  res.cookie("dt_token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path:     "/",
  });
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Request body:  { email: string, password: string, name?: string }
// Response 201:  { data: { token: string, user: UserProfile } }
// Response 400:  { error: "Email and password are required" }
// Response 409:  { error: "Email already registered" }
//
// TODO: validate email format (use zod or express-validator)
// TODO: enforce minimum password length / strength rules
// TODO: insert user row into DB (users table), hash password with bcrypt
// TODO: send a verification email before allowing login

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as RegisterBody;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // TODO: check for existing user in DB
    // const existing = await db.user.findUnique({ where: { email } });
    // if (existing) throw new AppError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 12);

    // TODO: persist to DB and get back the real user ID
    // const user = await db.user.create({ data: { email, passwordHash, name } });
    const mockUser: UserProfile = {
      id:        "usr_" + Date.now(),
      email,
      name:      name ?? null,
      login:     null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    // Suppress unused variable warning until DB is wired
    void passwordHash;

    const token = signToken({ sub: mockUser.id, email: mockUser.email });
    setAuthCookie(res, token);

    const body: ApiResponse<AuthResponse> = { data: { token, user: mockUser } };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Request body:  { email: string, password: string }
// Response 200:  { data: { token: string, user: UserProfile } }
// Response 400:  { error: "Email and password are required" }
// Response 401:  { error: "Invalid credentials" }
//
// TODO: look up user by email in DB
// TODO: compare password with bcrypt.compare(password, user.passwordHash)
// TODO: update user.lastLoginAt timestamp

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // TODO: const user = await db.user.findUnique({ where: { email } });
    // if (!user) throw new AppError("Invalid credentials", 401);
    // const valid = await bcrypt.compare(password, user.passwordHash);
    // if (!valid) throw new AppError("Invalid credentials", 401);

    // Mock response — replace once DB is connected
    const mockUser: UserProfile = {
      id:        "usr_demo",
      email,
      name:      "Demo User",
      login:     null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    const token = signToken({ sub: mockUser.id, email: mockUser.email });
    setAuthCookie(res, token);

    const body: ApiResponse<AuthResponse> = { data: { token, user: mockUser } };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/github ─────────────────────────────────────────────────────
// Initiates the GitHub OAuth flow.
// Response 302:  redirect to https://github.com/login/oauth/authorize
//
// TODO: store the state value in Redis / DB to prevent CSRF (currently in-memory)
// TODO: add rate limiting specific to OAuth initiation

const oauthStateMap = new Map<string, number>(); // state → timestamp

router.get("/github", (_req: Request, res: Response) => {
  const clientId    = process.env.GITHUB_CLIENT_ID    ?? "";
  const redirectUri = process.env.GITHUB_REDIRECT_URI ?? "";

  if (!clientId) {
    res.status(503).json({ error: "GitHub OAuth is not configured" });
    return;
  }

  const state  = crypto.randomUUID();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  oauthStateMap.set(state, expiry);

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: redirectUri,
    scope:        "repo read:user user:email",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// ─── GET /api/auth/github/callback ───────────────────────────────────────────
// Query params:  { code: string, state: string }
// On success:    redirect to FRONTEND_URL with ?token=<jwt>
// Response 400:  { error: "Invalid OAuth state" }
// Response 502:  { error: "GitHub token exchange failed" }
//
// TODO: validate state against Redis / DB store, not in-memory map
// TODO: upsert the user in the DB (create if new, update name/avatar if returning)
// TODO: link GitHub account to existing email-based account if emails match

router.get("/github/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      throw new AppError("Missing code or state parameter", 400);
    }

    // Validate state and clean up
    const expiry = oauthStateMap.get(state);
    if (!expiry || Date.now() > expiry) {
      oauthStateMap.delete(state);
      throw new AppError("Invalid or expired OAuth state", 400);
    }
    oauthStateMap.delete(state);

    // Exchange code → access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    if (!tokenRes.ok) throw new AppError("GitHub token exchange failed", 502);

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new AppError(tokenData.error ?? "GitHub OAuth failed", 502);
    }
    const ghToken = tokenData.access_token;

    // Fetch GitHub user profile
    const ghUserRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept:        "application/vnd.github+json",
      },
    });
    if (!ghUserRes.ok) throw new AppError("Failed to fetch GitHub user", 502);

    const ghUser = (await ghUserRes.json()) as {
      id: number; login: string; name: string | null;
      email: string | null; avatar_url: string;
    };

    // TODO: upsert user in DB using ghUser.id as the GitHub identity
    const userId  = `gh_${ghUser.id}`;
    const email   = ghUser.email ?? `${ghUser.login}@users.noreply.github.com`;
    const token   = signToken({
      sub:       userId,
      email,
      login:     ghUser.login,
      name:      ghUser.name,
      avatarUrl: ghUser.avatar_url,
    });

    setAuthCookie(res, token);

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Headers:       Authorization: Bearer <token>  OR  Cookie: dt_token
// Response 200:  { data: { user: UserProfile } }
// Response 401:  { error: "Authentication required" }
//
// TODO: fetch fresh user data from DB instead of returning the JWT payload directly

router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user: UserProfile = {
    id:        req.user!.sub,
    email:     req.user!.email,
    name:      req.user!.name ?? null,
    login:     req.user!.login ?? null,
    avatarUrl: req.user!.avatarUrl ?? null,
    createdAt: new Date().toISOString(), // TODO: pull real createdAt from DB
  };
  res.json({ data: { user } });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Clears the auth cookie.
// Response 200:  { data: { message: "Logged out" } }
//
// TODO: if using refresh tokens, revoke them in the DB / Redis here

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("dt_token", { path: "/" });
  res.json({ data: { message: "Logged out" } });
});

export default router;
