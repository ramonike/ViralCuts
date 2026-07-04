/**
 * YouTube OAuth and Upload Routes
 * Requirements: 1.2, 1.3, 1.4
 */

import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getAuthUrl,
  exchangeCode,
  refreshToken as refreshYouTubeToken,
  revokeToken,
} from "../services/youtube-auth.js";
import { consumeOAuthState, issueOAuthState } from "../services/oauth-state.js";
import { sendError } from "../utils/http-error.js";
import {
  initiateUpload,
  uploadChunk,
  resumeUpload,
  uploadThumbnail,
  addToPlaylist,
  getVideoCategories,
  getUserPlaylists,
  uploadChunkWithRetry,
  isRetryableError,
} from "../services/youtube-upload.js";

const youtube = new Hono();

function getPublicOAuthErrorMessage() {
  return "Falha ao conectar conta YouTube";
}

function isLegacyBrowserTokenUploadEnabled() {
  return process.env.ALLOW_LEGACY_BROWSER_YOUTUBE_TOKEN === "true";
}

// Helper to get valid access token (refreshes if needed)
async function getValidAccessToken(userId, accountId = null) {
  const whereClause = accountId
    ? {
        userId,
        providerId: "youtube",
        OR: [
          { id: accountId },
          { id: `youtube_${userId}_${accountId}` },
          { accountId },
        ],
      }
    : { userId, providerId: "youtube" };

  const account = await prisma.account.findFirst({ where: whereClause });

  if (!account) {
    throw new Error("YouTube account not found");
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const isExpired = account.accessTokenExpiresAt
    ? new Date(account.accessTokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000)
    : true;

  if (isExpired && account.refreshToken) {
    const tokens = await refreshYouTubeToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    return tokens.access_token;
  }

  if (!account.accessToken) {
    throw new Error("No access token available");
  }

  return account.accessToken;
}

/**
 * GET /api/youtube/auth/url
 * Get OAuth authorization URL for YouTube
 */
youtube.get("/auth/url", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const state = issueOAuthState(c, "youtube", { userId: user.id });
    const authUrl = getAuthUrl(state);

    return c.json({ url: authUrl });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Auth] URL", error, message: "Failed to generate auth URL" });
  }
});

/**
 * GET /api/youtube/auth/callback
 * OAuth callback endpoint - exchanges code for tokens and saves to database
 * Requirements: 1.2, 1.4
 */
youtube.get("/auth/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    if (error) {
      console.error("[YouTube Auth] OAuth error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const publicError = getPublicOAuthErrorMessage();
      return c.redirect(`${frontendUrl}/settings?youtube_error=${encodeURIComponent(publicError)}`);
    }

    if (!code) {
      return c.json({ error: "Missing authorization code" }, 400);
    }

    const stateData = consumeOAuthState(c, "youtube", state);
    const userId = stateData?.userId;

    if (!userId) {
      return c.json({ error: "Invalid or expired state parameter" }, 400);
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
        idToken: channel.snippet.title,  // ← nome do canal
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
        idToken: channel.snippet.title,  // ← nome do canal
      },
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return c.redirect(
      `${frontendUrl}/settings?youtube_connected=true&channel=${encodeURIComponent(channel.snippet.title)}`
    );
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const publicError = getPublicOAuthErrorMessage();
    return c.redirect(
      `${frontendUrl}/settings?youtube_error=${encodeURIComponent(publicError)}`
    );
  }
});

/**
 * POST /api/youtube/auth/refresh
 * Refresh access token using stored refresh token
 * Requirements: 1.3, 1.4
 */
youtube.post("/auth/refresh", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
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
      return c.json({ error: "No refresh token available. Please re-authenticate." }, 401);
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
  } catch (error) {
    console.error("[YouTube Auth] Refresh error:", error);

    // If refresh fails, user needs to re-authenticate
    if (error.message.includes("invalid_grant") || error.message.includes("Token has been revoked")) {
      return c.json({
        error: "Refresh token expired or revoked. Please re-authenticate.",
        requiresReauth: true
      }, 401);
    }

    return sendError(c, { scope: "[YouTube Auth] Refresh", error, message: "Failed to refresh YouTube account" });
  }
});

/**
 * GET /api/youtube/accounts
 * Get all connected YouTube accounts for the user
 */
youtube.get("/accounts", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
        providerId: "youtube",
      },
      select: {
        id: true,
        accountId: true,
        accessTokenExpiresAt: true,
        scope: true,
        createdAt: true,
      },
    });

    // Check if tokens are expired
    const accountsWithStatus = accounts.map((account) => ({
      ...account,
      isExpired: account.accessTokenExpiresAt
        ? new Date(account.accessTokenExpiresAt) < new Date()
        : true,
    }));

    return c.json({ accounts: accountsWithStatus });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Auth] Accounts", error, message: "Failed to fetch YouTube accounts" });
  }
});

/**
 * DELETE /api/youtube/accounts/:accountId
 * Disconnect a YouTube account
 */
youtube.delete("/accounts/:accountId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const accountId = c.req.param("accountId");

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        userId: user.id,
        providerId: "youtube",
      },
    });

    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Revoke the token if we have one
    if (account.refreshToken) {
      try {
        await revokeToken(account.refreshToken);
      } catch (revokeError) {
        console.warn("[YouTube Auth] Failed to revoke token:", revokeError);
        // Continue with deletion even if revoke fails
      }
    }

    // Delete the account
    await prisma.account.deleteMany({
      where: { id: account.id, userId: user.id, providerId: "youtube" },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Auth] Disconnect", error, message: "Failed to disconnect YouTube account" });
  }
});

/**
 * GET /api/youtube/token
 * Get current access token (refreshes if expired)
 */
youtube.get("/token", authMiddleware, async (c) => {
  return c.json({
    error: "This endpoint is deprecated and no longer returns OAuth access tokens.",
    requiresReauth: false,
  }, 410);
});

/**
 * POST /api/youtube/upload/initiate
 * Initiate a resumable upload session
 * Requirements: 2.1
 */
youtube.post("/upload/initiate", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const uploadId = body.uploadId || null;
    const title = body.title || body.snippet?.title;
    const description = body.description ?? body.snippet?.description ?? "";
    const tags = body.tags ?? body.snippet?.tags ?? [];
    const categoryId = body.categoryId || body.snippet?.categoryId || "22";
    const privacyStatus = body.privacyStatus || body.status?.privacyStatus || "private";
    const publishAt = body.publishAt || body.status?.publishAt || null;
    const playlistId = body.playlistId || null;
    const fileSize = body.fileSize;
    const mimeType = body.mimeType;
    const accountId = body.accountId || null;

    if (!title) {
      return c.json({ error: "Video title is required", code: "YOUTUBE_UPLOAD_TITLE_REQUIRED" }, 400);
    }

    if (!fileSize || fileSize <= 0) {
      return c.json({ error: "Valid file size is required", code: "YOUTUBE_UPLOAD_FILE_SIZE_REQUIRED" }, 400);
    }

    if (!mimeType) {
      return c.json({ error: "MIME type is required", code: "YOUTUBE_UPLOAD_MIME_TYPE_REQUIRED" }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Initiate upload session
    const session = await initiateUpload(
      { title, description, tags, categoryId, privacyStatus, publishAt, playlistId },
      fileSize,
      mimeType,
      accessToken
    );

    const uploadData = {
      sessionUri: session.sessionUri,
      fileName: title,
      fileSize: BigInt(fileSize),
      mimeType: mimeType,
      bytesUploaded: BigInt(0),
      status: "initiated",
      platform: "youtube",
      metadata: { title, description, tags, categoryId, privacyStatus, publishAt, playlistId, accountId },
    };

    const existingUpload = uploadId
      ? await prisma.upload.findFirst({ where: { id: uploadId, userId: user.id } })
      : null;

    const uploadRecord = existingUpload
      ? await prisma.upload.update({
          where: { id: existingUpload.id },
          data: uploadData,
        })
      : await prisma.upload.create({
          data: {
            id: `upload_${Date.now()}_${crypto.randomUUID()}`,
            userId: user.id,
            ...uploadData,
          },
        });

    return c.json({
      uploadId: uploadRecord.id,
      sessionUri: session.sessionUri,
      status: session.status,
      totalBytes: session.totalBytes,
    });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Upload] Initiate", error, message: "Failed to initiate upload" });
  }
});

/**
 * POST /api/youtube/upload/chunk
 * Upload a chunk of the video file
 * Requirements: 2.2, 2.4
 */
youtube.post("/upload/chunk", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const contentRange = c.req.header("Content-Range");
    const uploadId = c.req.header("X-Upload-Id");
    const sessionUri = c.req.header("X-Session-Uri");
    const accountId = c.req.header("X-Account-Id");
    const useRetry = c.req.header("X-Use-Retry") !== "false"; // Default to true

    if (!sessionUri) {
      return c.json({ error: "Session URI is required (X-Session-Uri header)" }, 400);
    }

    // Parse Content-Range header: bytes startByte-endByte/totalBytes
    let startByte = 0;
    let totalBytes = 0;

    if (contentRange) {
      const match = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
      if (match) {
        startByte = parseInt(match[1], 10);
        totalBytes = parseInt(match[3], 10);
      }
    }

    // Get chunk data from request body
    const chunk = Buffer.from(await c.req.arrayBuffer());

    if (chunk.length === 0) {
      return c.json({ error: "Chunk data is required" }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Upload chunk with or without retry based on header
    let progress;
    let retryAttempts = 0;

    if (useRetry) {
      progress = await uploadChunkWithRetry(
        sessionUri,
        chunk,
        startByte,
        totalBytes,
        accessToken,
        {
          onRetry: ({ attempt }) => {
            retryAttempts = attempt;
            console.log(`[YouTube Upload] Retry attempt ${attempt} for chunk at byte ${startByte}`);
          },
        }
      );
    } else {
      progress = await uploadChunk(sessionUri, chunk, startByte, totalBytes, accessToken);
    }

    // Update upload record if we have an uploadId
    if (uploadId) {
      await prisma.upload.updateMany({
        where: { id: uploadId, userId: user.id, platform: "youtube" },
        data: {
          bytesUploaded: BigInt(progress.bytesUploaded),
          status: progress.status,
          youtubeVideoId: progress.videoId,
          updatedAt: new Date(),
        },
      }).catch(() => {
        // Ignore if upload record doesn't exist
      });
    }

    return c.json({
      status: progress.status,
      bytesUploaded: progress.bytesUploaded,
      totalBytes: progress.totalBytes,
      progress: progress.progress,
      videoId: progress.videoId,
      retryAttempts,
    });
  } catch (error) {
    // Check if error is retryable (for client-side retry)
    if (isRetryableError(error)) {
      return c.json({
        error: "Upload chunk failed",
        retryable: true,
        status: error.status
      }, error.status || 500);
    }

    return sendError(c, { scope: "[YouTube Upload] Chunk", error, message: "Failed to upload video chunk" });
  }
});

/**
 * POST /api/youtube/upload/resume
 * Resume an interrupted upload
 * Requirements: 2.3
 */
youtube.post("/upload/resume", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { uploadId, sessionUri, totalBytes, accountId } = body;

    if (!sessionUri) {
      return c.json({ error: "Session URI is required" }, 400);
    }

    if (!totalBytes) {
      return c.json({ error: "Total bytes is required" }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Check upload status
    const progress = await resumeUpload(sessionUri, totalBytes, accessToken);

    // Update upload record if we have an uploadId
    if (uploadId) {
      await prisma.upload.updateMany({
        where: { id: uploadId, userId: user.id, platform: "youtube" },
        data: {
          bytesUploaded: BigInt(progress.bytesUploaded),
          status: progress.status,
          youtubeVideoId: progress.videoId,
          updatedAt: new Date(),
        },
      }).catch(() => {
        // Ignore if upload record doesn't exist
      });
    }

    return c.json({
      status: progress.status,
      bytesUploaded: progress.bytesUploaded,
      totalBytes: progress.totalBytes,
      progress: progress.progress,
      resumeFrom: progress.resumeFrom,
      videoId: progress.videoId,
      error: progress.error,
    });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Upload] Resume", error, message: "Failed to resume upload" });
  }
});

/**
 * GET /api/youtube/categories
 * Get video categories
 */
youtube.get("/categories", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const regionCode = c.req.query("regionCode") || "US";
    const accountId = c.req.query("accountId");

    const accessToken = await getValidAccessToken(user.id, accountId);
    const categories = await getVideoCategories(regionCode, accessToken);

    return c.json({ categories });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Categories", error, message: "Failed to fetch video categories" });
  }
});

/**
 * GET /api/youtube/playlists
 * Get user's playlists
 */
youtube.get("/playlists", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const accountId = c.req.query("accountId");

    const accessToken = await getValidAccessToken(user.id, accountId);
    const playlists = await getUserPlaylists(accessToken);

    return c.json({ playlists });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Playlists", error, message: "Failed to fetch playlists" });
  }
});

/**
 * POST /api/youtube/thumbnail
 * Upload thumbnail for a video
 */
youtube.post("/thumbnail", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const videoId = c.req.header("X-Video-Id");
    const accountId = c.req.header("X-Account-Id");
    const contentType = c.req.header("Content-Type");

    if (!videoId) {
      return c.json({ error: "Video ID is required (X-Video-Id header)" }, 400);
    }

    const imageData = Buffer.from(await c.req.arrayBuffer());

    if (imageData.length === 0) {
      return c.json({ error: "Image data is required" }, 400);
    }

    const accessToken = await getValidAccessToken(user.id, accountId);
    const result = await uploadThumbnail(videoId, imageData, contentType, accessToken);

    return c.json(result);
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Thumbnail", error, message: "Failed to upload thumbnail" });
  }
});

/**
 * POST /api/youtube/playlist/add
 * Add video to playlist
 */
youtube.post("/playlist/add", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { videoId, playlistId, accountId } = body;

    if (!videoId) {
      return c.json({ error: "Video ID is required" }, 400);
    }

    if (!playlistId) {
      return c.json({ error: "Playlist ID is required" }, 400);
    }

    const accessToken = await getValidAccessToken(user.id, accountId);
    const result = await addToPlaylist(videoId, playlistId, accessToken);

    return c.json(result);
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Playlist add", error, message: "Failed to add video to playlist" });
  }
});

/**
 * GET /api/youtube/scheduled
 * Get scheduled uploads for the current user
 * Requirements: 4.5
 */
youtube.get("/scheduled", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "50", 10);
    const includeAll = c.req.query("includeAll") === "true";

    const whereClause = {
      userId: user.id,
      platform: "youtube",
    };

    if (!includeAll) {
      whereClause.status = "scheduled";
      whereClause.scheduledAt = { gte: new Date() };
    }

    const uploads = await prisma.upload.findMany({
      where: whereClause,
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });

    // Convert BigInt to number for JSON serialization
    const serializedUploads = uploads.map((upload) => ({
      ...upload,
      fileSize: upload.fileSize ? Number(upload.fileSize) : null,
      bytesUploaded: Number(upload.bytesUploaded),
    }));

    return c.json({ uploads: serializedUploads });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Scheduled uploads", error, message: "Failed to fetch scheduled uploads" });
  }
});

/**
 * POST /api/youtube/schedule
 * Schedule an upload for future publication
 * Requirements: 4.1, 4.4
 */
youtube.post("/schedule", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { uploadId, scheduledAt } = body;

    if (!uploadId) {
      return c.json({ error: "Upload ID is required" }, 400);
    }

    if (!scheduledAt) {
      return c.json({ error: "Scheduled time is required" }, 400);
    }

    const scheduledDate = new Date(scheduledAt);

    // Validate scheduled time is in the future
    if (scheduledDate <= new Date()) {
      return c.json({ error: "Scheduled time must be in the future" }, 400);
    }

    // Verify upload belongs to user
    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id },
    });

    if (!upload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    // Update upload with scheduled time
    await prisma.upload.updateMany({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
      data: {
        status: "scheduled",
        scheduledAt: scheduledDate,
        updatedAt: new Date(),
      },
    });

    const updatedUpload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
    });

    if (!updatedUpload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    return c.json({
      success: true,
      upload: {
        ...updatedUpload,
        fileSize: updatedUpload.fileSize ? Number(updatedUpload.fileSize) : null,
        bytesUploaded: Number(updatedUpload.bytesUploaded),
      },
    });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Schedule", error, message: "Failed to schedule upload" });
  }
});

/**
 * PUT /api/youtube/schedule/:uploadId
 * Reschedule an upload
 * Requirements: 4.4
 */
youtube.put("/schedule/:uploadId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const uploadId = c.req.param("uploadId");
    const body = await c.req.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return c.json({ error: "New scheduled time is required" }, 400);
    }

    const scheduledDate = new Date(scheduledAt);

    // Validate scheduled time is in the future
    if (scheduledDate <= new Date()) {
      return c.json({ error: "Scheduled time must be in the future" }, 400);
    }

    // Verify upload belongs to user and is scheduled
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: user.id,
        status: { in: ["scheduled", "initiated", "complete"] },
      },
    });

    if (!upload) {
      return c.json({ error: "Scheduled upload not found" }, 404);
    }

    // Update scheduled time
    await prisma.upload.updateMany({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
      data: {
        scheduledAt: scheduledDate,
        status: "scheduled",
        updatedAt: new Date(),
      },
    });

    const updatedUpload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
    });

    if (!updatedUpload) {
      return c.json({ error: "Scheduled upload not found" }, 404);
    }

    return c.json({
      success: true,
      upload: {
        ...updatedUpload,
        fileSize: updatedUpload.fileSize ? Number(updatedUpload.fileSize) : null,
        bytesUploaded: Number(updatedUpload.bytesUploaded),
      },
    });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Reschedule", error, message: "Failed to reschedule upload" });
  }
});

/**
 * DELETE /api/youtube/schedule/:uploadId
 * Cancel a scheduled upload
 * Requirements: 4.4
 */
youtube.delete("/schedule/:uploadId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const uploadId = c.req.param("uploadId");

    // Verify upload belongs to user
    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id },
    });

    if (!upload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    // Update status to cancelled
    await prisma.upload.updateMany({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
      data: {
        status: "cancelled",
        scheduledAt: null,
        updatedAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[YouTube] Cancel schedule", error, message: "Failed to cancel scheduled upload" });
  }
});

/**
 * POST /api/youtube/upload-init
 * Inicia uma sessão de upload resumable no YouTube e retorna a URL.
 * O browser faz o upload diretamente para o Google — evita timeout do Render.
 */
youtube.post("/upload-init", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { uploadId, title, description, tags = [], privacyStatus = "private", scheduledAt, accountId, fileSize, mimeType = "video/mp4", accessToken: clientAccessToken } = body;

    if (!uploadId || !fileSize) {
      return c.json({ error: "uploadId e fileSize são obrigatórios" }, 400);
    }

    if (clientAccessToken && !isLegacyBrowserTokenUploadEnabled()) {
      return c.json({
        error: "Legacy browser token upload is disabled.",
        code: "LEGACY_BROWSER_TOKEN_UPLOAD_DISABLED",
      }, 410);
    }

    let accessToken = clientAccessToken || null;

    // Se o frontend já enviou o accessToken (caso normal com múltiplas contas),
    // usa direto — cada connectedAccount tem seu próprio token client-side.
    // Só busca no banco se não veio token no body (fallback para compatibilidade).
    if (!accessToken) {
      let account = accountId
        ? await prisma.account.findFirst({ where: { userId, id: { contains: accountId } } })
        : null;
      if (!account) {
        account = await prisma.account.findFirst({ where: { userId, providerId: "youtube" } });
      }
      if (!account) return c.json({ error: "Conta YouTube não encontrada" }, 401);

      accessToken = account.accessToken;
      const isExpired = account.accessTokenExpiresAt
        ? new Date(account.accessTokenExpiresAt) < new Date(Date.now() + 2 * 60 * 1000)
        : true;

      if (isExpired && account.refreshToken) {
        const tokens = await refreshYouTubeToken(account.refreshToken);
        accessToken = tokens.access_token;
        await prisma.account.update({
          where: { id: account.id },
          data: { accessToken: tokens.access_token, accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000), updatedAt: new Date() },
        });
      }
    }

    if (!accessToken) return c.json({ error: "Token inválido. Reconecte sua conta YouTube." }, 401);

    // Iniciar sessão resumable no YouTube
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(fileSize),
        },
        body: JSON.stringify({
          snippet: { title, description, tags, categoryId: "22" },
          status: { privacyStatus: "private", selfDeclaredMadeForKids: false },
        }),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      console.error("[YouTube Upload Init] YouTube rejected legacy upload", {
        status: initRes.status,
        message: err.error?.message,
      });
      return c.json({ error: "YouTube rejeitou o upload." }, 502);
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) return c.json({ error: "YouTube não retornou URL de upload" }, 502);

    console.log(`[YouTube Upload Init] uploadId=${uploadId} sessionUrl obtida`);

    return c.json({ uploadUrl, uploadId });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Upload] Legacy init", error, message: "Failed to initialize legacy upload" });
  }
});

/**
 * POST /api/youtube/upload-complete
 * Chamado pelo frontend após o upload direto terminar.
 * Salva o youtubeVideoId no registro de upload.
 */
youtube.post("/upload-complete", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const { uploadId, youtubeVideoId, scheduledAt, title, description, tags = [], privacyStatus } = await c.req.json();

    if (!uploadId || !youtubeVideoId) {
      return c.json({ error: "uploadId e youtubeVideoId são obrigatórios" }, 400);
    }

    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: user.id,
        platform: "youtube",
      },
    });

    if (!upload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    await prisma.upload.updateMany({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
      data: {
        youtubeVideoId,
        status: "scheduled",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        updatedAt: new Date(),
        metadata: {
          ...(upload.metadata || {}),
          title,
          description,
          tags,
          privacyStatus,
          youtubeVideoId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    const updated = await prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id, platform: "youtube" },
    });

    if (!updated) {
      return c.json({ error: "Upload not found" }, 404);
    }

    console.log(`[YouTube Upload Complete] uploadId=${uploadId} youtubeVideoId=${youtubeVideoId}`);

    return c.json({
      success: true,
      uploadId,
      youtubeVideoId,
      status: "scheduled",
      upload: { ...updated, fileSize: updated.fileSize ? Number(updated.fileSize) : null, bytesUploaded: updated.bytesUploaded ? Number(updated.bytesUploaded) : 0 },
    });
  } catch (error) {
    return sendError(c, { scope: "[YouTube Upload] Complete", error, message: "Failed to finalize upload" });
  }
});
export default youtube;
