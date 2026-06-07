/**
 * CommandCenterNotifications Component
 * 
 * Notification center with actionable alerts for the Daily Command Center.
 * Displays scheduled upload reminders, performance change alerts, and system notifications.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/card';
import { 
  Bell, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
  Settings,
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Storage keys
const PREFERENCES_STORAGE_KEY = 'command-center-notification-preferences';
const DISMISSED_STORAGE_KEY = 'command-center-dismissed-notifications';

// Default notification preferences
const DEFAULT_PREFERENCES = {
  enabled: true,
  types: {
    scheduled_upload: true,
    performance_alert: true,
    achievement: true,
    system_update: true,
    optimization_tip: true,
  },
  frequency: 'all', // 'all' | 'important' | 'minimal'
};

// Notification type configurations
const NOTIFICATION_TYPE_CONFIG = {
  scheduled_upload: {
    icon: Calendar,
    iconClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    label: 'Scheduled Upload',
    priority: 'high',
  },
  performance_alert: {
    icon: TrendingUp,
    iconClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    label: 'Performance Alert',
    priority: 'high',
  },
  performance_decline: {
    icon: TrendingDown,
    iconClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    label: 'Performance Decline',
    priority: 'high',
  },
  achievement: {
    icon: Sparkles,
    iconClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    label: 'Achievement',
    priority: 'medium',
  },
  system_update: {
    icon: Bell,
    iconClass: 'text-slate-400',
    bgClass: 'bg-slate-500/10',
    label: 'System Update',
    priority: 'low',
  },
  optimization_tip: {
    icon: AlertTriangle,
    iconClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    label: 'Optimization Tip',
    priority: 'medium',
  },
};

/**
 * Format relative time for notifications
 * @param {Date} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now - notificationDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return notificationDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

/**
 * Format time until scheduled upload
 * @param {Date} scheduledTime
 * @returns {string}
 */
function formatTimeUntil(scheduledTime) {
  const now = new Date();
  const scheduled = new Date(scheduledTime);
  const diffInMs = scheduled - now;
  
  if (diffInMs < 0) return 'Overdue';
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes < 60) return `in ${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `in ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `in ${diffInDays}d`;
}

/**
 * NotificationPreferencesManager
 * Handles loading and saving notification preferences
 * Requirements: 7.5 - Allow users to customize notification preferences
 */
class NotificationPreferencesManager {
  constructor() {
    this.preferences = this.loadPreferences();
    this.dismissed = this.loadDismissed();
  }

  loadPreferences() {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  savePreferences(preferences) {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      this.preferences = preferences;
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  loadDismissed() {
    try {
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load dismissed notifications:', error);
    }
    return new Set();
  }

  saveDismissed(dismissed) {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]));
      this.dismissed = dismissed;
    } catch (error) {
      console.error('Failed to save dismissed notifications:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  isTypeEnabled(type) {
    if (!this.preferences.enabled) return false;
    return this.preferences.types[type] !== false;
  }

  isDismissed(notificationId) {
    return this.dismissed.has(notificationId);
  }

  dismiss(notificationId) {
    this.dismissed.add(notificationId);
    this.saveDismissed(this.dismissed);
  }

  clearDismissed() {
    this.dismissed.clear();
    this.saveDismissed(this.dismissed);
  }
}

/**
 * ErrorHandler
 * Handles errors gracefully with retry strategies
 * Requirements: 7.5 - Graceful error handling for all components
 */
class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseBackoffMs = 1000;
  }

  /**
   * Execute an operation with retry logic
   * @param {string} operationId - Unique identifier for the operation
   * @param {Function} operation - Async operation to execute
   * @param {Object} options - Retry options
   * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
   */
  async executeWithRetry(operationId, operation, options = {}) {
    const { maxRetries = this.maxRetries, backoffMs = this.baseBackoffMs } = options;
    
    let attempts = this.retryAttempts.get(operationId) || 0;
    
    while (attempts < maxRetries) {
      try {
        const result = await operation();
        this.retryAttempts.delete(operationId);
        return { success: true, data: result };
      } catch (error) {
        attempts++;
        this.retryAttempts.set(operationId, attempts);
        
        if (attempts >= maxRetries) {
          console.error(`Operation ${operationId} failed after ${attempts} attempts:`, error);
          return { success: false, error, attempts };
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { success: false, error: new Error('Max retries exceeded'), attempts };
  }

  /**
   * Handle data loading errors with fallback
   * @param {Error} error
   * @param {any} fallbackData
   * @returns {Object}
   */
  handleDataLoadingError(error, fallbackData = []) {
    console.error('Data loading error:', error);
    return {
      data: fallbackData,
      isDefault: true,
      message: 'Unable to load data. Showing cached or default content.',
      error,
    };
  }

  /**
   * Handle storage errors gracefully
   * @param {Error} error
   * @param {string} operation
   * @returns {Object}
   */
  handleStorageError(error, operation) {
    console.error(`Storage error during ${operation}:`, error);
    return {
      success: false,
      message: `Failed to ${operation}. Changes may not persist.`,
      error,
    };
  }

  /**
   * Reset retry attempts for an operation
   * @param {string} operationId
   */
  resetRetries(operationId) {
    this.retryAttempts.delete(operationId);
  }

  /**
   * Get current retry count for an operation
   * @param {string} operationId
   * @returns {number}
   */
  getRetryCount(operationId) {
    return this.retryAttempts.get(operationId) || 0;
  }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

/**
 * NotificationService
 * Handles notification generation and filtering
 * Requirements: 7.1, 7.2, 7.3
 */
class NotificationService {
  constructor(preferencesManager = null) {
    this.preferencesManager = preferencesManager || new NotificationPreferencesManager();
  }

  /**
   * Generate scheduled upload reminders
   * Requirements: 7.2 - Show reminders with direct action buttons
   * @param {Array} scheduledUploads
   * @returns {Array}
   */
  generateScheduledUploadReminders(scheduledUploads = []) {
    if (!this.preferencesManager.isTypeEnabled('scheduled_upload')) {
      return [];
    }

    const now = new Date();
    const reminderThreshold = 24 * 60 * 60 * 1000; // 24 hours

    return scheduledUploads
      .filter(upload => {
        const scheduledTime = new Date(upload.scheduledTime);
        const timeUntil = scheduledTime - now;
        return timeUntil > 0 && timeUntil <= reminderThreshold;
      })
      .map(upload => ({
        id: `scheduled-${upload.id}`,
        type: 'scheduled_upload',
        title: 'Scheduled Upload Reminder',
        message: `"${upload.title}" is scheduled ${formatTimeUntil(upload.scheduledTime)}`,
        timestamp: new Date(),
        read: false,
        actionable: true,
        actions: [
          { id: 'view', label: 'View', handler: () => {} },
          { id: 'reschedule', label: 'Reschedule', handler: () => {} },
        ],
        priority: 'high',
        metadata: { uploadId: upload.id, scheduledTime: upload.scheduledTime },
      }));
  }

  /**
   * Generate performance change alerts
   * Requirements: 7.3 - Alert with analysis and suggestions
   * @param {Object} currentMetrics
   * @param {Object} previousMetrics
   * @returns {Array}
   */
  generatePerformanceAlerts(currentMetrics, previousMetrics) {
    if (!this.preferencesManager.isTypeEnabled('performance_alert')) {
      return [];
    }

    const alerts = [];
    
    if (!currentMetrics || !previousMetrics) return alerts;

    // Check for significant performance changes (>10%)
    const viewsChange = this.calculatePercentageChange(
      previousMetrics.views,
      currentMetrics.views
    );
    
    const subscribersChange = this.calculatePercentageChange(
      previousMetrics.subscribers,
      currentMetrics.subscribers
    );

    const engagementChange = this.calculatePercentageChange(
      previousMetrics.engagement,
      currentMetrics.engagement
    );

    // Positive performance alert
    if (viewsChange > 10 || subscribersChange > 10) {
      alerts.push({
        id: `performance-positive-${Date.now()}`,
        type: 'performance_alert',
        title: 'Performance Improvement',
        message: this.generatePositivePerformanceMessage(viewsChange, subscribersChange),
        timestamp: new Date(),
        read: false,
        actionable: true,
        actions: [
          { id: 'view-analytics', label: 'View Analytics', handler: () => {} },
        ],
        priority: 'medium',
        metadata: { viewsChange, subscribersChange, engagementChange },
      });
    }

    // Negative performance alert
    if (viewsChange < -10 || subscribersChange < -10 || engagementChange < -15) {
      alerts.push({
        id: `performance-decline-${Date.now()}`,
        type: 'performance_decline',
        title: 'Performance Decline Detected',
        message: this.generateDeclineMessage(viewsChange, subscribersChange, engagementChange),
        timestamp: new Date(),
        read: false,
        actionable: true,
        actions: [
          { id: 'view-analysis', label: 'View Analysis', handler: () => {} },
          { id: 'get-suggestions', label: 'Get Suggestions', handler: () => {} },
        ],
        priority: 'high',
        metadata: { viewsChange, subscribersChange, engagementChange },
      });
    }

    return alerts;
  }

  calculatePercentageChange(previous, current) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  generatePositivePerformanceMessage(viewsChange, subscribersChange) {
    const parts = [];
    if (viewsChange > 10) parts.push(`views up ${viewsChange.toFixed(0)}%`);
    if (subscribersChange > 10) parts.push(`subscribers up ${subscribersChange.toFixed(0)}%`);
    return `Great news! Your channel is growing: ${parts.join(', ')}`;
  }

  generateDeclineMessage(viewsChange, subscribersChange, engagementChange) {
    const parts = [];
    if (viewsChange < -10) parts.push(`views down ${Math.abs(viewsChange).toFixed(0)}%`);
    if (subscribersChange < -10) parts.push(`subscribers down ${Math.abs(subscribersChange).toFixed(0)}%`);
    if (engagementChange < -15) parts.push(`engagement down ${Math.abs(engagementChange).toFixed(0)}%`);
    return `We noticed some changes: ${parts.join(', ')}. Let's work on improving this.`;
  }

  /**
   * Filter notifications based on user preferences
   * Requirements: 7.5 - Allow users to customize notification preferences
   * @param {Array} notifications
   * @returns {Array}
   */
  filterByPreferences(notifications) {
    const { frequency } = this.preferencesManager.preferences;
    
    return notifications.filter(notification => {
      // Check if type is enabled
      if (!this.preferencesManager.isTypeEnabled(notification.type)) {
        return false;
      }
      
      // Check if dismissed
      if (this.preferencesManager.isDismissed(notification.id)) {
        return false;
      }
      
      // Filter by frequency preference
      if (frequency === 'important') {
        return notification.priority === 'high';
      }
      
      if (frequency === 'minimal') {
        return notification.priority === 'high' && notification.actionable;
      }
      
      return true;
    });
  }

  /**
   * Get all notifications for display
   * Requirements: 7.1 - Display notification center with actionable alerts
   * @param {Object} data - Data sources for notifications
   * @returns {Array}
   */
  getNotifications(data = {}) {
    const { scheduledUploads, currentMetrics, previousMetrics, customNotifications } = data;
    
    const notifications = [
      ...this.generateScheduledUploadReminders(scheduledUploads || []),
      ...this.generatePerformanceAlerts(currentMetrics, previousMetrics),
      ...(customNotifications || []),
    ];
    
    return this.filterByPreferences(notifications)
      .sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }

  /**
   * Get count of items requiring attention
   * Requirements: 7.2 - Show notification badges
   * @param {Array} notifications
   * @returns {number}
   */
  getAttentionCount(notifications) {
    return notifications.filter(n => !n.read && n.priority === 'high').length;
  }
}

/**
 * Single notification item component
 */
const NotificationItem = ({ notification, onAction, onDismiss, onMarkRead }) => {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.system_update;
  const Icon = config.icon;

  const handleAction = useCallback((action) => {
    if (action.handler) {
      action.handler();
    }
    if (onAction) {
      onAction(notification, action);
    }
  }, [notification, onAction]);

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(notification.id);
    }
  }, [notification.id, onDismiss]);

  const handleClick = useCallback(() => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  }, [notification, onMarkRead]);

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 border-b border-slate-700/50 hover:bg-slate-800/50 
        transition-colors cursor-pointer group
        ${!notification.read ? 'bg-slate-800/30' : ''}
      `}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${config.bgClass} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconClass}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium truncate ${
                  notification.read ? 'text-slate-300' : 'text-white'
                }`}>
                  {notification.title}
                </p>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className={`text-sm mt-1 line-clamp-2 ${
                notification.read ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {notification.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          {notification.actionable && notification.actions?.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.actions.map(action => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 
                    hover:bg-blue-500/30 rounded-lg transition-colors"
                  data-testid={`notification-action-${action.id}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-slate-500 mt-2">
            {formatRelativeTime(notification.timestamp)}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 
            rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dismiss"
          data-testid={`notification-dismiss-${notification.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Notification preferences panel component
 * Requirements: 7.5 - Allow users to customize notification preferences
 */
const NotificationPreferencesPanel = ({ preferences, onUpdate, onClose }) => {
  const handleToggleType = useCallback((type) => {
    onUpdate({
      ...preferences,
      types: {
        ...preferences.types,
        [type]: !preferences.types[type],
      },
    });
  }, [preferences, onUpdate]);

  const handleFrequencyChange = useCallback((frequency) => {
    onUpdate({
      ...preferences,
      frequency,
    });
  }, [preferences, onUpdate]);

  const handleToggleEnabled = useCallback(() => {
    onUpdate({
      ...preferences,
      enabled: !preferences.enabled,
    });
  }, [preferences, onUpdate]);

  return (
    <div className="p-4 border-b border-slate-700 bg-slate-800/50" data-testid="notification-preferences">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-white">Notification Preferences</h4>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between py-2 border-b border-slate-700/50 mb-3">
        <span className="text-sm text-slate-300">Enable notifications</span>
        <button
          onClick={handleToggleEnabled}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            preferences.enabled ? 'bg-blue-500' : 'bg-slate-600'
          }`}
          data-testid="notification-master-toggle"
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            preferences.enabled ? 'left-5' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Frequency selector */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-2">Notification frequency</p>
        <div className="flex gap-2">
          {['all', 'important', 'minimal'].map(freq => (
            <button
              key={freq}
              onClick={() => handleFrequencyChange(freq)}
              disabled={!preferences.enabled}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                preferences.frequency === freq
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              } ${!preferences.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid={`frequency-${freq}`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Type toggles */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 mb-2">Notification types</p>
        {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <config.icon className={`w-4 h-4 ${config.iconClass}`} />
              <span className="text-sm text-slate-300">{config.label}</span>
            </div>
            <button
              onClick={() => handleToggleType(type)}
              disabled={!preferences.enabled}
              className={`relative w-8 h-4 rounded-full transition-colors ${
                preferences.types[type] ? 'bg-blue-500' : 'bg-slate-600'
              } ${!preferences.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid={`type-toggle-${type}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                preferences.types[type] ? 'left-4' : 'left-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Error state component for displaying errors with retry option
 * Requirements: 7.5 - Graceful error handling
 */
const ErrorState = ({ error, onRetry, message }) => {
  return (
    <div className="py-8 text-center" data-testid="notification-error">
      <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
      <p className="text-slate-300 text-sm font-medium mb-1">
        {message || 'Something went wrong'}
      </p>
      <p className="text-slate-500 text-xs mb-4">
        {error?.message || 'Unable to load notifications'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
            bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
          data-testid="notification-retry"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * Main CommandCenterNotifications component
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const CommandCenterNotifications = ({
  scheduledUploads = [],
  currentMetrics = null,
  previousMetrics = null,
  customNotifications = [],
  onNotificationAction,
  onNotificationDismiss,
  onNotificationRead,
  onError,
  maxHeight = 400,
  className = '',
}) => {
  // State
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'actionable'
  const [showPreferences, setShowPreferences] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(() => {
    try {
      const manager = new NotificationPreferencesManager();
      return manager.preferences;
    } catch (err) {
      console.error('Failed to load preferences:', err);
      return { ...DEFAULT_PREFERENCES };
    }
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    const manager = new NotificationPreferencesManager();
    return manager.dismissed;
  });
  const [readIds, setReadIds] = useState(new Set());

  // Initialize service
  const service = useMemo(() => {
    const manager = new NotificationPreferencesManager();
    manager.preferences = preferences;
    manager.dismissed = dismissedIds;
    return new NotificationService(manager);
  }, [preferences, dismissedIds]);

  // Get notifications
  const notifications = useMemo(() => {
    return service.getNotifications({
      scheduledUploads,
      currentMetrics,
      previousMetrics,
      customNotifications,
    }).map(n => ({
      ...n,
      read: readIds.has(n.id) || n.read,
    }));
  }, [service, scheduledUploads, currentMetrics, previousMetrics, customNotifications, readIds]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'actionable':
        return notifications.filter(n => n.actionable);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Calculate counts
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );
  
  const attentionCount = useMemo(() => 
    service.getAttentionCount(notifications), 
    [service, notifications]
  );

  // Handlers
  const handleDismiss = useCallback((notificationId) => {
    try {
      const manager = new NotificationPreferencesManager();
      manager.dismiss(notificationId);
      setDismissedIds(new Set(manager.dismissed));
      
      if (onNotificationDismiss) {
        onNotificationDismiss(notificationId);
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      const result = errorHandler.handleStorageError(err, 'dismiss notification');
      if (onError) onError(result);
    }
  }, [onNotificationDismiss, onError]);

  const handleMarkRead = useCallback((notificationId) => {
    setReadIds(prev => new Set([...prev, notificationId]));
    
    if (onNotificationRead) {
      onNotificationRead(notificationId);
    }
  }, [onNotificationRead]);

  const handleMarkAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadIds(new Set(allIds));
    
    allIds.forEach(id => {
      if (onNotificationRead) {
        onNotificationRead(id);
      }
    });
  }, [notifications, onNotificationRead]);

  const handleAction = useCallback((notification, action) => {
    handleMarkRead(notification.id);
    
    if (onNotificationAction) {
      onNotificationAction(notification, action);
    }
  }, [handleMarkRead, onNotificationAction]);

  const handlePreferencesUpdate = useCallback((newPreferences) => {
    try {
      const manager = new NotificationPreferencesManager();
      manager.savePreferences(newPreferences);
      setPreferences(newPreferences);
      setError(null);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      const result = errorHandler.handleStorageError(err, 'save preferences');
      if (onError) onError(result);
    }
  }, [onError]);

  // Error retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    try {
      const manager = new NotificationPreferencesManager();
      setPreferences(manager.preferences);
      setDismissedIds(manager.dismissed);
    } catch (err) {
      setError(err);
    }
  }, []);

  return (
    <Card className={`overflow-hidden ${className}`} data-testid="command-center-notifications">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span 
                className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full"
                data-testid="unread-count"
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className={`p-1.5 rounded-lg transition-colors ${
              showPreferences 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Notification preferences"
            data-testid="preferences-toggle"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {['all', 'unread', 'actionable'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              data-testid={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences panel */}
      {showPreferences && (
        <NotificationPreferencesPanel
          preferences={preferences}
          onUpdate={handlePreferencesUpdate}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {/* Notification list */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
        data-testid="notification-list"
      >
        {error ? (
          <ErrorState 
            error={error} 
            onRetry={handleRetry}
            message="Unable to load notifications"
          />
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {filter === 'unread' 
                ? 'No unread notifications'
                : filter === 'actionable'
                ? 'No actionable notifications'
                : 'No notifications yet'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onAction={handleAction}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
              text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg 
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="mark-all-read"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark all as read
          </button>
          {attentionCount > 0 && (
            <span className="text-xs text-orange-400" data-testid="attention-count">
              {attentionCount} item{attentionCount !== 1 ? 's' : ''} need attention
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

// Export service and utilities for testing
export { 
  NotificationService, 
  NotificationPreferencesManager,
  ErrorHandler,
  errorHandler,
  NOTIFICATION_TYPE_CONFIG, 
  DEFAULT_PREFERENCES,
  formatRelativeTime,
  formatTimeUntil,
};

export default CommandCenterNotifications;
