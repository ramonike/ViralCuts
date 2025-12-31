/**
 * Platform Manager Service
 * Orchestrates uploads to multiple platforms with unified status tracking
 * Requirements: 3.1
 */

import { prisma } from '../db/prisma.js';
import { getPlatformConfig, getEnabledPlatforms } from '../config/platforms.js';
import * as tiktokService from './platforms/tiktok.js';
import * as youtubeUpload from './youtube-upload.js';
import * as youtubeAuth from './youtube-auth.js';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
};

// Status constants
export const UploadStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt) {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(cappedDelay + jitter);
}

/**
 * Get available platforms for a user
 * Returns platforms that are configured and connected
 * @param {string} userId - User ID
 * @returns {Promise<Platform[]>} Array of available platforms
 */
export async function getAvailablePlatforms(userId) {
  const enabledPlatforms = getEnabledPlatforms();
  const platforms = [];

  // Get user's connected accounts
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      providerId: true,
      accountId: true,
      accessToken: true,
      accessTokenExpiresAt: true,
    },
  });

  for (const platform of enabledPlatforms) {
    const account = accounts.find(a => 
      a.providerId === platform.id || 
      a.providerId === `${platform.id}-oauth`
    );

    const isConnected = !!account?.accessToken;
    const isExpired = account?.accessTokenExpiresAt 
      ? new Date(account.accessTokenExpiresAt) < new Date()
      : false;

    platforms.push({
      id: platform.id,
      name: platform.name,
      connected: isConnected && !isExpired,
      needsReauth: isConnected && isExpired,
      accountId: account?.accountId || null,
      videoRequirements: platform.videoRequirements,
      privacyOptions: platform.privacyOptions || [],
    });
  }

  return platforms;
}

/**
 * Create a multi-platform upload
 * @param {Object} params - Upload parameters
 * @param {string} params.userId - User ID
 * @param {string} params.videoId - Video ID (optional)
 * @param {string[]} params.platforms - Array of platform IDs
 * @param {Object} params.metadata - Video metadata
 * @param {Date} params.scheduledAt - Scheduled publish time (optional)
 * @returns {Promise<Upload>} Created upload with platform statuses
 */
export async function createMultiPlatformUpload({
  userId,
  videoId,
  platforms,
  metadata,
  scheduledAt,
}) {
  // Validate platforms
  const availablePlatforms = await getAvailablePlatforms(userId);
  const validPlatforms = platforms.filter(p => 
    availablePlatforms.some(ap => ap.id === p && ap.connected)
  );

  if (validPlatforms.length === 0) {
    throw new Error('No valid connected platforms selected');
  }

  // Create upload with platform statuses
  const upload = await prisma.upload.create({
    data: {
      userId,
      videoId: videoId || null,
      platform: validPlatforms[0], // Primary platform
      platforms: validPlatforms,
      status: UploadStatus.PENDING,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      metadata,
      platformStatuses: {
        create: validPlatforms.map(platform => ({
          platform,
          status: UploadStatus.PENDING,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        })),
      },
    },
    include: {
      platformStatuses: true,
      video: true,
    },
  });

  return upload;
}

/**
 * Get aggregated status for an upload
 * @param {string} uploadId - Upload ID
 * @returns {Promise<AggregatedStatus>} Aggregated status across platforms
 */
export async function getAggregatedStatus(uploadId) {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      platformStatuses: true,
    },
  });

  if (!upload) {
    throw new Error('Upload not found');
  }

  const statuses = upload.platformStatuses;
  const statusCounts = {
    pending: 0,
    uploading: 0,
    processing: 0,
    published: 0,
    failed: 0,
    cancelled: 0,
  };

  statuses.forEach(s => {
    if (statusCounts[s.status] !== undefined) {
      statusCounts[s.status]++;
    }
  });

  // Determine overall status
  let overallStatus = UploadStatus.PENDING;
  
  if (statusCounts.published === statuses.length) {
    overallStatus = UploadStatus.PUBLISHED;
  } else if (statusCounts.failed === statuses.length) {
    overallStatus = UploadStatus.FAILED;
  } else if (statusCounts.uploading > 0 || statusCounts.processing > 0) {
    overallStatus = UploadStatus.UPLOADING;
  } else if (statusCounts.published > 0 || statusCounts.failed > 0) {
    overallStatus = UploadStatus.PROCESSING; // Partial completion
  }

  return {
    uploadId,
    overallStatus,
    statusCounts,
    platforms: statuses.map(s => ({
      platform: s.platform,
      status: s.status,
      platformVideoId: s.platformVideoId,
      platformVideoUrl: s.platformVideoUrl,
      error: s.error,
      publishedAt: s.publishedAt,
    })),
    totalPlatforms: statuses.length,
    completedPlatforms: statusCounts.published,
    failedPlatforms: statusCounts.failed,
  };
}

/**
 * Update platform-specific status
 * @param {string} uploadId - Upload ID
 * @param {string} platform - Platform ID
 * @param {Object} statusUpdate - Status update data
 */
export async function updatePlatformStatus(uploadId, platform, statusUpdate) {
  const { status, platformVideoId, platformVideoUrl, error, publishedAt, metadata } = statusUpdate;

  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (platformVideoId !== undefined) updateData.platformVideoId = platformVideoId;
  if (platformVideoUrl !== undefined) updateData.platformVideoUrl = platformVideoUrl;
  if (error !== undefined) updateData.error = error;
  if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);
  if (metadata !== undefined) updateData.metadata = metadata;

  await prisma.platformUploadStatus.update({
    where: {
      uploadId_platform: {
        uploadId,
        platform,
      },
    },
    data: updateData,
  });

  // Update overall upload status
  const aggregated = await getAggregatedStatus(uploadId);
  await prisma.upload.update({
    where: { id: uploadId },
    data: { status: aggregated.overallStatus },
  });

  return aggregated;
}


/**
 * Upload to a specific platform
 * @param {string} uploadId - Upload ID
 * @param {string} platform - Platform ID
 * @param {Buffer|ArrayBuffer} videoData - Video file data
 * @param {Object} metadata - Platform-specific metadata
 * @param {string} accessToken - Platform access token
 * @param {Object} options - Upload options
 * @returns {Promise<PlatformUploadResult>} Upload result
 */
export async function uploadToPlatform(uploadId, platform, videoData, metadata, accessToken, options = {}) {
  const { onProgress, signal } = options;

  // Update status to uploading
  await updatePlatformStatus(uploadId, platform, { status: UploadStatus.UPLOADING });

  try {
    let result;

    switch (platform) {
      case 'youtube':
        result = await uploadToYouTube(videoData, metadata, accessToken, { onProgress, signal });
        break;
      case 'tiktok':
        result = await uploadToTikTok(videoData, metadata, accessToken, { onProgress, signal });
        break;
      case 'instagram':
        result = await uploadToInstagram(videoData, metadata, accessToken, { onProgress, signal });
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Update status based on result
    await updatePlatformStatus(uploadId, platform, {
      status: result.status === 'success' ? UploadStatus.PUBLISHED : UploadStatus.PROCESSING,
      platformVideoId: result.videoId,
      platformVideoUrl: result.videoUrl,
      publishedAt: result.status === 'success' ? new Date() : null,
    });

    return result;
  } catch (error) {
    await updatePlatformStatus(uploadId, platform, {
      status: UploadStatus.FAILED,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Upload to YouTube
 */
async function uploadToYouTube(videoData, metadata, accessToken, options = {}) {
  const fileSize = videoData.byteLength || videoData.length;
  const mimeType = metadata.mimeType || 'video/mp4';

  // Initialize upload session
  const session = await youtubeUpload.initiateUpload(
    {
      title: metadata.title,
      description: metadata.description || '',
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || '22',
      privacyStatus: metadata.privacyStatus || 'private',
      publishAt: metadata.publishAt,
    },
    fileSize,
    mimeType,
    accessToken
  );

  // Upload in chunks
  const chunkSize = youtubeUpload.DEFAULT_CHUNK_SIZE;
  let bytesUploaded = 0;
  let result;

  while (bytesUploaded < fileSize) {
    if (options.signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    const chunk = videoData.slice(bytesUploaded, bytesUploaded + chunkSize);
    result = await youtubeUpload.uploadChunkWithRetry(
      session.sessionUri,
      chunk,
      bytesUploaded,
      fileSize,
      accessToken
    );

    bytesUploaded = result.bytesUploaded;

    if (options.onProgress) {
      options.onProgress(bytesUploaded, fileSize, 'uploading');
    }

    if (result.status === 'complete') {
      break;
    }
  }

  return {
    status: 'success',
    videoId: result.videoId,
    videoUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
    platform: 'youtube',
  };
}

/**
 * Upload to TikTok
 */
async function uploadToTikTok(videoData, metadata, accessToken, options = {}) {
  const tiktokMetadata = {
    title: metadata.title || '',
    privacyLevel: mapPrivacyToTikTok(metadata.privacyStatus),
    disableComment: metadata.disableComment || false,
    disableDuet: metadata.disableDuet || false,
    disableStitch: metadata.disableStitch || false,
  };

  const result = await tiktokService.uploadVideo(videoData, tiktokMetadata, accessToken, {
    onProgress: options.onProgress,
    signal: options.signal,
  });

  // Poll for publish status
  const publishStatus = await tiktokService.waitForPublish(result.publishId, accessToken, {
    maxAttempts: 30,
    intervalMs: 5000,
  });

  return {
    status: publishStatus.status === 'published' ? 'success' : 'processing',
    videoId: publishStatus.publiclyAvailablePostId,
    videoUrl: publishStatus.videoUrl,
    platform: 'tiktok',
    publishId: result.publishId,
  };
}

/**
 * Upload to Instagram (placeholder - requires Meta API implementation)
 */
async function uploadToInstagram(videoData, metadata, accessToken, options = {}) {
  // Instagram Reels upload requires Graph API implementation
  // This is a placeholder that will be implemented in task 2.2
  throw new Error('Instagram upload not yet implemented. Complete task 2.2 first.');
}

/**
 * Map privacy status to TikTok format
 */
function mapPrivacyToTikTok(privacyStatus) {
  const mapping = {
    'public': 'PUBLIC_TO_EVERYONE',
    'unlisted': 'MUTUAL_FOLLOW_FRIENDS',
    'private': 'SELF_ONLY',
  };
  return mapping[privacyStatus] || 'SELF_ONLY';
}

/**
 * Upload to multiple platforms in parallel
 * @param {string} uploadId - Upload ID
 * @param {Buffer|ArrayBuffer} videoData - Video file data
 * @param {Object} metadata - Video metadata
 * @param {Object} tokens - Platform tokens { youtube: token, tiktok: token, ... }
 * @param {Object} options - Upload options
 * @returns {Promise<MultiPlatformUploadResult>} Results for all platforms
 */
export async function uploadToMultiplePlatforms(uploadId, videoData, metadata, tokens, options = {}) {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: { platformStatuses: true },
  });

  if (!upload) {
    throw new Error('Upload not found');
  }

  const platforms = upload.platforms;
  const results = {};
  const errors = {};

  // Upload to each platform in parallel
  const uploadPromises = platforms.map(async (platform) => {
    const token = tokens[platform];
    if (!token) {
      errors[platform] = 'No access token available';
      await updatePlatformStatus(uploadId, platform, {
        status: UploadStatus.FAILED,
        error: 'No access token available',
      });
      return;
    }

    try {
      const result = await uploadToPlatform(
        uploadId,
        platform,
        videoData,
        { ...metadata, platform },
        token,
        options
      );
      results[platform] = result;
    } catch (error) {
      errors[platform] = error.message;
      // Status already updated in uploadToPlatform
    }
  });

  await Promise.allSettled(uploadPromises);

  return {
    uploadId,
    results,
    errors,
    aggregatedStatus: await getAggregatedStatus(uploadId),
  };
}

/**
 * Retry failed platform upload
 * @param {string} uploadId - Upload ID
 * @param {string} platform - Platform to retry
 * @param {Buffer|ArrayBuffer} videoData - Video file data
 * @param {Object} metadata - Video metadata
 * @param {string} accessToken - Platform access token
 * @param {Object} options - Upload options
 */
export async function retryPlatformUpload(uploadId, platform, videoData, metadata, accessToken, options = {}) {
  // Reset status to pending
  await updatePlatformStatus(uploadId, platform, {
    status: UploadStatus.PENDING,
    error: null,
  });

  // Attempt upload
  return uploadToPlatform(uploadId, platform, videoData, metadata, accessToken, options);
}

/**
 * Cancel platform upload
 * @param {string} uploadId - Upload ID
 * @param {string} platform - Platform to cancel (optional, cancels all if not specified)
 */
export async function cancelPlatformUpload(uploadId, platform = null) {
  if (platform) {
    await updatePlatformStatus(uploadId, platform, {
      status: UploadStatus.CANCELLED,
    });
  } else {
    // Cancel all platforms
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { platformStatuses: true },
    });

    if (upload) {
      await Promise.all(
        upload.platformStatuses
          .filter(s => s.status === UploadStatus.PENDING || s.status === UploadStatus.UPLOADING)
          .map(s => updatePlatformStatus(uploadId, s.platform, {
            status: UploadStatus.CANCELLED,
          }))
      );
    }
  }

  return getAggregatedStatus(uploadId);
}

/**
 * Get uploads with platform statuses for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 */
export async function getUserUploads(userId, filters = {}) {
  const where = { userId };
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.platform) {
    where.platforms = { has: filters.platform };
  }

  const uploads = await prisma.upload.findMany({
    where,
    include: {
      platformStatuses: true,
      video: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return uploads.map(upload => ({
    ...upload,
    aggregatedStatus: calculateAggregatedStatusSync(upload.platformStatuses),
  }));
}

/**
 * Synchronous version of aggregated status calculation
 */
function calculateAggregatedStatusSync(platformStatuses) {
  const statusCounts = {
    pending: 0,
    uploading: 0,
    processing: 0,
    published: 0,
    failed: 0,
    cancelled: 0,
  };

  platformStatuses.forEach(s => {
    if (statusCounts[s.status] !== undefined) {
      statusCounts[s.status]++;
    }
  });

  let overallStatus = UploadStatus.PENDING;
  
  if (statusCounts.published === platformStatuses.length) {
    overallStatus = UploadStatus.PUBLISHED;
  } else if (statusCounts.failed === platformStatuses.length) {
    overallStatus = UploadStatus.FAILED;
  } else if (statusCounts.uploading > 0 || statusCounts.processing > 0) {
    overallStatus = UploadStatus.UPLOADING;
  } else if (statusCounts.published > 0 || statusCounts.failed > 0) {
    overallStatus = UploadStatus.PROCESSING;
  }

  return {
    overallStatus,
    statusCounts,
    totalPlatforms: platformStatuses.length,
    completedPlatforms: statusCounts.published,
    failedPlatforms: statusCounts.failed,
  };
}

export default {
  // Platform management
  getAvailablePlatforms,
  
  // Upload operations
  createMultiPlatformUpload,
  uploadToPlatform,
  uploadToMultiplePlatforms,
  retryPlatformUpload,
  cancelPlatformUpload,
  
  // Status management
  getAggregatedStatus,
  updatePlatformStatus,
  getUserUploads,
  
  // Constants
  UploadStatus,
  RETRY_CONFIG,
};
