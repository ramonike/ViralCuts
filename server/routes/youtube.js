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

// Helper to get valid access token (refreshes if needed)
async function getValidAccessToken(userId, accountId = null) {
  const whereClause = accountId
    ? { id: `youtube_${userId}_${accountId}` }
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
    // Use user ID as state for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");
    const authUrl = getAuthUrl(state);

    return c.json({ url: authUrl });
  } catch (error) {
    console.error("[YouTube Auth] Error generating auth URL:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube Auth] Callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return c.redirect(
      `${frontendUrl}/settings?youtube_error=${encodeURIComponent(error.message)}`
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
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
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

    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube Auth] Error fetching accounts:", error);
    return c.json({ error: error.message }, 500);
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
    await prisma.account.delete({
      where: { id: account.id },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("[YouTube Auth] Error disconnecting account:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/youtube/token
 * Get current access token (refreshes if expired)
 */
youtube.get("/token", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const accountId = c.req.query("accountId");

    const whereClause = accountId
      ? { id: `youtube_${user.id}_${accountId}` }
      : { userId: user.id, providerId: "youtube" };

    const account = await prisma.account.findFirst({
      where: whereClause,
    });

    if (!account) {
      return c.json({ error: "YouTube account not found" }, 404);
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired = account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000)
      : true;

    if (isExpired && account.refreshToken) {
      // Refresh the token
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

      return c.json({
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
      });
    }

    if (!account.accessToken) {
      return c.json({ error: "No access token available" }, 401);
    }

    return c.json({
      access_token: account.accessToken,
      expires_at: account.accessTokenExpiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("[YouTube Auth] Error getting token:", error);
    return c.json({ error: error.message }, 500);
  }
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

    const {
      title,
      description,
      tags,
      categoryId,
      privacyStatus,
      publishAt,
      playlistId,
      fileSize,
      mimeType,
      accountId
    } = body;

    if (!title) {
      return c.json({ error: "Video title is required" }, 400);
    }

    if (!fileSize || fileSize <= 0) {
      return c.json({ error: "Valid file size is required" }, 400);
    }

    if (!mimeType) {
      return c.json({ error: "MIME type is required" }, 400);
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

    // Store session in database for resumption
    const uploadRecord = await prisma.upload.create({
      data: {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        sessionUri: session.sessionUri,
        fileName: title,
        fileSize: BigInt(fileSize),
        mimeType: mimeType,
        bytesUploaded: BigInt(0),
        status: "initiated",
        platform: "youtube",
        metadata: { title, description, tags, categoryId, privacyStatus, publishAt, playlistId },
      },
    });

    return c.json({
      uploadId: uploadRecord.id,
      sessionUri: session.sessionUri,
      status: session.status,
      totalBytes: session.totalBytes,
    });
  } catch (error) {
    console.error("[YouTube Upload] Initiate error:", error);
    return c.json({ error: error.message }, 500);
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
      await prisma.upload.update({
        where: { id: uploadId },
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
    console.error("[YouTube Upload] Chunk error:", error);

    // Check if error is retryable (for client-side retry)
    if (isRetryableError(error)) {
      return c.json({
        error: error.message,
        retryable: true,
        status: error.status
      }, error.status || 500);
    }

    return c.json({ error: error.message }, 500);
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
      await prisma.upload.update({
        where: { id: uploadId },
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
    console.error("[YouTube Upload] Resume error:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube] Error getting categories:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube] Error getting playlists:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube] Error uploading thumbnail:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube] Error adding to playlist:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[YouTube] Error getting scheduled uploads:", error);
    return c.json({ error: error.message }, 500);
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
    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: "scheduled",
        scheduledAt: scheduledDate,
        updatedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      upload: {
        ...updatedUpload,
        fileSize: updatedUpload.fileSize ? Number(updatedUpload.fileSize) : null,
        bytesUploaded: Number(updatedUpload.bytesUploaded),
      },
    });
  } catch (error) {
    console.error("[YouTube] Error scheduling upload:", error);
    return c.json({ error: error.message }, 500);
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
    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: {
        scheduledAt: scheduledDate,
        status: "scheduled",
        updatedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      upload: {
        ...updatedUpload,
        fileSize: updatedUpload.fileSize ? Number(updatedUpload.fileSize) : null,
        bytesUploaded: Number(updatedUpload.bytesUploaded),
      },
    });
  } catch (error) {
    console.error("[YouTube] Error rescheduling upload:", error);
    return c.json({ error: error.message }, 500);
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
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: "cancelled",
        scheduledAt: null,
        updatedAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("[YouTube] Error cancelling scheduled upload:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/youtube/upload
 * Faz upload de um arquivo de vídeo para o YouTube como privado.
 * Usa resumable upload para suportar arquivos grandes sem timeout do Render.
 * Após o upload, atualiza o registro de upload com youtubeVideoId e status="scheduled".
 */
youtube.post("/upload", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file");
    const uploadId = formData.get("uploadId");
    const title = formData.get("title") || "Sem título";
    const description = formData.get("description") || "";
    const tagsRaw = formData.get("tags") || "";
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
    const privacyStatus = formData.get("privacyStatus") || "private";
    const scheduledAt = formData.get("scheduledAt") || null;
    const accountId = formData.get("accountId") || null;

    if (!file || !uploadId) {
      return c.json({ error: "file e uploadId são obrigatórios" }, 400);
    }

    // Buscar token de acesso do YouTube para o usuário
    const whereClause = accountId
      ? { userId, id: { contains: accountId } }
      : { userId, providerId: "youtube" };

    let account = await prisma.account.findFirst({ where: whereClause });
    if (!account) {
      // Fallback: qualquer conta youtube do usuário
      account = await prisma.account.findFirst({ where: { userId, providerId: "youtube" } });
    }
    if (!account) {
      return c.json({ error: "Conta YouTube não encontrada. Reconecte sua conta." }, 401);
    }

    // Refresh token se expirado
    let accessToken = account.accessToken;
    const isExpired = account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt) < new Date(Date.now() + 2 * 60 * 1000)
      : true;

    if (isExpired && account.refreshToken) {
      console.log("[YouTube Upload] Token expirado, renovando...");
      const tokens = await refreshYouTubeToken(account.refreshToken);
      accessToken = tokens.access_token;
      await prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken: tokens.access_token,
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        },
      });
    }

    if (!accessToken) {
      return c.json({ error: "Token de acesso inválido. Reconecte sua conta YouTube." }, 401);
    }

    // Metadados do vídeo para o YouTube
    const videoMetadata = {
      snippet: { title, description, tags, categoryId: "22" },
      status: {
        privacyStatus: "private", // sempre privado no upload — job muda para público
        selfDeclaredMadeForKids: false,
      },
    };

    const fileBuffer = await file.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    const mimeType = file.type || "video/mp4";

    console.log(`[YouTube Upload] Iniciando upload: "${title}" (${Math.round(fileSize / 1024 / 1024)}MB)`);

    // ── Iniciar resumable upload session ────────────────────────────────────
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(fileSize),
        },
        body: JSON.stringify(videoMetadata),
      }
    );

    if (!initResponse.ok) {
      const err = await initResponse.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${initResponse.status}`;
      console.error("[YouTube Upload] Falha ao iniciar sessão:", msg);
      return c.json({ error: `Falha ao iniciar upload no YouTube: ${msg}` }, 502);
    }

    const uploadUrl = initResponse.headers.get("Location");
    if (!uploadUrl) {
      return c.json({ error: "YouTube não retornou URL de upload" }, 502);
    }

    // ── Enviar o arquivo ────────────────────────────────────────────────────
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(fileSize),
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok && uploadResponse.status !== 201) {
      const err = await uploadResponse.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${uploadResponse.status}`;
      console.error("[YouTube Upload] Falha ao enviar arquivo:", msg);

      // Marcar upload como falho no banco
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: "failed",
          metadata: { error: msg, failedAt: new Date().toISOString() },
          updatedAt: new Date(),
        },
      });

      return c.json({ error: `Falha no upload do arquivo: ${msg}` }, 502);
    }

    const videoData = await uploadResponse.json();
    const youtubeVideoId = videoData.id;

    console.log(`[YouTube Upload] Upload concluído! videoId: ${youtubeVideoId}`);

    // ── Atualizar registro no banco ─────────────────────────────────────────
    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: {
        youtubeVideoId,
        status: "scheduled",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        updatedAt: new Date(),
        metadata: {
          title,
          description,
          tags,
          privacyStatus,
          youtubeVideoId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    return c.json({
      success: true,
      uploadId,
      youtubeVideoId,
      status: "scheduled",
      videoUrl: `https://youtube.com/watch?v=${youtubeVideoId}`,
      upload: {
        ...updatedUpload,
        fileSize: updatedUpload.fileSize ? Number(updatedUpload.fileSize) : null,
        bytesUploaded: updatedUpload.bytesUploaded ? Number(updatedUpload.bytesUploaded) : 0,
      },
    });
  } catch (error) {
    console.error("[YouTube Upload] Erro inesperado:", error);
    return c.json({ error: error.message || "Erro interno no upload" }, 500);
  }
});

export default youtube;