/**
 * FocusMode Component
 * 
 * Provides a simplified interface during content creation to minimize distractions.
 * Includes timer, progress tracking, and quick access to AI tools.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Focus,
  Play,
  Pause,
  Square,
  Clock,
  Sparkles,
  Upload,
  CheckCircle,
  X,
  ChevronRight,
  Zap,
  BarChart3,
  Target,
  Timer,
  Keyboard,
} from 'lucide-react';

// Storage key for focus session data
const FOCUS_SESSION_STORAGE_KEY = 'focus-mode-session';
const FOCUS_PREFERENCES_KEY = 'focus-mode-preferences';

// Default focus session duration (25 minutes - Pomodoro technique)
const DEFAULT_FOCUS_DURATION = 25;

// Keyboard shortcut for focus mode toggle
const FOCUS_MODE_SHORTCUT = 'Ctrl+Shift+F';

/**
 * Allowed widgets in focus mode
 * Requirements: 10.2 - Hide non-essential widgets
 */
const FOCUS_MODE_ALLOWED_WIDGETS = [
  'content-workflow',
  'ai-tools',
  'progress-tracker',
  'timer',
];

/**
 * Allowed tools in focus mode
 * Requirements: 10.3 - Include timer, progress tracking, and quick access to AI tools
 */
const FOCUS_MODE_ALLOWED_TOOLS = [
  'opus-clip',
  'ai-assistant',
  'upload-queue',
  'content-editor',
];

/**
 * Quick actions available in focus mode
 * Requirements: 10.5 - Quick action and keyboard shortcut access
 */
const FOCUS_MODE_QUICK_ACTIONS = [
  {
    id: 'ai-tools',
    title: 'AI Tools',
    icon: 'sparkles',
    shortcut: 'Ctrl+A',
    description: 'Access AI-powered content tools',
  },
  {
    id: 'upload',
    title: 'Upload',
    icon: 'upload',
    shortcut: 'Ctrl+U',
    description: 'Upload content',
  },
  {
    id: 'complete-task',
    title: 'Complete Task',
    icon: 'check',
    shortcut: 'Ctrl+Enter',
    description: 'Mark current task as complete',
  },
  {
    id: 'end-session',
    title: 'End Session',
    icon: 'square',
    shortcut: 'Ctrl+E',
    description: 'End focus session and view summary',
  },
];

/**
 * Keyboard shortcuts map for focus mode
 * Requirements: 10.5 - Keyboard shortcut access
 */
const FOCUS_MODE_KEYBOARD_SHORTCUTS = {
  toggle: { key: 'F', ctrl: true, shift: true, description: 'Toggle Focus Mode' },
  aiTools: { key: 'a', ctrl: true, description: 'Open AI Tools' },
  upload: { key: 'u', ctrl: true, description: 'Open Upload' },
  completeTask: { key: 'Enter', ctrl: true, description: 'Complete Current Task' },
  endSession: { key: 'e', ctrl: true, description: 'End Focus Session' },
  pauseResume: { key: ' ', ctrl: false, description: 'Pause/Resume Timer' },
};

/**
 * FocusMode Service
 * Handles focus session management and state
 */
export class FocusModeService {
  constructor() {
    this.session = null;
    this.listeners = new Set();
  }

  /**
   * Start a new focus session
   * Requirements: 10.1 - Provide Focus Mode that simplifies interface
   * @param {number} duration - Duration in minutes
   * @returns {import('./types').FocusSession}
   */
  startSession(duration = DEFAULT_FOCUS_DURATION) {
    this.session = {
      id: `focus_${Date.now()}`,
      startedAt: new Date(),
      duration,
      tasksCompleted: [],
      contentCreated: [],
      paused: false,
      pausedAt: null,
      totalPausedTime: 0,
    };
    
    this.saveSession();
    this.notifyListeners();
    return this.session;
  }

  /**
   * End the current focus session
   * Requirements: 10.4 - Show summary of work completed
   * @returns {import('./types').FocusSession}
   */
  endSession() {
    if (!this.session) return null;

    const endedSession = {
      ...this.session,
      endedAt: new Date(),
      summary: this.generateSummary(),
    };

    this.session = null;
    this.clearSavedSession();
    this.notifyListeners();
    
    return endedSession;
  }

  /**
   * Pause the current session
   */
  pauseSession() {
    if (!this.session || this.session.paused) return;
    
    this.session.paused = true;
    this.session.pausedAt = new Date();
    this.saveSession();
    this.notifyListeners();
  }

  /**
   * Resume the current session
   */
  resumeSession() {
    if (!this.session || !this.session.paused) return;
    
    const pausedDuration = Date.now() - new Date(this.session.pausedAt).getTime();
    this.session.totalPausedTime += pausedDuration;
    this.session.paused = false;
    this.session.pausedAt = null;
    this.saveSession();
    this.notifyListeners();
  }

  /**
   * Add completed task to session
   * @param {string} taskId
   */
  addCompletedTask(taskId) {
    if (!this.session) return;
    
    if (!this.session.tasksCompleted.includes(taskId)) {
      this.session.tasksCompleted.push(taskId);
      this.saveSession();
      this.notifyListeners();
    }
  }

  /**
   * Add created content to session
   * @param {string} contentId
   */
  addCreatedContent(contentId) {
    if (!this.session) return;
    
    if (!this.session.contentCreated.includes(contentId)) {
      this.session.contentCreated.push(contentId);
      this.saveSession();
      this.notifyListeners();
    }
  }

  /**
   * Get elapsed time in the current session (excluding paused time)
   * @returns {number} Elapsed time in milliseconds
   */
  getElapsedTime() {
    if (!this.session) return 0;
    
    const now = this.session.paused 
      ? new Date(this.session.pausedAt).getTime()
      : Date.now();
    
    const elapsed = now - new Date(this.session.startedAt).getTime() - this.session.totalPausedTime;
    return Math.max(0, elapsed);
  }

  /**
   * Get remaining time in the current session
   * @returns {number} Remaining time in milliseconds
   */
  getRemainingTime() {
    if (!this.session) return 0;
    
    const totalDuration = this.session.duration * 60 * 1000;
    const elapsed = this.getElapsedTime();
    return Math.max(0, totalDuration - elapsed);
  }

  /**
   * Check if session is active
   * @returns {boolean}
   */
  isActive() {
    return this.session !== null && !this.session.paused;
  }

  /**
   * Check if session exists (active or paused)
   * @returns {boolean}
   */
  hasSession() {
    return this.session !== null;
  }

  /**
   * Generate session summary
   * Requirements: 10.4 - Show summary of work completed
   * @returns {string}
   */
  generateSummary() {
    if (!this.session) return '';

    const elapsed = this.getElapsedTime();
    const minutes = Math.floor(elapsed / 60000);
    const tasksCount = this.session.tasksCompleted.length;
    const contentCount = this.session.contentCreated.length;

    const parts = [];
    parts.push(`Focused for ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    
    if (tasksCount > 0) {
      parts.push(`${tasksCount} task${tasksCount !== 1 ? 's' : ''} completed`);
    }
    
    if (contentCount > 0) {
      parts.push(`${contentCount} content item${contentCount !== 1 ? 's' : ''} created`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get next step suggestions after session ends
   * Requirements: 10.4 - Suggest next steps
   * @returns {Array<{id: string, title: string, description: string, icon?: string, priority?: number}>}
   */
  getNextStepSuggestions() {
    const suggestions = [];
    
    if (this.session) {
      // Prioritize based on what was accomplished
      if (this.session.contentCreated.length > 0) {
        suggestions.push({
          id: 'schedule',
          title: 'Schedule Content',
          description: 'Schedule your created content for optimal timing',
          icon: 'calendar',
          priority: 1,
        });
        suggestions.push({
          id: 'optimize',
          title: 'Optimize Metadata',
          description: 'Add titles, descriptions, and tags to your content',
          icon: 'edit',
          priority: 2,
        });
      }
      
      if (this.session.tasksCompleted.length > 0) {
        suggestions.push({
          id: 'review',
          title: 'Review Progress',
          description: 'Check your analytics and progress dashboard',
          icon: 'chart',
          priority: 3,
        });
      }

      // If significant work was done, suggest a break first
      const elapsed = this.getElapsedTime();
      const minutesWorked = Math.floor(elapsed / 60000);
      if (minutesWorked >= 25) {
        suggestions.unshift({
          id: 'break',
          title: 'Take a Break',
          description: `You've been focused for ${minutesWorked} minutes. Rest for 5 minutes before continuing.`,
          icon: 'coffee',
          priority: 0,
        });
      } else {
        suggestions.push({
          id: 'break',
          title: 'Take a Break',
          description: 'Rest for 5 minutes before your next focus session',
          icon: 'coffee',
          priority: 4,
        });
      }
    } else {
      suggestions.push({
        id: 'break',
        title: 'Take a Break',
        description: 'Rest for 5 minutes before your next focus session',
        icon: 'coffee',
        priority: 4,
      });
    }

    suggestions.push({
      id: 'continue',
      title: 'Start Another Session',
      description: 'Continue with another focus session',
      icon: 'play',
      priority: 5,
    });

    // Sort by priority
    return suggestions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }

  /**
   * Get detailed session statistics
   * Requirements: 10.4 - Show summary of work completed
   * @returns {Object} Detailed session statistics
   */
  getSessionStatistics() {
    if (!this.session) return null;

    const elapsed = this.getElapsedTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const plannedDuration = this.session.duration;
    const completionPercentage = Math.min(100, Math.round((elapsed / (plannedDuration * 60000)) * 100));

    return {
      duration: {
        minutes,
        seconds,
        formatted: `${minutes}m ${seconds}s`,
        planned: plannedDuration,
        completionPercentage,
      },
      tasks: {
        completed: this.session.tasksCompleted.length,
        ids: [...this.session.tasksCompleted],
      },
      content: {
        created: this.session.contentCreated.length,
        ids: [...this.session.contentCreated],
      },
      pauses: {
        totalPausedTime: this.session.totalPausedTime || 0,
        pausedTimeFormatted: this.formatDuration(this.session.totalPausedTime || 0),
      },
      productivity: this.calculateProductivityScore(),
    };
  }

  /**
   * Calculate productivity score based on session activity
   * @returns {number} Score from 0-100
   */
  calculateProductivityScore() {
    if (!this.session) return 0;

    const elapsed = this.getElapsedTime();
    const plannedDuration = this.session.duration * 60000;
    
    // Base score from time spent (max 40 points)
    const timeScore = Math.min(40, (elapsed / plannedDuration) * 40);
    
    // Task completion score (max 30 points)
    const taskScore = Math.min(30, this.session.tasksCompleted.length * 10);
    
    // Content creation score (max 30 points)
    const contentScore = Math.min(30, this.session.contentCreated.length * 15);
    
    return Math.round(timeScore + taskScore + contentScore);
  }

  /**
   * Format duration in milliseconds to human readable string
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Save session to localStorage
   */
  saveSession() {
    if (this.session) {
      try {
        localStorage.setItem(FOCUS_SESSION_STORAGE_KEY, JSON.stringify(this.session));
      } catch (e) {
        console.error('Failed to save focus session:', e);
      }
    }
  }

  /**
   * Load session from localStorage
   * @returns {import('./types').FocusSession | null}
   */
  loadSession() {
    try {
      const saved = localStorage.getItem(FOCUS_SESSION_STORAGE_KEY);
      if (saved) {
        this.session = JSON.parse(saved);
        return this.session;
      }
    } catch (e) {
      console.error('Failed to load focus session:', e);
    }
    return null;
  }

  /**
   * Clear saved session from localStorage
   */
  clearSavedSession() {
    try {
      localStorage.removeItem(FOCUS_SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear focus session:', e);
    }
  }

  /**
   * Subscribe to session changes
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of session changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  /**
   * Check if a widget is allowed in focus mode
   * Requirements: 10.2 - Hide non-essential widgets
   * @param {string} widgetId
   * @returns {boolean}
   */
  isWidgetAllowed(widgetId) {
    return FOCUS_MODE_ALLOWED_WIDGETS.includes(widgetId);
  }

  /**
   * Check if a tool is allowed in focus mode
   * Requirements: 10.3 - Quick access to AI tools
   * @param {string} toolId
   * @returns {boolean}
   */
  isToolAllowed(toolId) {
    return FOCUS_MODE_ALLOWED_TOOLS.includes(toolId);
  }

  /**
   * Get allowed widgets for focus mode
   * Requirements: 10.2 - Hide non-essential widgets
   * @returns {string[]}
   */
  getAllowedWidgets() {
    return [...FOCUS_MODE_ALLOWED_WIDGETS];
  }

  /**
   * Get allowed tools for focus mode
   * Requirements: 10.3 - Quick access to AI tools
   * @returns {string[]}
   */
  getAllowedTools() {
    return [...FOCUS_MODE_ALLOWED_TOOLS];
  }

  /**
   * Filter widgets for focus mode
   * Requirements: 10.2 - Hide non-essential widgets
   * @param {Array<{id: string}>} widgets
   * @returns {Array<{id: string}>}
   */
  filterWidgetsForFocusMode(widgets) {
    return widgets.filter(widget => this.isWidgetAllowed(widget.id));
  }

  /**
   * Filter tools for focus mode
   * Requirements: 10.3 - Quick access to AI tools
   * @param {Array<{id: string}>} tools
   * @returns {Array<{id: string}>}
   */
  filterToolsForFocusMode(tools) {
    return tools.filter(tool => this.isToolAllowed(tool.id));
  }
}

// Singleton instance
let focusModeServiceInstance = null;

/**
 * Get or create FocusModeService instance
 * @returns {FocusModeService}
 */
export function getFocusModeService() {
  if (!focusModeServiceInstance) {
    focusModeServiceInstance = new FocusModeService();
  }
  return focusModeServiceInstance;
}


/**
 * Timer display component
 */
const TimerDisplay = ({ remainingMs, isPaused }) => {
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  
  return (
    <div className={`text-4xl font-mono font-bold ${isPaused ? 'text-yellow-600' : 'text-blue-600'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

/**
 * Progress ring component
 */
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
};

/**
 * Focus session summary component
 * Requirements: 10.4 - Show summary of work completed and suggest next steps
 */
const SessionSummary = ({ session, suggestions, statistics, onSuggestionClick, onClose }) => {
  if (!session) return null;

  const elapsed = session.endedAt 
    ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime() - (session.totalPausedTime || 0)
    : 0;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  // Get icon for suggestion
  const getSuggestionIcon = (iconName) => {
    const icons = {
      calendar: Clock,
      chart: BarChart3,
      coffee: Timer,
      play: Play,
      edit: Sparkles,
    };
    const Icon = icons[iconName] || ChevronRight;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="focus-session-summary">
      <Card className="p-6 max-w-md w-full mx-4 bg-white max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-4">
          {/* Success icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900">
            Focus Session Complete!
          </h3>
          
          <p className="text-gray-600" data-testid="session-summary-text">
            {session.summary || `You focused for ${minutes} minutes and ${seconds} seconds.`}
          </p>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {minutes}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">Time Focused</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {statistics?.productivity || 0}%
              </div>
              <div className="text-sm text-gray-500">Productivity</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {session.tasksCompleted?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Tasks Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {session.contentCreated?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Content Created</div>
            </div>
          </div>

          {/* Pause time if any */}
          {session.totalPausedTime > 0 && (
            <div className="text-sm text-gray-500">
              Paused for {Math.floor(session.totalPausedTime / 60000)}m {Math.floor((session.totalPausedTime % 60000) / 1000)}s
            </div>
          )}

          {/* Next step suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 flex items-center justify-center">
                <Target className="w-4 h-4 mr-2" />
                What's next?
              </h4>
              <div className="space-y-2">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors flex items-center ${
                      index === 0 ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : ''
                    }`}
                    data-testid={`suggestion-${suggestion.id}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getSuggestionIcon(suggestion.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      <div className="text-sm text-gray-500">{suggestion.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full mt-4" variant="outline">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

/**
 * Quick action button for focus mode
 * Requirements: 10.5 - Quick action and keyboard shortcut access
 */
const FocusQuickAction = ({ action, onClick }) => {
  const getIcon = (iconName) => {
    const icons = {
      sparkles: Sparkles,
      upload: Upload,
      check: CheckCircle,
      square: Square,
    };
    const Icon = icons[iconName] || Zap;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <button
      onClick={() => onClick?.(action)}
      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-50 transition-colors"
      title={`${action.title} (${action.shortcut})`}
      data-testid={`focus-action-${action.id}`}
    >
      {getIcon(action.icon)}
      <span className="text-sm font-medium">{action.title}</span>
      {action.shortcut && (
        <span className="text-xs text-gray-400 ml-auto">{action.shortcut}</span>
      )}
    </button>
  );
};

/**
 * Main FocusMode component
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * @param {Object} props
 * @param {boolean} [props.isActive] - Whether focus mode is currently active
 * @param {Function} [props.onActivate] - Callback when focus mode is activated
 * @param {Function} [props.onDeactivate] - Callback when focus mode is deactivated
 * @param {Function} [props.onTaskComplete] - Callback when a task is completed
 * @param {Function} [props.onToolLaunch] - Callback when a tool is launched
 * @param {number} [props.defaultDuration] - Default session duration in minutes
 * @param {Array} [props.currentTasks] - Current tasks to track
 * @param {string} [props.className] - Additional CSS classes
 */
export const FocusMode = ({
  isActive: externalIsActive,
  onActivate,
  onDeactivate,
  onTaskComplete,
  onToolLaunch,
  defaultDuration = DEFAULT_FOCUS_DURATION,
  currentTasks = [],
  className = '',
}) => {
  const service = useMemo(() => getFocusModeService(), []);
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(defaultDuration * 60 * 1000);
  const [progress, setProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [sessionStatistics, setSessionStatistics] = useState(null);
  const [duration, setDuration] = useState(defaultDuration);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  const timerRef = useRef(null);

  // Sync with external isActive prop
  useEffect(() => {
    if (externalIsActive !== undefined && externalIsActive !== isActive) {
      if (externalIsActive) {
        handleActivate();
      } else {
        handleDeactivate();
      }
    }
  }, [externalIsActive]);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = service.loadSession();
    if (savedSession) {
      setIsActive(true);
      setIsPaused(savedSession.paused || false);
      setDuration(savedSession.duration);
    }
  }, [service]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        const remaining = service.getRemainingTime();
        setRemainingTime(remaining);
        
        const totalDuration = duration * 60 * 1000;
        const elapsed = totalDuration - remaining;
        setProgress((elapsed / totalDuration) * 100);

        // Auto-end session when time is up
        if (remaining <= 0) {
          handleDeactivate();
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, duration, service]);

  /**
   * Activate focus mode
   * Requirements: 10.1 - Provide Focus Mode that simplifies interface
   */
  const handleActivate = useCallback(() => {
    service.startSession(duration);
    setIsActive(true);
    setIsPaused(false);
    setRemainingTime(duration * 60 * 1000);
    setProgress(0);
    
    onActivate?.();
  }, [service, duration, onActivate]);

  /**
   * Deactivate focus mode
   * Requirements: 10.4 - Show summary when session ends
   */
  const handleDeactivate = useCallback(() => {
    // Capture statistics before ending session
    const stats = service.getSessionStatistics();
    const session = service.endSession();
    setIsActive(false);
    setIsPaused(false);
    
    if (session) {
      setCompletedSession(session);
      setSessionStatistics(stats);
      setShowSummary(true);
    }
    
    onDeactivate?.();
  }, [service, onDeactivate]);

  /**
   * Pause/Resume session
   */
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      service.resumeSession();
      setIsPaused(false);
    } else {
      service.pauseSession();
      setIsPaused(true);
    }
  }, [service, isPaused]);

  /**
   * Handle quick action click
   * Requirements: 10.5 - Quick action access
   */
  const handleQuickAction = useCallback((action) => {
    switch (action.id) {
      case 'ai-tools':
        onToolLaunch?.('opus-clip');
        break;
      case 'upload':
        onToolLaunch?.('upload-queue');
        break;
      case 'complete-task':
        if (currentTasks.length > 0) {
          const firstIncomplete = currentTasks.find(t => !t.completed);
          if (firstIncomplete) {
            service.addCompletedTask(firstIncomplete.id);
            onTaskComplete?.(firstIncomplete.id);
          }
        }
        break;
      case 'end-session':
        handleDeactivate();
        break;
      default:
        break;
    }
  }, [service, currentTasks, onToolLaunch, onTaskComplete, handleDeactivate]);

  // Keyboard shortcut handler
  // Requirements: 10.5 - Keyboard shortcut access
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus mode toggle: Ctrl+Shift+F
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        if (isActive) {
          handleDeactivate();
        } else {
          handleActivate();
        }
        return;
      }

      // Quick actions in focus mode
      if (isActive) {
        // Ctrl+A for AI Tools
        if (e.ctrlKey && e.key === 'a' && !e.shiftKey) {
          e.preventDefault();
          handleQuickAction({ id: 'ai-tools' });
          return;
        }
        // Ctrl+U for Upload
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          handleQuickAction({ id: 'upload' });
          return;
        }
        // Ctrl+Enter for Complete Task
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleQuickAction({ id: 'complete-task' });
          return;
        }
        // Ctrl+E for End Session
        if (e.ctrlKey && e.key === 'e') {
          e.preventDefault();
          handleDeactivate();
          return;
        }
        // Space for Pause/Resume (when not in an input field)
        if (e.key === ' ' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          const activeElement = document.activeElement;
          const isInputField = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
          );
          if (!isInputField) {
            e.preventDefault();
            handlePauseResume();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handlePauseResume, handleDeactivate, handleActivate, handleQuickAction]);

  /**
   * Handle suggestion click from summary
   * Requirements: 10.4 - Suggest next steps
   */
  const handleSuggestionClick = useCallback((suggestion) => {
    setShowSummary(false);
    
    switch (suggestion.id) {
      case 'continue':
        handleActivate();
        break;
      case 'schedule':
        onToolLaunch?.('scheduler');
        break;
      case 'review':
        onToolLaunch?.('analytics');
        break;
      case 'optimize':
        onToolLaunch?.('metadata-editor');
        break;
      case 'break':
        // Just close the summary for break - user can rest
        break;
      default:
        break;
    }
  }, [handleActivate, onToolLaunch]);

  /**
   * Close summary modal
   */
  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    setCompletedSession(null);
  }, []);

  // Duration options
  const durationOptions = [15, 25, 45, 60, 90];

  // Get next step suggestions
  const suggestions = useMemo(() => {
    return service.getNextStepSuggestions();
  }, [service, completedSession]);

  // If not active, show activation button
  if (!isActive) {
    return (
      <>
        <Card className={`p-4 ${className}`} data-testid="focus-mode-inactive">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Focus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Modo Foco</h3>
                <p className="text-sm text-gray-500">
                  Minimize distrações e foque na criação
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Duration picker */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDurationPicker(!showDurationPicker)}
                  className="text-sm"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {duration}m
                </Button>
                
                {showDurationPicker && (
                  <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-2">
                    {durationOptions.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDuration(d);
                          setShowDurationPicker(false);
                        }}
                        className={`block w-full text-left px-3 py-1 rounded hover:bg-gray-100 ${
                          d === duration ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {d} minutos
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleActivate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="focus-mode-activate"
              >
                <Play className="w-4 h-4 mr-1" />
                Iniciar Foco
              </Button>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-400 flex items-center">
            <Keyboard className="w-3 h-3 mr-1" />
            Pressione {FOCUS_MODE_SHORTCUT} para alternar o modo foco
          </div>
        </Card>

        {/* Session Summary Modal */}
        {showSummary && completedSession && (
          <SessionSummary
            session={completedSession}
            suggestions={suggestions}
            statistics={sessionStatistics}
            onSuggestionClick={handleSuggestionClick}
            onClose={handleCloseSummary}
          />
        )}
      </>
    );
  }

  // Active focus mode UI
  // Requirements: 10.1 - Simplified interface during content creation
  return (
    <>
      <div 
        className={`fixed inset-0 bg-gray-900 bg-opacity-95 z-40 flex flex-col ${className}`}
        data-testid="focus-mode-active"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 text-white">
            <Focus className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Modo Foco</span>
            {isPaused && (
              <span className="text-yellow-400 text-sm">(Pausado)</span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeactivate}
            className="text-gray-400 hover:text-white"
            data-testid="focus-mode-deactivate"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Timer with progress ring */}
          <div className="relative mb-8">
            <ProgressRing progress={progress} size={200} strokeWidth={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <TimerDisplay remainingMs={remainingTime} isPaused={isPaused} />
              <div className="text-gray-400 text-sm mt-1">
                {isPaused ? 'Pausado' : 'Restante'}
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              onClick={handlePauseResume}
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              data-testid="focus-mode-pause-resume"
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDeactivate}
              variant="outline"
              size="lg"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              <Square className="w-5 h-5 mr-2" />
              Encerrar Sessão
            </Button>
          </div>

          {/* Quick actions */}
          {/* Requirements: 10.5 - Quick action and keyboard shortcut access */}
          <Card className="bg-gray-800 border-gray-700 p-4 w-full max-w-md">
            <h4 className="text-gray-300 text-sm font-medium mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" />
              Ações Rápidas
            </h4>
            <div className="space-y-1">
              {FOCUS_MODE_QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  data-testid={`focus-action-${action.id}`}
                >
                  <span className="text-sm">{action.title}</span>
                  <span className="text-xs text-gray-500">{action.shortcut}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Session stats */}
          <div className="mt-6 flex items-center space-x-6 text-gray-400 text-sm">
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              <span>{service.session?.tasksCompleted?.length || 0} tarefas</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span>{service.session?.contentCreated?.length || 0} conteúdos</span>
            </div>
          </div>
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-xs">
          <Keyboard className="w-3 h-3 inline mr-1" />
          Pressione {FOCUS_MODE_SHORTCUT} para sair • Ctrl+A para IA • Ctrl+U para Upload • Ctrl+E para Encerrar • Espaço para Pausar
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummary && completedSession && (
        <SessionSummary
          session={completedSession}
          suggestions={suggestions}
          statistics={sessionStatistics}
          onSuggestionClick={handleSuggestionClick}
          onClose={handleCloseSummary}
        />
      )}
    </>
  );
};

// Export constants for testing
export {
  FOCUS_MODE_ALLOWED_WIDGETS,
  FOCUS_MODE_ALLOWED_TOOLS,
  FOCUS_MODE_QUICK_ACTIONS,
  FOCUS_MODE_SHORTCUT,
  DEFAULT_FOCUS_DURATION,
  FOCUS_MODE_KEYBOARD_SHORTCUTS,
};

export default FocusMode;
