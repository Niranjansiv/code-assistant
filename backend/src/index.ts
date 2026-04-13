import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRouter     from "./routes/auth.js";
import githubRouter   from "./routes/github.js";
import analysisRouter from "./routes/analysis.js";
import analyticsRouter from "./routes/analytics.js";
import { errorHandler } from "./middleware/error.js";

// ─── App ──────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the Next.js frontend.
// In production, swap the hardcoded origin for process.env.FRONTEND_URL.

app.use(
  cors({
    origin:      process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,   // needed so the browser sends the dt_token cookie
    methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body / Cookie parsers ────────────────────────────────────────────────────

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate limiting ────────────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP, applied to every route.
// Tighter limits on auth routes are handled within routes/auth.ts.
// TODO: swap windowMs/max for values from env vars (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)

app.use(
  rateLimit({
    windowMs:       15 * 60 * 1000, // 15 minutes
    max:            100,
    standardHeaders: true,           // RateLimit-* headers (RFC 6585)
    legacyHeaders:  false,           // suppress X-RateLimit-* headers
    message:        { error: "Too many requests — please try again in 15 minutes." },
    keyGenerator:   (req) =>
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim()
      ?? req.ip
      ?? "unknown",
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status:    "ok",
    service:   "deeptrace-api",
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV ?? "development",
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth",      authRouter);
app.use("/api/repos",     githubRouter);
app.use("/api/analysis",  analysisRouter);
app.use("/api/analytics", analyticsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
// Must be registered LAST — Express identifies error handlers by their 4-arg signature.

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  deeptrace-api  →  http://localhost:${PORT}`);
  console.log(`  health check   →  http://localhost:${PORT}/health\n`);
});

export default app;
