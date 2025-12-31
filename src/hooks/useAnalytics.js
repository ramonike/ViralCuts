/**
 * useAnalytics Hook
 * Provides analytics data with date range filtering and caching
 * Requirements: 1.5
 */

import { useState, useCallback, useEffect } from 'react';
import {
  fetchChannelAnalytics,
  fetchVideoAnalytics,
  fetchAudienceRetention,
  fetchTrafficSources,
  fetchDemographics,
  clearAnalyticsCache,
  getDateRange
} from '../api/analytics';

// Available date range options
export const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' }
];

/**
 * Hook for managing analytics data with date range filtering
 * @param {string} token - YouTube OAuth token
 * @returns {Object} Analytics state and functions
 */
export function useAnalytics(token) {
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Analytics data state
  const [channelAnalytics, setChannelAnalytics] = useState(null);
  const [videoAnalytics, setVideoAnalytics] = useState({});
  const [retentionData, setRetentionData] = useState({});
  const [trafficSources, setTrafficSources] = useState([]);
  const [demographics, setDemographics] = useState(null);
  
  // Get effective period string (handles custom range)
  const getEffectivePeriod = useCallback(() => {
    if (period === 'custom' && customRange.start && customRange.end) {
      return `${customRange.start},${customRange.end}`;
    }
    return period;
  }, [period, customRange]);
  
  // Fetch channel analytics
  const loadChannelAnalytics = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (forceRefresh) {
        clearAnalyticsCache();
      }
      
      const effectivePeriod = getEffectivePeriod();
      const data = await fetchChannelAnalytics(token, effectivePeriod);
      setChannelAnalytics(data);
    } catch (err) {
      console.error('[useAnalytics] Failed to load channel analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, getEffectivePeriod]);
  
  // Fetch video-specific analytics
  const loadVideoAnalytics = useCallback(async (videoId) => {
    if (!token || !videoId) return null;
    
    try {
      const data = await fetchVideoAnalytics(token, videoId);
      setVideoAnalytics(prev => ({ ...prev, [videoId]: data }));
      return data;
    } catch (err) {
      console.error('[useAnalytics] Failed to load video analytics:', err);
      return null;
    }
  }, [token]);
  
  // Fetch audience retention for a video
  const loadRetention = useCallback(async (videoId) => {
    if (!token || !videoId) return null;
    
    try {
      const data = await fetchAudienceRetention(token, videoId);
      setRetentionData(prev => ({ ...prev, [videoId]: data }));
      return data;
    } catch (err) {
      console.error('[useAnalytics] Failed to load retention:', err);
      return null;
    }
  }, [token]);
  
  // Fetch traffic sources
  const loadTrafficSources = useCallback(async () => {
    if (!token) return;
    
    try {
      const effectivePeriod = getEffectivePeriod();
      const data = await fetchTrafficSources(token, effectivePeriod);
      setTrafficSources(data);
    } catch (err) {
      console.error('[useAnalytics] Failed to load traffic sources:', err);
    }
  }, [token, getEffectivePeriod]);
  
  // Fetch demographics
  const loadDemographics = useCallback(async () => {
    if (!token) return;
    
    try {
      const effectivePeriod = getEffectivePeriod();
      const data = await fetchDemographics(token, effectivePeriod);
      setDemographics(data);
    } catch (err) {
      console.error('[useAnalytics] Failed to load demographics:', err);
    }
  }, [token, getEffectivePeriod]);
  
  // Load all analytics data
  const loadAllAnalytics = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (forceRefresh) {
        clearAnalyticsCache();
      }
      
      const effectivePeriod = getEffectivePeriod();
      
      // Fetch all data in parallel
      const [channel, traffic, demo] = await Promise.allSettled([
        fetchChannelAnalytics(token, effectivePeriod),
        fetchTrafficSources(token, effectivePeriod),
        fetchDemographics(token, effectivePeriod)
      ]);
      
      if (channel.status === 'fulfilled') setChannelAnalytics(channel.value);
      if (traffic.status === 'fulfilled') setTrafficSources(traffic.value);
      if (demo.status === 'fulfilled') setDemographics(demo.value);
      
    } catch (err) {
      console.error('[useAnalytics] Failed to load analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, getEffectivePeriod]);
  
  // Refresh all data (clears cache)
  const refresh = useCallback(() => {
    return loadAllAnalytics(true);
  }, [loadAllAnalytics]);
  
  // Change date range period
  const changePeriod = useCallback((newPeriod) => {
    setPeriod(newPeriod);
  }, []);
  
  // Set custom date range
  const setCustomDateRange = useCallback((start, end) => {
    setCustomRange({ start, end });
    setPeriod('custom');
  }, []);
  
  // Auto-load when token or period changes
  useEffect(() => {
    if (token) {
      loadAllAnalytics();
    }
  }, [token, period, customRange.start, customRange.end]);
  
  // Get current date range info
  const dateRangeInfo = getDateRange(getEffectivePeriod());
  
  return {
    // State
    loading,
    error,
    period,
    customRange,
    dateRangeInfo,
    
    // Data
    channelAnalytics,
    videoAnalytics,
    retentionData,
    trafficSources,
    demographics,
    
    // Actions
    changePeriod,
    setCustomDateRange,
    refresh,
    loadChannelAnalytics,
    loadVideoAnalytics,
    loadRetention,
    loadTrafficSources,
    loadDemographics,
    loadAllAnalytics
  };
}

export default useAnalytics;
