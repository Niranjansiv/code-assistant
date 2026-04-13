import { Request, Response, NextFunction } from "express";

// ─── App error class ──────────────────────────────────────────────────────────

/**
 * Throw an AppError anywhere in a route handler to produce a structured HTTP
 * error response. Express's error handler will catch it automatically.
 *
 * @example
 *   throw new AppError("Repository not found", 404);
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Global error handler (must have 4 params for Express to treat it as one) ─

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status  = err instanceof AppError ? err.status : 500;
  const message = err.message || "Internal Server Error";

  // Log server errors in all envs; skip 4xx in production to reduce noise
  if (status >= 500 || process.env.NODE_ENV !== "production") {
    console.error(`[error] ${status} — ${message}`, status >= 500 ? err.stack : "");
  }

  res.status(status).json({
    error:   message,
    status,
    ...(process.env.NODE_ENV === "development" && status >= 500 && { stack: err.stack }),
  });
}
