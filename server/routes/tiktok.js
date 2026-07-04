/**
 * TikTok OAuth and Upload Routes
 * Requirements: 1.2, 1.3
 */

import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getAuthUrl,
  exchangeCode,
  refreshToken as refreshTikTokToken,
  revokeToken,
  getUserInfo,
  getCreatorInfo,
  uploadVideo,
  getPublishStatus,
  waitForPublish,
  validateVideoMetadata,
} from "../services/platforms/tiktok.js";
import { consumeOAuthState, issueOAuthState, updateOAuthState } from "../services/oauth-state.js";
import { sendError } from "../utils/http-error.js";

const tiktok = new Hono();

function getPublicOAuthErrorMessage() {
  return "Falha ao conectar conta TikTok";
}

// Helper to get valid access token (refreshes if needed)
async function getValidAccessToken(userId, accountId = null) {
  if (!accountId) {
    const account = await prisma.account.findFirst({ where: { userId, providerId: "tiktok" } });
    if (!account) throw new Error("TikTok account not found");
    return getTokenWithRefresh(account);
  }

  // accountId may be bare openId or prefixed (tiktok_...)
  const bareId = accountId.startsWith('tiktok_') ? accountId.slice(7) : accountId;

  let account = await prisma.account.findFirst({
    where: { id: `tiktok_${userId}_${bareId}` },
  });

  // Fallback: try with userId prefix (legacy format from ScheduleVideoModal)
  if (!account) {
    account = await prisma.account.findFirst({
      where: { id: `tiktok_${userId}_${accountId}` },
    });
  }

  if (!account) {
    throw new Error("TikTok account not found");
  }

  return getTokenWithRefresh(account);
}

async function getTokenWithRefresh(account) {
  const isExpired = account.accessTokenExpiresAt
    ? new Date(account.accessTokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000)
    : true;

  if (isExpired && account.refreshToken) {
    const tokens = await refreshTikTokToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
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
 * GET /api/tiktok/auth/url
 * Get OAuth authorization URL for TikTok
 * Requirements: 1.2
 */
tiktok.get("/auth/url", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const state = issueOAuthState(c, "tiktok", { userId: user.id });

    const { url, codeVerifier } = await getAuthUrl(state);
    updateOAuthState(state, { codeVerifier });

    return c.json({ url });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Auth] URL", error, message: "Failed to generate auth URL" });
  }
});

/**
 * GET /api/auth/tiktok/callback
 * OAuth callback endpoint - exchanges code for tokens and saves to database
 * Requirements: 1.2
 */
tiktok.get("/auth/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (error) {
      console.error("[TikTok Auth] OAuth error:", error, errorDescription);
      const publicError = getPublicOAuthErrorMessage();
      c.res.headers.set('Content-Type', 'text/html; charset=utf-8');
      return c.html(`
<!DOCTYPE html>
<html><body><script>
  if (window.opener) {
    window.opener.postMessage({ type: 'tiktok_error', error: '${publicError}' }, '*');
    setTimeout(function(){ window.close(); }, 200);
  } else {
    window.location.href = '${frontendUrl}/dashboard/settings?tiktok_error=${encodeURIComponent(publicError)}';
  }
<\/script></body></html>
      `);
    }

    if (!code) {
      return c.json({ error: "Missing authorization code" }, 400);
    }

    if (!state) {
      return c.json({ error: "Missing state parameter" }, 400);
    }

    const storedData = consumeOAuthState(c, "tiktok", state);
    if (!storedData) {
      return c.json({ error: "Invalid or expired state parameter. Please try again." }, 400);
    }

    const { codeVerifier, userId } = storedData;

    // Exchange code for tokens
    const tokens = await exchangeCode(code, codeVerifier);

    // Get TikTok user info
    const userInfo = await getUserInfo(tokens.access_token);

    const accountId = tokens.open_id || userInfo.open_id;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const refreshExpiresAt = tokens.refresh_expires_in
      ? new Date(Date.now() + tokens.refresh_expires_in * 1000)
      : null;

    // Upsert account - update if exists, create if not
    await prisma.account.upsert({
      where: {
        id: `tiktok_${userId}_${accountId}`,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: expiresAt,
        refreshTokenExpiresAt: refreshExpiresAt,
        scope: tokens.scope,
        displayName: userInfo.display_name,
        username: userInfo.username || null,
        avatarUrl: userInfo.avatar_url,
        bioDescription: userInfo.bio_description,
        followerCount: userInfo.follower_count,
        followingCount: userInfo.following_count,
        likesCount: userInfo.likes_count,
        videoCount: userInfo.video_count,
        updatedAt: new Date(),
      },
      create: {
        id: `tiktok_${userId}_${accountId}`,
        accountId: accountId,
        providerId: "tiktok",
        userId: userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: expiresAt,
        refreshTokenExpiresAt: refreshExpiresAt,
        scope: tokens.scope,
        displayName: userInfo.display_name,
        username: userInfo.username || null,
        avatarUrl: userInfo.avatar_url,
        bioDescription: userInfo.bio_description,
        followerCount: userInfo.follower_count,
        followingCount: userInfo.following_count,
        likesCount: userInfo.likes_count,
        videoCount: userInfo.video_count,
      },
    });

    // Return HTML that posts message to parent and closes popup
    const displayName = userInfo.display_name || "TikTok User";
    c.res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return c.html(`
<!DOCTYPE html>
<html><body><script>
  if (window.opener) {
    window.opener.postMessage({ type: 'tiktok_connected', account: '${displayName.replace(/'/g, "\\'")}' }, '*');
    setTimeout(function(){ window.close(); }, 200);
    document.body.innerHTML = '<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333">Conectado! Feche esta janela.</p>';
  } else {
    window.location.href = '${frontendUrl}/dashboard/settings?tiktok_connected=true&account=${encodeURIComponent(displayName)}';
  }
<\/script></body></html>
    `);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const publicError = getPublicOAuthErrorMessage();
    // Return HTML that posts error to parent and closes popup
    c.res.headers.set('Content-Type', 'text/html; charset=utf-8');
    return c.html(`
<!DOCTYPE html>
<html><body><script>
  if (window.opener) {
    window.opener.postMessage({ type: 'tiktok_error', error: '${publicError}' }, '*');
    setTimeout(function(){ window.close(); }, 200);
    document.body.innerHTML = '<p style="font-family:sans-serif;text-align:center;padding:40px;color:#c00">${publicError}</p>';
  } else {
    window.location.href = '${frontendUrl}/dashboard/settings?tiktok_error=${encodeURIComponent(publicError)}';
  }
<\/script></body></html>
    `);
  }
});


/**
 * POST /api/tiktok/auth/refresh
 * Refresh access token using stored refresh token
 * Requirements: 1.2
 */
tiktok.post("/auth/refresh", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json().catch(() => ({}));
    const { accountId } = body;

    // Find the TikTok account for this user
    const whereClause = accountId
      ? { id: `tiktok_${user.id}_${accountId}` }
      : { userId: user.id, providerId: "tiktok" };

    const account = await prisma.account.findFirst({
      where: whereClause,
    });

    if (!account) {
      return c.json({ error: "TikTok account not found" }, 404);
    }

    if (!account.refreshToken) {
      return c.json({ error: "No refresh token available. Please re-authenticate.", requiresReauth: true }, 401);
    }

    // Refresh the token
    const tokens = await refreshTikTokToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const refreshExpiresAt = tokens.refresh_expires_in
      ? new Date(Date.now() + tokens.refresh_expires_in * 1000)
      : null;

    // Update the account with new tokens (TikTok returns new refresh token)
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: expiresAt,
        refreshTokenExpiresAt: refreshExpiresAt,
        updatedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      expires_at: expiresAt.toISOString(),
      refresh_expires_at: refreshExpiresAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("[TikTok Auth] Refresh error:", error);

    // If refresh fails, user needs to re-authenticate
    if (error.message.includes("invalid_grant") || error.message.includes("expired")) {
      return c.json({
        error: "Refresh token expired or revoked. Please re-authenticate.",
        requiresReauth: true
      }, 401);
    }

    return sendError(c, { scope: "[TikTok Auth] Refresh", error, message: "Failed to refresh TikTok account" });
  }
});

/**
 * GET /api/tiktok/accounts
 * Get all connected TikTok accounts for the user
 */
tiktok.get("/accounts", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
        providerId: "tiktok",
      },
      select: {
        id: true,
        accountId: true,
        accessTokenExpiresAt: true,
        refreshTokenExpiresAt: true,
        scope: true,
        createdAt: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bioDescription: true,
        followerCount: true,
        followingCount: true,
        likesCount: true,
        videoCount: true,
      },
    });

    // Check if tokens are expired
    const accountsWithStatus = accounts.map((account) => ({
      ...account,
      isExpired: account.accessTokenExpiresAt
        ? new Date(account.accessTokenExpiresAt) < new Date()
        : true,
      refreshExpired: account.refreshTokenExpiresAt
        ? new Date(account.refreshTokenExpiresAt) < new Date()
        : false,
    }));

    return c.json({ accounts: accountsWithStatus });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Auth] Accounts", error, message: "Failed to fetch TikTok accounts" });
  }
});

/**
 * DELETE /api/tiktok/accounts/:accountId
 * Disconnect a TikTok account
 */
tiktok.delete("/accounts/:accountId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const accountId = c.req.param("accountId");

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        userId: user.id,
        providerId: "tiktok",
      },
    });

    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Revoke the token if we have one
    if (account.accessToken) {
      try {
        await revokeToken(account.accessToken);
      } catch (revokeError) {
        console.warn("[TikTok Auth] Failed to revoke token:", revokeError);
        // Continue with deletion even if revoke fails
      }
    }

    // Delete the account
    await prisma.account.deleteMany({
      where: { id: account.id, userId: user.id, providerId: "tiktok" },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Auth] Disconnect", error, message: "Failed to disconnect TikTok account" });
  }
});


/**
 * GET /api/tiktok/creator-info
 * Get creator info including posting permissions and limits
 */
tiktok.get("/creator-info", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const accountId = c.req.query("accountId");

    const accessToken = await getValidAccessToken(user.id, accountId);
    const creatorInfo = await getCreatorInfo(accessToken);

    return c.json({ creatorInfo });
  } catch (error) {
    return sendError(c, { scope: "[TikTok] Creator info", error, message: "Failed to fetch creator info" });
  }
});

/**
 * POST /api/tiktok/upload
 * Upload a video to TikTok
 * Requirements: 1.3
 */
tiktok.post("/upload", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const contentType = c.req.header("Content-Type");
    const accountId = c.req.header("X-Account-Id");

    // Get metadata from headers (URI-encoded JSON)
    const metadataHeader = c.req.header("X-Video-Metadata");
    let metadata = {};

    if (metadataHeader) {
      try {
        metadata = JSON.parse(decodeURIComponent(metadataHeader));
      } catch {
        return c.json({ error: "Invalid X-Video-Metadata header (must be valid JSON)" }, 400);
      }
    }

    // Get video data from request body
    const videoData = Buffer.from(await c.req.arrayBuffer());

    if (videoData.length === 0) {
      return c.json({ error: "Video data is required" }, 400);
    }

    // Validate metadata
    try {
      validateVideoMetadata(metadata, videoData.length);
    } catch (validationError) {
      return c.json({ error: validationError.message }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Create upload record
    const uploadRecord = await prisma.upload.create({
      data: {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        userId: user.id,
        fileName: metadata.title || "TikTok Video",
        fileSize: BigInt(videoData.length),
        mimeType: contentType || "video/mp4",
        bytesUploaded: BigInt(0),
        status: "uploading",
        platform: "tiktok",
        metadata: metadata,
      },
    });

    // Upload video
    const result = await uploadVideo(videoData, metadata, accessToken, {
      onProgress: async (bytesUploaded, totalBytes, status) => {
        // Update upload record with progress
        await prisma.upload.updateMany({
          where: { id: uploadRecord.id, userId: user.id, platform: "tiktok" },
          data: {
            bytesUploaded: BigInt(bytesUploaded),
            status: status === "processing" ? "processing" : "uploading",
            updatedAt: new Date(),
          },
        }).catch(() => { });
      },
    });

    // Update upload record with publish ID
    await prisma.upload.updateMany({
      where: { id: uploadRecord.id, userId: user.id, platform: "tiktok" },
      data: {
        status: "processing",
        metadata: {
          ...metadata,
          publishId: result.publishId,
        },
        updatedAt: new Date(),
      },
    });

    return c.json({
      uploadId: uploadRecord.id,
      publishId: result.publishId,
      status: result.status,
      bytesUploaded: result.bytesUploaded,
      totalBytes: result.totalBytes,
      message: result.message,
    });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Upload]", error, message: "Failed to upload video to TikTok" });
  }
});

/**
 * GET /api/tiktok/status/:publishId
 * Get the publish status of an uploaded video
 * Requirements: 1.3
 */
tiktok.get("/status/:publishId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const publishId = c.req.param("publishId");
    const accountId = c.req.query("accountId");

    if (!publishId) {
      return c.json({ error: "Publish ID is required" }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Get publish status from TikTok
    const status = await getPublishStatus(publishId, accessToken);

    // Find and update the upload record if it exists
    const upload = await prisma.upload.findFirst({
      where: {
        userId: user.id,
        platform: "tiktok",
        metadata: {
          path: ["publishId"],
          equals: publishId,
        },
      },
    });

    if (upload) {
      // Map TikTok status to our internal status
      let uploadStatus = "processing";
      if (status.status === "published") {
        uploadStatus = "complete";
      } else if (status.status === "failed") {
        uploadStatus = "failed";
      } else if (status.status === "pending_approval") {
        uploadStatus = "pending";
      }

      await prisma.upload.updateMany({
        where: { id: upload.id, userId: user.id, platform: "tiktok" },
        data: {
          status: uploadStatus,
          publishedAt: status.status === "published" ? new Date() : null,
          metadata: {
            ...(upload.metadata || {}),
            tiktokVideoId: status.publiclyAvailablePostId,
            tiktokVideoUrl: status.videoUrl,
            failReason: status.failReason,
          },
          updatedAt: new Date(),
        },
      });
    }

    return c.json({
      publishId: status.publishId,
      status: status.status,
      rawStatus: status.rawStatus,
      videoId: status.publiclyAvailablePostId,
      videoUrl: status.videoUrl,
      failReason: status.failReason,
      uploadedBytes: status.uploadedBytes,
    });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Status]", error, message: "Failed to fetch TikTok publish status" });
  }
});


/**
 * POST /api/tiktok/status/:publishId/wait
 * Wait for video to finish processing (polling)
 */
tiktok.post("/status/:publishId/wait", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const publishId = c.req.param("publishId");
    const accountId = c.req.query("accountId");
    const body = await c.req.json().catch(() => ({}));

    const maxAttempts = body.maxAttempts || 30;
    const intervalMs = body.intervalMs || 5000;

    if (!publishId) {
      return c.json({ error: "Publish ID is required" }, 400);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, accountId);

    // Wait for publish to complete
    const status = await waitForPublish(publishId, accessToken, {
      maxAttempts,
      intervalMs,
    });

    // Update upload record
    const upload = await prisma.upload.findFirst({
      where: {
        userId: user.id,
        platform: "tiktok",
        metadata: {
          path: ["publishId"],
          equals: publishId,
        },
      },
    });

    if (upload) {
      await prisma.upload.updateMany({
        where: { id: upload.id, userId: user.id, platform: "tiktok" },
        data: {
          status: "complete",
          publishedAt: new Date(),
          metadata: {
            ...(upload.metadata || {}),
            tiktokVideoId: status.publiclyAvailablePostId,
            tiktokVideoUrl: status.videoUrl,
          },
          updatedAt: new Date(),
        },
      });
    }

    return c.json({
      publishId: status.publishId,
      status: status.status,
      videoId: status.publiclyAvailablePostId,
      videoUrl: status.videoUrl,
    });
  } catch (error) {
    return sendError(c, { scope: "[TikTok Status] Wait", error, message: "Failed while waiting for TikTok publish status" });
  }
});

/**
 * GET /api/tiktok/uploads
 * Get all TikTok uploads for the current user
 */
tiktok.get("/uploads", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "50", 10);
    const status = c.req.query("status");

    const whereClause = {
      userId: user.id,
      platform: "tiktok",
    };

    if (status) {
      whereClause.status = status;
    }

    const uploads = await prisma.upload.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
    return sendError(c, { scope: "[TikTok] Uploads", error, message: "Failed to fetch TikTok uploads" });
  }
});

/**
 * DELETE /api/tiktok/uploads/:uploadId
 * Cancel/delete an upload record
 */
tiktok.delete("/uploads/:uploadId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const uploadId = c.req.param("uploadId");

    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: user.id,
        platform: "tiktok",
      },
    });

    if (!upload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    // Only allow deletion of non-published uploads
    if (upload.status === "complete") {
      return c.json({ error: "Cannot delete published uploads" }, 400);
    }

    await prisma.upload.deleteMany({
      where: { id: uploadId, userId: user.id, platform: "tiktok" },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[TikTok] Delete upload", error, message: "Failed to delete TikTok upload" });
  }
});

export default tiktok;
