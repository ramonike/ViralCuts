/**
 * Command Center Integration Hook
 * Provides seamless integration with existing systems:
 * - Upload Queue
 * - Settings
 * - Analytics
 * Requirements: 9.2, 9.3, 9.5
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getMigrationService, getActiveSystem } from './MigrationService';

// Storage key for command center preferences
const COMMAND_CENTER_PREFS_KEY = 'viralcuts-command-center-preferences';

/**
 * Hook for integrating command center with existing upload queue
 * @param {Object} uploadQueueHook - The useUploadQueue hook result
 * @returns {Object} Enhanced upload queue integration
 */
export function useUploadQueueIntegration(uploadQueueHook) {
  const {
    uploadQueue = [],
    addToUploadQueue,
    removeQueueItem,
    markQueueStatus,
    startUploadQueue,
    rescheduleVideo,
    updateVideoMetadata,
  } = uploadQueueHook || {};

  // Calculate upload-related metrics for command center
  const uploadMetrics = useMemo(() => {
    if (!uploadQueue || !Array.isArray(uploadQueue)) {
      return {
        pendingUploads: 0,
        scheduledUploads: 0,
        completedToday: 0,
        failedUploads: 0,
        hasItemsRequiringAttention: false,
      };
    }

    const today = new Date().toLocaleDateString('en-CA');
    
    return {
      pendingUploads: uploadQueue.filter(item => item.status === 'ready').length,
      scheduledUploads: uploadQueue.filter(item => item.scheduledAt && item.status === 'ready').length,
      completedToday: uploadQueue.filter(item => 
        item.status === 'done' && 
        new Date(item.completedAt || Date.now()).toLocaleDateString('en-CA') === today
      ).length,
      failedUploads: uploadQueue.filter(item => item.status === 'error').length,
      hasItemsRequiringAttention: uploadQueue.some(item => 
        item.status === 'error' || 
        (item.status === 'ready' && item.scheduledAt && new Date(item.scheduledAt) <= new Date())
      ),
    };
  }, [uploadQueue]);

  // Quick action handlers for command center
  const quickUploadActions = useMemo(() => ({
    startAllPending: () => {
      if (startUploadQueue) {
        startUploadQueue();
      }
    },
    retryFailed: () => {
      if (uploadQueue && markQueueStatus) {
        uploadQueue
          .filter(item => item.status === 'error')
          .forEach(item => markQueueStatus(item.id, 'ready'));
      }
    },
    clearCompleted: () => {
      if (uploadQueue && removeQueueItem) {
        uploadQueue
          .filter(item => item.status === 'done')
          .forEach(item => removeQueueItem(item.id));
      }
    },
  }), [uploadQueue, startUploadQueue, markQueueStatus, removeQueueItem]);

  return {
    uploadQueue,
    uploadMetrics,
    quickUploadActions,
    addToUploadQueue,
    removeQueueItem,
    markQueueStatus,
    startUploadQueue,
    rescheduleVideo,
    updateVideoMetadata,
  };
}

/**
 * Hook for integrating command center with settings
 * @param {Object} settingsHook - The useSettings hook result
 * @returns {Object} Enhanced settings integration
 */
export function useSettingsIntegration(settingsHook) {
  const {
    settings = {},
    updateSettings,
    resetSettings,
    isLoading,
    syncStatus,
  } = settingsHook || {};

  // Command center specific preferences
  const [commandCenterPrefs, setCommandCenterPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(COMMAND_CENTER_PREFS_KEY);
      return stored ? JSON.parse(stored) : {
        showSetupAssistant: true,
        showDailyPlanner: true,
        showProgressDashboard: true,
        showQuickActions: true,
        showSmartSuggestions: true,
        focusModeEnabled: false,
        notificationPreferences: {
          uploadReminders: true,
          performanceAlerts: true,
          achievementNotifications: true,
          trendingTopics: true,
        },
      };
    } catch {
      return {
        showSetupAssistant: true,
        showDailyPlanner: true,
        showProgressDashboard: true,
        showQuickActions: true,
        showSmartSuggestions: true,
        focusModeEnabled: false,
        notificationPreferences: {
          uploadReminders: true,
          performanceAlerts: true,
          achievementNotifications: true,
          trendingTopics: true,
        },
      };
    }
  });

  // Save command center preferences
  const updateCommandCenterPrefs = useCallback((newPrefs) => {
    setCommandCenterPrefs(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(COMMAND_CENTER_PREFS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('[useSettingsIntegration] Error saving preferences:', error);
      }
      return updated;
    });
  }, []);

  // Combined settings for command center
  const combinedSettings = useMemo(() => ({
    ...settings,
    commandCenter: commandCenterPrefs,
  }), [settings, commandCenterPrefs]);

  return {
    settings: combinedSettings,
    commandCenterPrefs,
    updateSettings,
    updateCommandCenterPrefs,
    resetSettings,
    isLoading,
    syncStatus,
  };
}

/**
 * Hook for integrating command center with analytics
 * @param {Object} analyticsHook - The useAnalytics hook result
 * @returns {Object} Enhanced analytics integration
 */
export function useAnalyticsIntegration(analyticsHook) {
  const {
    loading,
    error,
    channelAnalytics,
    videoAnalytics,
    trafficSources,
    demographics,
    refresh,
    loadChannelAnalytics,
  } = analyticsHook || {};

  // Calculate performance metrics for command center
  const performanceMetrics = useMemo(() => {
    if (!channelAnalytics) {
      return {
        trend: 'stable',
        changePercentage: 0,
        isDecreasing: false,
        highlights: [],
      };
    }

    const { current, previous } = channelAnalytics;
    
    // Calculate trend
    const currentViews = current?.views || 0;
    const previousViews = previous?.views || 0;
    const changePercentage = previousViews > 0 
      ? Math.round(((currentViews - previousViews) / previousViews) * 100)
      : 0;

    const trend = changePercentage > 5 ? 'improving' : changePercentage < -5 ? 'declining' : 'stable';

    // Generate highlights
    const highlights = [];
    if (current?.subscriberGrowth > 0) {
      highlights.push({
        type: 'achievement',
        message: `+${current.subscriberGrowth} novos inscritos`,
      });
    }
    if (changePercentage > 10) {
      highlights.push({
        type: 'achievement',
        message: `Visualizações aumentaram ${changePercentage}%`,
      });
    }
    if (changePercentage < -10) {
      highlights.push({
        type: 'warning',
        message: `Visualizações diminuíram ${Math.abs(changePercentage)}%`,
      });
    }

    return {
      trend,
      changePercentage,
      isDecreasing: trend === 'declining',
      highlights,
      current,
      previous,
    };
  }, [channelAnalytics]);

  // Generate suggestions based on analytics
  const analyticsSuggestions = useMemo(() => {
    const suggestions = [];

    if (performanceMetrics.isDecreasing) {
      suggestions.push({
        id: 'declining-performance',
        type: 'warning',
        title: 'Performance em queda',
        description: 'Suas visualizações diminuíram. Considere otimizar seus títulos e thumbnails.',
        impact: 'high',
        actionable: true,
        actionUrl: '/analytics',
      });
    }

    if (trafficSources && trafficSources.length > 0) {
      const topSource = trafficSources[0];
      if (topSource && topSource.percentage < 30) {
        suggestions.push({
          id: 'diversify-traffic',
          type: 'tip',
          title: 'Diversifique suas fontes de tráfego',
          description: 'Considere promover seus vídeos em outras plataformas.',
          impact: 'medium',
          actionable: true,
        });
      }
    }

    return suggestions;
  }, [performanceMetrics, trafficSources]);

  return {
    loading,
    error,
    channelAnalytics,
    videoAnalytics,
    trafficSources,
    demographics,
    performanceMetrics,
    analyticsSuggestions,
    refresh,
    loadChannelAnalytics,
  };
}

/**
 * Main hook for command center state and integration
 * Combines all integrations and manages command center state
 * @param {Object} options - Integration options
 * @returns {Object} Complete command center integration
 */
export function useCommandCenterIntegration({
  uploadQueueHook,
  settingsHook,
  analyticsHook,
  journeyContext,
} = {}) {
  const migrationService = getMigrationService();
  
  // Active system state
  const [activeSystem, setActiveSystem] = useState(() => getActiveSystem());
  
  // Command center state
  const [commandCenterState, setCommandCenterState] = useState(() => {
    return migrationService.loadCommandCenterState();
  });

  // Integration hooks
  const uploadIntegration = useUploadQueueIntegration(uploadQueueHook);
  const settingsIntegration = useSettingsIntegration(settingsHook);
  const analyticsIntegration = useAnalyticsIntegration(analyticsHook);

  // Listen for migration events
  useEffect(() => {
    const unsubscribe = migrationService.onMigrationEvent((event) => {
      if (event.type === 'preference-changed') {
        setActiveSystem(event.preference);
      }
      if (event.type === 'migration-completed') {
        setCommandCenterState(event.state);
      }
    });

    return unsubscribe;
  }, [migrationService]);

  // Sync command center state to localStorage - use ref to prevent loops
  const commandCenterStateRef = useRef(commandCenterState);
  useEffect(() => {
    // Only save if state actually changed
    if (JSON.stringify(commandCenterStateRef.current) !== JSON.stringify(commandCenterState)) {
      commandCenterStateRef.current = commandCenterState;
      migrationService.saveCommandCenterState(commandCenterState);
    }
  }, [commandCenterState, migrationService]);

  // Update command center state
  const updateCommandCenterState = useCallback((updates) => {
    setCommandCenterState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Switch between systems
  const switchSystem = useCallback((system) => {
    if (system === 'journey') {
      migrationService.switchToJourney();
    } else {
      migrationService.switchToCommandCenter();
    }
    setActiveSystem(system);
  }, []);

  // Perform migration
  const performMigration = useCallback(() => {
    const result = migrationService.performMigration();
    if (result.success) {
      setCommandCenterState(result.state);
      setActiveSystem('command-center');
    }
    return result;
  }, []);

  // Check if migration is needed
  const needsMigration = !migrationService.isMigrationCompleted();

  // Combined metrics from all sources
  const combinedMetrics = useMemo(() => ({
    ...commandCenterState.metrics,
    uploads: uploadIntegration.uploadMetrics,
    performance: analyticsIntegration.performanceMetrics,
  }), [commandCenterState.metrics, uploadIntegration.uploadMetrics, analyticsIntegration.performanceMetrics]);

  // Combined suggestions
  const combinedSuggestions = useMemo(() => [
    ...commandCenterState.suggestions,
    ...analyticsIntegration.analyticsSuggestions,
  ], [commandCenterState.suggestions, analyticsIntegration.analyticsSuggestions]);

  return {
    // System state
    activeSystem,
    needsMigration,
    switchSystem,
    performMigration,
    
    // Command center state
    commandCenterState,
    updateCommandCenterState,
    
    // Integrations
    upload: uploadIntegration,
    settings: settingsIntegration,
    analytics: analyticsIntegration,
    
    // Combined data
    metrics: combinedMetrics,
    suggestions: combinedSuggestions,
    
    // Journey context (for backward compatibility)
    journeyContext,
  };
}

export default useCommandCenterIntegration;
