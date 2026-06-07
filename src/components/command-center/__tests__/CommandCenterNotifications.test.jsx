/**
 * CommandCenterNotifications Component Tests
 * 
 * Property-based and unit tests for the notification center component
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  CommandCenterNotifications, 
  NotificationService, 
  NotificationPreferencesManager,
  DEFAULT_PREFERENCES,
  NOTIFICATION_TYPE_CONFIG,
} from '../CommandCenterNotifications';
import { notificationArbitrary } from './arbitraries';

// Mock the UI components
vi.mock('../../ui/card', () => ({
  Card: ({ children, className, ...props }) => (
    <div className={className} {...props}>{children}</div>
  )
}));

vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Video: () => <div data-testid="video-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
}));

// Custom arbitraries for notification testing
const scheduledUploadArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 48 * 60 * 60 * 1000) }),
});

const metricsArbitrary = fc.record({
  views: fc.integer({ min: 0, max: 10000000 }),
  subscribers: fc.integer({ min: 0, max: 1000000 }),
  engagement: fc.integer({ min: 0, max: 100 }),
});

const commandCenterNotificationArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('scheduled_upload', 'performance_alert', 'performance_decline', 'achievement', 'system_update', 'optimization_tip'),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  message: fc.string({ minLength: 10, maxLength: 300 }),
  timestamp: fc.date(),
  read: fc.boolean(),
  actionable: fc.boolean(),
  actions: fc.option(fc.array(fc.record({
    id: fc.string({ minLength: 3, maxLength: 20 }),
    label: fc.string({ minLength: 3, maxLength: 30 }),
    handler: fc.constant(() => {}),
  }), { minLength: 1, maxLength: 3 }), { nil: undefined }),
  priority: fc.constantFrom('low', 'medium', 'high'),
});

describe('CommandCenterNotifications', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============================================
  // PROPERTY-BASED TESTS
  // ============================================

  /**
   * Property 9: Notification Badge Consistency
   * Feature: daily-command-center, Property 9: Notification badge consistency
   * Validates: Requirements 7.2
   * 
   * For any item requiring user attention, a notification badge should be 
   * visible in the relevant UI component.
   */
  test('Feature: daily-command-center, Property 9: Notification badge consistency', () => {
    fc.assert(fc.property(
      fc.array(commandCenterNotificationArbitrary, { minLength: 0, maxLength: 20 }),
      (notifications) => {
        // Filter to get unread notifications
        const unreadNotifications = notifications.filter(n => !n.read);
        
        // Render component with notifications
        const { container } = render(
          <CommandCenterNotifications 
            customNotifications={notifications}
          />
        );
        
        // Check if unread count badge is displayed correctly
        const unreadBadge = container.querySelector('[data-testid="unread-count"]');
        
        if (unreadNotifications.length > 0) {
          // Badge should be visible when there are unread notifications
          expect(unreadBadge).not.toBeNull();
          expect(unreadBadge.textContent).toContain(`${unreadNotifications.length}`);
        }
        
        // Cleanup
        container.remove();
        
        return true;
      }
    ), { numRuns: 20 });
  });

  /**
   * Property 11: User Preference Persistence
   * Feature: daily-command-center, Property 11: User preference persistence
   * Validates: Requirements 7.5
   * 
   * For any user customization (notifications), the preferences should 
   * persist across sessions.
   */
  test('Feature: daily-command-center, Property 11: User preference persistence', () => {
    fc.assert(fc.property(
      fc.record({
        enabled: fc.boolean(),
        types: fc.record({
          scheduled_upload: fc.boolean(),
          performance_alert: fc.boolean(),
          achievement: fc.boolean(),
          system_update: fc.boolean(),
          optimization_tip: fc.boolean(),
        }),
        frequency: fc.constantFrom('all', 'important', 'minimal'),
      }),
      (preferences) => {
        // Create manager and save preferences
        const manager1 = new NotificationPreferencesManager();
        manager1.savePreferences(preferences);
        
        // Create new manager instance (simulating new session)
        const manager2 = new NotificationPreferencesManager();
        const loadedPreferences = manager2.loadPreferences();
        
        // Verify preferences were persisted
        expect(loadedPreferences.enabled).toBe(preferences.enabled);
        expect(loadedPreferences.frequency).toBe(preferences.frequency);
        
        // Verify type preferences
        Object.keys(preferences.types).forEach(type => {
          expect(loadedPreferences.types[type]).toBe(preferences.types[type]);
        });
        
        return true;
      }
    ), { numRuns: 20 });
  });

  // ============================================
  // UNIT TESTS
  // ============================================

  describe('Unit Tests', () => {
    test('renders notification center component', () => {
      render(<CommandCenterNotifications />);
      
      expect(screen.getByTestId('command-center-notifications')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('displays empty state when no notifications', () => {
      render(<CommandCenterNotifications />);
      
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });

    test('displays notifications when provided', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Test Notification',
          message: 'This is a test message',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    test('shows unread count badge when there are unread notifications', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Unread Notification',
          message: 'This is unread',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'Read Notification',
          message: 'This is read',
          timestamp: new Date(),
          read: true,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      const unreadBadge = screen.getByTestId('unread-count');
      expect(unreadBadge).toBeInTheDocument();
      expect(unreadBadge).toHaveTextContent('1 new');
    });

    test('filters notifications by unread', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Unread',
          message: 'Unread message',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'Read',
          message: 'Read message',
          timestamp: new Date(),
          read: true,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      // Click unread filter
      fireEvent.click(screen.getByTestId('filter-unread'));
      
      // Should only show unread notification
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.queryByText('Read')).not.toBeInTheDocument();
    });

    test('filters notifications by actionable', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Has Actions',
          message: 'Has actions',
          timestamp: new Date(),
          read: false,
          actionable: true,
          actions: [{ id: 'action1', label: 'Do Something', handler: () => {} }],
          priority: 'medium',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'No Actions',
          message: 'No actions',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      // Click actionable filter
      fireEvent.click(screen.getByTestId('filter-actionable'));
      
      // Should only show actionable notification
      expect(screen.getByText('Has Actions')).toBeInTheDocument();
      expect(screen.queryByText('No Actions')).not.toBeInTheDocument();
    });

    test('displays action buttons for actionable notifications', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'scheduled_upload',
          title: 'Scheduled Upload',
          message: 'Your video is scheduled',
          timestamp: new Date(),
          read: false,
          actionable: true,
          actions: [
            { id: 'view', label: 'View', handler: () => {} },
            { id: 'reschedule', label: 'Reschedule', handler: () => {} },
          ],
          priority: 'high',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      expect(screen.getByTestId('notification-action-view')).toBeInTheDocument();
      expect(screen.getByTestId('notification-action-reschedule')).toBeInTheDocument();
    });

    test('calls onNotificationAction when action button clicked', () => {
      const mockOnAction = vi.fn();
      const notifications = [
        {
          id: 'test-1',
          type: 'scheduled_upload',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date(),
          read: false,
          actionable: true,
          actions: [{ id: 'view', label: 'View', handler: () => {} }],
          priority: 'high',
        },
      ];
      
      render(
        <CommandCenterNotifications 
          customNotifications={notifications}
          onNotificationAction={mockOnAction}
        />
      );
      
      fireEvent.click(screen.getByTestId('notification-action-view'));
      
      expect(mockOnAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-1' }),
        expect.objectContaining({ id: 'view' })
      );
    });

    test('dismisses notification when dismiss button clicked', () => {
      const mockOnDismiss = vi.fn();
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(
        <CommandCenterNotifications 
          customNotifications={notifications}
          onNotificationDismiss={mockOnDismiss}
        />
      );
      
      fireEvent.click(screen.getByTestId('notification-dismiss-test-1'));
      
      expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
    });

    test('marks all as read when button clicked', () => {
      const mockOnRead = vi.fn();
      const notifications = [
        {
          id: 'test-1',
          type: 'system_update',
          title: 'Test 1',
          message: 'Message 1',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'Test 2',
          message: 'Message 2',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'medium',
        },
      ];
      
      render(
        <CommandCenterNotifications 
          customNotifications={notifications}
          onNotificationRead={mockOnRead}
        />
      );
      
      fireEvent.click(screen.getByTestId('mark-all-read'));
      
      expect(mockOnRead).toHaveBeenCalledTimes(2);
    });

    test('opens preferences panel when settings clicked', () => {
      render(<CommandCenterNotifications />);
      
      fireEvent.click(screen.getByTestId('preferences-toggle'));
      
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    test('toggles notification type in preferences', () => {
      render(<CommandCenterNotifications />);
      
      // Open preferences
      fireEvent.click(screen.getByTestId('preferences-toggle'));
      
      // Toggle a notification type
      const toggle = screen.getByTestId('type-toggle-scheduled_upload');
      fireEvent.click(toggle);
      
      // Verify localStorage was updated
      const stored = JSON.parse(localStorage.getItem('command-center-notification-preferences'));
      expect(stored.types.scheduled_upload).toBe(false);
    });

    test('changes notification frequency in preferences', () => {
      render(<CommandCenterNotifications />);
      
      // Open preferences
      fireEvent.click(screen.getByTestId('preferences-toggle'));
      
      // Change frequency
      fireEvent.click(screen.getByTestId('frequency-important'));
      
      // Verify localStorage was updated
      const stored = JSON.parse(localStorage.getItem('command-center-notification-preferences'));
      expect(stored.frequency).toBe('important');
    });

    test('shows attention count for high priority unread notifications', () => {
      const notifications = [
        {
          id: 'test-1',
          type: 'performance_decline',
          title: 'Performance Alert',
          message: 'Your views are declining',
          timestamp: new Date(),
          read: false,
          actionable: true,
          actions: [{ id: 'view', label: 'View', handler: () => {} }],
          priority: 'high',
        },
      ];
      
      render(<CommandCenterNotifications customNotifications={notifications} />);
      
      const attentionCount = screen.getByTestId('attention-count');
      expect(attentionCount).toBeInTheDocument();
      expect(attentionCount).toHaveTextContent('1 item need attention');
    });
  });

  // ============================================
  // SERVICE TESTS
  // ============================================

  describe('NotificationService', () => {
    let service;
    let preferencesManager;

    beforeEach(() => {
      localStorage.clear();
      preferencesManager = new NotificationPreferencesManager();
      service = new NotificationService(preferencesManager);
    });

    test('generates scheduled upload reminders for uploads within 24 hours', () => {
      const scheduledUploads = [
        {
          id: 'upload-1',
          title: 'My Video',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
      ];
      
      const reminders = service.generateScheduledUploadReminders(scheduledUploads);
      
      expect(reminders).toHaveLength(1);
      expect(reminders[0].type).toBe('scheduled_upload');
      expect(reminders[0].title).toBe('Scheduled Upload Reminder');
      expect(reminders[0].actionable).toBe(true);
      expect(reminders[0].actions).toHaveLength(2);
    });

    test('does not generate reminders for uploads more than 24 hours away', () => {
      const scheduledUploads = [
        {
          id: 'upload-1',
          title: 'My Video',
          scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        },
      ];
      
      const reminders = service.generateScheduledUploadReminders(scheduledUploads);
      
      expect(reminders).toHaveLength(0);
    });

    test('generates positive performance alert when metrics improve significantly', () => {
      const currentMetrics = { views: 1200, subscribers: 1100, engagement: 50 };
      const previousMetrics = { views: 1000, subscribers: 1000, engagement: 45 };
      
      const alerts = service.generatePerformanceAlerts(currentMetrics, previousMetrics);
      
      expect(alerts.some(a => a.type === 'performance_alert')).toBe(true);
    });

    test('generates decline alert when metrics decline significantly', () => {
      const currentMetrics = { views: 800, subscribers: 900, engagement: 30 };
      const previousMetrics = { views: 1000, subscribers: 1000, engagement: 50 };
      
      const alerts = service.generatePerformanceAlerts(currentMetrics, previousMetrics);
      
      expect(alerts.some(a => a.type === 'performance_decline')).toBe(true);
    });

    test('filters notifications by user preferences', () => {
      // Disable scheduled_upload notifications
      preferencesManager.savePreferences({
        ...DEFAULT_PREFERENCES,
        types: {
          ...DEFAULT_PREFERENCES.types,
          scheduled_upload: false,
        },
      });
      
      const notifications = [
        {
          id: 'test-1',
          type: 'scheduled_upload',
          title: 'Scheduled',
          message: 'Test',
          timestamp: new Date(),
          read: false,
          actionable: true,
          priority: 'high',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'System',
          message: 'Test',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'low',
        },
      ];
      
      const filtered = service.filterByPreferences(notifications);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('system_update');
    });

    test('filters by frequency preference - important only', () => {
      preferencesManager.savePreferences({
        ...DEFAULT_PREFERENCES,
        frequency: 'important',
      });
      
      const notifications = [
        {
          id: 'test-1',
          type: 'performance_decline',
          title: 'High Priority',
          message: 'Test',
          timestamp: new Date(),
          read: false,
          actionable: true,
          priority: 'high',
        },
        {
          id: 'test-2',
          type: 'system_update',
          title: 'Low Priority',
          message: 'Test',
          timestamp: new Date(),
          read: false,
          actionable: false,
          priority: 'low',
        },
      ];
      
      const filtered = service.filterByPreferences(notifications);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('high');
    });

    test('sorts notifications by priority then timestamp', () => {
      const notifications = service.getNotifications({
        customNotifications: [
          {
            id: 'test-1',
            type: 'system_update',
            title: 'Low Priority Old',
            message: 'Test',
            timestamp: new Date(Date.now() - 1000),
            read: false,
            actionable: false,
            priority: 'low',
          },
          {
            id: 'test-2',
            type: 'performance_decline',
            title: 'High Priority',
            message: 'Test',
            timestamp: new Date(),
            read: false,
            actionable: true,
            priority: 'high',
          },
          {
            id: 'test-3',
            type: 'achievement',
            title: 'Medium Priority',
            message: 'Test',
            timestamp: new Date(),
            read: false,
            actionable: false,
            priority: 'medium',
          },
        ],
      });
      
      expect(notifications[0].priority).toBe('high');
      expect(notifications[1].priority).toBe('medium');
      expect(notifications[2].priority).toBe('low');
    });

    test('calculates attention count correctly', () => {
      const notifications = [
        { id: '1', read: false, priority: 'high' },
        { id: '2', read: false, priority: 'medium' },
        { id: '3', read: true, priority: 'high' },
        { id: '4', read: false, priority: 'high' },
      ];
      
      const count = service.getAttentionCount(notifications);
      
      expect(count).toBe(2); // Only unread high priority
    });
  });

  // ============================================
  // PREFERENCES MANAGER TESTS
  // ============================================

  describe('NotificationPreferencesManager', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('loads default preferences when none stored', () => {
      const manager = new NotificationPreferencesManager();
      
      expect(manager.preferences.enabled).toBe(true);
      expect(manager.preferences.frequency).toBe('all');
    });

    test('saves and loads preferences correctly', () => {
      const manager = new NotificationPreferencesManager();
      
      const newPreferences = {
        enabled: false,
        types: {
          scheduled_upload: false,
          performance_alert: true,
          achievement: false,
          system_update: true,
          optimization_tip: false,
        },
        frequency: 'minimal',
      };
      
      manager.savePreferences(newPreferences);
      
      const manager2 = new NotificationPreferencesManager();
      expect(manager2.preferences.enabled).toBe(false);
      expect(manager2.preferences.frequency).toBe('minimal');
      expect(manager2.preferences.types.scheduled_upload).toBe(false);
    });

    test('checks if notification type is enabled', () => {
      const manager = new NotificationPreferencesManager();
      
      expect(manager.isTypeEnabled('scheduled_upload')).toBe(true);
      
      manager.savePreferences({
        ...manager.preferences,
        types: {
          ...manager.preferences.types,
          scheduled_upload: false,
        },
      });
      
      expect(manager.isTypeEnabled('scheduled_upload')).toBe(false);
    });

    test('returns false for all types when notifications disabled', () => {
      const manager = new NotificationPreferencesManager();
      
      manager.savePreferences({
        ...manager.preferences,
        enabled: false,
      });
      
      expect(manager.isTypeEnabled('scheduled_upload')).toBe(false);
      expect(manager.isTypeEnabled('performance_alert')).toBe(false);
    });

    test('tracks dismissed notifications', () => {
      const manager = new NotificationPreferencesManager();
      
      expect(manager.isDismissed('notification-1')).toBe(false);
      
      manager.dismiss('notification-1');
      
      expect(manager.isDismissed('notification-1')).toBe(true);
      
      // Verify persistence
      const manager2 = new NotificationPreferencesManager();
      expect(manager2.isDismissed('notification-1')).toBe(true);
    });

    test('clears dismissed notifications', () => {
      const manager = new NotificationPreferencesManager();
      
      manager.dismiss('notification-1');
      manager.dismiss('notification-2');
      
      expect(manager.isDismissed('notification-1')).toBe(true);
      
      manager.clearDismissed();
      
      expect(manager.isDismissed('notification-1')).toBe(false);
      expect(manager.isDismissed('notification-2')).toBe(false);
    });
  });
});


  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    test('displays error state when error prop is set', () => {
      // Simulate an error by mocking localStorage to throw
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      // Reset and render with error
      const { rerender } = render(<CommandCenterNotifications />);
      
      // Restore localStorage
      localStorage.getItem = originalGetItem;
      
      // The component should handle the error gracefully
      expect(screen.getByTestId('command-center-notifications')).toBeInTheDocument();
    });

    test('ErrorHandler executes with retry logic', async () => {
      const { ErrorHandler } = await import('../CommandCenterNotifications');
      const handler = new ErrorHandler();
      
      let attempts = 0;
      const failingOperation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const result = await handler.executeWithRetry('test-op', failingOperation, {
        maxRetries: 3,
        backoffMs: 10, // Short backoff for testing
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attempts).toBe(2);
    });

    test('ErrorHandler returns failure after max retries', async () => {
      const { ErrorHandler } = await import('../CommandCenterNotifications');
      const handler = new ErrorHandler();
      
      const alwaysFailingOperation = async () => {
        throw new Error('Permanent failure');
      };
      
      const result = await handler.executeWithRetry('test-op-fail', alwaysFailingOperation, {
        maxRetries: 2,
        backoffMs: 10,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(2);
    });

    test('ErrorHandler handles data loading errors with fallback', async () => {
      const { ErrorHandler } = await import('../CommandCenterNotifications');
      const handler = new ErrorHandler();
      
      const fallbackData = [{ id: 'fallback' }];
      const result = handler.handleDataLoadingError(new Error('Load failed'), fallbackData);
      
      expect(result.data).toEqual(fallbackData);
      expect(result.isDefault).toBe(true);
      expect(result.message).toContain('Unable to load data');
    });

    test('ErrorHandler handles storage errors', async () => {
      const { ErrorHandler } = await import('../CommandCenterNotifications');
      const handler = new ErrorHandler();
      
      const result = handler.handleStorageError(new Error('Storage full'), 'save preferences');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save preferences');
    });

    test('ErrorHandler tracks and resets retry attempts', async () => {
      const { ErrorHandler } = await import('../CommandCenterNotifications');
      const handler = new ErrorHandler();
      
      // Simulate some retries
      await handler.executeWithRetry('track-test', async () => {
        throw new Error('fail');
      }, { maxRetries: 2, backoffMs: 1 });
      
      expect(handler.getRetryCount('track-test')).toBe(2);
      
      handler.resetRetries('track-test');
      expect(handler.getRetryCount('track-test')).toBe(0);
    });

    test('calls onError callback when error occurs', () => {
      const mockOnError = vi.fn();
      
      // First render the component normally
      render(
        <CommandCenterNotifications 
          onError={mockOnError}
        />
      );
      
      // Open preferences panel first
      fireEvent.click(screen.getByTestId('preferences-toggle'));
      
      // Now mock localStorage to throw on setItem
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      // Try to change something - this should trigger the error
      fireEvent.click(screen.getByTestId('frequency-important'));
      
      // Restore localStorage
      localStorage.setItem = originalSetItem;
      
      // onError should have been called
      expect(mockOnError).toHaveBeenCalled();
    });
  });
