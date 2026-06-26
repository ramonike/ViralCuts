/**
 * Platform configuration for multi-platform upload support
 * 
 * This file centralizes all platform-specific configuration
 * including API endpoints, OAuth settings, and video requirements.
 */

export const platformConfig = {
  tiktok: {
    name: 'TikTok',
    enabled: !!process.env.TIKTOK_CLIENT_KEY,
    
    // OAuth Configuration
    oauth: {
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback',
      scopes: ['user.info.basic', 'user.info.stats', 'user.info.profile', 'video.upload', 'video.publish'],
    },
    
    // API Endpoints
    endpoints: {
      authorize: 'https://www.tiktok.com/v2/auth/authorize/',
      token: 'https://open.tiktokapis.com/v2/oauth/token/',
      userInfo: 'https://open.tiktokapis.com/v2/user/info/',
      videoInit: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
      publishStatus: 'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      creatorInfo: 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
    },
    
    // Video Requirements
    videoRequirements: {
      maxDuration: 600, // 10 minutes in seconds
      minDuration: 1,
      maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB in bytes
      supportedFormats: ['mp4', 'webm', 'mov'],
      recommendedAspectRatio: '9:16',
      supportedAspectRatios: ['9:16', '1:1', '16:9'],
      minResolution: 720,
      recommendedResolution: 1080,
    },
    
    // Rate Limits
    rateLimits: {
      uploadsPerDay: 20,
      apiCallsPerDay: 1000,
    },
    
    // Privacy Options
    privacyOptions: [
      { value: 'PUBLIC_TO_EVERYONE', label: 'Public' },
      { value: 'MUTUAL_FOLLOW_FRIENDS', label: 'Friends' },
      { value: 'SELF_ONLY', label: 'Private' },
    ],
  },
  
  youtube: {
    name: 'YouTube',
    enabled: !!process.env.GOOGLE_CLIENT_ID,
    
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback',
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
    },
    
    videoRequirements: {
      maxDuration: 43200, // 12 hours in seconds
      maxFileSize: 256 * 1024 * 1024 * 1024, // 256GB
      supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
    },
  },
  
  instagram: {
    name: 'Instagram Reels',
    enabled: !!process.env.INSTAGRAM_APP_ID,
    
    oauth: {
      appId: process.env.INSTAGRAM_APP_ID,
      appSecret: process.env.INSTAGRAM_APP_SECRET,
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback',
      scopes: ['instagram_basic', 'instagram_content_publish'],
    },
    
    endpoints: {
      authorize: 'https://api.instagram.com/oauth/authorize',
      token: 'https://api.instagram.com/oauth/access_token',
      graphApi: 'https://graph.instagram.com',
    },
    
    videoRequirements: {
      maxDuration: 90, // 90 seconds for Reels
      minDuration: 3,
      maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
      supportedFormats: ['mp4', 'mov'],
      recommendedAspectRatio: '9:16',
      minResolution: 720,
    },
  },
};

/**
 * Get configuration for a specific platform
 * @param {string} platformId - Platform identifier (tiktok, youtube, instagram)
 * @returns {object|null} Platform configuration or null if not found
 */
export function getPlatformConfig(platformId) {
  return platformConfig[platformId] || null;
}

/**
 * Get all enabled platforms
 * @returns {object[]} Array of enabled platform configurations
 */
export function getEnabledPlatforms() {
  return Object.entries(platformConfig)
    .filter(([_, config]) => config.enabled)
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Check if a platform is properly configured
 * @param {string} platformId - Platform identifier
 * @returns {boolean} True if platform is configured and enabled
 */
export function isPlatformConfigured(platformId) {
  const config = platformConfig[platformId];
  return config?.enabled || false;
}

export default platformConfig;
