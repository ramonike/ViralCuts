import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth.js";
import { prisma, connectWithRetry, isRetryableError } from "./db/prisma.js";
import { rateLimiter, authRateLimiter } from "./middleware/rate-limit.js";
import { isTrustedOrigin } from "./config/security.js";
import adminRoutes from "./routes/admin.js";

// Import route modules
import progressRoutes from "./routes/progress.js";
import uploadsRoutes from "./routes/uploads.js";
import achievementsRoutes from "./routes/achievements.js";
import settingsRoutes from "./routes/settings.js";
import videosRoutes from "./routes/videos.js";
import youtubeRoutes from "./routes/youtube.js";
import notificationsRoutes from "./routes/notifications.js";
import tiktokRoutes from "./routes/tiktok.js";
import aiRoutes from "./routes/ai.js";
import betaRoutes from "./routes/beta.js";
import subscriptionRoutes from "./routes/subscription.js";

// Import scheduled jobs
import { startScheduledUploadsJob, stopScheduledUploadsJob } from "./jobs/scheduled-uploads.js";

const app = new Hono();

// Security headers
app.use("/*", secureHeaders());

// CORS middleware
app.use("/*", cors({
  origin: (origin) => isTrustedOrigin(origin),
  credentials: true,
}));

// Rate limiting global (excluindo rotas de auth que têm rate limit próprio)
app.use("/api/progress/*", rateLimiter());
app.use("/api/uploads/*", rateLimiter());
app.use("/api/achievements/*", rateLimiter());
app.use("/api/settings/*", rateLimiter());
app.use("/api/videos/*", rateLimiter());
app.use("/api/youtube/*", rateLimiter());
app.use("/api/tiktok/*", rateLimiter());
app.use("/api/notifications/*", rateLimiter());
app.use("/api/health", rateLimiter());

// YouTube OAuth callback - must be BEFORE the generic auth handler
// This route is handled separately because it's not part of Better Auth
app.get("/api/auth/youtube/callback", async (c) => {
  const youtubeModule = await import("./routes/youtube.js");
  return youtubeModule.default.fetch(
    new Request(c.req.url.replace("/api/auth/youtube/callback", "/auth/callback"), {
      method: c.req.method,
      headers: c.req.raw.headers,
    }),
    c.env
  );
});

// YouTube OAuth refresh - must be BEFORE the generic auth handler
// Endpoint: POST /api/auth/youtube/refresh
// Requirements: 1.3, 1.4
app.post("/api/auth/youtube/refresh", async (c) => {
  const { refreshToken: refreshYouTubeToken } = await import("./services/youtube-auth.js");

  try {
    // Validate session
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ error: "Unauthorized", message: "Valid session required" }, 401);
    }

    const user = session.user;
    const body = await c.req.json().catch(() => ({}));
    const { accountId } = body;

    // Find the YouTube account for this user
    const whereClause = accountId
      ? { id: `youtube_${user.id}_${accountId}` }
      : { userId: user.id, providerId: "youtube" };

    const account = await prisma.account.findFirst({
      where: whereClause,
    });

    if (!account) {
      return c.json({ error: "YouTube account not found" }, 404);
    }

    if (!account.refreshToken) {
      return c.json({ error: "No refresh token available. Please re-authenticate.", requiresReauth: true }, 401);
    }

    // Refresh the token
    const tokens = await refreshYouTubeToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update the account with new access token
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[YouTube Auth] Refresh error:", err);

    // If refresh fails, user needs to re-authenticate
    if (err.message.includes("invalid_grant") || err.message.includes("Token has been revoked")) {
      return c.json({
        error: "Refresh token expired or revoked. Please re-authenticate.",
        requiresReauth: true
      }, 401);
    }

    return c.json({ error: err.message }, 500);
  }
});

// TikTok OAuth callback - must be BEFORE the generic auth handler
// This route delegates to the tiktok routes module for callback handling
// Requirements: 1.2
app.get("/api/auth/tiktok/callback", async (c) => {
  // Import the tiktok routes and handle callback
  const tiktokModule = await import("./routes/tiktok.js");
  // The callback is handled by the tiktok routes, so we forward to it
  return tiktokModule.default.fetch(
    new Request(c.req.url.replace("/api/auth/tiktok/callback", "/auth/callback"), {
      method: c.req.method,
      headers: c.req.raw.headers,
    }),
    c.env
  );
});

// Auth routes - handle all Better Auth endpoints
app.use("/api/auth/*", authRateLimiter());
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Mount API routes
app.route("/api/admin", adminRoutes);
app.route("/api/progress", progressRoutes);
app.route("/api/uploads", uploadsRoutes);
app.route("/api/achievements", achievementsRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/videos", videosRoutes);
app.route("/api/youtube", youtubeRoutes);
app.route("/api/tiktok", tiktokRoutes);
app.route("/api/notifications", notificationsRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/beta", betaRoutes);
app.route("/api/subscription", subscriptionRoutes);

// Health check with database connection test
app.get("/api/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection error:", error.message);

    const errorResponse = {
      status: "error",
      database: "disconnected",
      error: error.message,
      code: error.code || 'UNKNOWN',
      retryable: isRetryableError(error),
    };

    return c.json(errorResponse, 500);
  }
});

// Initialize database connection with retry logic
async function initializeDatabase() {
  try {
    await connectWithRetry({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize database connection:", error.message);
    // In production, you might want to exit the process
    // For development, we'll continue and let individual requests handle the error
    if (process.env.NODE_ENV === 'production') {
      console.error("Exiting due to database connection failure in production");
      process.exit(1);
    }
    return false;
  }
}

// Start server
const port = process.env.PORT || 3000;

// Initialize database before starting server
initializeDatabase().then((connected) => {
  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
    if (!connected) {
      console.warn("Warning: Server started without database connection");
    }

    // Start scheduled uploads job if database is connected
    if (connected) {
      startScheduledUploadsJob();
    }
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  stopScheduledUploadsJob();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  stopScheduledUploadsJob();
  process.exit(0);
});

export default app;
