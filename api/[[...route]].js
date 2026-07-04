import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { auth } from "../server/auth.js";
import { prisma, connectWithRetry, isRetryableError } from "../server/db/prisma.js";
import { authRateLimiter } from "../server/middleware/rate-limit.js";
import { isTrustedOrigin } from "../server/config/security.js";
import { createRequestId, logServerError } from "../server/utils/http-error.js";

export const config = {
  runtime: "nodejs",
};

const app = new Hono().basePath("/api");

// CORS middleware
app.use("/*", cors({
  origin: (origin) => isTrustedOrigin(origin),
  credentials: true,
}));

// Auth routes - handle all Better Auth endpoints
app.use("/auth/*", authRateLimiter());
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// Health check with database connection test
app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch (error) {
    const requestId = createRequestId();
    logServerError("[Vercel Health Check]", requestId, error);
    
    return c.json({
      status: "error",
      database: "disconnected",
      error: "Health check failed",
      requestId,
    }, 500);
  }
});

export default handle(app);
