/**
 * TikTok OAuth 2.0 Authentication Service & Content Posting API
 * Implements OAuth flow and video upload for TikTok
 * Requirements: 1.2, 1.3
 */

import { getPlatformConfig } from '../../config/platforms.js';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_REVOKE_URL = 'https://open.tiktokapis.com/v2/oauth/revoke/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

// Content Posting API endpoints
const TIKTOK_VIDEO_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const TIKTOK_PUBLISH_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
const TIKTOK_CREATOR_INFO_URL = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';

// Upload configuration
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024; // 4GB max
const MAX_VIDEO_DURATION = 600; // 10 minutes in seconds
const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB minimum chunk
const MAX_CHUNK_SIZE = 64 * 1024 * 1024; // 64MB maximum chunk

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 32000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Get TikTok OAuth configuration from environment
 * @returns {object} OAuth configuration
 * @throws {Error} If required credentials are missing
 */
function getOAuthConfig() {
  const config = getPlatformConfig('tiktok');
  
  if (!config?.oauth?.clientKey || !config?.oauth?.clientSecret) {
    throw new Error('Missing TikTok OAuth credentials. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.');
  }

  return {
    clientKey: config.oauth.clientKey,
    clientSecret: config.oauth.clientSecret,
    redirectUri: config.oauth.redirectUri,
    scopes: config.oauth.scopes,
  };
}

/**
 * Generate a cryptographically secure code verifier for PKCE
 * @returns {string} Code verifier string
 */
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate code challenge from code verifier using SHA-256
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Base64URL encoded code challenge
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate OAuth 2.0 authorization URL for TikTok
 * TikTok requires PKCE (Proof Key for Code Exchange) for security
 * @param {string} state - Optional state parameter for CSRF protection
 * @returns {Promise<{url: string, codeVerifier: string}>} Authorization URL and code verifier
 */
export async function getAuthUrl(state = null) {
  const { clientKey, redirectUri, scopes } = getOAuthConfig();
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(','),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (state) {
    params.append('state', state);
  }

  return {
    url: `${TIKTOK_AUTH_URL}?${params.toString()}`,
    codeVerifier, // Must be stored and used during token exchange
  };
}


/**
 * Exchange authorization code for access and refresh tokens
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} codeVerifier - PKCE code verifier used during authorization
 * @returns {Promise<TikTokTokenResponse>} Token response with access and refresh tokens
 */
export async function exchangeCode(code, codeVerifier) {
  const { clientKey, clientSecret, redirectUri } = getOAuthConfig();

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || 'Unknown error';
    throw new Error(`TikTok token exchange failed: ${errorMsg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_expires_in: data.refresh_expires_in,
    open_id: data.open_id,
    scope: data.scope,
    token_type: data.token_type || 'Bearer',
  };
}

/**
 * Refresh access token using refresh token
 * TikTok refresh tokens are valid for 365 days
 * @param {string} refreshTokenValue - Refresh token from previous authorization
 * @returns {Promise<TikTokTokenResponse>} New token response
 */
export async function refreshToken(refreshTokenValue) {
  const { clientKey, clientSecret } = getOAuthConfig();

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || 'Unknown error';
    throw new Error(`TikTok token refresh failed: ${errorMsg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token, // TikTok returns a new refresh token
    expires_in: data.expires_in,
    refresh_expires_in: data.refresh_expires_in,
    open_id: data.open_id,
    scope: data.scope,
    token_type: data.token_type || 'Bearer',
  };
}

/**
 * Revoke OAuth token (access or refresh)
 * @param {string} token - Access or refresh token to revoke
 * @returns {Promise<void>}
 */
export async function revokeToken(token) {
  const { clientKey, clientSecret } = getOAuthConfig();

  const response = await fetch(TIKTOK_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      token: token,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`TikTok token revocation failed: ${data.error_description || data.error}`);
  }
}

/**
 * Get user info from TikTok
 * @param {string} accessToken - Valid access token
 * @returns {Promise<TikTokUserInfo>} User information
 */
export async function getUserInfo(accessToken) {
  const params = new URLSearchParams({
    fields: 'open_id,union_id,avatar_url,display_name',
  });

  const response = await fetch(`${TIKTOK_USER_INFO_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok || (data.error?.code && data.error.code !== 'ok')) {
    const errorMsg = data.error?.message || 'Failed to fetch user info';
    console.error("[TikTok getUserInfo] Failed response:", {
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(data),
    });
    throw new Error(`TikTok user info failed: ${errorMsg}`);
  }

  return {
    open_id: data.data?.user?.open_id,
    union_id: data.data?.user?.union_id,
    avatar_url: data.data?.user?.avatar_url,
    display_name: data.data?.user?.display_name,
  };
}

/**
 * Validate if access token is still valid
 * @param {string} accessToken - Access token to validate
 * @returns {Promise<boolean>} True if token is valid
 */
export async function validateToken(accessToken) {
  try {
    await getUserInfo(accessToken);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Content Posting API - Video Upload Functions
// Requirements: 1.3
// ============================================================================

/**
 * Get creator info including posting permissions and limits
 * @param {string} accessToken - Valid access token
 * @returns {Promise<CreatorInfo>} Creator information and limits
 */
export async function getCreatorInfo(accessToken) {
  const response = await fetch(TIKTOK_CREATOR_INFO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();

  if (!response.ok || (data.error?.code && data.error.code !== 'ok')) {
    const errorMsg = data.error?.message || 'Failed to fetch creator info';
    throw new Error(`TikTok creator info failed: ${errorMsg}`);
  }

  return {
    creator_avatar_url: data.data?.creator_avatar_url,
    creator_username: data.data?.creator_username,
    creator_nickname: data.data?.creator_nickname,
    privacy_level_options: data.data?.privacy_level_options || [],
    comment_disabled: data.data?.comment_disabled,
    duet_disabled: data.data?.duet_disabled,
    stitch_disabled: data.data?.stitch_disabled,
    max_video_post_duration_sec: data.data?.max_video_post_duration_sec || MAX_VIDEO_DURATION,
  };
}

/**
 * Validate video metadata before upload
 * @param {TikTokVideoMetadata} metadata - Video metadata to validate
 * @param {number} fileSize - File size in bytes
 * @param {number} duration - Video duration in seconds (optional)
 * @throws {Error} If validation fails
 */
export function validateVideoMetadata(metadata, fileSize, duration = null) {
  // Validate file size
  if (fileSize > MAX_VIDEO_SIZE) {
    throw new Error(`Video file size (${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB) exceeds maximum allowed (4GB)`);
  }

  // Validate duration if provided
  if (duration !== null && duration > MAX_VIDEO_DURATION) {
    throw new Error(`Video duration (${duration}s) exceeds maximum allowed (${MAX_VIDEO_DURATION}s / 10 minutes)`);
  }

  // Validate privacy level
  const validPrivacyLevels = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'];
  if (metadata.privacyLevel && !validPrivacyLevels.includes(metadata.privacyLevel)) {
    throw new Error(`Invalid privacy level: ${metadata.privacyLevel}. Must be one of: ${validPrivacyLevels.join(', ')}`);
  }

  return true;
}

/**
 * Calculate optimal chunk size based on file size
 * @param {number} fileSize - Total file size in bytes
 * @returns {number} Optimal chunk size in bytes
 */
export function calculateChunkSize(fileSize) {
  // For small files (< 20MB), use minimum chunk size
  if (fileSize < 20 * 1024 * 1024) {
    return Math.min(fileSize, MIN_CHUNK_SIZE);
  }
  
  // For medium files (20MB - 500MB), use 10MB chunks
  if (fileSize < 500 * 1024 * 1024) {
    return DEFAULT_CHUNK_SIZE;
  }
  
  // For large files (500MB - 2GB), use 32MB chunks
  if (fileSize < 2 * 1024 * 1024 * 1024) {
    return 32 * 1024 * 1024;
  }
  
  // For very large files (> 2GB), use maximum chunk size
  return MAX_CHUNK_SIZE;
}

/**
 * Initialize a video upload session with TikTok
 * This is the first step in the Content Posting API flow
 * @param {TikTokVideoMetadata} metadata - Video metadata
 * @param {number} fileSize - Total file size in bytes
 * @param {number} chunkCount - Number of chunks for upload
 * @param {string} accessToken - Valid access token
 * @returns {Promise<TikTokUploadSession>} Upload session with publish_id and upload_url
 */
export async function initiateUpload(metadata, fileSize, chunkCount, accessToken) {
  // Validate metadata
  validateVideoMetadata(metadata, fileSize);

  // Build post info object
  const postInfo = {
    title: metadata.title || '',
    privacy_level: metadata.privacyLevel || 'SELF_ONLY',
    disable_comment: metadata.disableComment || false,
    disable_duet: metadata.disableDuet || false,
    disable_stitch: metadata.disableStitch || false,
    video_cover_timestamp_ms: metadata.coverTimestampMs || 0,
  };

  // Add optional brand content disclosure
  if (metadata.brandContentToggle !== undefined) {
    postInfo.brand_content_toggle = metadata.brandContentToggle;
    if (metadata.brandOrganicToggle !== undefined) {
      postInfo.brand_organic_toggle = metadata.brandOrganicToggle;
    }
  }

  // Build source info for chunked upload
  const sourceInfo = {
    source: 'FILE_UPLOAD',
    video_size: fileSize,
    chunk_size: calculateChunkSize(fileSize),
    total_chunk_count: chunkCount,
  };

  const requestBody = {
    post_info: postInfo,
    source_info: sourceInfo,
  };

  const response = await fetch(TIKTOK_VIDEO_INIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok || (data.error?.code && data.error.code !== 'ok')) {
    const errorCode = data.error?.code || 'unknown';
    const errorMsg = data.error?.message || 'Failed to initialize upload';
    throw new Error(`TikTok upload init failed (${errorCode}): ${errorMsg}`);
  }

  return {
    publishId: data.data?.publish_id,
    uploadUrl: data.data?.upload_url,
    status: 'initialized',
    fileSize,
    chunkSize: sourceInfo.chunk_size,
    totalChunks: chunkCount,
    uploadedChunks: 0,
    bytesUploaded: 0,
  };
}

/**
 * Upload a single chunk of the video file
 * @param {string} uploadUrl - Upload URL from initiateUpload
 * @param {Buffer|ArrayBuffer} chunkData - Chunk data to upload
 * @param {number} chunkIndex - Zero-based chunk index
 * @param {number} startByte - Starting byte position
 * @param {number} endByte - Ending byte position (inclusive)
 * @param {number} totalSize - Total file size
 * @param {string} accessToken - Valid access token
 * @returns {Promise<TikTokChunkUploadResult>} Chunk upload result
 */
export async function uploadChunk(uploadUrl, chunkData, chunkIndex, startByte, endByte, totalSize, accessToken) {
  const contentRange = `bytes ${startByte}-${endByte}/${totalSize}`;
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'video/mp4',
      'Content-Length': chunkData.byteLength || chunkData.length,
      'Content-Range': contentRange,
    },
    body: chunkData,
  });

  // 200/201 - Chunk uploaded successfully
  if (response.ok) {
    return {
      success: true,
      chunkIndex,
      bytesUploaded: endByte - startByte + 1,
      status: 'uploaded',
    };
  }

  // Handle errors
  const errorText = await response.text().catch(() => 'Unknown error');
  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch {
    errorData = { error: { message: errorText } };
  }

  const errorMsg = errorData.error?.message || errorText || 'Chunk upload failed';
  
  // Check for retryable errors
  if (RETRY_CONFIG.retryableStatusCodes.includes(response.status)) {
    const retryError = new Error(`Retryable error: ${errorMsg}`);
    retryError.retryable = true;
    retryError.status = response.status;
    throw retryError;
  }

  throw new Error(`TikTok chunk upload failed (${response.status}): ${errorMsg}`);
}

/**
 * Check the publish status of an uploaded video
 * @param {string} publishId - Publish ID from initiateUpload
 * @param {string} accessToken - Valid access token
 * @returns {Promise<TikTokPublishStatus>} Current publish status
 */
export async function getPublishStatus(publishId, accessToken) {
  const response = await fetch(TIKTOK_PUBLISH_STATUS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  });

  const data = await response.json();

  if (!response.ok || (data.error?.code && data.error.code !== 'ok')) {
    const errorMsg = data.error?.message || 'Failed to fetch publish status';
    throw new Error(`TikTok publish status failed: ${errorMsg}`);
  }

  // Map TikTok status to our internal status
  const statusMap = {
    'PROCESSING_UPLOAD': 'uploading',
    'PROCESSING_DOWNLOAD': 'processing',
    'SEND_TO_USER_INBOX': 'pending_approval',
    'PUBLISH_COMPLETE': 'published',
    'FAILED': 'failed',
  };

  const tiktokStatus = data.data?.status;
  
  return {
    publishId,
    status: statusMap[tiktokStatus] || tiktokStatus,
    rawStatus: tiktokStatus,
    publiclyAvailablePostId: data.data?.publicly_available_post_id || null,
    failReason: data.data?.fail_reason || null,
    uploadedBytes: data.data?.uploaded_bytes,
    videoUrl: data.data?.publicly_available_post_id 
      ? `https://www.tiktok.com/@/video/${data.data.publicly_available_post_id}`
      : null,
  };
}

/**
 * Poll publish status until completion or failure
 * @param {string} publishId - Publish ID from initiateUpload
 * @param {string} accessToken - Valid access token
 * @param {Object} options - Polling options
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 60)
 * @param {number} options.intervalMs - Polling interval in ms (default: 5000)
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<TikTokPublishStatus>} Final publish status
 */
export async function waitForPublish(publishId, accessToken, options = {}) {
  const maxAttempts = options.maxAttempts || 60;
  const intervalMs = options.intervalMs || 5000;
  const onProgress = options.onProgress;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getPublishStatus(publishId, accessToken);

    if (onProgress) {
      onProgress(status, attempt + 1, maxAttempts);
    }

    // Check for terminal states
    if (status.status === 'published') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(`TikTok publish failed: ${status.failReason || 'Unknown reason'}`);
    }

    // Wait before next poll
    await sleep(intervalMs);
  }

  throw new Error('TikTok publish timed out - video may still be processing');
}

/**
 * Upload a complete video file to TikTok using chunked upload
 * This is the main entry point for video uploads
 * @param {Buffer|ArrayBuffer} videoData - Complete video file data
 * @param {TikTokVideoMetadata} metadata - Video metadata
 * @param {string} accessToken - Valid access token
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback (bytesUploaded, totalBytes, status)
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 * @returns {Promise<TikTokUploadResult>} Upload result with publish_id and status
 */
export async function uploadVideo(videoData, metadata, accessToken, options = {}) {
  const fileSize = videoData.byteLength || videoData.length;
  const onProgress = options.onProgress;
  const signal = options.signal;

  // Calculate chunk size and count
  const chunkSize = calculateChunkSize(fileSize);
  const totalChunks = Math.ceil(fileSize / chunkSize);

  // Step 1: Initialize upload session
  const session = await initiateUpload(metadata, fileSize, totalChunks, accessToken);

  if (onProgress) {
    onProgress(0, fileSize, 'initialized');
  }

  // Step 2: Upload chunks
  let bytesUploaded = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    const startByte = chunkIndex * chunkSize;
    const endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
    
    // Extract chunk data
    const chunkData = videoData.slice(startByte, endByte + 1);

    // Upload chunk with retry
    await uploadChunkWithRetry(
      session.uploadUrl,
      chunkData,
      chunkIndex,
      startByte,
      endByte,
      fileSize,
      accessToken,
      { maxRetries: RETRY_CONFIG.maxRetries }
    );

    bytesUploaded = endByte + 1;

    if (onProgress) {
      onProgress(bytesUploaded, fileSize, 'uploading');
    }
  }

  if (onProgress) {
    onProgress(fileSize, fileSize, 'processing');
  }

  // Step 3: Return session info - caller can poll for status
  return {
    publishId: session.publishId,
    status: 'uploaded',
    bytesUploaded: fileSize,
    totalBytes: fileSize,
    message: 'Video uploaded successfully. Use getPublishStatus to check processing status.',
  };
}

/**
 * Upload video from a file path (Node.js only)
 * @param {string} filePath - Path to video file
 * @param {TikTokVideoMetadata} metadata - Video metadata
 * @param {string} accessToken - Valid access token
 * @param {Object} options - Upload options
 * @returns {Promise<TikTokUploadResult>} Upload result
 */
export async function uploadVideoFromFile(filePath, metadata, accessToken, options = {}) {
  // Dynamic import for Node.js fs module
  const fs = await import('fs');
  const { stat, open } = fs.promises;

  // Get file size
  const stats = await stat(filePath);
  const fileSize = stats.size;

  // Validate
  validateVideoMetadata(metadata, fileSize);

  // Calculate chunk size and count
  const chunkSize = calculateChunkSize(fileSize);
  const totalChunks = Math.ceil(fileSize / chunkSize);

  const onProgress = options.onProgress;
  const signal = options.signal;

  // Step 1: Initialize upload session
  const session = await initiateUpload(metadata, fileSize, totalChunks, accessToken);

  if (onProgress) {
    onProgress(0, fileSize, 'initialized');
  }

  // Step 2: Upload chunks by reading file in chunks
  const fileHandle = await open(filePath, 'r');
  let bytesUploaded = 0;

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      const startByte = chunkIndex * chunkSize;
      const endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
      const chunkLength = endByte - startByte + 1;

      // Read chunk from file
      const buffer = Buffer.alloc(chunkLength);
      await fileHandle.read(buffer, 0, chunkLength, startByte);

      // Upload chunk with retry
      await uploadChunkWithRetry(
        session.uploadUrl,
        buffer,
        chunkIndex,
        startByte,
        endByte,
        fileSize,
        accessToken,
        { maxRetries: RETRY_CONFIG.maxRetries }
      );

      bytesUploaded = endByte + 1;

      if (onProgress) {
        onProgress(bytesUploaded, fileSize, 'uploading');
      }
    }
  } finally {
    await fileHandle.close();
  }

  if (onProgress) {
    onProgress(fileSize, fileSize, 'processing');
  }

  return {
    publishId: session.publishId,
    status: 'uploaded',
    bytesUploaded: fileSize,
    totalBytes: fileSize,
    message: 'Video uploaded successfully. Use getPublishStatus to check processing status.',
  };
}

// ============================================================================
// Retry and Error Handling Utilities
// ============================================================================

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
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
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
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

      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt);

      if (onRetry) {
        onRetry({ attempt: attempt + 1, maxRetries, delay, error });
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Upload chunk with automatic retry
 * @param {string} uploadUrl - Upload URL
 * @param {Buffer|ArrayBuffer} chunkData - Chunk data
 * @param {number} chunkIndex - Chunk index
 * @param {number} startByte - Start byte
 * @param {number} endByte - End byte
 * @param {number} totalSize - Total file size
 * @param {string} accessToken - Access token
 * @param {Object} options - Retry options
 * @returns {Promise<TikTokChunkUploadResult>} Chunk upload result
 */
export async function uploadChunkWithRetry(uploadUrl, chunkData, chunkIndex, startByte, endByte, totalSize, accessToken, options = {}) {
  return withRetry(
    () => uploadChunk(uploadUrl, chunkData, chunkIndex, startByte, endByte, totalSize, accessToken),
    {
      maxRetries: options.maxRetries ?? RETRY_CONFIG.maxRetries,
      onRetry: options.onRetry,
    }
  );
}

export default {
  // OAuth functions
  getAuthUrl,
  exchangeCode,
  refreshToken,
  revokeToken,
  getUserInfo,
  validateToken,
  // Upload functions
  getCreatorInfo,
  validateVideoMetadata,
  calculateChunkSize,
  initiateUpload,
  uploadChunk,
  uploadChunkWithRetry,
  getPublishStatus,
  waitForPublish,
  uploadVideo,
  uploadVideoFromFile,
  // Utilities
  isRetryableError,
  calculateBackoffDelay,
  withRetry,
  // Constants
  DEFAULT_CHUNK_SIZE,
  MAX_VIDEO_SIZE,
  MAX_VIDEO_DURATION,
  RETRY_CONFIG,
};
