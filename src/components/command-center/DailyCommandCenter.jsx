/**
 * Daily Command Center - Main Container Component
 * Orchestrates all child components and manages shared state
 * 
 * Requirements: 8.1, 8.4, 9.2, 9.4
 * - Adapt layout based on screen size (mobile, tablet, desktop)
 * - Maintain consistent design language with current theme
 * - Preserve all existing functionality during transition
 * - Provide option to switch back to old system temporarily
 */

import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Settings, RefreshCw, AlertCircle } from 'lucide-react';

// Import child components
import { SetupAssistant } from './SetupAssistant';
import { DailyPlanner } from './DailyPlanner';
import { ProgressDashboard } from './ProgressDashboard';
import { QuickActions } from './QuickActions';
import { SmartSuggestions } from './SmartSuggestions';
import { ContentWorkflow } from './ContentWorkflow';
import { CommandCenterNotifications } from './CommandCenterNotifications';
import { FocusMode, getFocusModeService } from './FocusMode';

// Import layout and customization components
import {
  ResponsiveLayoutProvider,
  ResponsiveGrid,
  ResponsiveWidget,
  ResponsiveContainer,
  useResponsive,
  DeviceType,
} from './ResponsiveLayout';
import {
  WidgetCustomizationProvider,
  WidgetCustomizationPanel,
  CustomizeLayoutButton,
  useWidgetCustomization,
  DEFAULT_WIDGETS,
} from './WidgetCustomization';

// Import migration and integration
import {
  getMigrationService,
  getActiveSystem,
  DEFAULT_COMMAND_CENTER_STATE,
} from './MigrationService';
import { SystemSwitcherButton } from './SystemSwitcher';
import { useCommandCenterIntegration } from './useCommandCenterIntegration';

// Import constants
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SETUP_TASKS,
  loadFeatureFlags,
  saveFeatureFlags,
} from './constants';

// ============================================
// COMMAND CENTER CONTEXT
// ============================================

const CommandCenterContext = createContext(null);

/**
 * Hook to access command center context
 */
export function useCommandCenter() {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error('useCommandCenter must be used within DailyCommandCenter');
  }
  return context;
}

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

class CommandCenterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DailyCommandCenter] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 m-4">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                The Command Center encountered an error. Please try refreshing the page.
              </p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ============================================
// MAIN COMMAND CENTER CONTENT
// ============================================

/**
 * Inner content component that uses responsive and customization contexts
 */
function CommandCenterContent({
  user,
  userSettings,
  setupTasks,
  onSetupTaskComplete,
  userGoals,
  metrics,
  previousMetrics,
  token,
  scheduledUploads,
  userActivity,
  currentWorkflow,
  onWorkflowStart,
  onWorkflowComplete,
  onToolLaunch,
  featureFlags,
  onLayoutChange,
}) {
  const { isMobile, isTablet, deviceType } = useResponsive();
  const {
    getVisibleWidgets,
    isWidgetVisible,
    isCustomizing,
    setIsCustomizing
  } = useWidgetCustomization();

  const [focusModeActive, setFocusModeActive] = useState(false);
  const focusModeService = useMemo(() => getFocusModeService(), []);

  // Handle focus mode activation
  const handleFocusModeActivate = useCallback(() => {
    setFocusModeActive(true);
  }, []);

  const handleFocusModeDeactivate = useCallback(() => {
    setFocusModeActive(false);
  }, []);

  // If focus mode is active, show simplified interface
  if (focusModeActive && featureFlags.enableFocusMode) {
    return (
      <FocusMode
        isActive={focusModeActive}
        onActivate={handleFocusModeActivate}
        onDeactivate={handleFocusModeDeactivate}
        onToolLaunch={onToolLaunch}
        currentTasks={[]}
      />
    );
  }

  // Calculate if setup is complete
  const setupComplete = setupTasks.every(task => task.completed);
  const showSetupAssistant = !setupComplete && isWidgetVisible('setup-assistant');

  return (
    <ResponsiveContainer className="min-h-screen bg-slate-950">
      {/* Header - Enhanced Dark Design */}
      <div className="mb-8 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Main Title with Gradient and Glow Effect */}
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-violet-400 bg-clip-text text-transparent drop-shadow-lg">
                {isMobile ? 'Central de Comando' : 'Central de Comando Diária'}
              </h1>
              {/* Subtle glow effect behind title */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-violet-600/20 blur-xl -z-10 rounded-lg"></div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Switcher */}
            {featureFlags.enableSystemSwitcher && (
              <SystemSwitcherButton className="hidden sm:flex" />
            )}

            {/* Customize Layout Button */}
            {featureFlags.enableWidgetCustomization && !isMobile && (
              <CustomizeLayoutButton />
            )}

            {/* Focus Mode Button - Dark Style */}
            {featureFlags.enableFocusMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFocusModeActivate}
                className="flex items-center gap-2 bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all duration-200"
              >
                <span className="hidden sm:inline">Modo Foco</span>
                <span className="sm:hidden">Foco</span>
              </Button>
            )}
          </div>
        </div>

        {/* Decorative line under header */}
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      </div>

      {/* Main Grid Layout - Dark Theme */}
      <ResponsiveGrid className="gap-6">
        {/* Setup Assistant - Full width on top for new users */}
        {showSetupAssistant && (
          <ResponsiveWidget id="setup-assistant" fullWidth>
            <SetupAssistant
              tasks={setupTasks}
              onCompleteTask={onSetupTaskComplete}
              compact={isMobile}
            />
          </ResponsiveWidget>
        )}

        {/* Quick Actions - Always visible, high priority, full width */}
        {isWidgetVisible('quick-actions') && (
          <ResponsiveWidget id="quick-actions" fullWidth>
            <QuickActions
              userState={{
                hasRecentUploads: metrics?.videosCreatedThisWeek > 0,
                hasScheduledContent: scheduledUploads?.length > 0,
                hasUnreadNotifications: false,
              }}
              onActionClick={(action) => {
                console.log('[CommandCenter] Quick action clicked:', action.id);
              }}
              onNavigate={(actionId, itemAction) => {
                console.log('[CommandCenter] Navigating:', actionId, itemAction);
                // Map actions to routes
                const routes = {
                  'upload-video': '/dashboard/videos',
                  'schedule-content': '/dashboard/calendar',
                  'check-analytics': '/dashboard/analytics',
                  'optimize-channel': '/dashboard',
                  'ai-tools': '/dashboard',
                  'notifications': '/dashboard',
                };
                const route = routes[actionId] || '/dashboard';
                window.location.href = route;
              }}
            />
          </ResponsiveWidget>
        )}

        {/* Daily Planner */}
        {isWidgetVisible('daily-planner') && (
          <ResponsiveWidget id="daily-planner">
            <Card className="p-5 h-full bg-slate-900/80 border-slate-800">
              <DailyPlanner
                userGoals={userGoals}
                onTaskComplete={(taskId, data) => {
                  console.log('[CommandCenter] Task completed:', taskId, data);
                }}
              />
            </Card>
          </ResponsiveWidget>
        )}

        {/* Progress Dashboard */}
        {isWidgetVisible('progress-dashboard') && (
          <ResponsiveWidget id="progress-dashboard">
            <ProgressDashboard
              metrics={metrics}
              previousMetrics={previousMetrics}
              token={token}
            />
          </ResponsiveWidget>
        )}

        {/* Content Workflow */}
        {isWidgetVisible('content-workflow') && (
          <ResponsiveWidget id="content-workflow">
            <ContentWorkflow
              currentWorkflow={currentWorkflow}
              onWorkflowStart={onWorkflowStart}
              onWorkflowComplete={onWorkflowComplete}
              onToolLaunch={onToolLaunch}
            />
          </ResponsiveWidget>
        )}

        {/* Smart Suggestions - Full width for better layout */}
        {isWidgetVisible('smart-suggestions') && featureFlags.enableSmartSuggestions && (
          <ResponsiveWidget id="smart-suggestions" fullWidth hideOnMobile>
            <Card className="p-5 bg-slate-900/80 border-slate-800">
              <SmartSuggestions
                userActivity={userActivity}
                userMetrics={metrics}
                previousMetrics={previousMetrics}
              />
            </Card>
          </ResponsiveWidget>
        )}

        {/* Notifications */}
        {isWidgetVisible('notifications') && featureFlags.enableNotifications && (
          <ResponsiveWidget id="notifications" hideOnMobile>
            <CommandCenterNotifications
              scheduledUploads={scheduledUploads}
              currentMetrics={metrics}
              previousMetrics={previousMetrics}
            />
          </ResponsiveWidget>
        )}
      </ResponsiveGrid>

      {/* Focus Mode Component (inactive state) */}
      {featureFlags.enableFocusMode && !focusModeActive && (
        <div className="mt-6">
          <FocusMode
            isActive={false}
            onActivate={handleFocusModeActivate}
            onDeactivate={handleFocusModeDeactivate}
            onToolLaunch={onToolLaunch}
          />
        </div>
      )}

      {/* Widget Customization Panel */}
      {featureFlags.enableWidgetCustomization && (
        <WidgetCustomizationPanel
          isOpen={isCustomizing}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </ResponsiveContainer>
  );
}

// ============================================
// MAIN DAILY COMMAND CENTER COMPONENT
// ============================================

/**
 * Main container for the Daily Command Center
 * Requirements: 8.1, 8.4, 9.2, 9.4
 * 
 * @param {import('./types').DailyCommandCenterProps} props
 */
export function DailyCommandCenter({
  user,
  userSettings: propUserSettings,
  onLayoutChange,
  focusMode = false,
  // Integration props
  uploadQueueHook,
  settingsHook,
  analyticsHook,
  journeyContext,
  // Optional overrides
  initialSetupTasks,
  token,
}) {
  // API hooks - disabled to prevent crashes when API is unavailable
  // Using local state fallbacks instead
  const commandCenterState = {
    state: null,
    loading: false,
    error: null,
    fetchState: () => Promise.resolve(null),
    updateState: () => Promise.resolve(null),
    completeSetupTask: () => Promise.resolve(null),
    updateWidgetLayout: () => Promise.resolve(null),
    updateUserGoals: () => Promise.resolve(null),
  };
  const dailyTasks = {
    tasks: [],
    loading: false,
    error: null,
    fetchTasks: () => Promise.resolve([]),
    generateTasks: () => Promise.resolve([]),
    createTask: () => Promise.resolve(null),
    updateTaskProgress: () => Promise.resolve(null),
    completeTask: () => Promise.resolve(null),
  };
  const userMetrics = {
    metrics: null,
    previousMetrics: null,
    loading: false,
    error: null,
    fetchMetrics: () => Promise.resolve(null),
    recalculateMetrics: () => Promise.resolve(null),
  };
  const userActivity = {
    activities: [],
    loading: false,
    error: null,
    fetchActivities: () => Promise.resolve([]),
    logActivity: () => Promise.resolve(null),
  };

  // No API errors since we're using local state
  const hasApiError = null;

  // Feature flags from API state with fallback
  const featureFlags = useMemo(() => {
    if (commandCenterState.state?.enabledFeatures) {
      const enabled = commandCenterState.state.enabledFeatures;
      return {
        enableCommandCenter: enabled.includes('enableCommandCenter'),
        enableFocusMode: enabled.includes('enableFocusMode'),
        enableSmartSuggestions: enabled.includes('enableSmartSuggestions'),
        enableNotifications: enabled.includes('enableNotifications'),
        enableWidgetCustomization: enabled.includes('enableWidgetCustomization'),
        enableSystemSwitcher: enabled.includes('enableSystemSwitcher'),
        showBetaBadge: true,
      };
    }
    return DEFAULT_FEATURE_FLAGS;
  }, [commandCenterState.state]);

  // Migration service
  const migrationService = useMemo(() => getMigrationService(), []);

  // Command center integration (fallback for existing functionality)
  // Wrapped in try-catch to prevent crashes
  let integration;
  try {
    integration = useCommandCenterIntegration({
      uploadQueueHook,
      settingsHook,
      analyticsHook,
      journeyContext,
    });
  } catch (error) {
    console.error('[DailyCommandCenter] Integration hook error:', error);
    integration = {
      activeSystem: 'command-center',
      needsMigration: false,
      switchSystem: () => { },
      performMigration: () => ({ success: false }),
      commandCenterState: {},
      updateCommandCenterState: () => { },
      upload: { uploadQueue: [], uploadMetrics: {}, quickUploadActions: {} },
      settings: { settings: {}, commandCenterPrefs: {} },
      analytics: { performanceMetrics: {}, analyticsSuggestions: [] },
      metrics: {},
      suggestions: [],
    };
  }

  // Setup tasks from API state with fallback
  const setupTasks = useMemo(() => {
    if (commandCenterState.state) {
      return DEFAULT_SETUP_TASKS.map(task => ({
        ...task,
        completed: commandCenterState.state.completedSetupTasks.includes(task.id)
      }));
    }
    // Fallback: use initial setup tasks or defaults
    return initialSetupTasks || DEFAULT_SETUP_TASKS;
  }, [commandCenterState.state, initialSetupTasks]);

  const [currentWorkflow, setCurrentWorkflow] = useState(null);

  // User settings with defaults
  const userSettings = useMemo(() => ({
    ...DEFAULT_COMMAND_CENTER_STATE.userSettings,
    ...propUserSettings,
  }), [propUserSettings]);

  // User goals from API state with fallback
  const userGoals = useMemo(() => {
    if (commandCenterState.state) {
      return {
        focusAreas: commandCenterState.state.focusAreas || ['growth'],
        dailyUploadTarget: commandCenterState.state.dailyUploadTarget || 1,
        weeklyUploadTarget: commandCenterState.state.weeklyUploadTarget || 3,
      };
    }
    // Fallback: use user settings or defaults
    return userSettings.goals || DEFAULT_COMMAND_CENTER_STATE.userSettings.goals;
  }, [commandCenterState.state, userSettings]);

  // Metrics from API with fallback
  const metrics = useMemo(() =>
    userMetrics.metrics || DEFAULT_COMMAND_CENTER_STATE.metrics,
    [userMetrics.metrics]
  );

  // Handle setup task completion
  const handleSetupTaskComplete = useCallback(async (taskId) => {
    try {
      if (commandCenterState.completeSetupTask) {
        await commandCenterState.completeSetupTask(taskId);
      }

      // Log activity if available
      if (userActivity.logActivity) {
        await userActivity.logActivity({
          type: 'setup',
          action: 'complete_task',
          description: `Completed setup task: ${taskId}`,
          metadata: { taskId }
        });
      }
    } catch (error) {
      console.error('Error completing setup task:', error);
      // Don't throw - just log the error
    }
  }, [commandCenterState, userActivity]);

  // Handle workflow events
  const handleWorkflowStart = useCallback(async (workflow) => {
    setCurrentWorkflow(workflow);

    try {
      if (commandCenterState.updateState) {
        await commandCenterState.updateState({ currentWorkflow: workflow });
      }

      // Log activity if available
      if (userActivity.logActivity) {
        await userActivity.logActivity({
          type: 'workflow',
          action: 'start_workflow',
          description: `Started workflow: ${workflow.name || workflow.id}`,
          metadata: { workflow }
        });
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      // Don't throw - just log the error
    }
  }, [commandCenterState, userActivity]);

  const handleWorkflowComplete = useCallback(async (workflow) => {
    setCurrentWorkflow(null);

    try {
      if (commandCenterState.updateState) {
        await commandCenterState.updateState({ currentWorkflow: null });
      }

      // Log activity if available
      if (userActivity.logActivity) {
        await userActivity.logActivity({
          type: 'workflow',
          action: 'complete_workflow',
          description: `Completed workflow: ${workflow.name || workflow.id}`,
          metadata: { workflow }
        });
      }
    } catch (error) {
      console.error('Error completing workflow:', error);
      // Don't throw - just log the error
    }
  }, [commandCenterState, userActivity]);

  // Handle tool launch
  const handleToolLaunch = useCallback(async (toolId) => {
    console.log('[DailyCommandCenter] Launching tool:', toolId);

    // Log activity if available
    try {
      if (userActivity.logActivity) {
        await userActivity.logActivity({
          type: 'tool_usage',
          action: 'launch_tool',
          description: `Launched tool: ${toolId}`,
          metadata: { toolId }
        });
      }
    } catch (error) {
      console.error('Error logging tool launch:', error);
      // Don't throw - just log the error
    }

    // Tool launch logic - integrate with existing navigation
    switch (toolId) {
      case 'opus-clip':
        window.location.href = '/dashboard#opus';
        break;
      case 'upload-queue':
        window.location.href = '/videos';
        break;
      case 'scheduler':
        window.location.href = '/calendar';
        break;
      case 'analytics':
        window.location.href = '/analytics';
        break;
      default:
        console.log('[DailyCommandCenter] Unknown tool:', toolId);
    }
  }, [userActivity]);

  // Handle layout changes
  const handleLayoutChange = useCallback(async (layout) => {
    try {
      if (commandCenterState.updateWidgetLayout) {
        await commandCenterState.updateWidgetLayout(layout);
      }

      if (onLayoutChange) {
        onLayoutChange(layout);
      }

      // Log activity if available
      if (userActivity.logActivity) {
        await userActivity.logActivity({
          type: 'customization',
          action: 'update_layout',
          description: 'Updated widget layout',
          metadata: { layout }
        });
      }
    } catch (error) {
      console.error('Error updating layout:', error);
      // Don't throw - just log the error
    }
  }, [commandCenterState, userActivity, onLayoutChange]);

  // Update feature flags
  const updateFeatureFlags = useCallback(async (updates) => {
    try {
      if (commandCenterState.updateState) {
        const currentFeatures = commandCenterState.state?.enabledFeatures || [];
        const updatedFeatures = [...currentFeatures];

        // Update enabled features based on flag changes
        Object.entries(updates).forEach(([flag, enabled]) => {
          if (enabled && !updatedFeatures.includes(flag)) {
            updatedFeatures.push(flag);
          } else if (!enabled && updatedFeatures.includes(flag)) {
            const index = updatedFeatures.indexOf(flag);
            updatedFeatures.splice(index, 1);
          }
        });

        await commandCenterState.updateState({ enabledFeatures: updatedFeatures });
      }
    } catch (error) {
      console.error('Error updating feature flags:', error);
      // Don't throw - just log the error
    }
  }, [commandCenterState]);

  // Context value with safe fallbacks
  const contextValue = useMemo(() => ({
    user,
    userSettings,
    featureFlags,
    updateFeatureFlags,
    integration,
    setupTasks,
    metrics,
    currentWorkflow,
    handleToolLaunch,
    // API hooks with safe access
    commandCenterState: commandCenterState || {},
    dailyTasks: dailyTasks || {},
    userMetrics: userMetrics || {},
    userActivity: userActivity || {},
  }), [
    user,
    userSettings,
    featureFlags,
    updateFeatureFlags,
    integration,
    setupTasks,
    metrics,
    currentWorkflow,
    handleToolLaunch,
    commandCenterState,
    dailyTasks,
    userMetrics,
    userActivity,
  ]);

  // Check if command center is enabled
  if (!featureFlags.enableCommandCenter) {
    return null;
  }

  // Show error state if API calls failed with authentication issues
  // Only show error for authentication issues, not for general API failures
  if (hasApiError && typeof hasApiError === 'string' && (hasApiError.includes('Unauthorized') || hasApiError.includes('401'))) {
    return (
      <CommandCenterErrorBoundary>
        <ResponsiveLayoutProvider>
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Card className="p-8 bg-slate-900/80 border-slate-800">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-100 mb-2">
                    Acesso Restrito
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Você precisa estar logado para acessar a Central de Comando.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.location.href = '/login'}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Fazer Login
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ResponsiveLayoutProvider>
      </CommandCenterErrorBoundary>
    );
  }

  return (
    <CommandCenterErrorBoundary>
      <CommandCenterContext.Provider value={contextValue}>
        <ResponsiveLayoutProvider>
          <WidgetCustomizationProvider
            availableWidgets={DEFAULT_WIDGETS}
            onLayoutChange={handleLayoutChange}
          >
            <CommandCenterContent
              user={user}
              userSettings={userSettings}
              setupTasks={setupTasks}
              onSetupTaskComplete={handleSetupTaskComplete}
              userGoals={userGoals}
              metrics={metrics}
              previousMetrics={userMetrics.previousMetrics}
              token={token}
              scheduledUploads={integration.upload?.uploadQueue?.filter(
                item => item.scheduledAt && item.status === 'ready'
              )}
              userActivity={userActivity.activities || []}
              currentWorkflow={currentWorkflow}
              onWorkflowStart={handleWorkflowStart}
              onWorkflowComplete={handleWorkflowComplete}
              onToolLaunch={handleToolLaunch}
              featureFlags={featureFlags}
              onLayoutChange={handleLayoutChange}
            />
          </WidgetCustomizationProvider>
        </ResponsiveLayoutProvider>
      </CommandCenterContext.Provider>
    </CommandCenterErrorBoundary>
  );
}

// Re-export constants from constants.js for backward compatibility
export {
  loadFeatureFlags,
  saveFeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SETUP_TASKS,
} from './constants';

export default DailyCommandCenter;
