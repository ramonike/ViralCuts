/**
 * Scheduled Uploads Job
 * Background job that checks for scheduled uploads and publishes them at the correct time
 * Requirements: 4.2, 4.3
 */

import { prisma } from "../db/prisma.js";
import { refreshToken } from "../services/youtube-auth.js";
import { uploadVideo as uploadTikTokVideo } from "../services/platforms/tiktok.js";

// Job configuration
const JOB_CONFIG = {
  checkIntervalMs: 60 * 1000, // Check every minute
  publishWindowMs: 2 * 60 * 1000, // Publish if within 2 minutes of scheduled time
  maxRetries: 3,
  retryDelayMs: 5 * 60 * 1000, // 5 minutes between retries
};

// Job state
let jobInterval = null;
let isRunning = false;

// Notification callbacks (can be set by the server)
let notificationCallbacks = [];

/**
 * Register a callback to be called when a video is published
 * @param {Function} callback - Function to call with (userId, notification) params
 */
export function onVideoPublished(callback) {
  notificationCallbacks.push(callback);
}

/**
 * Remove a notification callback
 * @param {Function} callback - Callback to remove
 */
export function offVideoPublished(callback) {
  notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
}

/**
 * Notify all registered callbacks about a published video
 * @param {string} userId - User ID
 * @param {object} notification - Notification data
 */
async function notifyVideoPublished(userId, notification) {
  for (const callback of notificationCallbacks) {
    try {
      await callback(userId, notification);
    } catch (error) {
      console.error("[Scheduled Uploads] Notification callback error:", error);
    }
  }

  // Store notification in database for later retrieval
  try {
    await prisma.notification.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
      },
    });
    console.log(`[Scheduled Uploads] Notification stored for user ${userId}`);
  } catch (error) {
    // Notification table might not exist yet, just log
    console.log("[Scheduled Uploads] Could not store notification:", error.message);
  }
}

/**
 * Get a valid access token for a user's YouTube account
 * @param {string} userId - User ID
 * @param {string} accountId - Optional specific account ID
 * @returns {Promise<{accessToken: string, account: object}>}
 */
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
    const tokens = await refreshToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    return { accessToken: tokens.access_token, account };
  }

  if (!account.accessToken) {
    throw new Error("No access token available");
  }

  return { accessToken: account.accessToken, account };
}

/**
 * Update video privacy status on YouTube to make it public
 * @param {string} videoId - YouTube video ID
 * @param {string} accessToken - Valid access token
 * @returns {Promise<object>} Updated video data
 */
async function publishVideoOnYouTube(videoId, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=status`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(`Failed to publish video: ${error.error?.message || "Unknown error"}`);
  }

  return response.json();
}

/**
 * Process a single scheduled upload
 * @param {object} upload - Upload record from database
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function processScheduledUpload(upload) {
  console.log(`[Scheduled Uploads] Processing upload ${upload.id} platform=${upload.platform}`);

  try {
    // ── TikTok ────────────────────────────────────────────────────────────
    if (upload.platform === "tiktok") {
      const fileUrl = upload.metadata?.fileUrl;
      if (!fileUrl) {
        throw new Error("TikTok upload sem fileUrl no metadata");
      }

      // Buscar token TikTok do usuário
      const tiktokAccount = await prisma.account.findFirst({
        where: { userId: upload.userId, providerId: "tiktok" },
      });
      if (!tiktokAccount?.accessToken) throw new Error("Conta TikTok não encontrada");

      // Baixar o arquivo do Supabase Storage
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) throw new Error(`Não foi possível baixar o vídeo: HTTP ${fileRes.status}`);
      const videoBuffer = Buffer.from(await fileRes.arrayBuffer());

      // Upload para o TikTok
      const metadata = {
        title: upload.metadata?.title || upload.fileName || "ViralCuts Video",
        description: upload.metadata?.description || "",
        tags: upload.metadata?.tags || [],
        privacyLevel: "PUBLIC_TO_EVERYONE",
        disableDuet: false,
        disableStitch: false,
        disableComment: false,
      };

      await uploadTikTokVideo(videoBuffer, metadata, tiktokAccount.accessToken);

      // Atualiza status
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: "published", publishedAt: new Date(), updatedAt: new Date() },
      });

      // Limpa arquivo do storage após publicação
      try {
        const { deleteVideoFromStorage } = await import("../db/supabase.js");
        const ext = (upload.metadata?.mimeType || "video/mp4").split("/")[1] || "mp4";
        await deleteVideoFromStorage(upload.userId, upload.id, ext);
      } catch (e) {
        console.warn("[Scheduled Uploads] Não foi possível limpar storage:", e.message);
      }

      await notifyVideoPublished(upload.userId, {
        type: "video_published",
        title: "🎉 Vídeo Publicado no TikTok!",
        message: `"${metadata.title}" foi publicado com sucesso no TikTok.`,
        data: { uploadId: upload.id, videoTitle: metadata.title, publishedAt: new Date().toISOString() },
      });

      return { success: true };
    }

    // ── YouTube ───────────────────────────────────────────────────────────

    // ── YouTube ───────────────────────────────────────────────────────────
    // O YouTube já publicou nativamente via publishAt definido no upload.
    // O job só precisa atualizar o status no nosso banco.
    if (upload.platform === "youtube") {
      // Verifica se o vídeo realmente está público agora (opcional — confia no YouTube)
      const youtubeVideoId = upload.youtubeVideoId || upload.metadata?.youtubeVideoId;

      if (!youtubeVideoId) {
        console.warn(`[Scheduled Uploads] Upload ${upload.id} sem youtubeVideoId — marcando como failed`);
        await prisma.upload.update({
          where: { id: upload.id },
          data: { status: "failed", updatedAt: new Date() },
        });
        return { success: false, error: "No YouTube video ID" };
      }

      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: "published", publishedAt: new Date(), updatedAt: new Date() },
      });

      console.log(`[Scheduled Uploads] YouTube video ${youtubeVideoId} marcado como publicado`);

      const videoTitle = upload.metadata?.title || upload.fileName || 'Seu vídeo';
      await notifyVideoPublished(upload.userId, {
        type: 'video_published',
        title: '🎉 Vídeo Publicado!',
        message: `"${videoTitle}" foi publicado com sucesso no YouTube.`,
        data: {
          uploadId: upload.id,
          videoId: youtubeVideoId,
          videoTitle,
          videoUrl: `https://youtube.com/watch?v=${youtubeVideoId}`,
          publishedAt: new Date().toISOString(),
        },
      });

      return { success: true, videoId: youtubeVideoId };
    }

    // Plataforma desconhecida
    console.warn(`[Scheduled Uploads] Plataforma não suportada: ${upload.platform}`);
    return { success: false, error: `Plataforma não suportada: ${upload.platform}` };

  } catch (error) {
    console.error(`[Scheduled Uploads] Error processing upload ${upload.id}:`, error);

    const retryCount = (upload.metadata?.retryCount || 0) + 1;
    const shouldRetry = retryCount < JOB_CONFIG.maxRetries;

    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: shouldRetry ? "scheduled" : "failed",
        metadata: {
          ...upload.metadata,
          retryCount,
          lastError: error.message,
          lastRetryAt: new Date().toISOString(),
        },
        // If retrying, push scheduled time forward
        scheduledAt: shouldRetry
          ? new Date(Date.now() + JOB_CONFIG.retryDelayMs)
          : upload.scheduledAt,
        updatedAt: new Date(),
      },
    });

    // Notify user if all retries exhausted
    if (!shouldRetry) {
      await notifyVideoPublished(upload.userId, {
        type: 'video_publish_failed',
        title: '❌ Falha na Publicação',
        message: `Não foi possível publicar "${upload.metadata?.title || 'seu vídeo'}" após ${JOB_CONFIG.maxRetries} tentativas.`,
        data: {
          uploadId: upload.id,
          error: error.message,
          retryCount,
        },
      });
    }

    return { success: false, error: error.message };
  }
}

/**
 * Check for and process scheduled uploads that are due
 */
async function checkScheduledUploads() {
  if (isRunning) {
    console.log("[Scheduled Uploads] Job already running, skipping...");
    return;
  }

  isRunning = true;

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - JOB_CONFIG.publishWindowMs); // 2min atrás (tolerância)
    const windowEnd = new Date(now.getTime() + JOB_CONFIG.publishWindowMs);   // 2min à frente

    // Busca uploads agendados dentro da janela de tempo (não todos os passados!)
    const dueUploads = await prisma.upload.findMany({
      where: {
        status: "scheduled",
        scheduledAt: {
          gte: windowStart, // não mais antigo que 2min atrás (evita publicar atrasados acumulados)
          lte: windowEnd,   // não mais distante que 2min no futuro
        },
        platform: { in: ["youtube", "tiktok"] },
      },
      orderBy: { scheduledAt: "asc" },
    });

    if (dueUploads.length === 0) {
      return;
    }

    console.log(`[Scheduled Uploads] Found ${dueUploads.length} uploads due for publishing`);

    // Process each upload
    const results = await Promise.allSettled(
      dueUploads.map((upload) => processScheduledUpload(upload))
    );

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

    console.log(`[Scheduled Uploads] Processed ${results.length} uploads: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error("[Scheduled Uploads] Error checking scheduled uploads:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduled uploads job
 */
export function startScheduledUploadsJob() {
  if (jobInterval) {
    console.log("[Scheduled Uploads] Job already started");
    return;
  }

  console.log("[Scheduled Uploads] Starting job...");

  // Run immediately on start
  checkScheduledUploads();

  // Then run at regular intervals
  jobInterval = setInterval(checkScheduledUploads, JOB_CONFIG.checkIntervalMs);

  console.log(`[Scheduled Uploads] Job started, checking every ${JOB_CONFIG.checkIntervalMs / 1000} seconds`);
}

/**
 * Stop the scheduled uploads job
 */
export function stopScheduledUploadsJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log("[Scheduled Uploads] Job stopped");
  }
}

/**
 * Get job status
 * @returns {object} Job status information
 */
export function getJobStatus() {
  return {
    running: jobInterval !== null,
    processing: isRunning,
    config: JOB_CONFIG,
  };
}

/**
 * Manually trigger a check for scheduled uploads
 * @returns {Promise<void>}
 */
export async function triggerCheck() {
  await checkScheduledUploads();
}

/**
 * Get upcoming scheduled uploads
 * @param {number} limit - Maximum number of uploads to return
 * @returns {Promise<object[]>} List of upcoming scheduled uploads
 */
export async function getUpcomingScheduledUploads(limit = 10) {
  return prisma.upload.findMany({
    where: {
      status: "scheduled",
      scheduledAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Schedule an upload for future publication
 * @param {string} uploadId - Upload ID
 * @param {Date} scheduledAt - When to publish
 * @returns {Promise<object>} Updated upload record
 */
export async function scheduleUpload(uploadId, scheduledAt) {
  // Validate scheduled time is in the future
  if (new Date(scheduledAt) <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  return prisma.upload.update({
    where: { id: uploadId },
    data: {
      status: "scheduled",
      scheduledAt: new Date(scheduledAt),
      updatedAt: new Date(),
    },
  });
}

/**
 * Cancel a scheduled upload
 * @param {string} uploadId - Upload ID
 * @returns {Promise<object>} Updated upload record
 */
export async function cancelScheduledUpload(uploadId) {
  return prisma.upload.update({
    where: { id: uploadId },
    data: {
      status: "cancelled",
      scheduledAt: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Reschedule an upload
 * @param {string} uploadId - Upload ID
 * @param {Date} newScheduledAt - New scheduled time
 * @returns {Promise<object>} Updated upload record
 */
export async function rescheduleUpload(uploadId, newScheduledAt) {
  // Validate new scheduled time is in the future
  if (new Date(newScheduledAt) <= new Date()) {
    throw new Error("New scheduled time must be in the future");
  }

  return prisma.upload.update({
    where: { id: uploadId },
    data: {
      scheduledAt: new Date(newScheduledAt),
      status: "scheduled",
      updatedAt: new Date(),
    },
  });
}

export default {
  startScheduledUploadsJob,
  stopScheduledUploadsJob,
  getJobStatus,
  triggerCheck,
  getUpcomingScheduledUploads,
  scheduleUpload,
  cancelScheduledUpload,
  rescheduleUpload,
  onVideoPublished,
  offVideoPublished,
};