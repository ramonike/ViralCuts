/**
 * YouTube Analytics API Integration
 * Provides real analytics data from YouTube Analytics API
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import { isMockModeEnabled, shouldUseMockToken } from '../config/features';

const YOUTUBE_ANALYTICS_API = 'https://youtubeanalytics.googleapis.com/v2/reports';
const YOUTUBE_DATA_API = 'https://www.googleapis.com/youtube/v3';

// Cache configuration
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const analyticsCache = new Map();

function maybeReturnMock(mockData, reason) {
  if (isMockModeEnabled()) {
    return mockData;
  }
  throw new Error(reason);
}

/**
 * Format date to YYYY-MM-DD for API requests
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range based on period selection
 * @param {string} period - '7d', '30d', '90d', or custom range
 * @returns {{ startDate: string, endDate: string }}
 */
export function getDateRange(period = '30d') {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    default:
      // Custom range - expect format "YYYY-MM-DD,YYYY-MM-DD"
      if (period.includes(',')) {
        const [start, end] = period.split(',');
        return { startDate: start, endDate: end };
      }
      startDate.setDate(endDate.getDate() - 30);
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * Generate cache key for analytics requests
 */
function getCacheKey(type, params) {
  return `${type}:${JSON.stringify(params)}`;
}

/**
 * Get cached data if valid
 */
function getCachedData(key) {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Analytics API] Using cached data for:', key);
    return cached.data;
  }
  return null;
}

/**
 * Set cache data
 */
function setCacheData(key, data) {
  analyticsCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear all analytics cache
 */
export function clearAnalyticsCache() {
  analyticsCache.clear();
  console.log('[Analytics API] Cache cleared');
}

/**
 * Clear specific cache entry
 */
export function invalidateCache(type) {
  for (const key of analyticsCache.keys()) {
    if (key.startsWith(type)) {
      analyticsCache.delete(key);
    }
  }
}

// Mock data for development/quota exceeded scenarios
const MOCK_CHANNEL_ANALYTICS = {
  views: 15432,
  watchTimeMinutes: 45678,
  subscribersGained: 234,
  subscribersLost: 12,
  estimatedRevenue: 156.78,
  averageViewDuration: 178,
  impressions: 89432,
  impressionsCTR: 4.8
};

const MOCK_VIDEO_ANALYTICS = {
  videoId: 'mock_video',
  views: 5432,
  likes: 234,
  comments: 45,
  shares: 23,
  averageViewDuration: 145,
  averageViewPercentage: 65.4,
  ctr: 5.2
};


/**
 * Fetch channel analytics from YouTube Analytics API
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period ('7d', '30d', '90d', or custom)
 * @returns {Promise<Object>} Channel analytics data
 */
export async function fetchChannelAnalytics(token, period = '30d') {
  console.log('[Analytics API] fetchChannelAnalytics called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('channel', { startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Return mock data if no token or mock token
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK channel analytics');
    return MOCK_CHANNEL_ANALYTICS;
  }
  
  try {
    // Fetch multiple metrics in parallel
    const metrics = 'views,estimatedMinutesWatched,subscribersGained,subscribersLost,averageViewDuration';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        console.warn('[Analytics API] Quota exceeded, using mock data');
        return maybeReturnMock(MOCK_CHANNEL_ANALYTICS, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Analytics API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Channel analytics response:', data);
    
    // Parse response - YouTube Analytics returns data in rows array
    if (data.rows && data.rows.length > 0) {
      const [views, watchTimeMinutes, subscribersGained, subscribersLost, averageViewDuration] = data.rows[0];
      
      const result = {
        views: views || 0,
        watchTimeMinutes: watchTimeMinutes || 0,
        subscribersGained: subscribersGained || 0,
        subscribersLost: subscribersLost || 0,
        averageViewDuration: averageViewDuration || 0,
        impressions: 0,
        impressionsCTR: 0
      };
      
      // Fetch impressions data separately (different metric group)
      try {
        const impressionsUrl = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=annotationImpressions,annotationClickThroughRate`;
        const impressionsResponse = await fetch(impressionsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        });
        
        if (impressionsResponse.ok) {
          const impressionsData = await impressionsResponse.json();
          if (impressionsData.rows && impressionsData.rows.length > 0) {
            result.impressions = impressionsData.rows[0][0] || 0;
            result.impressionsCTR = impressionsData.rows[0][1] || 0;
          }
        }
      } catch (e) {
        console.warn('[Analytics API] Could not fetch impressions:', e);
      }
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(MOCK_CHANNEL_ANALYTICS, 'Channel analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to fetch channel analytics:', error);
    
    // Return mock data on error
    if (error.message?.includes('quota')) {
      return maybeReturnMock(MOCK_CHANNEL_ANALYTICS, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Fetch analytics for a specific video
 * @param {string} token - OAuth access token
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video analytics data
 */
export async function fetchVideoAnalytics(token, videoId) {
  console.log('[Analytics API] fetchVideoAnalytics called for:', videoId);
  
  const cacheKey = getCacheKey('video', { videoId });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Return mock data if no token or mock token
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK video analytics');
    return { ...MOCK_VIDEO_ANALYTICS, videoId };
  }
  
  try {
    const { startDate, endDate } = getDateRange('30d');
    const metrics = 'views,likes,comments,shares,averageViewDuration,averageViewPercentage';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&filters=video==${videoId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Video analytics error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock({ ...MOCK_VIDEO_ANALYTICS, videoId }, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Video Analytics API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Video analytics response:', data);
    
    if (data.rows && data.rows.length > 0) {
      const [views, likes, comments, shares, averageViewDuration, averageViewPercentage] = data.rows[0];
      
      const result = {
        videoId,
        views: views || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        averageViewDuration: averageViewDuration || 0,
        averageViewPercentage: averageViewPercentage || 0,
        ctr: 0 // Will be calculated from impressions if available
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock({ ...MOCK_VIDEO_ANALYTICS, videoId }, 'Video analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to fetch video analytics:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock({ ...MOCK_VIDEO_ANALYTICS, videoId }, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}


/**
 * Fetch audience retention data for a video
 * @param {string} token - OAuth access token
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Retention data with drop-off points
 */
export async function fetchAudienceRetention(token, videoId) {
  console.log('[Analytics API] fetchAudienceRetention called for:', videoId);
  
  const cacheKey = getCacheKey('retention', { videoId });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock retention data
  const mockRetention = {
    videoId,
    averageViewDuration: 145,
    averageViewPercentage: 65.4,
    retentionCurve: [
      { position: 0, percentage: 100 },
      { position: 10, percentage: 92 },
      { position: 20, percentage: 85 },
      { position: 30, percentage: 78 },
      { position: 40, percentage: 72 },
      { position: 50, percentage: 68 },
      { position: 60, percentage: 62 },
      { position: 70, percentage: 55 },
      { position: 80, percentage: 48 },
      { position: 90, percentage: 42 },
      { position: 100, percentage: 35 }
    ],
    dropOffPoints: [
      { position: 15, severity: 'minor', dropPercentage: 8 },
      { position: 45, severity: 'moderate', dropPercentage: 12 }
    ]
  };
  
  // Return mock data if no token or mock token
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK retention data');
    return mockRetention;
  }
  
  try {
    // YouTube Analytics API doesn't provide detailed retention curve directly
    // We fetch averageViewDuration and averageViewPercentage
    const { startDate, endDate } = getDateRange('30d');
    const metrics = 'averageViewDuration,averageViewPercentage';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&filters=video==${videoId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Retention error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockRetention, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Retention API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Retention response:', data);
    
    if (data.rows && data.rows.length > 0) {
      const [averageViewDuration, averageViewPercentage] = data.rows[0];
      
      // Generate estimated retention curve based on average percentage
      const avgPct = averageViewPercentage || 50;
      const retentionCurve = [];
      const dropOffPoints = [];
      
      for (let i = 0; i <= 100; i += 10) {
        // Exponential decay model based on average retention
        const decayRate = -Math.log(avgPct / 100) / 50;
        const percentage = Math.max(0, 100 * Math.exp(-decayRate * i));
        retentionCurve.push({ position: i, percentage: Math.round(percentage * 10) / 10 });
        
        // Detect significant drop-offs
        if (i > 0) {
          const prevPct = retentionCurve[retentionCurve.length - 2].percentage;
          const drop = prevPct - percentage;
          if (drop > 10) {
            dropOffPoints.push({
              position: i,
              severity: drop > 15 ? 'major' : 'moderate',
              dropPercentage: Math.round(drop * 10) / 10
            });
          }
        }
      }
      
      const result = {
        videoId,
        averageViewDuration: averageViewDuration || 0,
        averageViewPercentage: averageViewPercentage || 0,
        retentionCurve,
        dropOffPoints
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockRetention, 'Retention analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to fetch retention:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockRetention, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Fetch traffic sources data
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period
 * @returns {Promise<Array>} Traffic sources breakdown
 */
export async function fetchTrafficSources(token, period = '30d') {
  console.log('[Analytics API] fetchTrafficSources called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('traffic', { startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock traffic data
  const mockTraffic = [
    { source: 'YouTube Search', views: 4532, percentage: 35.2 },
    { source: 'Suggested Videos', views: 3421, percentage: 26.6 },
    { source: 'Browse Features', views: 2134, percentage: 16.6 },
    { source: 'External', views: 1543, percentage: 12.0 },
    { source: 'Direct', views: 1234, percentage: 9.6 }
  ];
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK traffic data');
    return mockTraffic;
  }
  
  try {
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views&dimensions=insightTrafficSourceType&sort=-views`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockTraffic, 'YouTube Analytics quota exceeded');
      }
      throw new Error(`Traffic API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.rows && data.rows.length > 0) {
      const totalViews = data.rows.reduce((sum, row) => sum + row[1], 0);
      
      const result = data.rows.map(row => ({
        source: row[0],
        views: row[1],
        percentage: Math.round((row[1] / totalViews) * 1000) / 10
      }));
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockTraffic, 'Traffic analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to fetch traffic sources:', error);
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockTraffic, 'YouTube Analytics quota exceeded');
    }
    throw error;
  }
}

/**
 * Fetch demographics data
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period
 * @returns {Promise<Object>} Demographics breakdown
 */
export async function fetchDemographics(token, period = '30d') {
  console.log('[Analytics API] fetchDemographics called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('demographics', { startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock demographics data
  const mockDemographics = {
    ageGroups: [
      { group: '13-17', percentage: 8.5 },
      { group: '18-24', percentage: 28.3 },
      { group: '25-34', percentage: 35.2 },
      { group: '35-44', percentage: 18.4 },
      { group: '45-54', percentage: 6.8 },
      { group: '55+', percentage: 2.8 }
    ],
    gender: [
      { type: 'male', percentage: 62.4 },
      { type: 'female', percentage: 37.6 }
    ],
    topCountries: [
      { country: 'BR', views: 8543, percentage: 65.2 },
      { country: 'PT', views: 1234, percentage: 9.4 },
      { country: 'US', views: 987, percentage: 7.5 },
      { country: 'AO', views: 654, percentage: 5.0 },
      { country: 'MZ', views: 432, percentage: 3.3 }
    ]
  };
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK demographics data');
    return mockDemographics;
  }
  
  try {
    // Fetch age and gender data
    const ageGenderUrl = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=viewerPercentage&dimensions=ageGroup,gender`;
    
    const response = await fetch(ageGenderUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockDemographics, 'YouTube Analytics quota exceeded');
      }
      throw new Error(`Demographics API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process demographics data
    const result = {
      ageGroups: [],
      gender: [],
      topCountries: []
    };
    
    if (data.rows) {
      const ageMap = {};
      const genderMap = {};
      
      data.rows.forEach(row => {
        const [ageGroup, gender, percentage] = row;
        
        // Aggregate by age group
        if (!ageMap[ageGroup]) ageMap[ageGroup] = 0;
        ageMap[ageGroup] += percentage;
        
        // Aggregate by gender
        if (!genderMap[gender]) genderMap[gender] = 0;
        genderMap[gender] += percentage;
      });
      
      result.ageGroups = Object.entries(ageMap).map(([group, percentage]) => ({
        group,
        percentage: Math.round(percentage * 10) / 10
      }));
      
      result.gender = Object.entries(genderMap).map(([type, percentage]) => ({
        type,
        percentage: Math.round(percentage * 10) / 10
      }));
    }
    
    // Fetch country data separately
    try {
      const countryUrl = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views&dimensions=country&sort=-views&maxResults=5`;
      
      const countryResponse = await fetch(countryUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      
      if (countryResponse.ok) {
        const countryData = await countryResponse.json();
        if (countryData.rows) {
          const totalViews = countryData.rows.reduce((sum, row) => sum + row[1], 0);
          result.topCountries = countryData.rows.map(row => ({
            country: row[0],
            views: row[1],
            percentage: Math.round((row[1] / totalViews) * 1000) / 10
          }));
        }
      }
    } catch (e) {
      console.warn('[Analytics API] Could not fetch country data:', e);
      if (isMockModeEnabled()) {
        result.topCountries = mockDemographics.topCountries;
      }
    }
    
    setCacheData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[Analytics API] Failed to fetch demographics:', error);
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockDemographics, 'YouTube Analytics quota exceeded');
    }
    throw error;
  }
}

/**
 * Calculate audience retention percentage for a video
 * Requirements: 2.2
 * @param {string} token - OAuth access token
 * @param {string} videoId - YouTube video ID
 * @param {string} period - Date range period
 * @returns {Promise<Object>} Retention data with percentage and drop-off analysis
 */
export async function calculateAudienceRetention(token, videoId, period = '30d') {
  console.log('[Analytics API] calculateAudienceRetention called for:', videoId);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('retention-calc', { videoId, startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock retention calculation data
  const mockRetention = {
    videoId,
    averageViewDuration: 145, // seconds
    videoDuration: 240, // seconds
    retentionPercentage: 60.42,
    dropOffPoints: [
      { timestamp: 30, percentage: 85, dropSeverity: 'minor' },
      { timestamp: 120, percentage: 55, dropSeverity: 'major' }
    ],
    period: { startDate, endDate }
  };
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK retention calculation data');
    return mockRetention;
  }
  
  try {
    // First, get video duration from YouTube Data API
    let videoDuration = 240; // Default fallback
    
    try {
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}`;
      const videoInfoResponse = await fetch(videoInfoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      
      if (videoInfoResponse.ok) {
        const videoInfo = await videoInfoResponse.json();
        if (videoInfo.items && videoInfo.items.length > 0) {
          // Parse ISO 8601 duration (e.g., "PT4M13S" = 4 minutes 13 seconds)
          const duration = videoInfo.items[0].contentDetails.duration;
          videoDuration = parseDuration(duration);
        }
      }
    } catch (e) {
      console.warn('[Analytics API] Could not fetch video duration:', e);
    }
    
    // Fetch average view duration from Analytics API
    const metrics = 'averageViewDuration,averageViewPercentage';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&filters=video==${videoId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Retention calculation error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockRetention, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Retention Calculation API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Retention calculation response:', data);
    
    if (data.rows && data.rows.length > 0) {
      const [averageViewDuration, averageViewPercentage] = data.rows[0];
      
      // Calculate retention percentage
      const retentionPercentage = videoDuration > 0 
        ? (averageViewDuration / videoDuration) * 100 
        : averageViewPercentage || 0;
      
      // Identify drop-off points based on retention curve estimation
      const dropOffPoints = identifyDropOffPoints(averageViewPercentage || retentionPercentage, videoDuration);
      
      const result = {
        videoId,
        averageViewDuration: Math.round(averageViewDuration || 0),
        videoDuration,
        retentionPercentage: Math.round(retentionPercentage * 100) / 100,
        dropOffPoints,
        period: { startDate, endDate }
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockRetention, 'Retention calculation unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to calculate retention:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockRetention, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Helper function to parse ISO 8601 duration to seconds
 * @param {string} duration - ISO 8601 duration string (e.g., "PT4M13S")
 * @returns {number} Duration in seconds
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Helper function to identify drop-off points based on retention percentage
 * @param {number} avgRetention - Average retention percentage
 * @param {number} videoDuration - Video duration in seconds
 * @returns {Array} Array of drop-off points
 */
function identifyDropOffPoints(avgRetention, videoDuration) {
  const dropOffPoints = [];
  
  // Estimate drop-off points using exponential decay model
  // Most videos have drop-offs at intro (10-15%), middle (40-50%), and end (80-90%)
  const checkPoints = [
    { position: 0.15, label: 'intro' },
    { position: 0.45, label: 'middle' },
    { position: 0.75, label: 'late' }
  ];
  
  checkPoints.forEach(({ position, label }) => {
    const timestamp = Math.round(videoDuration * position);
    const decayRate = -Math.log(avgRetention / 100) / 50;
    const expectedRetention = 100 * Math.exp(-decayRate * (position * 100));
    
    // If expected retention drops significantly, mark as drop-off point
    const drop = 100 - expectedRetention;
    if (drop > 15) {
      dropOffPoints.push({
        timestamp,
        percentage: Math.round(expectedRetention * 10) / 10,
        dropSeverity: drop > 30 ? 'major' : drop > 20 ? 'moderate' : 'minor',
        label
      });
    }
  });
  
  return dropOffPoints;
}

/**
 * Analyze best publishing times based on view patterns
 * Requirements: 2.3
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period
 * @returns {Promise<Object>} Best times analysis with recommendations
 */
export async function analyzeBestPublishingTimes(token, period = '30d') {
  console.log('[Analytics API] analyzeBestPublishingTimes called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('best-times', { startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock best times data
  const mockBestTimes = {
    hourlyBreakdown: generateMockHourlyData(),
    peakHours: [
      { hour: 18, dayOfWeek: 'all', avgViews: 1234, score: 95 },
      { hour: 20, dayOfWeek: 'all', avgViews: 1156, score: 92 },
      { hour: 19, dayOfWeek: 'all', avgViews: 1089, score: 88 }
    ],
    recommendations: [
      {
        time: '18:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        reason: 'Highest engagement during weekday evenings',
        confidence: 'high'
      },
      {
        time: '20:00',
        days: ['Saturday', 'Sunday'],
        reason: 'Strong weekend evening performance',
        confidence: 'high'
      }
    ],
    period: { startDate, endDate }
  };
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK best times data');
    return mockBestTimes;
  }
  
  try {
    // Fetch views by hour of day
    const metrics = 'views';
    const dimensions = 'hour';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=${dimensions}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Best times error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockBestTimes, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Best Times API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Best times response:', data);
    
    if (data.rows && data.rows.length > 0) {
      // Process hourly data
      const hourlyBreakdown = data.rows.map(row => ({
        hour: parseInt(row[0]),
        views: row[1] || 0
      }));
      
      // Sort by views to find peak hours
      const sortedHours = [...hourlyBreakdown].sort((a, b) => b.views - a.views);
      const maxViews = sortedHours[0]?.views || 1;
      
      // Get top 3 peak hours
      const peakHours = sortedHours.slice(0, 3).map(item => ({
        hour: item.hour,
        dayOfWeek: 'all',
        avgViews: item.views,
        score: Math.round((item.views / maxViews) * 100)
      }));
      
      // Generate recommendations based on peak hours
      const recommendations = generateRecommendations(peakHours);
      
      const result = {
        hourlyBreakdown,
        peakHours,
        recommendations,
        period: { startDate, endDate }
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockBestTimes, 'Best times analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to analyze best times:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockBestTimes, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Helper function to generate mock hourly data
 * @returns {Array} Array of hourly view data
 */
function generateMockHourlyData() {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    // Simulate realistic view patterns (higher in evening)
    let baseViews = 300;
    if (i >= 17 && i <= 22) baseViews = 1000; // Evening peak
    else if (i >= 12 && i <= 16) baseViews = 600; // Afternoon
    else if (i >= 6 && i <= 11) baseViews = 400; // Morning
    
    hours.push({
      hour: i,
      views: baseViews + ((i * 37) % 200)
    });
  }
  return hours;
}

/**
 * Helper function to generate publishing recommendations
 * @param {Array} peakHours - Array of peak hour data
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(peakHours) {
  const recommendations = [];
  
  peakHours.forEach((peak, index) => {
    const hour = peak.hour;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    let days = [];
    let reason = '';
    let confidence = 'high';
    
    // Categorize by time of day
    if (hour >= 17 && hour <= 22) {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      reason = 'Highest engagement during weekday evenings';
    } else if (hour >= 12 && hour <= 16) {
      days = ['Saturday', 'Sunday'];
      reason = 'Strong afternoon performance on weekends';
    } else if (hour >= 6 && hour <= 11) {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      reason = 'Good morning engagement on weekdays';
      confidence = 'medium';
    } else {
      days = ['Saturday', 'Sunday'];
      reason = 'Late night audience on weekends';
      confidence = 'medium';
    }
    
    if (index === 0) {
      recommendations.push({
        time: timeStr,
        days,
        reason,
        confidence
      });
    }
  });
  
  return recommendations;
}

/**
 * Track subscriber growth over time
 * Requirements: 2.4
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period
 * @returns {Promise<Object>} Subscriber growth data with evolution chart
 */
export async function trackSubscriberGrowth(token, period = '30d') {
  console.log('[Analytics API] trackSubscriberGrowth called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('subscriber-growth', { startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock subscriber growth data
  const mockGrowth = {
    totalGained: 234,
    totalLost: 12,
    netGrowth: 222,
    growthRate: 2.8, // percentage
    dailyData: generateMockDailyGrowth(startDate, endDate),
    period: { startDate, endDate }
  };
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK subscriber growth data');
    return mockGrowth;
  }
  
  try {
    // Fetch subscriber data with daily breakdown
    const metrics = 'subscribersGained,subscribersLost';
    const dimensions = 'day';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=${dimensions}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Subscriber growth error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockGrowth, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Subscriber Growth API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Subscriber growth response:', data);
    
    if (data.rows && data.rows.length > 0) {
      // Process daily data
      let totalGained = 0;
      let totalLost = 0;
      let cumulativeNet = 0;
      
      const dailyData = data.rows.map(row => {
        const [date, gained, lost] = row;
        const netChange = (gained || 0) - (lost || 0);
        
        totalGained += gained || 0;
        totalLost += lost || 0;
        cumulativeNet += netChange;
        
        return {
          date,
          gained: gained || 0,
          lost: lost || 0,
          netChange,
          cumulativeNet
        };
      });
      
      const netGrowth = totalGained - totalLost;
      
      // Calculate growth rate (assuming we know starting subscriber count)
      // For now, use a percentage based on net growth
      const growthRate = totalGained > 0 ? (netGrowth / totalGained) * 100 : 0;
      
      const result = {
        totalGained,
        totalLost,
        netGrowth,
        growthRate: Math.round(growthRate * 100) / 100,
        dailyData,
        period: { startDate, endDate }
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockGrowth, 'Subscriber growth unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to track subscriber growth:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockGrowth, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Helper function to generate mock daily growth data
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of daily growth data
 */
function generateMockDailyGrowth(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyData = [];
  let cumulativeNet = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(new Date(d));
    const dayOfMonth = d.getDate();
    const gained = 5 + ((dayOfMonth * 7) % 15); // 5-19 gained per day
    const lost = (dayOfMonth * 2) % 3; // 0-2 lost per day
    const netChange = gained - lost;
    cumulativeNet += netChange;
    
    dailyData.push({
      date: dateStr,
      gained,
      lost,
      netChange,
      cumulativeNet
    });
  }
  
  return dailyData;
}

/**
 * Calculate CTR (Click-Through Rate) for a video
 * Requirements: 2.1
 * @param {string} token - OAuth access token
 * @param {string} videoId - YouTube video ID
 * @param {string} period - Date range period
 * @returns {Promise<Object>} CTR data with impressions and clicks
 */
export async function calculateVideoCTR(token, videoId, period = '30d') {
  console.log('[Analytics API] calculateVideoCTR called for:', videoId);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('ctr', { videoId, startDate, endDate });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock CTR data
  const mockCTR = {
    videoId,
    impressions: 12543,
    clicks: 654,
    ctr: 5.21,
    period: { startDate, endDate }
  };
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK CTR data');
    return mockCTR;
  }
  
  try {
    // Fetch impressions and click-through rate from YouTube Analytics API
    const metrics = 'cardImpressions,cardClicks,cardClickRate';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&filters=video==${videoId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] CTR error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockCTR, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`CTR API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] CTR response:', data);
    
    if (data.rows && data.rows.length > 0) {
      const [impressions, clicks, clickRate] = data.rows[0];
      
      // Calculate CTR as percentage
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      
      const result = {
        videoId,
        impressions: impressions || 0,
        clicks: clicks || 0,
        ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
        period: { startDate, endDate }
      };
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockCTR, 'CTR analytics unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to calculate CTR:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockCTR, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

/**
 * Calculate CTR for all videos in a channel
 * Requirements: 2.1
 * @param {string} token - OAuth access token
 * @param {string} period - Date range period
 * @param {number} maxResults - Maximum number of videos to fetch
 * @returns {Promise<Array>} Array of video CTR data
 */
export async function calculateChannelCTR(token, period = '30d', maxResults = 10) {
  console.log('[Analytics API] calculateChannelCTR called, period:', period);
  
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = getCacheKey('channel-ctr', { startDate, endDate, maxResults });
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  // Mock channel CTR data
  const mockChannelCTR = [
    { videoId: 'video1', title: 'Video 1', impressions: 12543, clicks: 654, ctr: 5.21 },
    { videoId: 'video2', title: 'Video 2', impressions: 9876, clicks: 432, ctr: 4.37 },
    { videoId: 'video3', title: 'Video 3', impressions: 8765, clicks: 567, ctr: 6.47 },
    { videoId: 'video4', title: 'Video 4', impressions: 7654, clicks: 321, ctr: 4.19 },
    { videoId: 'video5', title: 'Video 5', impressions: 6543, clicks: 289, ctr: 4.42 }
  ];
  
  if (shouldUseMockToken(token)) {
    console.log('[Analytics API] Using MOCK channel CTR data');
    return mockChannelCTR;
  }
  
  try {
    // Fetch CTR data grouped by video
    const metrics = 'cardImpressions,cardClicks';
    const url = `${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=video&sort=-cardImpressions&maxResults=${maxResults}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Analytics API] Channel CTR error:', errorText);
      
      if (errorText.includes('quotaExceeded')) {
        return maybeReturnMock(mockChannelCTR, 'YouTube Analytics quota exceeded');
      }
      
      throw new Error(`Channel CTR API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Analytics API] Channel CTR response:', data);
    
    if (data.rows && data.rows.length > 0) {
      const result = data.rows.map(row => {
        const [videoId, impressions, clicks] = row;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        
        return {
          videoId,
          impressions: impressions || 0,
          clicks: clicks || 0,
          ctr: Math.round(ctr * 100) / 100
        };
      });
      
      setCacheData(cacheKey, result);
      return result;
    }
    
    return maybeReturnMock(mockChannelCTR, 'Channel CTR unavailable');
  } catch (error) {
    console.error('[Analytics API] Failed to calculate channel CTR:', error);
    
    if (error.message?.includes('quota')) {
      return maybeReturnMock(mockChannelCTR, 'YouTube Analytics quota exceeded');
    }
    
    throw error;
  }
}

export default {
  fetchChannelAnalytics,
  fetchVideoAnalytics,
  fetchAudienceRetention,
  fetchTrafficSources,
  fetchDemographics,
  calculateVideoCTR,
  calculateChannelCTR,
  calculateAudienceRetention,
  analyzeBestPublishingTimes,
  trackSubscriberGrowth,
  getDateRange,
  clearAnalyticsCache,
  invalidateCache
};
