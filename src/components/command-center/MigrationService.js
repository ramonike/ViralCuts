/**
 * Migration Service for Daily Command Center
 * Handles data migration from existing journey system to command center format
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

// Storage keys for migration
export const MIGRATION_STORAGE_KEYS = {
  migrationCompleted: 'viralcuts-command-center-migration-completed',
  migrationVersion: 'viralcuts-command-center-migration-version',
  systemPreference: 'viralcuts-system-preference', // 'command-center' | 'journey'
  commandCenterState: 'viralcuts-command-center-state',
  backupJourneyState: 'viralcuts-journey-backup',
};

// Journey system storage keys (from JourneyContext)
const JOURNEY_STORAGE_KEYS = {
  journeyState: 'viralcuts-journey-state',
  stages: 'viralcuts-journey-stages',
  userStats: 'viralcuts-user-stats',
  lastSync: 'viralcuts-journey-last-sync',
};

// Current migration version
export const CURRENT_MIGRATION_VERSION = '1.0.0';

/**
 * Default command center state structure
 */
export const DEFAULT_COMMAND_CENTER_STATE = {
  setupProgress: {
    totalTasks: 5,
    completedTasks: 0,
    percentage: 0,
    essentialTasksComplete: false,
  },
  dailyTasks: [],
  metrics: {
    videosCreatedThisWeek: 0,
    uploadConsistency: 0,
    channelGrowth: {
      subscribers: 0,
      views: 0,
      engagement: 0,
    },
    streaks: {
      dailyActivity: 0,
      weeklyUploads: 0,
      contentCreation: 0,
    },
    achievements: [],
  },
  suggestions: [],
  focusMode: false,
  layoutConfig: {
    widgetOrder: [
      'setup-assistant',
      'daily-planner',
      'progress-dashboard',
      'quick-actions',
      'smart-suggestions',
      'content-workflow',
    ],
    widgetVisibility: {
      'setup-assistant': true,
      'daily-planner': true,
      'progress-dashboard': true,
      'quick-actions': true,
      'smart-suggestions': true,
      'content-workflow': true,
      'notifications': true,
    },
    compactMode: false,
    focusMode: false,
  },
  notifications: [],
  currentWorkflow: null,
  userSettings: {
    setupCompleted: false,
    experienceLevel: 'beginner',
    goals: {
      dailyUploadTarget: 1,
      weeklyContentGoal: 7,
      growthTargets: {
        subscribers: 1000,
        views: 10000,
        engagement: 5,
      },
      focusAreas: ['growth'],
    },
    preferences: {
      notificationFrequency: 'all',
      focusModeEnabled: false,
      widgetVisibility: {},
      quickActionsOrder: [],
    },
    layoutConfig: {
      widgetOrder: [],
      widgetVisibility: {},
      compactMode: false,
      focusMode: false,
    },
  },
};

/**
 * Maps journey milestones to command center setup tasks
 */
const MILESTONE_TO_SETUP_TASK_MAP = {
  'youtube-connection': 'connect-youtube',
  'channel-photo': 'setup-profile',
  'channel-banner': 'setup-branding',
  'channel-description': 'setup-description',
  'niche-selection': 'define-niche',
  'content-calendar': 'setup-calendar',
  'first-ai-tool': 'explore-ai-tools',
  'first-upload': 'first-upload',
};

/**
 * Maps journey experience levels to command center levels
 */
const EXPERIENCE_LEVEL_MAP = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

/**
 * Migration Service Class
 * Handles all migration operations between journey and command center systems
 */
export class MigrationService {
  constructor() {
    this.migrationCallbacks = [];
  }

  /**
   * Check if migration has been completed
   * @returns {boolean}
   */
  isMigrationCompleted() {
    try {
      const completed = localStorage.getItem(MIGRATION_STORAGE_KEYS.migrationCompleted);
      const version = localStorage.getItem(MIGRATION_STORAGE_KEYS.migrationVersion);
      return completed === 'true' && version === CURRENT_MIGRATION_VERSION;
    } catch (error) {
      console.error('[MigrationService] Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Get current system preference
   * @returns {'command-center' | 'journey' | null}
   */
  getSystemPreference() {
    try {
      return localStorage.getItem(MIGRATION_STORAGE_KEYS.systemPreference);
    } catch (error) {
      console.error('[MigrationService] Error getting system preference:', error);
      return null;
    }
  }

  /**
   * Set system preference
   * @param {'command-center' | 'journey'} preference
   */
  setSystemPreference(preference) {
    try {
      localStorage.setItem(MIGRATION_STORAGE_KEYS.systemPreference, preference);
      this.notifyCallbacks({ type: 'preference-changed', preference });
    } catch (error) {
      console.error('[MigrationService] Error setting system preference:', error);
    }
  }

  /**
   * Load existing journey data from localStorage
   * @returns {Object | null}
   */
  loadJourneyData() {
    try {
      const journeyState = localStorage.getItem(JOURNEY_STORAGE_KEYS.journeyState);
      const stages = localStorage.getItem(JOURNEY_STORAGE_KEYS.stages);
      const userStats = localStorage.getItem(JOURNEY_STORAGE_KEYS.userStats);

      if (!journeyState && !stages && !userStats) {
        return null;
      }

      return {
        journeyState: journeyState ? JSON.parse(journeyState) : null,
        stages: stages ? JSON.parse(stages) : null,
        userStats: userStats ? JSON.parse(userStats) : null,
      };
    } catch (error) {
      console.error('[MigrationService] Error loading journey data:', error);
      return null;
    }
  }

  /**
   * Backup journey data before migration
   * @param {Object} journeyData
   */
  backupJourneyData(journeyData) {
    try {
      localStorage.setItem(
        MIGRATION_STORAGE_KEYS.backupJourneyState,
        JSON.stringify({
          ...journeyData,
          backupTimestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('[MigrationService] Error backing up journey data:', error);
    }
  }

  /**
   * Restore journey data from backup
   * @returns {Object | null}
   */
  restoreJourneyBackup() {
    try {
      const backup = localStorage.getItem(MIGRATION_STORAGE_KEYS.backupJourneyState);
      if (!backup) return null;

      const backupData = JSON.parse(backup);
      
      // Restore to original journey storage keys
      if (backupData.journeyState) {
        localStorage.setItem(JOURNEY_STORAGE_KEYS.journeyState, JSON.stringify(backupData.journeyState));
      }
      if (backupData.stages) {
        localStorage.setItem(JOURNEY_STORAGE_KEYS.stages, JSON.stringify(backupData.stages));
      }
      if (backupData.userStats) {
        localStorage.setItem(JOURNEY_STORAGE_KEYS.userStats, JSON.stringify(backupData.userStats));
      }

      return backupData;
    } catch (error) {
      console.error('[MigrationService] Error restoring journey backup:', error);
      return null;
    }
  }

  /**
   * Convert journey milestones to setup task completions
   * @param {string[]} completedMilestones
   * @returns {string[]}
   */
  convertMilestonesToSetupTasks(completedMilestones) {
    if (!completedMilestones || !Array.isArray(completedMilestones)) {
      return [];
    }

    return completedMilestones
      .map(milestone => MILESTONE_TO_SETUP_TASK_MAP[milestone])
      .filter(Boolean);
  }

  /**
   * Convert journey achievements to command center format
   * @param {Array} achievements
   * @returns {Array}
   */
  convertAchievements(achievements) {
    if (!achievements || !Array.isArray(achievements)) {
      return [];
    }

    return achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon || '🏆',
      unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : new Date(),
      category: achievement.category || 'setup',
      points: achievement.points || 0,
    }));
  }

  /**
   * Calculate setup progress from journey data
   * @param {Object} journeyData
   * @returns {Object}
   */
  calculateSetupProgress(journeyData) {
    const { journeyState, stages } = journeyData;
    
    if (!journeyState || !stages) {
      return DEFAULT_COMMAND_CENTER_STATE.setupProgress;
    }

    // Count essential setup milestones
    const setupStage = stages.find(s => s.id === 'setup');
    const essentialMilestones = setupStage?.milestones || [];
    const completedEssential = essentialMilestones.filter(
      m => journeyState.completedMilestones?.includes(m.id)
    ).length;

    const totalTasks = Math.max(essentialMilestones.length, 5);
    const completedTasks = completedEssential;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      percentage,
      essentialTasksComplete: completedTasks >= Math.min(3, totalTasks),
    };
  }

  /**
   * Calculate user metrics from journey data
   * @param {Object} journeyData
   * @returns {Object}
   */
  calculateMetrics(journeyData) {
    const { userStats } = journeyData;

    if (!userStats) {
      return DEFAULT_COMMAND_CENTER_STATE.metrics;
    }

    return {
      videosCreatedThisWeek: userStats.videosCreated || 0,
      uploadConsistency: Math.min(100, (userStats.currentStreak || 0) * 10),
      channelGrowth: {
        subscribers: 0, // Will be populated from analytics
        views: 0,
        engagement: userStats.channelOptimizationScore || 0,
      },
      streaks: {
        dailyActivity: userStats.currentStreak || 0,
        weeklyUploads: Math.floor((userStats.videosCreated || 0) / 7),
        contentCreation: userStats.daysActive || 0,
      },
      achievements: this.convertAchievements(userStats.achievements),
    };
  }

  /**
   * Migrate journey data to command center format
   * @param {Object} journeyData
   * @returns {Object}
   */
  migrateToCommandCenter(journeyData) {
    if (!journeyData) {
      return { ...DEFAULT_COMMAND_CENTER_STATE };
    }

    const { journeyState, userStats } = journeyData;

    // Calculate setup progress
    const setupProgress = this.calculateSetupProgress(journeyData);

    // Calculate metrics
    const metrics = this.calculateMetrics(journeyData);

    // Map experience level
    const experienceLevel = journeyState?.experienceLevel
      ? EXPERIENCE_LEVEL_MAP[journeyState.experienceLevel] || 'beginner'
      : 'beginner';

    // Determine if setup is completed
    const setupCompleted = journeyState?.onboardingCompleted || setupProgress.essentialTasksComplete;

    return {
      ...DEFAULT_COMMAND_CENTER_STATE,
      setupProgress,
      metrics,
      userSettings: {
        ...DEFAULT_COMMAND_CENTER_STATE.userSettings,
        setupCompleted,
        experienceLevel,
      },
    };
  }

  /**
   * Perform full migration from journey to command center
   * @returns {Object} Migration result
   */
  performMigration() {
    try {
      // Load existing journey data
      const journeyData = this.loadJourneyData();

      // Backup journey data
      if (journeyData) {
        this.backupJourneyData(journeyData);
      }

      // Migrate to command center format
      const commandCenterState = this.migrateToCommandCenter(journeyData);

      // Save command center state
      this.saveCommandCenterState(commandCenterState);

      // Mark migration as completed
      localStorage.setItem(MIGRATION_STORAGE_KEYS.migrationCompleted, 'true');
      localStorage.setItem(MIGRATION_STORAGE_KEYS.migrationVersion, CURRENT_MIGRATION_VERSION);
      
      // Set default preference to command center
      this.setSystemPreference('command-center');

      this.notifyCallbacks({ type: 'migration-completed', state: commandCenterState });

      return {
        success: true,
        state: commandCenterState,
        hadExistingData: !!journeyData,
      };
    } catch (error) {
      console.error('[MigrationService] Migration failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save command center state to localStorage
   * @param {Object} state
   */
  saveCommandCenterState(state) {
    try {
      localStorage.setItem(
        MIGRATION_STORAGE_KEYS.commandCenterState,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('[MigrationService] Error saving command center state:', error);
    }
  }

  /**
   * Load command center state from localStorage
   * @returns {Object}
   */
  loadCommandCenterState() {
    try {
      const stored = localStorage.getItem(MIGRATION_STORAGE_KEYS.commandCenterState);
      return stored ? JSON.parse(stored) : { ...DEFAULT_COMMAND_CENTER_STATE };
    } catch (error) {
      console.error('[MigrationService] Error loading command center state:', error);
      return { ...DEFAULT_COMMAND_CENTER_STATE };
    }
  }

  /**
   * Switch back to journey system
   * @returns {boolean}
   */
  switchToJourney() {
    try {
      // Restore journey backup if available
      this.restoreJourneyBackup();
      
      // Update preference
      this.setSystemPreference('journey');
      
      this.notifyCallbacks({ type: 'switched-to-journey' });
      
      return true;
    } catch (error) {
      console.error('[MigrationService] Error switching to journey:', error);
      return false;
    }
  }

  /**
   * Switch to command center system
   * @returns {boolean}
   */
  switchToCommandCenter() {
    try {
      // Perform migration if not done
      if (!this.isMigrationCompleted()) {
        this.performMigration();
      }
      
      // Update preference
      this.setSystemPreference('command-center');
      
      this.notifyCallbacks({ type: 'switched-to-command-center' });
      
      return true;
    } catch (error) {
      console.error('[MigrationService] Error switching to command center:', error);
      return false;
    }
  }

  /**
   * Register callback for migration events
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onMigrationEvent(callback) {
    this.migrationCallbacks.push(callback);
    return () => {
      this.migrationCallbacks = this.migrationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all registered callbacks
   * @param {Object} event
   */
  notifyCallbacks(event) {
    this.migrationCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[MigrationService] Callback error:', error);
      }
    });
  }

  /**
   * Reset migration state (for testing)
   */
  resetMigration() {
    try {
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.migrationCompleted);
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.migrationVersion);
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.systemPreference);
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.commandCenterState);
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.backupJourneyState);
    } catch (error) {
      console.error('[MigrationService] Error resetting migration:', error);
    }
  }
}

// Singleton instance
let migrationServiceInstance = null;

/**
 * Get the migration service singleton
 * @returns {MigrationService}
 */
export function getMigrationService() {
  if (!migrationServiceInstance) {
    migrationServiceInstance = new MigrationService();
  }
  return migrationServiceInstance;
}

/**
 * Check if should show command center or journey
 * @returns {'command-center' | 'journey'}
 */
export function getActiveSystem() {
  const service = getMigrationService();
  const preference = service.getSystemPreference();
  
  // If user has explicitly chosen, respect that
  if (preference) {
    return preference;
  }
  
  // Default to command-center (the new system)
  return 'command-center';
}

export default MigrationService;
