/**
 * Test utilities for Daily Command Center
 * Helper functions for testing components
 */

import { render } from '@testing-library/react';
import React from 'react';

/**
 * Deep equality check for objects
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Create a mock user for testing
 * @param {Partial<import('../types').User>} overrides
 * @returns {import('../types').User}
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock user settings for testing
 * @param {Partial<import('../types').UserSettings>} overrides
 * @returns {import('../types').UserSettings}
 */
export function createMockUserSettings(overrides = {}) {
  return {
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
    ...overrides,
  };
}

/**
 * Create a first-time user for testing
 * @returns {import('../types').User}
 */
export function createFirstTimeUser() {
  return createMockUser({
    createdAt: new Date().toISOString(),
  });
}

/**
 * Create a user with no tasks for testing
 * @returns {import('../types').User}
 */
export function createUserWithNoTasks() {
  return createMockUser({
    id: 'user-no-tasks',
  });
}

/**
 * Create mock setup tasks
 * @param {number} count
 * @returns {import('../types').SetupTask[]}
 */
export function createMockSetupTasks(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Setup Task ${i + 1}`,
    description: `Description for task ${i + 1}`,
    estimatedTime: 10 + i * 5,
    priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
    completed: false,
    benefits: [`Benefit ${i + 1}`],
  }));
}

/**
 * Create mock daily tasks
 * @param {number} count
 * @returns {import('../types').Task[]}
 */
export function createMockDailyTasks(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `daily-task-${i}`,
    title: `Daily Task ${i + 1}`,
    description: `Description for daily task ${i + 1}`,
    type: 'creation',
    estimatedTime: 30 + i * 15,
    expectedOutcome: `Outcome ${i + 1}`,
    priority: count - i,
    progress: 0,
    completed: false,
  }));
}

/**
 * Create mock user metrics
 * @param {Partial<import('../types').UserMetrics>} overrides
 * @returns {import('../types').UserMetrics}
 */
export function createMockUserMetrics(overrides = {}) {
  return {
    videosCreatedThisWeek: 5,
    uploadConsistency: 80,
    channelGrowth: {
      subscribers: 1500,
      views: 25000,
      engagement: 7,
    },
    streaks: {
      dailyActivity: 10,
      weeklyUploads: 3,
      contentCreation: 15,
    },
    achievements: [],
    ...overrides,
  };
}

/**
 * Create mock actions
 * @param {number} count
 * @returns {import('../types').Action[]}
 */
export function createMockActions(count = 6) {
  const categories = ['creation', 'optimization', 'analysis', 'management'];
  return Array.from({ length: count }, (_, i) => ({
    id: `action-${i}`,
    title: `Action ${i + 1}`,
    icon: '🎬',
    description: `Description for action ${i + 1}`,
    handler: () => {},
    category: categories[i % categories.length],
    usageCount: i * 10,
  }));
}

/**
 * Create mock suggestions
 * @param {number} count
 * @returns {import('../types').Suggestion[]}
 */
export function createMockSuggestions(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `suggestion-${i}`,
    type: 'tip',
    title: `Suggestion ${i + 1}`,
    description: `Description for suggestion ${i + 1}`,
    confidence: 0.8,
    impact: 'medium',
    actionable: true,
    dismissible: true,
    createdAt: new Date(),
  }));
}

/**
 * Create mock workflow state
 * @param {Partial<import('../types').ContentWorkflowState>} overrides
 * @returns {import('../types').ContentWorkflowState}
 */
export function createMockWorkflowState(overrides = {}) {
  return {
    id: 'workflow-1',
    contentType: 'short',
    currentStep: 0,
    steps: [
      {
        id: 'step-1',
        name: 'Planning',
        description: 'Plan your content',
        completed: false,
        tools: ['AI Tool'],
        estimatedTime: 15,
      },
    ],
    progress: 0,
    startedAt: new Date(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Render component with common providers
 * @param {React.ReactElement} ui
 * @param {Object} options
 */
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    ...options,
  });
}

/**
 * Wait for a condition to be true
 * @param {() => boolean} condition
 * @param {number} timeout
 * @returns {Promise<void>}
 */
export function waitForCondition(condition, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 50);
  });
}

/**
 * Generate large user data for performance testing
 * @param {number} size
 * @returns {Object}
 */
export function generateLargeUserData(size) {
  return {
    tasks: createMockDailyTasks(size),
    metrics: createMockUserMetrics(),
    suggestions: createMockSuggestions(Math.floor(size / 100)),
    actions: createMockActions(10),
  };
}
