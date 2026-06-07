/**
 * Integration Compatibility Tests
 * Tests for upload queue, settings, and analytics integration
 * Requirements: 9.3, 9.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  useCommandCenterIntegration,
  useUploadQueueIntegration,
  useSettingsIntegration,
  useAnalyticsIntegration,
} from '../useCommandCenterIntegration';

import {
  SystemSwitcherButton,
  SystemSwitcherPanel,
  SystemConditionalRender,
  useSystemSwitcher,
} from '../SystemSwitcher';

import {
  getMigrationService,
  MIGRATION_STORAGE_KEYS,
} from '../MigrationService';

// ============================================
// UPLOAD QUEUE INTEGRATION TESTS
// ============================================

describe('Upload Queue Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useUploadQueueIntegration', () => {
    it('should integrate with existing upload queue without breaking functionality', () => {
      const mockUploadQueue = [
        { id: '1', title: 'Video 1', status: 'ready', scheduledAt: null },
        { id: '2', title: 'Video 2', status: 'uploading', scheduledAt: null },
        { id: '3', title: 'Video 3', status: 'done', scheduledAt: null },
        { id: '4', title: 'Video 4', status: 'error', scheduledAt: null },
        { id: '5', title: 'Video 5', status: 'ready', scheduledAt: '2024-12-01T10:00:00Z' },
      ];

      const mockAddToUploadQueue = vi.fn();
      const mockRemoveQueueItem = vi.fn();
      const mockMarkQueueStatus = vi.fn();
      const mockStartUploadQueue = vi.fn();

      const mockHook = {
        uploadQueue: mockUploadQueue,
        addToUploadQueue: mockAddToUploadQueue,
        removeQueueItem: mockRemoveQueueItem,
        markQueueStatus: mockMarkQueueStatus,
        startUploadQueue: mockStartUploadQueue,
        rescheduleVideo: vi.fn(),
        updateVideoMetadata: vi.fn(),
      };

      const { result } = renderHook(() => useUploadQueueIntegration(mockHook));

      // Verify original functions are preserved
      expect(result.current.addToUploadQueue).toBe(mockAddToUploadQueue);
      expect(result.current.removeQueueItem).toBe(mockRemoveQueueItem);
      expect(result.current.markQueueStatus).toBe(mockMarkQueueStatus);
      expect(result.current.startUploadQueue).toBe(mockStartUploadQueue);

      // Verify metrics are calculated correctly
      expect(result.current.uploadMetrics.pendingUploads).toBe(2); // ready status
      expect(result.current.uploadMetrics.failedUploads).toBe(1); // error status
      expect(result.current.uploadMetrics.scheduledUploads).toBe(1); // ready with scheduledAt
      expect(result.current.uploadMetrics.hasItemsRequiringAttention).toBe(true); // has errors
    });

    it('should provide quick action handlers that work with existing queue', () => {
      const mockUploadQueue = [
        { id: '1', title: 'Video 1', status: 'error' },
        { id: '2', title: 'Video 2', status: 'done' },
        { id: '3', title: 'Video 3', status: 'ready' },
      ];

      const mockMarkQueueStatus = vi.fn();
      const mockRemoveQueueItem = vi.fn();
      const mockStartUploadQueue = vi.fn();

      const mockHook = {
        uploadQueue: mockUploadQueue,
        markQueueStatus: mockMarkQueueStatus,
        removeQueueItem: mockRemoveQueueItem,
        startUploadQueue: mockStartUploadQueue,
      };

      const { result } = renderHook(() => useUploadQueueIntegration(mockHook));

      // Test startAllPending
      act(() => {
        result.current.quickUploadActions.startAllPending();
      });
      expect(mockStartUploadQueue).toHaveBeenCalled();

      // Test retryFailed
      act(() => {
        result.current.quickUploadActions.retryFailed();
      });
      expect(mockMarkQueueStatus).toHaveBeenCalledWith('1', 'ready');

      // Test clearCompleted
      act(() => {
        result.current.quickUploadActions.clearCompleted();
      });
      expect(mockRemoveQueueItem).toHaveBeenCalledWith('2');
    });

    it('should not break when upload queue is empty', () => {
      const mockHook = {
        uploadQueue: [],
        addToUploadQueue: vi.fn(),
        removeQueueItem: vi.fn(),
        markQueueStatus: vi.fn(),
        startUploadQueue: vi.fn(),
      };

      const { result } = renderHook(() => useUploadQueueIntegration(mockHook));

      expect(result.current.uploadMetrics.pendingUploads).toBe(0);
      expect(result.current.uploadMetrics.failedUploads).toBe(0);
      expect(result.current.uploadMetrics.hasItemsRequiringAttention).toBe(false);

      // Quick actions should not throw
      expect(() => {
        result.current.quickUploadActions.startAllPending();
        result.current.quickUploadActions.retryFailed();
        result.current.quickUploadActions.clearCompleted();
      }).not.toThrow();
    });
  });
});

// ============================================
// SETTINGS INTEGRATION TESTS
// ============================================

describe('Settings Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useSettingsIntegration', () => {
    it('should integrate with existing settings without breaking functionality', () => {
      const mockSettings = {
        theme: 'dark',
        notifications: true,
        defaultPrivacy: 'private',
        customSetting: 'value',
      };

      const mockUpdateSettings = vi.fn();
      const mockResetSettings = vi.fn();

      const mockHook = {
        settings: mockSettings,
        updateSettings: mockUpdateSettings,
        resetSettings: mockResetSettings,
        isLoading: false,
        syncStatus: 'idle',
      };

      const { result } = renderHook(() => useSettingsIntegration(mockHook));

      // Verify original settings are preserved
      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.notifications).toBe(true);
      expect(result.current.settings.defaultPrivacy).toBe('private');
      expect(result.current.settings.customSetting).toBe('value');

      // Verify original functions are preserved
      expect(result.current.updateSettings).toBe(mockUpdateSettings);
      expect(result.current.resetSettings).toBe(mockResetSettings);

      // Verify command center preferences are added
      expect(result.current.commandCenterPrefs).toBeDefined();
      expect(result.current.settings.commandCenter).toBeDefined();
    });

    it('should persist command center preferences to localStorage', () => {
      const mockHook = {
        settings: { theme: 'dark' },
        updateSettings: vi.fn(),
        isLoading: false,
        syncStatus: 'idle',
      };

      const { result } = renderHook(() => useSettingsIntegration(mockHook));

      // Update command center preferences
      act(() => {
        result.current.updateCommandCenterPrefs({
          showSetupAssistant: false,
          focusModeEnabled: true,
        });
      });

      // Verify preferences are updated
      expect(result.current.commandCenterPrefs.showSetupAssistant).toBe(false);
      expect(result.current.commandCenterPrefs.focusModeEnabled).toBe(true);

      // Verify persistence to localStorage
      const stored = localStorage.getItem('viralcuts-command-center-preferences');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed.showSetupAssistant).toBe(false);
      expect(parsed.focusModeEnabled).toBe(true);
    });

    it('should load command center preferences from localStorage', () => {
      // Pre-populate localStorage
      localStorage.setItem('viralcuts-command-center-preferences', JSON.stringify({
        showSetupAssistant: false,
        showDailyPlanner: false,
        focusModeEnabled: true,
      }));

      const mockHook = {
        settings: { theme: 'dark' },
        updateSettings: vi.fn(),
        isLoading: false,
        syncStatus: 'idle',
      };

      const { result } = renderHook(() => useSettingsIntegration(mockHook));

      // Verify preferences are loaded from localStorage
      expect(result.current.commandCenterPrefs.showSetupAssistant).toBe(false);
      expect(result.current.commandCenterPrefs.showDailyPlanner).toBe(false);
      expect(result.current.commandCenterPrefs.focusModeEnabled).toBe(true);
    });
  });
});

// ============================================
// ANALYTICS INTEGRATION TESTS
// ============================================

describe('Analytics Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAnalyticsIntegration', () => {
    it('should integrate with existing analytics without breaking functionality', () => {
      const mockChannelAnalytics = {
        current: {
          views: 10000,
          subscribers: 1000,
          subscriberGrowth: 50,
        },
        previous: {
          views: 8000,
          subscribers: 950,
        },
      };

      const mockRefresh = vi.fn();
      const mockLoadChannelAnalytics = vi.fn();

      const mockHook = {
        loading: false,
        error: null,
        channelAnalytics: mockChannelAnalytics,
        videoAnalytics: {},
        trafficSources: [{ source: 'search', percentage: 40 }],
        demographics: null,
        refresh: mockRefresh,
        loadChannelAnalytics: mockLoadChannelAnalytics,
      };

      const { result } = renderHook(() => useAnalyticsIntegration(mockHook));

      // Verify original data is preserved
      expect(result.current.channelAnalytics).toBe(mockChannelAnalytics);
      expect(result.current.refresh).toBe(mockRefresh);
      expect(result.current.loadChannelAnalytics).toBe(mockLoadChannelAnalytics);

      // Verify performance metrics are calculated
      expect(result.current.performanceMetrics).toBeDefined();
      expect(result.current.performanceMetrics.trend).toBe('improving'); // 25% increase
      expect(result.current.performanceMetrics.changePercentage).toBe(25);
      expect(result.current.performanceMetrics.isDecreasing).toBe(false);
    });

    it('should detect declining performance and generate suggestions', () => {
      const mockChannelAnalytics = {
        current: {
          views: 5000,
          subscribers: 1000,
          subscriberGrowth: -10,
        },
        previous: {
          views: 10000,
          subscribers: 1010,
        },
      };

      const mockHook = {
        loading: false,
        error: null,
        channelAnalytics: mockChannelAnalytics,
        trafficSources: [],
        refresh: vi.fn(),
      };

      const { result } = renderHook(() => useAnalyticsIntegration(mockHook));

      // Verify declining trend is detected
      expect(result.current.performanceMetrics.trend).toBe('declining');
      expect(result.current.performanceMetrics.isDecreasing).toBe(true);

      // Verify suggestion is generated
      expect(result.current.analyticsSuggestions.length).toBeGreaterThan(0);
      expect(result.current.analyticsSuggestions.some(s => s.type === 'warning')).toBe(true);
    });

    it('should generate highlights for positive metrics', () => {
      const mockChannelAnalytics = {
        current: {
          views: 15000,
          subscribers: 1100,
          subscriberGrowth: 100,
        },
        previous: {
          views: 10000,
          subscribers: 1000,
        },
      };

      const mockHook = {
        loading: false,
        error: null,
        channelAnalytics: mockChannelAnalytics,
        trafficSources: [],
        refresh: vi.fn(),
      };

      const { result } = renderHook(() => useAnalyticsIntegration(mockHook));

      // Verify highlights are generated
      expect(result.current.performanceMetrics.highlights.length).toBeGreaterThan(0);
      expect(result.current.performanceMetrics.highlights.some(h => h.type === 'achievement')).toBe(true);
    });
  });
});

// ============================================
// SYSTEM SWITCHER TESTS
// ============================================

describe('System Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useSystemSwitcher', () => {
    it('should default to command-center for new users', () => {
      const { result } = renderHook(() => useSystemSwitcher());

      expect(result.current.activeSystem).toBe('command-center');
      expect(result.current.isCommandCenter).toBe(true);
      expect(result.current.isJourney).toBe(false);
    });

    it('should switch between systems correctly', async () => {
      const { result } = renderHook(() => useSystemSwitcher());

      // Switch to journey
      await act(async () => {
        await result.current.switchToJourney();
      });

      expect(result.current.activeSystem).toBe('journey');
      expect(result.current.isJourney).toBe(true);

      // Switch back to command center
      await act(async () => {
        await result.current.switchToCommandCenter();
      });

      expect(result.current.activeSystem).toBe('command-center');
      expect(result.current.isCommandCenter).toBe(true);
    });

    it('should toggle between systems', async () => {
      const { result } = renderHook(() => useSystemSwitcher());

      // Toggle from command-center to journey
      await act(async () => {
        await result.current.toggleSystem();
      });

      expect(result.current.activeSystem).toBe('journey');

      // Toggle back to command-center
      await act(async () => {
        await result.current.toggleSystem();
      });

      expect(result.current.activeSystem).toBe('command-center');
    });
  });

  describe('SystemConditionalRender', () => {
    it('should render command center content when active', () => {
      const migrationService = getMigrationService();
      migrationService.setSystemPreference('command-center');

      render(
        <SystemConditionalRender
          commandCenter={<div data-testid="command-center">Command Center</div>}
          journey={<div data-testid="journey">Journey</div>}
        />
      );

      expect(screen.getByTestId('command-center')).toBeInTheDocument();
      expect(screen.queryByTestId('journey')).not.toBeInTheDocument();
    });

    it('should render journey content when active', () => {
      const migrationService = getMigrationService();
      migrationService.setSystemPreference('journey');

      render(
        <SystemConditionalRender
          commandCenter={<div data-testid="command-center">Command Center</div>}
          journey={<div data-testid="journey">Journey</div>}
        />
      );

      expect(screen.getByTestId('journey')).toBeInTheDocument();
      expect(screen.queryByTestId('command-center')).not.toBeInTheDocument();
    });
  });

  describe('SystemSwitcherButton', () => {
    it('should render and be clickable', () => {
      const onSwitch = vi.fn();
      
      render(<SystemSwitcherButton onSwitch={onSwitch} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(onSwitch).toHaveBeenCalled();
    });
  });
});

// ============================================
// FULL INTEGRATION TEST
// ============================================

describe('Full Command Center Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should integrate all systems without conflicts', () => {
    // Setup mock hooks
    const mockUploadQueueHook = {
      uploadQueue: [
        { id: '1', title: 'Video 1', status: 'ready' },
      ],
      addToUploadQueue: vi.fn(),
      removeQueueItem: vi.fn(),
      markQueueStatus: vi.fn(),
      startUploadQueue: vi.fn(),
    };

    const mockSettingsHook = {
      settings: { theme: 'dark', notifications: true },
      updateSettings: vi.fn(),
      isLoading: false,
      syncStatus: 'idle',
    };

    const mockAnalyticsHook = {
      loading: false,
      error: null,
      channelAnalytics: {
        current: { views: 1000, subscribers: 100 },
        previous: { views: 800, subscribers: 90 },
      },
      trafficSources: [],
      refresh: vi.fn(),
    };

    const { result } = renderHook(() => useCommandCenterIntegration({
      uploadQueueHook: mockUploadQueueHook,
      settingsHook: mockSettingsHook,
      analyticsHook: mockAnalyticsHook,
    }));

    // Verify all integrations work together
    expect(result.current.upload.uploadQueue).toBe(mockUploadQueueHook.uploadQueue);
    expect(result.current.settings.settings.theme).toBe('dark');
    expect(result.current.analytics.channelAnalytics).toBe(mockAnalyticsHook.channelAnalytics);

    // Verify combined metrics
    expect(result.current.metrics.uploads).toBeDefined();
    expect(result.current.metrics.performance).toBeDefined();

    // Verify combined suggestions
    expect(Array.isArray(result.current.suggestions)).toBe(true);

    // Verify system state
    expect(result.current.activeSystem).toBe('command-center');
    expect(result.current.commandCenterState).toBeDefined();
  });

  it('should handle migration and preserve existing data', () => {
    // Setup existing journey data
    localStorage.setItem('viralcuts-journey-state', JSON.stringify({
      currentStage: 'creation',
      completedMilestones: ['youtube-connection', 'channel-photo'],
      experienceLevel: 'intermediate',
      onboardingCompleted: true,
    }));

    localStorage.setItem('viralcuts-user-stats', JSON.stringify({
      videosCreated: 10,
      totalPoints: 500,
      currentStreak: 5,
      achievements: [],
    }));

    const { result } = renderHook(() => useCommandCenterIntegration({}));

    // Perform migration
    act(() => {
      result.current.performMigration();
    });

    // Verify migration preserves data
    expect(result.current.commandCenterState.userSettings.experienceLevel).toBe('intermediate');
    expect(result.current.commandCenterState.userSettings.setupCompleted).toBe(true);
    expect(result.current.commandCenterState.metrics.videosCreatedThisWeek).toBe(10);

    // Verify can switch back to journey
    act(() => {
      result.current.switchSystem('journey');
    });

    expect(result.current.activeSystem).toBe('journey');

    // Verify journey data is restored
    const journeyState = localStorage.getItem('viralcuts-journey-state');
    expect(journeyState).not.toBeNull();
    const parsed = JSON.parse(journeyState);
    expect(parsed.currentStage).toBe('creation');
  });
});
