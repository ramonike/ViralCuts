/**
 * YouTube Resumable Upload Service
 * Implements YouTube Data API v3 Resumable Upload Protocol
 * Requirements: 2.1, 2.3
 */

const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// Default chunk size: 8MB (must be multiple of 256KB)
const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 32000,
  retryableStatusCodes: [408, 500, 502, 503, 504],
};

/**
 * Initiate a resumable upload session with YouTube
 * @param {Object} metadata - Video metadata
 * @param {string} metadata.title - Video title (required)
 * @param {string} metadata.description - Video description
 * @param {string[]} metadata.tags - Video tags
 * @param {string} metadata.categoryId - YouTube category ID
 * @param {string} metadata.privacyStatus - 'private' | 'public' | 'unlisted'
 * @param {string} metadata.publishAt - ISO date string for scheduled publish
 * @param {string} metadata.playlistId - Playlist to add video to
 * @param {number} fileSize - Total file size in bytes
 * @param {string} mimeType - Video MIME type (e.g., 'video/mp4')
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<UploadSession>} Upload session with sessionUri
 */
export async function initiateUpload(metadata, fileSize, mimeType, accessToken) {
  if (!metadata.title) {
    throw new Error("Video title is required");
  }

  if (!accessToken) {
    throw new Error("Access token is required");
  }

  // Build video resource for YouTube API
  const videoResource = {
    snippet: {
      title: metadata.title,
      description: metadata.description || "",
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || "22", // Default: People & Blogs
    },
    status: {
      privacyStatus: metadata.privacyStatus || "private",
      selfDeclaredMadeForKids: false,
    },
  };

  // Add scheduled publish time if provided
  if (metadata.publishAt && metadata.privacyStatus === "private") {
    videoResource.status.publishAt = metadata.publishAt;
  }

  const params = new URLSearchParams({
    uploadType: "resumable",
    part: "snippet,status",
  });

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": mimeType || "video/mp4",
  };

  if (fileSize && Number(fileSize) > 0) {
    headers["X-Upload-Content-Length"] = fileSize.toString();
  }

  const response = await fetch(`${YOUTUBE_UPLOAD_URL}?${params}`, {
    method: "POST",
    headers,
    body: JSON.stringify(videoResource),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    const errorMessage = error.error?.message || error.error?.errors?.[0]?.message || "Failed to initiate upload";
    throw new Error(`YouTube API error: ${errorMessage}`);
  }

  // Get the resumable session URI from response headers
  const sessionUri = response.headers.get("location");

  if (!sessionUri) {
    throw new Error("No upload session URI returned from YouTube");
  }

  return {
    sessionUri,
    videoId: null,
    bytesUploaded: 0,
    totalBytes: fileSize || null,
    status: "initiated",
    metadata,
    mimeType,
  };
}


/**
 * Upload a chunk of the video file
 * @param {string} sessionUri - Resumable upload session URI
 * @param {Buffer} chunk - Chunk data to upload
 * @param {number} startByte - Starting byte position
 * @param {number} totalBytes - Total file size
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<UploadProgress>} Upload progress
 */
export async function uploadChunk(sessionUri, chunk, startByte, totalBytes, accessToken) {
  const endByte = startByte + chunk.length - 1;
  const contentRange = `bytes ${startByte}-${endByte}/${totalBytes}`;

  const response = await fetch(sessionUri, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": chunk.length.toString(),
      "Content-Range": contentRange,
    },
    body: chunk,
  });

  // 308 Resume Incomplete - more chunks needed
  if (response.status === 308) {
    const rangeHeader = response.headers.get("range");
    let bytesUploaded = endByte + 1;

    if (rangeHeader) {
      // Parse "bytes=0-12345" format
      const match = rangeHeader.match(/bytes=0-(\d+)/);
      if (match) {
        bytesUploaded = parseInt(match[1], 10) + 1;
      }
    }

    return {
      status: "uploading",
      bytesUploaded,
      totalBytes,
      progress: Math.round((bytesUploaded / totalBytes) * 100),
      videoId: null,
    };
  }

  // 200 or 201 - Upload complete
  if (response.ok) {
    const data = await response.json();
    return {
      status: "complete",
      bytesUploaded: totalBytes,
      totalBytes,
      progress: 100,
      videoId: data.id,
      videoData: data,
    };
  }

  // Handle errors
  const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
  const errorMessage = error.error?.message || "Chunk upload failed";

  // Check for retryable errors
  if (response.status >= 500 || response.status === 408) {
    const retryError = new Error(`Retryable error: ${errorMessage}`);
    retryError.retryable = true;
    retryError.status = response.status;
    throw retryError;
  }

  throw new Error(`YouTube API error (${response.status}): ${errorMessage}`);
}

/**
 * Resume an interrupted upload by checking current status
 * @param {string} sessionUri - Resumable upload session URI
 * @param {number} totalBytes - Total file size
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<UploadProgress>} Current upload progress
 */
export async function resumeUpload(sessionUri, totalBytes, accessToken) {
  // Send empty PUT with Content-Range: bytes */{totalBytes} to query status
  const response = await fetch(sessionUri, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": "0",
      "Content-Range": `bytes */${totalBytes}`,
    },
  });

  // 308 Resume Incomplete - returns how many bytes have been received
  if (response.status === 308) {
    const rangeHeader = response.headers.get("range");
    let bytesUploaded = 0;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=0-(\d+)/);
      if (match) {
        bytesUploaded = parseInt(match[1], 10) + 1;
      }
    }

    return {
      status: "uploading",
      bytesUploaded,
      totalBytes,
      progress: Math.round((bytesUploaded / totalBytes) * 100),
      videoId: null,
      resumeFrom: bytesUploaded,
    };
  }

  // 200 or 201 - Upload was already complete
  if (response.ok) {
    const data = await response.json();
    return {
      status: "complete",
      bytesUploaded: totalBytes,
      totalBytes,
      progress: 100,
      videoId: data.id,
      videoData: data,
    };
  }

  // 404 - Session expired, need to start over
  if (response.status === 404) {
    return {
      status: "expired",
      bytesUploaded: 0,
      totalBytes,
      progress: 0,
      videoId: null,
      error: "Upload session expired. Please start a new upload.",
    };
  }

  const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
  throw new Error(`Failed to resume upload: ${error.error?.message || "Unknown error"}`);
}


/**
 * Upload thumbnail for a video
 * @param {string} videoId - YouTube video ID
 * @param {Buffer} imageData - Thumbnail image data
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, image/gif)
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<Object>} Thumbnail response
 */
export async function uploadThumbnail(videoId, imageData, mimeType, accessToken) {
  const params = new URLSearchParams({
    videoId,
  });

  const response = await fetch(
    `${YOUTUBE_UPLOAD_URL.replace("/videos", "/thumbnails/set")}?${params}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
        "Content-Length": imageData.length.toString(),
      },
      body: imageData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(`Thumbnail upload failed: ${error.error?.message || "Unknown error"}`);
  }

  return response.json();
}

/**
 * Add video to a playlist
 * @param {string} videoId - YouTube video ID
 * @param {string} playlistId - YouTube playlist ID
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<Object>} Playlist item response
 */
export async function addToPlaylist(videoId, playlistId, accessToken) {
  const response = await fetch(`${YOUTUBE_API_URL}/playlistItems?part=snippet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(`Failed to add to playlist: ${error.error?.message || "Unknown error"}`);
  }

  return response.json();
}

/**
 * Get video categories for a region
 * @param {string} regionCode - ISO 3166-1 alpha-2 country code
 * @param {string} accessToken - YouTube OAuth access token
 * @returns {Promise<Object[]>} List of video categories
 */
export async function getVideoCategories(regionCode = "US", accessToken) {
  const params = new URLSearchParams({
    part: "snippet",
    regionCode,
  });

  const response = await fetch(`${YOUTUBE_API_URL}/videoCategories?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(`Failed to get categories: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Get user's playlists
 * @param {string} accessToken - YouTube OAuth access token
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Object[]>} List of playlists
 */
export async function getUserPlaylists(accessToken, maxResults = 50) {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    mine: "true",
    maxResults: maxResults.toString(),
  });

  const response = await fetch(`${YOUTUBE_API_URL}/playlists?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(`Failed to get playlists: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.items || [];
}

export default {
  initiateUpload,
  uploadChunk,
  resumeUpload,
  uploadThumbnail,
  addToPlaylist,
  getVideoCategories,
  getUserPlaylists,
  isRetryableError,
  calculateBackoffDelay,
  withRetry,
  uploadChunkWithRetry,
  DEFAULT_CHUNK_SIZE,
  RETRY_CONFIG,
};


/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.status && RETRY_CONFIG.retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Explicitly marked as retryable
  if (error.retryable === true) {
    return true;
  }

  return false;
}

/**
 * Calculate delay for exponential backoff with jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(attempt) {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
  
  // Add jitter (±25%)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  
  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<any>} Result of the function
 */
export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.maxRetries;
  const onRetry = options.onRetry;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateBackoffDelay(attempt);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry({
          attempt: attempt + 1,
          maxRetries,
          delay,
          error,
        });
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Upload chunk with automatic retry
 * @param {string} sessionUri - Resumable upload session URI
 * @param {Buffer} chunk - Chunk data to upload
 * @param {number} startByte - Starting byte position
 * @param {number} totalBytes - Total file size
 * @param {string} accessToken - YouTube OAuth access token
 * @param {Object} options - Retry options
 * @returns {Promise<UploadProgress>} Upload progress
 */
export async function uploadChunkWithRetry(sessionUri, chunk, startByte, totalBytes, accessToken, options = {}) {
  return withRetry(
    () => uploadChunk(sessionUri, chunk, startByte, totalBytes, accessToken),
    {
      maxRetries: options.maxRetries ?? RETRY_CONFIG.maxRetries,
      onRetry: options.onRetry,
    }
  );
}
