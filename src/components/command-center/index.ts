/**
 * Daily Command Center - Barrel export
 */

// Main container component
export { 
  DailyCommandCenter, 
  useCommandCenter,
} from './DailyCommandCenter';

// Constants and utilities
export {
  loadFeatureFlags,
  saveFeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SETUP_TASKS,
} from './constants';

// Child components
export { SetupAssistant } from './SetupAssistant';
export { DailyPlanner } from './DailyPlanner';
export { ProgressDashboard } from './ProgressDashboard';
export { QuickActions } from './QuickActions';
export { SmartSuggestions } from './SmartSuggestions';
export { ContentWorkflow } from './ContentWorkflow';
export { CommandCenterNotifications } from './CommandCenterNotifications';

// Migration and Integration System (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5)
export {
  MigrationService,
  getMigrationService,
  getActiveSystem,
  MIGRATION_STORAGE_KEYS,
  CURRENT_MIGRATION_VERSION,
  DEFAULT_COMMAND_CENTER_STATE,
} from './MigrationService';

export {
  useCommandCenterIntegration,
  useUploadQueueIntegration,
  useSettingsIntegration,
  useAnalyticsIntegration,
} from './useCommandCenterIntegration';

// System Switcher (Requirements: 9.4, 9.5)
export {
  SystemSwitcherButton,
  SystemSwitcherPanel,
  SystemConditionalRender,
  useSystemSwitcher,
} from './SystemSwitcher';

// Responsive Layout System (Requirements: 8.1, 8.2, 8.4)
export {
  ResponsiveLayoutProvider,
  ResponsiveGrid,
  ResponsiveWidget,
  ResponsiveContainer,
  MobilePriorityContainer,
  ShowOnMobile,
  ShowOnTablet,
  ShowOnDesktop,
  HideOnMobile,
  HideOnTablet,
  HideOnDesktop,
  useResponsive,
  getDeviceType,
  getLayoutConfig,
  sortWidgetsByPriority,
  filterWidgetsForDevice,
  getGridClasses,
  BREAKPOINTS,
  DeviceType,
  DEFAULT_WIDGET_PRIORITY,
  DEFAULT_LAYOUTS,
} from './ResponsiveLayout';

// Widget Customization System (Requirements: 8.3, 8.5)
export {
  WidgetCustomizationProvider,
  WidgetCustomizationPanel,
  CustomizeLayoutButton,
  WidgetRenderer,
  useWidgetCustomization,
  DEFAULT_WIDGETS,
} from './WidgetCustomization';

// Focus Mode System (Requirements: 10.1, 10.2, 10.3, 10.4, 10.5)
export {
  FocusMode,
  FocusModeService,
  getFocusModeService,
  FOCUS_MODE_ALLOWED_WIDGETS,
  FOCUS_MODE_ALLOWED_TOOLS,
  FOCUS_MODE_QUICK_ACTIONS,
  FOCUS_MODE_SHORTCUT,
  DEFAULT_FOCUS_DURATION,
} from './FocusMode';

// Types
export * from './types';
