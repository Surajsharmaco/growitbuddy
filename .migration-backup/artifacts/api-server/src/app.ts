import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getOptimizeSettings } from "./routes/admin";

const app: Express = express();

// ──────────────────────────────────────────────────────────────────
// Optional public-read cache headers, controlled from /admin/optimize.
//
// SAFETY RULES (all enforced here):
//  - Only GET requests.
//  - Only the explicit allow-list of stable public endpoints below.
//  - NEVER admin, auth, forms, or write methods.
//  - Max TTL is 5 minutes — admin edits propagate quickly.
//  - When the setting is "off" (default), this middleware does nothing.
// ──────────────────────────────────────────────────────────────────
const PUBLIC_CACHE_ALLOWLIST: RegExp[] = [
  /^\/api\/portfolio\/items\/?$/,
  /^\/api\/seo\/[^/]+\/?$/,
];
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET") return next();
  try {
    const s = getOptimizeSettings();
    const url = req.url.split("?")[0] ?? req.url;

    // Long-lived headers for media (immutable URLs by ID).
    if (s.strictImageHeaders && /^\/api\/media\/file\/\d+\/?$/.test(url)) {
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    } else if (
      s.publicReadCache !== "off" &&
      PUBLIC_CACHE_ALLOWLIST.some((re) => re.test(url))
    ) {
      const maxAge = s.publicReadCache === "short" ? 60 : 300;
      res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=60`);
    }
  } catch { /* fail open — never block a request because of optimization */ }
  next();
});

// ── Security headers ──
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ── Body size limit (10 MB for JSON to handle large CMS payloads with images) ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
    credentials: true,
  }),
);

app.use("/api", router);

export default app;
