import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth.js";
import { prisma, connectWithRetry, isRetryableError } from "./db/prisma.js";
import { rateLimiter, authRateLimiter } from "./middleware/rate-limit.js";
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
import commandCenterRoutes from "./routes/commandCenter.js";
import aiRoutes from "./routes/ai.js";
import betaRoutes from "./routes/beta.js";

// Import scheduled jobs
import { startScheduledUploadsJob, stopScheduledUploadsJob } from "./jobs/scheduled-uploads.js";

const app = new Hono();

// Security headers
app.use("/*", secureHeaders());

// CORS middleware
app.use("/*", cors({
  origin: (origin) => {
    const allowed = [
      "https://viral-cuts-20.vercel.app",
      "https://viral-cuts-20-git-main-ramons-projects-9aa5c4f1.vercel.app",
      "http://localhost:5173",
    ];
    return allowed.includes(origin) ? origin : null;
  },
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
app.use("/api/command-center/*", rateLimiter());
app.use("/api/health", rateLimiter());

// YouTube OAuth callback - must be BEFORE the generic auth handler
// This route is handled separately because it's not part of Better Auth
app.get("/api/auth/youtube/callback", async (c) => {
  // Import and call the callback handler directly
  const { exchangeCode } = await import("./services/youtube-auth.js");

  try {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    if (error) {
      console.error("[YouTube Auth] OAuth error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return c.redirect(`${frontendUrl}/settings?youtube_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return c.json({ error: "Missing authorization code" }, 400);
    }

    // Decode state to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      userId = stateData.userId;
    } catch {
      return c.json({ error: "Invalid state parameter" }, 400);
    }

    if (!userId) {
      return c.json({ error: "Missing user ID in state" }, 400);
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    // Get YouTube channel info to use as accountId
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      throw new Error("Failed to fetch YouTube channel info");
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      throw new Error("No YouTube channel found for this account");
    }

    const accountId = channel.id;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert account - update if exists, create if not
    await prisma.account.upsert({
      where: {
        id: `youtube_${userId}_${accountId}`,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: expiresAt,
        scope: tokens.scope,
        updatedAt: new Date(),
      },
      create: {
        id: `youtube_${userId}_${accountId}`,
        accountId: accountId,
        providerId: "youtube",
        userId: userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: expiresAt,
        scope: tokens.scope,
      },
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return c.redirect(
      `${frontendUrl}/settings?youtube_connected=true&channel=${encodeURIComponent(channel.snippet.title)}`
    );
  } catch (err) {
    console.error("[YouTube Auth] Callback error:", err);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return c.redirect(
      `${frontendUrl}/settings?youtube_error=${encodeURIComponent(err.message)}`
    );
  }
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
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
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
app.route("/api/command-center", commandCenterRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/beta", betaRoutes);

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
