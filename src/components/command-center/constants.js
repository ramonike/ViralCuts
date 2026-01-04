/**
 * Command Center Constants
 * Separated from components for better Fast Refresh compatibility
 */

// ============================================
// FEATURE FLAG SYSTEM
// ============================================

export const FEATURE_FLAG_KEY = 'viralcuts-command-center-feature-flags';

/**
 * Default feature flags for gradual rollout
 * Requirements: 9.4 - Feature flag system for gradual rollout
 */
export const DEFAULT_FEATURE_FLAGS = {
  enableCommandCenter: true,
  enableFocusMode: true,
  enableSmartSuggestions: true,
  enableNotifications: true,
  enableWidgetCustomization: true,
  enableSystemSwitcher: true,
  showBetaBadge: true,
};

/**
 * Load feature flags from localStorage
 */
export function loadFeatureFlags() {
  try {
    const stored = localStorage.getItem(FEATURE_FLAG_KEY);
    return stored ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) } : DEFAULT_FEATURE_FLAGS;
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

/**
 * Save feature flags to localStorage
 */
export function saveFeatureFlags(flags) {
  try {
    localStorage.setItem(FEATURE_FLAG_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error('[DailyCommandCenter] Error saving feature flags:', error);
  }
}

// ============================================
// DEFAULT SETUP TASKS
// ============================================

export const DEFAULT_SETUP_TASKS = [
  {
    id: 'connect-youtube',
    title: 'Connect YouTube Channel',
    description: 'Link your YouTube account to enable uploads and analytics',
    estimatedTime: 2,
    priority: 'high',
    completed: false,
    actionUrl: '/settings#youtube',
    benefits: ['Enable direct uploads', 'Access channel analytics', 'Schedule content'],
  },
  {
    id: 'setup-profile',
    title: 'Complete Your Profile',
    description: 'Add your creator information and preferences',
    estimatedTime: 3,
    priority: 'high',
    completed: false,
    actionUrl: '/profile',
    benefits: ['Personalized recommendations', 'Better content suggestions'],
  },
  {
    id: 'explore-ai-tools',
    title: 'Explore AI Tools',
    description: 'Discover AI-powered tools for content creation',
    estimatedTime: 5,
    priority: 'medium',
    completed: false,
    actionUrl: '/dashboard#opus',
    benefits: ['Create clips automatically', 'Generate thumbnails', 'Optimize titles'],
  },
  {
    id: 'setup-notifications',
    title: 'Configure Notifications',
    description: 'Set up alerts for uploads, analytics, and reminders',
    estimatedTime: 2,
    priority: 'medium',
    completed: false,
    actionUrl: '/settings#notifications',
    benefits: ['Stay informed', 'Never miss deadlines', 'Track performance'],
  },
  {
    id: 'first-upload',
    title: 'Upload Your First Video',
    description: 'Start your content journey with your first upload',
    estimatedTime: 10,
    priority: 'low',
    completed: false,
    actionUrl: '/videos',
    benefits: ['Begin building your library', 'Test the upload workflow'],
  },
];
