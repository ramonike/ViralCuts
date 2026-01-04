/**
 * Migration Service Tests
 * Property-based and unit tests for migration and integration system
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  MigrationService,
  getMigrationService,
  getActiveSystem,
  MIGRATION_STORAGE_KEYS,
  CURRENT_MIGRATION_VERSION,
  DEFAULT_COMMAND_CENTER_STATE,
} from '../MigrationService';
import {
  useUploadQueueIntegration,
  useSettingsIntegration,
  useAnalyticsIntegration,
} from '../useCommandCenterIntegration';
import { renderHook } from '@testing-library/react';

// ============================================
// ARBITRARIES FOR PROPERTY TESTS
// ============================================

// Journey state arbitrary
const journeyStateArbitrary = fc.record({
  currentStage: fc.constantFrom('setup', 'planning', 'creation', 'optimization', 'publishing'),
  completedMilestones: fc.array(
    fc.constantFrom(
      'youtube-connection',
      'channel-photo',
      'channel-banner',
      'channel-description',
      'niche-selection',
      'content-calendar',
      'first-ai-tool',
      'first-upload'
    ),
    { maxLength: 8 }
  ),
  progressPercentage: fc.integer({ min: 0, max: 100 }),
  experienceLevel: fc.constantFrom('beginner', 'intermediate', 'advanced'),
  onboardingCompleted: fc.boolean(),
  lastActiveDate: fc.date().map(d => d.toISOString()),
  isFirstLogin: fc.boolean(),
});

// User stats arbitrary
const userStatsArbitrary = fc.record({
  videosCreated: fc.integer({ min: 0, max: 1000 }),
  toolsUsed: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 10 }),
  channelOptimizationScore: fc.integer({ min: 0, max: 100 }),
  daysActive: fc.integer({ min: 0, max: 365 }),
  totalPoints: fc.integer({ min: 0, max: 10000 }),
  achievements: fc.array(
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 5, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.string({ minLength: 1, maxLength: 5 }),
      category: fc.constantFrom('setup', 'creation', 'optimization', 'publishing', 'engagement'),
      points: fc.integer({ min: 10, max: 1000 }),
      unlockedAt: fc.date().map(d => d.toISOString()),
    }),
    { maxLength: 10 }
  ),
  currentStreak: fc.integer({ min: 0, max: 365 }),
});

// Journey stages arbitrary
const journeyStagesArbitrary = fc.array(
  fc.record({
    id: fc.constantFrom('setup', 'planning', 'creation', 'optimization', 'publishing'),
    name: fc.string({ minLength: 5, maxLength: 30 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    icon: fc.string({ minLength: 1, maxLength: 5 }),
    order: fc.integer({ min: 1, max: 5 }),
    estimatedTime: fc.integer({ min: 5, max: 120 }),
    difficulty: fc.constantFrom('easy', 'medium', 'hard'),
    unlocked: fc.boolean(),
    milestones: fc.array(
      fc.record({
        id: fc.string({ minLength: 5, maxLength: 30 }),
        title: fc.string({ minLength: 5, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 100 }),
        completed: fc.boolean(),
        category: fc.constantFrom('setup', 'optimization', 'creation', 'publishing'),
        points: fc.integer({ min: 10, max: 500 }),
      }),
      { minLength: 1, maxLength: 5 }
    ),
  }),
  { minLength: 1, maxLength: 5 }
);

// Upload queue item arbitrary
const uploadQueueItemArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  source: fc.constantFrom('manual', 'ai', 'scheduled'),
  platform: fc.constantFrom('YouTube Shorts', 'YouTube', 'TikTok'),
  scheduledAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  status: fc.constantFrom('ready', 'uploading', 'done', 'error', 'scheduled'),
  privacyStatus: fc.constantFrom('private', 'public', 'unlisted'),
});

// Settings arbitrary
const settingsArbitrary = fc.record({
  theme: fc.constantFrom('dark', 'light'),
  notifications: fc.boolean(),
  defaultPrivacy: fc.constantFrom('private', 'public', 'unlisted'),
});

// Analytics arbitrary
const analyticsArbitrary = fc.record({
  channelAnalytics: fc.option(
    fc.record({
      current: fc.record({
        views: fc.integer({ min: 0, max: 1000000 }),
        subscribers: fc.integer({ min: 0, max: 100000 }),
        subscriberGrowth: fc.integer({ min: -1000, max: 10000 }),
      }),
      previous: fc.record({
        views: fc.integer({ min: 0, max: 1000000 }),
        subscribers: fc.integer({ min: 0, max: 100000 }),
      }),
    }),
    { nil: null }
  ),
  trafficSources: fc.array(
    fc.record({
      source: fc.string({ minLength: 3, maxLength: 30 }),
      percentage: fc.integer({ min: 0, max: 100 }),
    }),
    { maxLength: 5 }
  ),
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('MigrationService Property Tests', () => {
  let migrationService;

  beforeEach(() => {
    localStorage.clear();
    migrationService = new MigrationService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Feature: daily-command-center, Property 12: System Integration Compatibility
   * For any existing system component (upload queue, settings, analytics),
   * the new command center should integrate without breaking existing functionality
   * Validates: Requirements 9.2, 9.3, 9.5
   */
  describe('Property 12: System Integration Compatibility', () => {
    it('should preserve all journey data during migration', () => {
      fc.assert(
        fc.property(
          journeyStateArbitrary,
          userStatsArbitrary,
          journeyStagesArbitrary,
          (journeyState, userStats, stages) => {
            // Setup: Store journey data
            localStorage.setItem('viralcuts-journey-state', JSON.stringify(journeyState));
            localStorage.setItem('viralcuts-user-stats', JSON.stringify(userStats));
            localStorage.setItem('viralcuts-journey-stages', JSON.stringify(stages));

            // Action: Perform migration
            const result = migrationService.performMigration();

            // Assert: Migration succeeds
            expect(result.success).toBe(true);

            // Assert: Backup was created
            const backup = localStorage.getItem(MIGRATION_STORAGE_KEYS.backupJourneyState);
            expect(backup).not.toBeNull();

            const backupData = JSON.parse(backup);
            
            // Assert: Backup contains original data
            expect(backupData.journeyState).toEqual(journeyState);
            expect(backupData.userStats).toEqual(userStats);
            expect(backupData.stages).toEqual(stages);

            // Cleanup for next iteration
            localStorage.clear();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain backward compatibility - can switch back to journey system', () => {
      fc.assert(
        fc.property(
          journeyStateArbitrary,
          userStatsArbitrary,
          (journeyState, userStats) => {
            // Setup: Store journey data and migrate
            localStorage.setItem('viralcuts-journey-state', JSON.stringify(journeyState));
            localStorage.setItem('viralcuts-user-stats', JSON.stringify(userStats));

            migrationService.performMigration();

            // Action: Switch back to journey
            const switchResult = migrationService.switchToJourney();

            // Assert: Switch succeeds
            expect(switchResult).toBe(true);

            // Assert: Journey data is restored
            const restoredJourneyState = localStorage.getItem('viralcuts-journey-state');
            expect(restoredJourneyState).not.toBeNull();
            expect(JSON.parse(restoredJourneyState)).toEqual(journeyState);

            // Assert: System preference is set to journey
            expect(migrationService.getSystemPreference()).toBe('journey');

            // Cleanup
            localStorage.clear();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid command center state from any journey data', () => {
      fc.assert(
        fc.property(
          journeyStateArbitrary,
          userStatsArbitrary,
          journeyStagesArbitrary,
          (journeyState, userStats, stages) => {
            // Setup
            localStorage.setItem('viralcuts-journey-state', JSON.stringify(journeyState));
            localStorage.setItem('viralcuts-user-stats', JSON.stringify(userStats));
            localStorage.setItem('viralcuts-journey-stages', JSON.stringify(stages));

            // Action
            const result = migrationService.performMigration();

            // Assert: Result has valid structure
            expect(result.success).toBe(true);
            expect(result.state).toBeDefined();

            const state = result.state;

            // Assert: Setup progress is valid
            expect(state.setupProgress).toBeDefined();
            expect(state.setupProgress.totalTasks).toBeGreaterThanOrEqual(0);
            expect(state.setupProgress.completedTasks).toBeGreaterThanOrEqual(0);
            expect(state.setupProgress.completedTasks).toBeLessThanOrEqual(state.setupProgress.totalTasks);
            expect(state.setupProgress.percentage).toBeGreaterThanOrEqual(0);
            expect(state.setupProgress.percentage).toBeLessThanOrEqual(100);

            // Assert: Metrics are valid
            expect(state.metrics).toBeDefined();
            expect(state.metrics.videosCreatedThisWeek).toBeGreaterThanOrEqual(0);
            expect(state.metrics.uploadConsistency).toBeGreaterThanOrEqual(0);
            expect(state.metrics.uploadConsistency).toBeLessThanOrEqual(100);

            // Assert: User settings are valid
            expect(state.userSettings).toBeDefined();
            expect(['beginner', 'intermediate', 'advanced']).toContain(state.userSettings.experienceLevel);

            // Cleanup
            localStorage.clear();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty/null journey data gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, {}, { journeyState: null, userStats: null, stages: null }),
          (emptyData) => {
            // Setup: Clear any existing data
            localStorage.clear();

            // Action: Perform migration with no existing data
            const result = migrationService.performMigration();

            // Assert: Migration succeeds with default state
            expect(result.success).toBe(true);
            expect(result.state).toBeDefined();
            expect(result.hadExistingData).toBe(false);

            // Assert: Default state structure is valid
            expect(result.state.setupProgress).toBeDefined();
            expect(result.state.metrics).toBeDefined();
            expect(result.state.userSettings).toBeDefined();

            // Cleanup
            localStorage.clear();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// ============================================
// INTEGRATION HOOK TESTS
// ============================================

describe('Integration Hooks Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useUploadQueueIntegration', () => {
    it('should calculate correct metrics for any upload queue', () => {
      fc.assert(
        fc.property(
          fc.array(uploadQueueItemArbitrary, { maxLength: 20 }),
          (uploadQueue) => {
            const mockHook = {
              uploadQueue,
              addToUploadQueue: vi.fn(),
              removeQueueItem: vi.fn(),
              markQueueStatus: vi.fn(),
              startUploadQueue: vi.fn(),
              rescheduleVideo: vi.fn(),
              updateVideoMetadata: vi.fn(),
            };

            const { result } = renderHook(() => useUploadQueueIntegration(mockHook));

            // Assert: Metrics are calculated correctly
            const metrics = result.current.uploadMetrics;
            
            expect(metrics.pendingUploads).toBe(
              uploadQueue.filter(item => item.status === 'ready').length
            );
            expect(metrics.failedUploads).toBe(
              uploadQueue.filter(item => item.status === 'error').length
            );
            expect(metrics.scheduledUploads).toBe(
              uploadQueue.filter(item => item.scheduledAt && item.status === 'ready').length
            );

            // Assert: hasItemsRequiringAttention is correct
            const hasErrors = uploadQueue.some(item => item.status === 'error');
            if (hasErrors) {
              expect(metrics.hasItemsRequiringAttention).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null/undefined upload queue gracefully', () => {
      const mockHook = {
        uploadQueue: null,
        addToUploadQueue: vi.fn(),
      };

      const { result } = renderHook(() => useUploadQueueIntegration(mockHook));

      expect(result.current.uploadMetrics.pendingUploads).toBe(0);
      expect(result.current.uploadMetrics.failedUploads).toBe(0);
      expect(result.current.uploadMetrics.hasItemsRequiringAttention).toBe(false);
    });
  });

  describe('useSettingsIntegration', () => {
    it('should preserve settings during integration', () => {
      fc.assert(
        fc.property(settingsArbitrary, (settings) => {
          const mockHook = {
            settings,
            updateSettings: vi.fn(),
            resetSettings: vi.fn(),
            isLoading: false,
            syncStatus: 'idle',
          };

          const { result } = renderHook(() => useSettingsIntegration(mockHook));

          // Assert: Original settings are preserved
          expect(result.current.settings.theme).toBe(settings.theme);
          expect(result.current.settings.notifications).toBe(settings.notifications);
          expect(result.current.settings.defaultPrivacy).toBe(settings.defaultPrivacy);

          // Assert: Command center preferences are added
          expect(result.current.commandCenterPrefs).toBeDefined();
          expect(result.current.settings.commandCenter).toBeDefined();

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('useAnalyticsIntegration', () => {
    it('should calculate performance metrics correctly', () => {
      fc.assert(
        fc.property(analyticsArbitrary, (analytics) => {
          const mockHook = {
            loading: false,
            error: null,
            channelAnalytics: analytics.channelAnalytics,
            trafficSources: analytics.trafficSources,
            refresh: vi.fn(),
            loadChannelAnalytics: vi.fn(),
          };

          const { result } = renderHook(() => useAnalyticsIntegration(mockHook));

          // Assert: Performance metrics are calculated
          expect(result.current.performanceMetrics).toBeDefined();
          expect(['improving', 'stable', 'declining']).toContain(result.current.performanceMetrics.trend);
          expect(typeof result.current.performanceMetrics.changePercentage).toBe('number');
          expect(typeof result.current.performanceMetrics.isDecreasing).toBe('boolean');

          // Assert: Suggestions are generated
          expect(Array.isArray(result.current.analyticsSuggestions)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle null analytics gracefully', () => {
      const mockHook = {
        loading: false,
        error: null,
        channelAnalytics: null,
        trafficSources: null,
        refresh: vi.fn(),
      };

      const { result } = renderHook(() => useAnalyticsIntegration(mockHook));

      expect(result.current.performanceMetrics.trend).toBe('stable');
      expect(result.current.performanceMetrics.changePercentage).toBe(0);
      expect(result.current.analyticsSuggestions).toEqual([]);
    });
  });
});

// ============================================
// UNIT TESTS
// ============================================

describe('MigrationService Unit Tests', () => {
  let migrationService;

  beforeEach(() => {
    localStorage.clear();
    migrationService = new MigrationService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isMigrationCompleted', () => {
    it('should return false when migration has not been performed', () => {
      expect(migrationService.isMigrationCompleted()).toBe(false);
    });

    it('should return true after successful migration', () => {
      migrationService.performMigration();
      expect(migrationService.isMigrationCompleted()).toBe(true);
    });

    it('should return false if version mismatch', () => {
      localStorage.setItem(MIGRATION_STORAGE_KEYS.migrationCompleted, 'true');
      localStorage.setItem(MIGRATION_STORAGE_KEYS.migrationVersion, '0.0.1');
      expect(migrationService.isMigrationCompleted()).toBe(false);
    });
  });

  describe('getSystemPreference / setSystemPreference', () => {
    it('should return null when no preference is set', () => {
      expect(migrationService.getSystemPreference()).toBeNull();
    });

    it('should return the set preference', () => {
      migrationService.setSystemPreference('command-center');
      expect(migrationService.getSystemPreference()).toBe('command-center');

      migrationService.setSystemPreference('journey');
      expect(migrationService.getSystemPreference()).toBe('journey');
    });
  });

  describe('convertMilestonesToSetupTasks', () => {
    it('should convert known milestones to setup tasks', () => {
      const milestones = ['youtube-connection', 'channel-photo', 'first-upload'];
      const tasks = migrationService.convertMilestonesToSetupTasks(milestones);

      expect(tasks).toContain('connect-youtube');
      expect(tasks).toContain('setup-profile');
      expect(tasks).toContain('first-upload');
    });

    it('should filter out unknown milestones', () => {
      const milestones = ['youtube-connection', 'unknown-milestone'];
      const tasks = migrationService.convertMilestonesToSetupTasks(milestones);

      expect(tasks).toContain('connect-youtube');
      expect(tasks).not.toContain('unknown-milestone');
    });

    it('should handle empty array', () => {
      expect(migrationService.convertMilestonesToSetupTasks([])).toEqual([]);
    });

    it('should handle null/undefined', () => {
      expect(migrationService.convertMilestonesToSetupTasks(null)).toEqual([]);
      expect(migrationService.convertMilestonesToSetupTasks(undefined)).toEqual([]);
    });
  });

  describe('convertAchievements', () => {
    it('should convert achievements to command center format', () => {
      const achievements = [
        {
          id: 'test-1',
          title: 'Test Achievement',
          description: 'Test description',
          icon: '🏆',
          category: 'setup',
          points: 100,
          unlockedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const converted = migrationService.convertAchievements(achievements);

      expect(converted).toHaveLength(1);
      expect(converted[0].id).toBe('test-1');
      expect(converted[0].title).toBe('Test Achievement');
      expect(converted[0].unlockedAt).toBeInstanceOf(Date);
    });

    it('should handle empty array', () => {
      expect(migrationService.convertAchievements([])).toEqual([]);
    });

    it('should handle null/undefined', () => {
      expect(migrationService.convertAchievements(null)).toEqual([]);
      expect(migrationService.convertAchievements(undefined)).toEqual([]);
    });
  });

  describe('resetMigration', () => {
    it('should clear all migration-related storage', () => {
      // Setup: Perform migration
      migrationService.performMigration();
      expect(migrationService.isMigrationCompleted()).toBe(true);

      // Action: Reset migration
      migrationService.resetMigration();

      // Assert: All storage is cleared
      expect(localStorage.getItem(MIGRATION_STORAGE_KEYS.migrationCompleted)).toBeNull();
      expect(localStorage.getItem(MIGRATION_STORAGE_KEYS.migrationVersion)).toBeNull();
      expect(localStorage.getItem(MIGRATION_STORAGE_KEYS.systemPreference)).toBeNull();
      expect(localStorage.getItem(MIGRATION_STORAGE_KEYS.commandCenterState)).toBeNull();
      expect(localStorage.getItem(MIGRATION_STORAGE_KEYS.backupJourneyState)).toBeNull();
    });
  });

  describe('getActiveSystem', () => {
    it('should return command-center by default for new users', () => {
      expect(getActiveSystem()).toBe('command-center');
    });

    it('should respect user preference', () => {
      migrationService.setSystemPreference('journey');
      expect(getActiveSystem()).toBe('journey');

      migrationService.setSystemPreference('command-center');
      expect(getActiveSystem()).toBe('command-center');
    });
  });
});
