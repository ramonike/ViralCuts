/**
 * Fast-check arbitraries for property-based testing
 * Generators for command center types
 */

import * as fc from 'fast-check';

// ============================================
// BASIC ARBITRARIES
// ============================================

export const experienceLevelArbitrary = fc.constantFrom('beginner', 'intermediate', 'advanced');

export const setupPriorityArbitrary = fc.constantFrom('high', 'medium', 'low');

export const taskTypeArbitrary = fc.constantFrom('creation', 'optimization', 'analysis', 'planning');

export const contentTypeArbitrary = fc.constantFrom('short', 'long', 'live', 'story');

export const suggestionTypeArbitrary = fc.constantFrom('action', 'tip', 'opportunity', 'warning');

export const impactLevelArbitrary = fc.constantFrom('low', 'medium', 'high');

export const actionCategoryArbitrary = fc.constantFrom('creation', 'optimization', 'analysis', 'management');

// ============================================
// USER CONFIGURATION ARBITRARIES
// ============================================

export const userGoalsArbitrary = fc.record({
  dailyUploadTarget: fc.integer({ min: 0, max: 10 }),
  weeklyContentGoal: fc.integer({ min: 0, max: 50 }),
  growthTargets: fc.record({
    subscribers: fc.integer({ min: 0, max: 1000000 }),
    views: fc.integer({ min: 0, max: 10000000 }),
    engagement: fc.integer({ min: 0, max: 100 }),
  }),
  focusAreas: fc.array(fc.constantFrom('growth', 'engagement', 'monetization', 'quality'), { minLength: 1, maxLength: 4 }),
});

export const userPreferencesArbitrary = fc.record({
  notificationFrequency: fc.constantFrom('all', 'important', 'minimal'),
  focusModeEnabled: fc.boolean(),
  widgetVisibility: fc.dictionary(fc.string(), fc.boolean()),
  quickActionsOrder: fc.array(fc.string(), { maxLength: 10 }),
});

export const layoutConfigArbitrary = fc.record({
  widgetOrder: fc.array(fc.string(), { maxLength: 10 }),
  widgetVisibility: fc.dictionary(fc.string(), fc.boolean()),
  compactMode: fc.boolean(),
  focusMode: fc.boolean(),
});

export const userSettingsArbitrary = fc.record({
  setupCompleted: fc.boolean(),
  experienceLevel: experienceLevelArbitrary,
  goals: userGoalsArbitrary,
  preferences: userPreferencesArbitrary,
  layoutConfig: layoutConfigArbitrary,
});

// ============================================
// SETUP ASSISTANT ARBITRARIES
// ============================================

export const setupTaskArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  estimatedTime: fc.integer({ min: 1, max: 120 }),
  priority: setupPriorityArbitrary,
  completed: fc.boolean(),
  actionUrl: fc.option(fc.webUrl(), { nil: undefined }),
  benefits: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
});

export const setupProgressArbitrary = fc.record({
  totalTasks: fc.integer({ min: 1, max: 20 }),
  completedTasks: fc.integer({ min: 0, max: 20 }),
  percentage: fc.integer({ min: 0, max: 100 }),
  essentialTasksComplete: fc.boolean(),
});

// ============================================
// DAILY PLANNER ARBITRARIES
// ============================================

export const taskArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 300 }),
  type: taskTypeArbitrary,
  estimatedTime: fc.integer({ min: 5, max: 240 }),
  expectedOutcome: fc.string({ minLength: 10, maxLength: 200 }),
  priority: fc.integer({ min: 1, max: 10 }),
  deadline: fc.option(fc.date(), { nil: undefined }),
  progress: fc.integer({ min: 0, max: 100 }),
  dependencies: fc.option(fc.array(fc.uuid(), { maxLength: 5 }), { nil: undefined }),
  completed: fc.boolean(),
});

// ============================================
// PROGRESS DASHBOARD ARBITRARIES
// ============================================

export const streakDataArbitrary = fc.record({
  dailyActivity: fc.integer({ min: 0, max: 365 }),
  weeklyUploads: fc.integer({ min: 0, max: 52 }),
  contentCreation: fc.integer({ min: 0, max: 365 }),
});

export const channelGrowthArbitrary = fc.record({
  subscribers: fc.integer({ min: 0, max: 10000000 }),
  views: fc.integer({ min: 0, max: 100000000 }),
  engagement: fc.integer({ min: 0, max: 100 }),
});

export const achievementArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.string({ minLength: 1, maxLength: 10 }),
  unlockedAt: fc.date(),
  category: fc.constantFrom('setup', 'creation', 'optimization', 'publishing', 'engagement'),
  points: fc.integer({ min: 10, max: 1000 }),
});

export const userMetricsArbitrary = fc.record({
  videosCreatedThisWeek: fc.integer({ min: 0, max: 50 }),
  uploadConsistency: fc.integer({ min: 0, max: 100 }),
  channelGrowth: channelGrowthArbitrary,
  streaks: streakDataArbitrary,
  achievements: fc.array(achievementArbitrary, { maxLength: 20 }),
});

// ============================================
// CONTENT WORKFLOW ARBITRARIES
// ============================================

export const workflowStepArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  completed: fc.boolean(),
  tools: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { maxLength: 5 }),
  estimatedTime: fc.integer({ min: 5, max: 120 }),
});

export const workflowStateArbitrary = fc.record({
  id: fc.uuid(),
  contentType: contentTypeArbitrary,
  currentStep: fc.integer({ min: 0, max: 10 }),
  steps: fc.array(workflowStepArbitrary, { minLength: 1, maxLength: 10 }),
  progress: fc.integer({ min: 0, max: 100 }),
  startedAt: fc.date(),
  lastSavedAt: fc.option(fc.date(), { nil: undefined }),
  metadata: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
});

// ============================================
// QUICK ACTIONS ARBITRARIES
// ============================================

export const actionArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  icon: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  shortcut: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  notificationCount: fc.option(fc.integer({ min: 0, max: 99 }), { nil: undefined }),
  handler: fc.constant(() => {}),
  category: actionCategoryArbitrary,
  usageCount: fc.integer({ min: 0, max: 1000 }),
  lastUsed: fc.option(fc.date(), { nil: undefined }),
});

export const userStateArbitrary = fc.record({
  hasRecentUploads: fc.boolean(),
  hasScheduledContent: fc.boolean(),
  hasUnreadNotifications: fc.boolean(),
  currentActivity: fc.option(fc.string(), { nil: undefined }),
  recentActions: fc.array(fc.string(), { maxLength: 10 }),
});

// ============================================
// SMART SUGGESTIONS ARBITRARIES
// ============================================

export const suggestionArbitrary = fc.record({
  id: fc.uuid(),
  type: suggestionTypeArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 300 }),
  confidence: fc.double({ min: 0, max: 1 }),
  impact: impactLevelArbitrary,
  actionable: fc.boolean(),
  actionUrl: fc.option(fc.webUrl(), { nil: undefined }),
  dismissible: fc.boolean(),
  createdAt: fc.date(),
});

export const userActivityArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.string({ minLength: 3, maxLength: 30 }),
  timestamp: fc.date(),
  metadata: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
});

// ============================================
// NOTIFICATION ARBITRARIES
// ============================================

export const notificationArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('reminder', 'alert', 'achievement', 'update'),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  message: fc.string({ minLength: 10, maxLength: 300 }),
  timestamp: fc.date(),
  read: fc.boolean(),
  actionable: fc.boolean(),
  actions: fc.option(fc.array(fc.record({
    label: fc.string({ minLength: 3, maxLength: 30 }),
    handler: fc.constant(() => {}),
  }), { maxLength: 3 }), { nil: undefined }),
  priority: fc.constantFrom('low', 'medium', 'high'),
});

// ============================================
// FOCUS MODE ARBITRARIES
// ============================================

export const focusSessionArbitrary = fc.record({
  id: fc.uuid(),
  startedAt: fc.date(),
  endedAt: fc.option(fc.date(), { nil: undefined }),
  duration: fc.integer({ min: 5, max: 120 }),
  tasksCompleted: fc.array(fc.uuid(), { maxLength: 20 }),
  contentCreated: fc.array(fc.uuid(), { maxLength: 10 }),
  summary: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  paused: fc.boolean(),
  pausedAt: fc.option(fc.date(), { nil: null }),
  totalPausedTime: fc.integer({ min: 0, max: 3600000 }),
});

export const widgetArbitrary = fc.record({
  id: fc.constantFrom(
    'content-workflow',
    'ai-tools',
    'progress-tracker',
    'timer',
    'setup-assistant',
    'daily-planner',
    'progress-dashboard',
    'quick-actions',
    'smart-suggestions',
    'notifications',
    'calendar',
    'analytics'
  ),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  visible: fc.boolean(),
  priority: fc.integer({ min: 1, max: 10 }),
});

export const toolArbitrary = fc.record({
  id: fc.constantFrom(
    'opus-clip',
    'ai-assistant',
    'upload-queue',
    'content-editor',
    'scheduler',
    'analytics',
    'settings',
    'notifications'
  ),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  category: fc.constantFrom('ai', 'creation', 'management', 'analysis'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a valid setup progress where completedTasks <= totalTasks
 */
export const validSetupProgressArbitrary = fc.integer({ min: 1, max: 20 }).chain(totalTasks =>
  fc.record({
    totalTasks: fc.constant(totalTasks),
    completedTasks: fc.integer({ min: 0, max: totalTasks }),
    percentage: fc.integer({ min: 0, max: 100 }),
    essentialTasksComplete: fc.boolean(),
  })
);

/**
 * Generate a valid workflow state where currentStep is within bounds
 */
export const validWorkflowStateArbitrary = fc.array(workflowStepArbitrary, { minLength: 1, maxLength: 10 }).chain(steps =>
  fc.record({
    id: fc.uuid(),
    contentType: contentTypeArbitrary,
    currentStep: fc.integer({ min: 0, max: steps.length - 1 }),
    steps: fc.constant(steps),
    progress: fc.integer({ min: 0, max: 100 }),
    startedAt: fc.date(),
    lastSavedAt: fc.option(fc.date(), { nil: undefined }),
    metadata: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
  })
);
