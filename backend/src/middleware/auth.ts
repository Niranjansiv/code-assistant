import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "../types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";

/** Sign a new JWT for the given payload. */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

/** Verify and decode a token, returning null on any failure. */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Extract the raw token string from the request.
 *  Checks (in order):
 *  1. Authorization: Bearer <token>
 *  2. Cookie: dt_token
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = req.cookies?.dt_token as string | undefined;
  return cookie ?? null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * requireAuth — hard gate.
 * Attaches `req.user` on success; responds 401 on missing/invalid token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const raw = extractToken(req);

  if (!raw) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyToken(raw);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}

/**
 * optionalAuth — soft gate.
 * Attaches `req.user` when a valid token is present, but never blocks.
 * Useful for public endpoints that behave differently for logged-in users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const raw = extractToken(req);
  if (raw) {
    const payload = verifyToken(raw);
    if (payload) req.user = payload;
  }
  next();
}
