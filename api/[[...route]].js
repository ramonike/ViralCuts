import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { auth } from "../server/auth.js";
import { prisma, connectWithRetry, isRetryableError } from "../server/db/prisma.js";

export const config = {
  runtime: "nodejs",
};

const app = new Hono().basePath("/api");

// CORS middleware
app.use("/*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Auth routes - handle all Better Auth endpoints
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// Health check with database connection test
app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection error:", error.message);
    
    return c.json({
      status: "error",
      database: "disconnected",
      error: error.message,
      code: error.code || 'UNKNOWN',
      retryable: isRetryableError(error),
    }, 500);
  }
});

export default handle(app);
