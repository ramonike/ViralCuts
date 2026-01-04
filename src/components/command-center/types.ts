/**
 * Type definitions for Daily Command Center
 * Based on design document specifications
 */

// ============================================
// USER CONFIGURATION
// ============================================

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserGoals {
  dailyUploadTarget: number;
  weeklyContentGoal: number;
  growthTargets: {
    subscribers: number;
    views: number;
    engagement: number;
  };
  focusAreas: string[]; // 'growth', 'engagement', 'monetization', etc.
}

export interface UserPreferences {
  notificationFrequency: 'all' | 'important' | 'minimal';
  focusModeEnabled: boolean;
  widgetVisibility: Record<string, boolean>;
  quickActionsOrder: string[];
}

export interface LayoutConfig {
  widgetOrder: string[];
  widgetVisibility: Record<string, boolean>;
  compactMode: boolean;
  focusMode: boolean;
}

export interface UserSettings {
  setupCompleted: boolean;
  experienceLevel: ExperienceLevel;
  goals: UserGoals;
  preferences: UserPreferences;
  layoutConfig: LayoutConfig;
}

// ============================================
// SETUP ASSISTANT
// ============================================

export type SetupPriority = 'high' | 'medium' | 'low';

export interface SetupTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  priority: SetupPriority;
  completed: boolean;
  actionUrl?: string;
  benefits: string[];
}

export interface SetupProgress {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  essentialTasksComplete: boolean;
}

export type SetupStatus = 'incomplete' | 'essential-complete' | 'fully-complete';

export interface OptimizationTask extends SetupTask {
  impact: 'low' | 'medium' | 'high';
}

// ============================================
// DAILY PLANNER
// ============================================

export type TaskType = 'creation' | 'optimization' | 'analysis' | 'planning';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimatedTime: number; // minutes
  expectedOutcome: string;
  priority: number;
  deadline?: Date;
  progress: number; // 0-100
  dependencies?: string[];
  completed: boolean;
}

export interface DailyTaskRecommendation {
  tasks: Task[];
  generatedAt: Date;
  focusArea: string;
}

// ============================================
// PROGRESS DASHBOARD
// ============================================

export interface StreakData {
  dailyActivity: number;
  weeklyUploads: number;
  contentCreation: number;
}

export interface ChannelGrowth {
  subscribers: number;
  views: number;
  engagement: number;
}

export interface UserMetrics {
  videosCreatedThisWeek: number;
  uploadConsistency: number; // percentage
  channelGrowth: ChannelGrowth;
  streaks: StreakData;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'setup' | 'creation' | 'optimization' | 'publishing' | 'engagement';
  points: number;
}

export interface PerformanceData {
  current: UserMetrics;
  previous: UserMetrics;
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
}

export interface Insight {
  id: string;
  type: 'achievement' | 'suggestion' | 'warning' | 'tip';
  title: string;
  description: string;
  actionable: boolean;
  actionUrl?: string;
}

// ============================================
// CONTENT WORKFLOW
// ============================================

export type ContentType = 'short' | 'long' | 'live' | 'story';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  tools: string[];
  estimatedTime: number;
}

export interface ContentWorkflowState {
  id: string;
  contentType: ContentType;
  currentStep: number;
  steps: WorkflowStep[];
  progress: number; // 0-100
  startedAt: Date;
  lastSavedAt?: Date;
  metadata: Record<string, any>;
}

export interface ToolSuggestion {
  toolId: string;
  toolName: string;
  description: string;
  category: string;
  relevanceScore: number;
}

// ============================================
// QUICK ACTIONS
// ============================================

export type ActionCategory = 'creation' | 'optimization' | 'analysis' | 'management';

export interface Action {
  id: string;
  title: string;
  icon: string;
  description: string;
  shortcut?: string;
  notificationCount?: number;
  handler: () => void | Promise<void>;
  category: ActionCategory;
  usageCount: number;
  lastUsed?: Date;
}

export interface UserState {
  hasRecentUploads: boolean;
  hasScheduledContent: boolean;
  hasUnreadNotifications: boolean;
  currentActivity?: string;
  recentActions: string[];
}

// ============================================
// SMART SUGGESTIONS
// ============================================

export type SuggestionType = 'action' | 'tip' | 'opportunity' | 'warning';
export type SuggestionImpact = 'low' | 'medium' | 'high';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: SuggestionImpact;
  actionable: boolean;
  actionUrl?: string;
  dismissible: boolean;
  createdAt: Date;
}

export interface UserActivity {
  id: string;
  type: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface BehaviorInsights {
  uploadFrequency: number;
  preferredContentTypes: ContentType[];
  mostUsedTools: string[];
  peakActivityTimes: number[];
  engagementPatterns: Record<string, number>;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  relevanceScore: number;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
}

export interface OptimizationTip {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: SuggestionImpact;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType = 'reminder' | 'alert' | 'achievement' | 'update';

export interface NotificationAction {
  label: string;
  handler: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  priority: 'low' | 'medium' | 'high';
}

// ============================================
// ANALYTICS INTEGRATION
// ============================================

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export interface ChannelMetrics {
  subscribers: number;
  views: number;
  watchTime: number;
  engagement: number;
  revenue?: number;
}

export interface VideoMetrics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  ctr: number; // click-through rate
  avgViewDuration: number;
}

export interface GrowthData {
  period: TimePeriod;
  subscriberGrowth: number[];
  viewGrowth: number[];
  engagementGrowth: number[];
  timestamps: Date[];
}

export interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
  avgEngagementRate: number;
  topEngagingVideos: VideoMetrics[];
}

// ============================================
// FOCUS MODE
// ============================================

export interface FocusModeConfig {
  enabled: boolean;
  duration?: number; // minutes
  startedAt?: Date;
  allowedWidgets: string[];
  allowedTools: string[];
}

export interface FocusSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // minutes
  tasksCompleted: string[];
  contentCreated: string[];
  summary?: string;
  paused?: boolean;
  pausedAt?: Date | null;
  totalPausedTime?: number;
}

// ============================================
// MAIN COMPONENT PROPS
// ============================================

export interface DailyCommandCenterProps {
  user: any; // Will use User type from api.ts
  userSettings: UserSettings;
  onLayoutChange?: (layout: LayoutConfig) => void;
  focusMode?: boolean;
}

export interface CommandCenterState {
  setupProgress: SetupProgress;
  dailyTasks: Task[];
  metrics: UserMetrics;
  suggestions: Suggestion[];
  focusMode: boolean;
  layoutConfig: LayoutConfig;
  notifications: Notification[];
  currentWorkflow?: ContentWorkflowState;
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface SetupAssistantService {
  checkSetupStatus(): SetupStatus;
  getEssentialTasks(): SetupTask[];
  completeTask(taskId: string): Promise<void>;
  getOptimizationSuggestions(): OptimizationTask[];
}

export interface DailyPlannerService {
  generateDailyTasks(userGoals: UserGoals): Task[];
  updateTaskProgress(taskId: string, progress: number): void;
  completeTask(taskId: string): Promise<void>;
  suggestNextActions(): Action[];
}

export interface ProgressDashboardService {
  getUserMetrics(): Promise<UserMetrics>;
  getStreakData(): StreakData;
  getPerformanceComparison(): Promise<PerformanceData>;
  generateInsights(): Insight[];
}

export interface QuickActionsService {
  getContextualActions(userState: UserState): Action[];
  executeAction(actionId: string, params?: any): Promise<void>;
  getNotificationCount(): number;
}

export interface SmartSuggestionsService {
  analyzeBehavior(userActivity: UserActivity[]): BehaviorInsights;
  generateSuggestions(insights: BehaviorInsights): Suggestion[];
  getTrendingTopics(): Promise<TrendingTopic[]>;
  getOptimizationTips(): OptimizationTip[];
}

export interface ContentWorkflowService {
  createWorkflow(contentType: ContentType): ContentWorkflowState;
  saveProgress(workflow: ContentWorkflowState): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<ContentWorkflowState>;
  completeStep(workflowId: string, stepId: string): void;
  suggestTools(contentType: ContentType, step: string): ToolSuggestion[];
}

export interface AnalyticsService {
  getChannelMetrics(): Promise<ChannelMetrics>;
  getVideoPerformance(videoId: string): Promise<VideoMetrics>;
  getGrowthTrends(period: TimePeriod): Promise<GrowthData>;
  getEngagementInsights(): Promise<EngagementData>;
}

export interface TaskManager {
  createTask(task: Partial<Task>): Task;
  updateTask(taskId: string, updates: Partial<Task>): void;
  deleteTask(taskId: string): void;
  getTasksByDate(date: Date): Task[];
  getTasksByType(type: TaskType): Task[];
}

// ============================================
// ERROR HANDLING
// ============================================

export type ErrorCategory = 'data-loading' | 'user-input' | 'integration' | 'performance';

export interface DataError extends Error {
  category: 'data-loading';
  source: string;
  retryable: boolean;
}

export interface InputError extends Error {
  category: 'user-input';
  field: string;
  validationErrors: string[];
}

export interface IntegrationError extends Error {
  category: 'integration';
  service: string;
  statusCode?: number;
}

export interface PerformanceError extends Error {
  category: 'performance';
  operation: string;
  duration: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RetryStrategy {
  maxRetries: number;
  backoffMs: number;
  shouldRetry: (error: Error) => boolean;
}

export interface FallbackData {
  data: any;
  isDefault: boolean;
  message: string;
}

export interface OptimizationAction {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ErrorHandler {
  handleDataLoadingError(error: DataError): FallbackData;
  handleUserInputError(error: InputError): ValidationResult;
  handleIntegrationError(error: IntegrationError): RetryStrategy;
  handlePerformanceError(error: PerformanceError): OptimizationAction;
}
