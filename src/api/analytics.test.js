/**
 * Analytics API Tests
 * Tests for real analytics data integration, caching, and period filtering
 * Requirements: 1.1-1.5, 2.1-2.4, 3.1-3.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from './analytics';

// Mock fetch globally
global.fetch = vi.fn();

describe('Analytics API - Date Range Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should generate correct date range for 7d period', () => {
    const { startDate, endDate } = getDateRange('7d');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(7);
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should generate correct date range for 30d period', () => {
    const { startDate, endDate } = getDateRange('30d');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(30);
  });

  it('should generate correct date range for 90d period', () => {
    const { startDate, endDate } = getDateRange('90d');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(90);
  });

  it('should handle custom date range', () => {
    const customRange = '2024-01-01,2024-01-31';
    const { startDate, endDate } = getDateRange(customRange);
    
    expect(startDate).toBe('2024-01-01');
    expect(endDate).toBe('2024-01-31');
  });

  it('should default to 30d for invalid period', () => {
    const { startDate, endDate } = getDateRange('invalid');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(30);
  });
});

describe('Analytics API - Mock vs Real Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should return mock data when no token provided', async () => {
    const result = await fetchChannelAnalytics(null, '30d');
    
    expect(result).toBeDefined();
    expect(result.views).toBeDefined();
    expect(result.watchTimeMinutes).toBeDefined();
    expect(result.subscribersGained).toBeDefined();
    expect(result.subscribersLost).toBeDefined();
    expect(result.averageViewDuration).toBeDefined();
    expect(result.impressions).toBeDefined();
    expect(result.impressionsCTR).toBeDefined();
  });

  it('should return mock data when MOCK_TOKEN provided', async () => {
    const result = await fetchChannelAnalytics('MOCK_TOKEN_123', '30d');
    
    expect(result).toBeDefined();
    expect(result.views).toBeGreaterThan(0);
    expect(result.watchTimeMinutes).toBeGreaterThan(0);
  });

  it('should attempt real API call with valid token', async () => {
    const mockResponse = {
      rows: [[1000, 5000, 50, 5, 120]]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    
    expect(global.fetch).toHaveBeenCalled();
    expect(result.views).toBe(1000);
    expect(result.watchTimeMinutes).toBe(5000);
    expect(result.subscribersGained).toBe(50);
  });

  it('should fallback to mock data on quota exceeded', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Quota Exceeded',
      text: async () => 'quotaExceeded'
    });
    
    const result = await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    
    expect(result).toBeDefined();
    expect(result.views).toBeGreaterThan(0);
  });

  it('should throw error on non-quota API errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      text: async () => 'Invalid credentials'
    });
    
    await expect(fetchChannelAnalytics('INVALID_TOKEN', '30d')).rejects.toThrow();
  });
});

describe('Analytics API - Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should cache channel analytics data', async () => {
    const mockResponse = {
      rows: [[1000, 5000, 50, 5, 120]]
    };
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    // First call - should hit API (2 calls: main + impressions)
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    const firstCallCount = global.fetch.mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0);
    
    // Second call - should use cache (no additional calls)
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    expect(global.fetch).toHaveBeenCalledTimes(firstCallCount); // Same count
  });

  it('should clear cache when clearAnalyticsCache is called', async () => {
    const mockResponse = {
      rows: [[1000, 5000, 50, 5, 120]]
    };
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    // First call
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    const firstCallCount = global.fetch.mock.calls.length;
    
    // Clear cache
    clearAnalyticsCache();
    
    // Second call - should hit API again
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    expect(global.fetch.mock.calls.length).toBeGreaterThan(firstCallCount);
  });

  it('should invalidate specific cache entries', async () => {
    const mockResponse = {
      rows: [[1000, 5000, 50, 5, 120]]
    };
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    // Fetch channel analytics
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    const firstCallCount = global.fetch.mock.calls.length;
    
    // Invalidate channel cache
    invalidateCache('channel');
    
    // Should hit API again
    await fetchChannelAnalytics('REAL_TOKEN_123', '30d');
    expect(global.fetch.mock.calls.length).toBeGreaterThan(firstCallCount);
  });
});

describe('Analytics API - Video Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should fetch video analytics with mock data', async () => {
    const result = await fetchVideoAnalytics('MOCK_TOKEN', 'video123');
    
    expect(result).toBeDefined();
    expect(result.videoId).toBe('video123');
    expect(result.views).toBeDefined();
    expect(result.likes).toBeDefined();
    expect(result.comments).toBeDefined();
    expect(result.shares).toBeDefined();
    expect(result.averageViewDuration).toBeDefined();
    expect(result.averageViewPercentage).toBeDefined();
  });

  it('should fetch video analytics with real API', async () => {
    const mockResponse = {
      rows: [[5000, 200, 50, 25, 180, 75]]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await fetchVideoAnalytics('REAL_TOKEN', 'video123');
    
    expect(result.videoId).toBe('video123');
    expect(result.views).toBe(5000);
    expect(result.likes).toBe(200);
    expect(result.comments).toBe(50);
  });
});

describe('Analytics API - CTR Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should calculate video CTR correctly', async () => {
    const mockResponse = {
      rows: [[10000, 500, 5.0]]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await calculateVideoCTR('REAL_TOKEN', 'video123', '30d');
    
    expect(result.videoId).toBe('video123');
    expect(result.impressions).toBe(10000);
    expect(result.clicks).toBe(500);
    expect(result.ctr).toBe(5);
  });

  it('should handle zero impressions gracefully', async () => {
    const mockResponse = {
      rows: [[0, 0, 0]]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await calculateVideoCTR('REAL_TOKEN', 'video123', '30d');
    
    expect(result.ctr).toBe(0);
  });

  it('should fetch channel CTR for multiple videos', async () => {
    const mockResponse = {
      rows: [
        ['video1', 10000, 500],
        ['video2', 8000, 400],
        ['video3', 6000, 300]
      ]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await calculateChannelCTR('REAL_TOKEN', '30d', 3);
    
    expect(result).toHaveLength(3);
    expect(result[0].videoId).toBe('video1');
    expect(result[0].ctr).toBe(5);
    expect(result[1].ctr).toBe(5);
  });
});

describe('Analytics API - Audience Retention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should fetch audience retention data', async () => {
    const result = await fetchAudienceRetention('MOCK_TOKEN', 'video123');
    
    expect(result).toBeDefined();
    expect(result.videoId).toBe('video123');
    expect(result.averageViewDuration).toBeDefined();
    expect(result.averageViewPercentage).toBeDefined();
    expect(result.retentionCurve).toBeDefined();
    expect(result.dropOffPoints).toBeDefined();
    expect(Array.isArray(result.retentionCurve)).toBe(true);
    expect(Array.isArray(result.dropOffPoints)).toBe(true);
  });

  it('should calculate retention percentage correctly', async () => {
    const mockAnalyticsResponse = {
      rows: [[120, 60]]
    };
    
    const mockVideoInfoResponse = {
      items: [{
        contentDetails: {
          duration: 'PT4M0S' // 4 minutes = 240 seconds
        }
      }]
    };
    
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoInfoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsResponse
      });
    
    const result = await calculateAudienceRetention('REAL_TOKEN', 'video123', '30d');
    
    expect(result.videoId).toBe('video123');
    expect(result.averageViewDuration).toBe(120);
    expect(result.videoDuration).toBe(240);
    expect(result.retentionPercentage).toBe(50);
  });

  it('should identify drop-off points', async () => {
    const result = await fetchAudienceRetention('MOCK_TOKEN', 'video123');
    
    expect(result.dropOffPoints).toBeDefined();
    expect(Array.isArray(result.dropOffPoints)).toBe(true);
    
    if (result.dropOffPoints.length > 0) {
      const dropOff = result.dropOffPoints[0];
      expect(dropOff.position).toBeDefined();
      expect(dropOff.severity).toBeDefined();
      expect(['minor', 'moderate', 'major']).toContain(dropOff.severity);
    }
  });
});

describe('Analytics API - Best Publishing Times', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should analyze best publishing times', async () => {
    const result = await analyzeBestPublishingTimes('MOCK_TOKEN', '30d');
    
    expect(result).toBeDefined();
    expect(result.hourlyBreakdown).toBeDefined();
    expect(result.peakHours).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.hourlyBreakdown)).toBe(true);
    expect(Array.isArray(result.peakHours)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should identify peak hours correctly', async () => {
    const mockResponse = {
      rows: [
        [18, 1500],
        [19, 1400],
        [20, 1300],
        [12, 800],
        [8, 400]
      ]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await analyzeBestPublishingTimes('REAL_TOKEN', '30d');
    
    expect(result.peakHours).toBeDefined();
    expect(result.peakHours.length).toBeGreaterThan(0);
    expect(result.peakHours[0].hour).toBe(18);
    expect(result.peakHours[0].score).toBe(100);
  });

  it('should provide actionable recommendations', async () => {
    const result = await analyzeBestPublishingTimes('MOCK_TOKEN', '30d');
    
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    
    const rec = result.recommendations[0];
    expect(rec.time).toBeDefined();
    expect(rec.days).toBeDefined();
    expect(rec.reason).toBeDefined();
    expect(rec.confidence).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(rec.confidence);
  });
});

describe('Analytics API - Subscriber Growth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should track subscriber growth', async () => {
    const result = await trackSubscriberGrowth('MOCK_TOKEN', '30d');
    
    expect(result).toBeDefined();
    expect(result.totalGained).toBeDefined();
    expect(result.totalLost).toBeDefined();
    expect(result.netGrowth).toBeDefined();
    expect(result.growthRate).toBeDefined();
    expect(result.dailyData).toBeDefined();
    expect(Array.isArray(result.dailyData)).toBe(true);
  });

  it('should calculate net growth correctly', async () => {
    const mockResponse = {
      rows: [
        ['2024-01-01', 10, 2],
        ['2024-01-02', 15, 3],
        ['2024-01-03', 12, 1]
      ]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await trackSubscriberGrowth('REAL_TOKEN', '7d');
    
    expect(result.totalGained).toBe(37);
    expect(result.totalLost).toBe(6);
    expect(result.netGrowth).toBe(31);
  });

  it('should provide daily breakdown', async () => {
    const result = await trackSubscriberGrowth('MOCK_TOKEN', '7d');
    
    expect(result.dailyData).toBeDefined();
    expect(result.dailyData.length).toBeGreaterThan(0);
    
    const day = result.dailyData[0];
    expect(day.date).toBeDefined();
    expect(day.gained).toBeDefined();
    expect(day.lost).toBeDefined();
    expect(day.netChange).toBeDefined();
    expect(day.cumulativeNet).toBeDefined();
  });
});

describe('Analytics API - Traffic Sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should fetch traffic sources', async () => {
    const result = await fetchTrafficSources('MOCK_TOKEN', '30d');
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    const source = result[0];
    expect(source.source).toBeDefined();
    expect(source.views).toBeDefined();
    expect(source.percentage).toBeDefined();
  });

  it('should calculate percentages correctly', async () => {
    const mockResponse = {
      rows: [
        ['YouTube Search', 5000],
        ['Suggested Videos', 3000],
        ['External', 2000]
      ]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await fetchTrafficSources('REAL_TOKEN', '30d');
    
    expect(result[0].percentage).toBe(50);
    expect(result[1].percentage).toBe(30);
    expect(result[2].percentage).toBe(20);
  });
});

describe('Analytics API - Demographics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalyticsCache();
  });

  it('should fetch demographics data', async () => {
    const result = await fetchDemographics('MOCK_TOKEN', '30d');
    
    expect(result).toBeDefined();
    expect(result.ageGroups).toBeDefined();
    expect(result.gender).toBeDefined();
    expect(result.topCountries).toBeDefined();
    expect(Array.isArray(result.ageGroups)).toBe(true);
    expect(Array.isArray(result.gender)).toBe(true);
    expect(Array.isArray(result.topCountries)).toBe(true);
  });

  it('should have valid age group data', async () => {
    const result = await fetchDemographics('MOCK_TOKEN', '30d');
    
    expect(result.ageGroups.length).toBeGreaterThan(0);
    
    const ageGroup = result.ageGroups[0];
    expect(ageGroup.group).toBeDefined();
    expect(ageGroup.percentage).toBeDefined();
    expect(ageGroup.percentage).toBeGreaterThanOrEqual(0);
    expect(ageGroup.percentage).toBeLessThanOrEqual(100);
  });

  it('should have valid gender data', async () => {
    const result = await fetchDemographics('MOCK_TOKEN', '30d');
    
    expect(result.gender.length).toBeGreaterThan(0);
    
    const gender = result.gender[0];
    expect(gender.type).toBeDefined();
    expect(gender.percentage).toBeDefined();
    expect(gender.percentage).toBeGreaterThanOrEqual(0);
    expect(gender.percentage).toBeLessThanOrEqual(100);
  });

  it('should have valid country data', async () => {
    const result = await fetchDemographics('MOCK_TOKEN', '30d');
    
    expect(result.topCountries.length).toBeGreaterThan(0);
    
    const country = result.topCountries[0];
    expect(country.country).toBeDefined();
    expect(country.views).toBeDefined();
    expect(country.percentage).toBeDefined();
  });
});
