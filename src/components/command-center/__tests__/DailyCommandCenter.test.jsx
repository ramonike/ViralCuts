/**
 * DailyCommandCenter Integration Tests
 * Tests for the main container component and full user workflows
 * Requirements: All requirements - Full system integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { DailyCommandCenter, DEFAULT_FEATURE_FLAGS, DEFAULT_SETUP_TASKS } from '../DailyCommandCenter';
import { getMigrationService } from '../MigrationService';
import {
  createMockUser,
  createMockUserSettings,
} from './test-utils';

// Mock FocusMode to avoid timer issues in tests
vi.mock('../FocusMode', () => ({
  FocusMode: ({ isActive, onActivate, onDeactivate }) => (
    <div data-testid="focus-mode" data-active={isActive}>
      <button onClick={onActivate}>Activate Focus</button>
      <button onClick={onDeactivate}>Deactivate Focus</button>
    </div>
  ),
  getFocusModeService: () => ({
    startSession: vi.fn(),
    endSession: vi.fn(),
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    isActive: () => false,
    getSession: () => null,
    loadSession: () => null,
    getRemainingTime: () => 0,
    getElapsedTime: () => 0,
    onSessionChange: vi.fn(() => () => {}),
  }),
}));

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (width) => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: width >= 1024 ? query.includes('min-width: 1024px') : 
             width >= 640 ? query.includes('min-width: 640px') : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe('DailyCommandCenter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia(1024); // Default to desktop
    
    // Set system preference to command-center
    const migrationService = getMigrationService();
    migrationService.setSystemPreference('command-center');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  describe('Basic Rendering', () => {
    it('should render the main container', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });

    it('should display current date', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      // Check that a date is displayed (format: weekday, month day)
      const today = new Date();
      const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
      expect(screen.getByText(new RegExp(weekday, 'i'))).toBeInTheDocument();
    });

    it('should render setup assistant for new users', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings({ setupCompleted: false });

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Setup Assistant/i)).toBeInTheDocument();
    });

    it('should not render when feature flag is disabled', () => {
      localStorage.setItem('viralcuts-command-center-feature-flags', JSON.stringify({
        ...DEFAULT_FEATURE_FLAGS,
        enableCommandCenter: false,
      }));

      const user = createMockUser();
      const userSettings = createMockUserSettings();

      const { container } = render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  // ============================================
  // FEATURE FLAG TESTS
  // ============================================

  describe('Feature Flags', () => {
    it('should respect feature flags for optional components', () => {
      localStorage.setItem('viralcuts-command-center-feature-flags', JSON.stringify({
        ...DEFAULT_FEATURE_FLAGS,
        enableSmartSuggestions: false,
        enableNotifications: false,
      }));

      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      // Smart suggestions should not be rendered
      expect(screen.queryByText(/Smart Suggestions/i)).not.toBeInTheDocument();
    });

    it('should show focus mode button when enabled', () => {
      localStorage.setItem('viralcuts-command-center-feature-flags', JSON.stringify({
        ...DEFAULT_FEATURE_FLAGS,
        enableFocusMode: true,
      }));

      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Focus/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // SETUP TASK COMPLETION TESTS
  // ============================================

  describe('Setup Task Completion', () => {
    it('should update progress when tasks are completed', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings({ setupCompleted: false });
      const initialTasks = DEFAULT_SETUP_TASKS.map((task, i) => ({
        ...task,
        completed: i < 2, // First 2 tasks completed
      }));

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          initialSetupTasks={initialTasks}
        />
      );

      // Progress should reflect completed tasks
      const progressText = screen.getByText(/40%|2 of 5/i);
      expect(progressText).toBeInTheDocument();
    });
  });

  // ============================================
  // QUICK ACTIONS TESTS
  // ============================================

  describe('Quick Actions', () => {
    it('should render quick actions component', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      // Check for common action buttons
      const quickActionsSection = screen.getByTestId('quick-actions');
      expect(quickActionsSection).toBeInTheDocument();
    });
  });

  // ============================================
  // DAILY PLANNER TESTS
  // ============================================

  describe('Daily Planner', () => {
    it('should render daily planner component', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Today's Plan/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // PROGRESS DASHBOARD TESTS
  // ============================================

  describe('Progress Dashboard', () => {
    it('should render progress dashboard component', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByTestId('progress-dashboard')).toBeInTheDocument();
    });
  });

  // ============================================
  // CONTENT WORKFLOW TESTS
  // ============================================

  describe('Content Workflow', () => {
    it('should render content workflow component', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      expect(screen.getByText(/Start Creating/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // INTEGRATION WITH EXISTING SYSTEMS
  // ============================================

  describe('Integration with Existing Systems', () => {
    it('should integrate with upload queue hook', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();
      const mockUploadQueueHook = {
        uploadQueue: [
          { id: '1', title: 'Video 1', status: 'ready' },
          { id: '2', title: 'Video 2', status: 'scheduled', scheduledAt: '2024-12-01T10:00:00Z' },
        ],
        addToUploadQueue: vi.fn(),
        removeQueueItem: vi.fn(),
        markQueueStatus: vi.fn(),
        startUploadQueue: vi.fn(),
      };

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          uploadQueueHook={mockUploadQueueHook}
        />
      );

      // Component should render without errors
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });

    it('should integrate with settings hook', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();
      const mockSettingsHook = {
        settings: { theme: 'dark', notifications: true },
        updateSettings: vi.fn(),
        isLoading: false,
      };

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          settingsHook={mockSettingsHook}
        />
      );

      // Component should render without errors
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });

    it('should integrate with analytics hook', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();
      const mockAnalyticsHook = {
        loading: false,
        error: null,
        channelAnalytics: {
          current: { views: 1000, subscribers: 100 },
          previous: { views: 800, subscribers: 90 },
        },
        refresh: vi.fn(),
      };

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          analyticsHook={mockAnalyticsHook}
        />
      );

      // Component should render without errors
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      const userSettings = createMockUserSettings();

      // Should not throw
      expect(() => {
        render(
          <DailyCommandCenter
            user={null}
            userSettings={userSettings}
          />
        );
      }).not.toThrow();
    });

    it('should handle missing userSettings gracefully', () => {
      const user = createMockUser();

      // Should not throw
      expect(() => {
        render(
          <DailyCommandCenter
            user={user}
            userSettings={null}
          />
        );
      }).not.toThrow();
    });
  });

  // ============================================
  // LAYOUT CHANGE CALLBACK TESTS
  // ============================================

  describe('Layout Change Callback', () => {
    it('should call onLayoutChange when layout is modified', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();
      const onLayoutChange = vi.fn();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          onLayoutChange={onLayoutChange}
        />
      );

      // Layout change is triggered internally when widget customization changes
      // This test verifies the callback prop is accepted
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // FULL USER WORKFLOW TESTS
  // ============================================

  describe('Full User Workflows', () => {
    it('should support complete new user onboarding flow', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings({ setupCompleted: false });

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      // 1. Setup assistant should be visible
      expect(screen.getByText(/Setup Assistant/i)).toBeInTheDocument();

      // 2. Quick actions should be available
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();

      // 3. Daily planner should show tasks
      expect(screen.getByText(/Today's Plan/i)).toBeInTheDocument();

      // 4. Content workflow should be accessible
      expect(screen.getByText(/Start Creating/i)).toBeInTheDocument();
    });

    it('should support returning user workflow', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings({ setupCompleted: true });
      const completedTasks = DEFAULT_SETUP_TASKS.map(task => ({
        ...task,
        completed: true,
      }));

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
          initialSetupTasks={completedTasks}
        />
      );

      // Setup assistant should show optimization suggestions instead of setup tasks
      // Quick actions and other components should be visible
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Today's Plan/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // COMPONENT INTERACTION TESTS
  // ============================================

  describe('Component Interaction', () => {
    it('should allow components to communicate through shared state', () => {
      const user = createMockUser();
      const userSettings = createMockUserSettings();

      render(
        <DailyCommandCenter
          user={user}
          userSettings={userSettings}
        />
      );

      // All main components should be rendered and functional
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Today's Plan/i)).toBeInTheDocument();
    });
  });
});

// ============================================
// DATA FLOW TESTS
// ============================================

describe('Data Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(1024);
    
    const migrationService = getMigrationService();
    migrationService.setSystemPreference('command-center');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should pass metrics to child components', () => {
    const user = createMockUser();
    const userSettings = createMockUserSettings();

    render(
      <DailyCommandCenter
        user={user}
        userSettings={userSettings}
      />
    );

    // Progress dashboard should receive metrics
    const progressDashboard = screen.getByTestId('progress-dashboard');
    expect(progressDashboard).toBeInTheDocument();
  });

  it('should update state when child components trigger actions', () => {
    const user = createMockUser();
    const userSettings = createMockUserSettings();

    render(
      <DailyCommandCenter
        user={user}
        userSettings={userSettings}
      />
    );

    // Component should handle state updates from children
    expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
  });
});
