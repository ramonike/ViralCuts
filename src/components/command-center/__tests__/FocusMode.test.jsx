/**
 * FocusMode Component Tests
 * Property-based and unit tests for focus mode functionality
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  FocusMode, 
  FocusModeService,
  getFocusModeService,
  FOCUS_MODE_ALLOWED_WIDGETS,
  FOCUS_MODE_ALLOWED_TOOLS,
} from '../FocusMode';
import { widgetArbitrary, toolArbitrary, focusSessionArbitrary } from './arbitraries';

// Mock timers for testing
vi.useFakeTimers();

describe('FocusMode', () => {
  let service;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    
    // Create fresh service instance for each test
    service = new FocusModeService();
    
    // Clear any existing timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('Property-based tests', () => {
    /**
     * Property 13: Focus Mode UI Filtering
     * For any user in focus mode, only creation-related tools and widgets should be visible
     * Validates: Requirements 10.2, 10.3
     */
    test('Feature: daily-command-center, Property 13: Focus Mode UI Filtering', () => {
      fc.assert(fc.property(
        fc.array(widgetArbitrary, { minLength: 1, maxLength: 15 }),
        fc.array(toolArbitrary, { minLength: 1, maxLength: 10 }),
        (widgets, tools) => {
          // Filter widgets using the service
          const filteredWidgets = service.filterWidgetsForFocusMode(widgets);
          const filteredTools = service.filterToolsForFocusMode(tools);

          // Property 1: All filtered widgets must be in the allowed list
          const allWidgetsAllowed = filteredWidgets.every(widget => 
            FOCUS_MODE_ALLOWED_WIDGETS.includes(widget.id)
          );

          // Property 2: All filtered tools must be in the allowed list
          const allToolsAllowed = filteredTools.every(tool => 
            FOCUS_MODE_ALLOWED_TOOLS.includes(tool.id)
          );

          // Property 3: No non-allowed widgets should pass through
          const noDisallowedWidgets = filteredWidgets.every(widget =>
            service.isWidgetAllowed(widget.id)
          );

          // Property 4: No non-allowed tools should pass through
          const noDisallowedTools = filteredTools.every(tool =>
            service.isToolAllowed(tool.id)
          );

          // Property 5: Filtered count should be <= original count
          const widgetCountValid = filteredWidgets.length <= widgets.length;
          const toolCountValid = filteredTools.length <= tools.length;

          // Property 6: All allowed widgets from input should be in output
          const allowedWidgetsPreserved = widgets
            .filter(w => FOCUS_MODE_ALLOWED_WIDGETS.includes(w.id))
            .every(w => filteredWidgets.some(fw => fw.id === w.id));

          // Property 7: All allowed tools from input should be in output
          const allowedToolsPreserved = tools
            .filter(t => FOCUS_MODE_ALLOWED_TOOLS.includes(t.id))
            .every(t => filteredTools.some(ft => ft.id === t.id));

          return (
            allWidgetsAllowed &&
            allToolsAllowed &&
            noDisallowedWidgets &&
            noDisallowedTools &&
            widgetCountValid &&
            toolCountValid &&
            allowedWidgetsPreserved &&
            allowedToolsPreserved
          );
        }
      ), { numRuns: 100 });
    });

    test('isWidgetAllowed returns consistent results', () => {
      fc.assert(fc.property(
        widgetArbitrary,
        (widget) => {
          const result1 = service.isWidgetAllowed(widget.id);
          const result2 = service.isWidgetAllowed(widget.id);
          
          // Same input should always produce same output
          return result1 === result2;
        }
      ), { numRuns: 100 });
    });

    test('isToolAllowed returns consistent results', () => {
      fc.assert(fc.property(
        toolArbitrary,
        (tool) => {
          const result1 = service.isToolAllowed(tool.id);
          const result2 = service.isToolAllowed(tool.id);
          
          // Same input should always produce same output
          return result1 === result2;
        }
      ), { numRuns: 100 });
    });

    test('getAllowedWidgets returns immutable list', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10 }),
        () => {
          const list1 = service.getAllowedWidgets();
          const list2 = service.getAllowedWidgets();
          
          // Lists should be equal but not the same reference
          return (
            list1.length === list2.length &&
            list1.every((item, i) => item === list2[i]) &&
            list1 !== list2 // Different array instances
          );
        }
      ), { numRuns: 20 });
    });

    test('getAllowedTools returns immutable list', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 10 }),
        () => {
          const list1 = service.getAllowedTools();
          const list2 = service.getAllowedTools();
          
          // Lists should be equal but not the same reference
          return (
            list1.length === list2.length &&
            list1.every((item, i) => item === list2[i]) &&
            list1 !== list2 // Different array instances
          );
        }
      ), { numRuns: 20 });
    });
  });

  describe('Unit tests - Focus Mode Activation/Deactivation', () => {
    /**
     * Test focus mode activation
     * Requirements: 10.1 - Provide Focus Mode that simplifies interface
     */
    test('displays activation button when focus mode is inactive', () => {
      render(<FocusMode />);
      
      expect(screen.getByTestId('focus-mode-inactive')).toBeInTheDocument();
      expect(screen.getByTestId('focus-mode-activate')).toBeInTheDocument();
      expect(screen.getByText('Focus Mode')).toBeInTheDocument();
      expect(screen.getByText('Start Focus')).toBeInTheDocument();
    });

    test('activates focus mode when start button is clicked', async () => {
      const onActivate = vi.fn();
      render(<FocusMode onActivate={onActivate} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      expect(onActivate).toHaveBeenCalled();
    });

    test('deactivates focus mode when end session button is clicked', async () => {
      const onDeactivate = vi.fn();
      render(<FocusMode onDeactivate={onDeactivate} />);
      
      // Activate first
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Click end session
      fireEvent.click(screen.getByText('End Session'));
      
      await waitFor(() => {
        expect(onDeactivate).toHaveBeenCalled();
      });
    });

    test('deactivates focus mode when X button is clicked', async () => {
      const onDeactivate = vi.fn();
      render(<FocusMode onDeactivate={onDeactivate} />);
      
      // Activate first
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Click X button
      fireEvent.click(screen.getByTestId('focus-mode-deactivate'));
      
      await waitFor(() => {
        expect(onDeactivate).toHaveBeenCalled();
      });
    });
  });

  describe('Unit tests - Session Summary', () => {
    /**
     * Test session summary generation
     * Requirements: 10.4 - Show summary of work completed and suggest next steps
     */
    test('shows session summary when focus session ends', async () => {
      render(<FocusMode />);
      
      // Activate focus mode
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // End session
      fireEvent.click(screen.getByText('End Session'));
      
      // Should show summary modal
      await waitFor(() => {
        expect(screen.getByTestId('focus-session-summary')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Focus Session Complete!')).toBeInTheDocument();
    });

    test('session summary shows next step suggestions', async () => {
      render(<FocusMode />);
      
      // Activate and end session
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('End Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-session-summary')).toBeInTheDocument();
      });
      
      // Should show next step suggestions
      expect(screen.getByText("What's next?")).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-break')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-continue')).toBeInTheDocument();
    });

    test('clicking continue suggestion starts new session', async () => {
      const onActivate = vi.fn();
      render(<FocusMode onActivate={onActivate} />);
      
      // Activate and end session
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('End Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-session-summary')).toBeInTheDocument();
      });
      
      // Click continue suggestion
      fireEvent.click(screen.getByTestId('suggestion-continue'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // onActivate should be called twice (initial + continue)
      expect(onActivate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Unit tests - Timer and Progress', () => {
    /**
     * Test timer functionality
     * Requirements: 10.3 - Include timer and progress tracking
     */
    test('displays timer when focus mode is active', async () => {
      render(<FocusMode defaultDuration={25} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Timer should show initial time (25:00)
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    test('timer counts down when active', async () => {
      render(<FocusMode defaultDuration={1} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Advance timer by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      // Timer should show 00:50
      await waitFor(() => {
        expect(screen.getByText('00:50')).toBeInTheDocument();
      });
    });

    test('pause button pauses the timer', async () => {
      render(<FocusMode defaultDuration={1} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Click pause
      fireEvent.click(screen.getByTestId('focus-mode-pause-resume'));
      
      // Should show "Paused" indicator
      await waitFor(() => {
        expect(screen.getByText('(Paused)')).toBeInTheDocument();
      });
      
      // Button should now say "Resume"
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    test('resume button resumes the timer', async () => {
      render(<FocusMode defaultDuration={1} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Pause
      fireEvent.click(screen.getByTestId('focus-mode-pause-resume'));
      
      await waitFor(() => {
        expect(screen.getByText('Resume')).toBeInTheDocument();
      });
      
      // Resume
      fireEvent.click(screen.getByTestId('focus-mode-pause-resume'));
      
      // Should no longer show "Paused"
      await waitFor(() => {
        expect(screen.queryByText('(Paused)')).not.toBeInTheDocument();
      });
      
      // Button should now say "Pause"
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  describe('Unit tests - Quick Actions', () => {
    /**
     * Test quick actions in focus mode
     * Requirements: 10.5 - Quick action and keyboard shortcut access
     */
    test('displays quick actions when focus mode is active', async () => {
      render(<FocusMode />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Should show quick actions
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByTestId('focus-action-ai-tools')).toBeInTheDocument();
      expect(screen.getByTestId('focus-action-upload')).toBeInTheDocument();
      expect(screen.getByTestId('focus-action-complete-task')).toBeInTheDocument();
    });

    test('quick action triggers tool launch callback', async () => {
      const onToolLaunch = vi.fn();
      render(<FocusMode onToolLaunch={onToolLaunch} />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Click AI Tools action
      fireEvent.click(screen.getByTestId('focus-action-ai-tools'));
      
      expect(onToolLaunch).toHaveBeenCalledWith('opus-clip');
    });

    test('displays keyboard shortcuts hint', async () => {
      render(<FocusMode />);
      
      fireEvent.click(screen.getByTestId('focus-mode-activate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-active')).toBeInTheDocument();
      });
      
      // Should show keyboard shortcuts
      expect(screen.getByText(/Ctrl\+Shift\+F/)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+A/)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+U/)).toBeInTheDocument();
    });
  });

  describe('FocusModeService', () => {
    test('startSession creates a new session', () => {
      const session = service.startSession(25);
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.duration).toBe(25);
      expect(session.tasksCompleted).toEqual([]);
      expect(session.contentCreated).toEqual([]);
    });

    test('endSession returns session with summary', () => {
      service.startSession(25);
      const endedSession = service.endSession();
      
      expect(endedSession).toBeDefined();
      expect(endedSession.endedAt).toBeDefined();
      expect(endedSession.summary).toBeDefined();
    });

    test('addCompletedTask adds task to session', () => {
      service.startSession(25);
      service.addCompletedTask('task-1');
      service.addCompletedTask('task-2');
      
      expect(service.session.tasksCompleted).toContain('task-1');
      expect(service.session.tasksCompleted).toContain('task-2');
    });

    test('addCompletedTask does not add duplicates', () => {
      service.startSession(25);
      service.addCompletedTask('task-1');
      service.addCompletedTask('task-1');
      
      expect(service.session.tasksCompleted.length).toBe(1);
    });

    test('addCreatedContent adds content to session', () => {
      service.startSession(25);
      service.addCreatedContent('content-1');
      
      expect(service.session.contentCreated).toContain('content-1');
    });

    test('generateSummary creates meaningful summary', () => {
      service.startSession(25);
      service.addCompletedTask('task-1');
      service.addCompletedTask('task-2');
      service.addCreatedContent('content-1');
      
      const summary = service.generateSummary();
      
      expect(summary).toContain('2 tasks completed');
      expect(summary).toContain('1 content item created');
    });

    test('getNextStepSuggestions returns suggestions', () => {
      service.startSession(25);
      const suggestions = service.getNextStepSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.id === 'break')).toBe(true);
      expect(suggestions.some(s => s.id === 'continue')).toBe(true);
    });

    test('isWidgetAllowed correctly filters widgets', () => {
      expect(service.isWidgetAllowed('content-workflow')).toBe(true);
      expect(service.isWidgetAllowed('ai-tools')).toBe(true);
      expect(service.isWidgetAllowed('setup-assistant')).toBe(false);
      expect(service.isWidgetAllowed('notifications')).toBe(false);
    });

    test('isToolAllowed correctly filters tools', () => {
      expect(service.isToolAllowed('opus-clip')).toBe(true);
      expect(service.isToolAllowed('ai-assistant')).toBe(true);
      expect(service.isToolAllowed('scheduler')).toBe(false);
      expect(service.isToolAllowed('analytics')).toBe(false);
    });
  });
});
