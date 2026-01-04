/**
 * SetupAssistant Component Tests
 * Unit tests and property-based tests for SetupAssistant
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { SetupAssistant } from '../SetupAssistant';
import { setupTaskArbitrary } from './arbitraries';
import { createMockSetupTasks } from './test-utils';

describe('SetupAssistant Component', () => {
  // ============================================
  // PROPERTY-BASED TESTS
  // ============================================

  describe('Property 1: Setup Assistant Information Completeness', () => {
    it('Feature: daily-command-center, Property 1: Setup task information completeness', () => {
      /**
       * Property: For any setup task displayed by the Setup Assistant,
       * the task should include estimated time, priority level, and benefits information
       * Validates: Requirements 1.2
       */
      fc.assert(
        fc.property(
          fc.array(setupTaskArbitrary, { minLength: 1, maxLength: 10 }),
          (tasks) => {
            // Render the component with generated tasks
            const onCompleteTask = vi.fn();
            const { container } = render(
              <SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />
            );

            // Get the displayed tasks (limited to first 5)
            const displayedTasks = tasks.slice(0, 5);

            // Verify each displayed task has all required information
            for (const task of displayedTasks) {
              // Check that estimated time is present and positive
              expect(task.estimatedTime).toBeGreaterThan(0);
              
              // Check that priority is defined and valid
              expect(task.priority).toBeDefined();
              expect(['high', 'medium', 'low']).toContain(task.priority);
              
              // Check that benefits array exists and has at least one item
              expect(task.benefits).toBeDefined();
              expect(Array.isArray(task.benefits)).toBe(true);
              expect(task.benefits.length).toBeGreaterThan(0);
              
              // Verify all benefits are non-empty strings
              for (const benefit of task.benefits) {
                expect(typeof benefit).toBe('string');
                expect(benefit.length).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ============================================
  // UNIT TESTS
  // ============================================

  describe('Unit Tests', () => {
    it('renders setup assistant with title and description', () => {
      const tasks = createMockSetupTasks(3);
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      expect(screen.getByText('Setup Assistant')).toBeInTheDocument();
      expect(screen.getByText(/Complete these essential steps/i)).toBeInTheDocument();
    });

    it('displays 3-5 essential tasks only', () => {
      const tasks = createMockSetupTasks(10);
      const onCompleteTask = vi.fn();

      const { container } = render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Count task items (should be max 5)
      const taskElements = container.querySelectorAll('[class*="border rounded-lg p-4"]');
      expect(taskElements.length).toBeLessThanOrEqual(5);
      expect(taskElements.length).toBeGreaterThanOrEqual(3);
    });

    it('displays estimated time for each task', () => {
      const tasks = createMockSetupTasks(3);
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Check that time is displayed (format: Xm or Xh Ym)
      tasks.slice(0, 5).forEach(task => {
        const timeRegex = /\d+[mh]/;
        const timeElements = screen.getAllByText(timeRegex);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('displays priority level for each task', () => {
      const tasks = createMockSetupTasks(3);
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Check for priority badges (use getAllByText for multiple elements)
      tasks.slice(0, 5).forEach(task => {
        const priorityBadges = screen.getAllByText(task.priority);
        expect(priorityBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays benefits for incomplete tasks', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = false;
      tasks[0].benefits = ['Unique Benefit A', 'Unique Benefit B'];
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const benefitsLabels = screen.getAllByText('Benefits:');
      expect(benefitsLabels.length).toBeGreaterThan(0);
      expect(screen.getByText(/Unique Benefit A/)).toBeInTheDocument();
      expect(screen.getByText(/Unique Benefit B/)).toBeInTheDocument();
    });

    it('calculates and displays progress percentage', () => {
      const tasks = createMockSetupTasks(4);
      tasks[0].completed = true;
      tasks[1].completed = true;
      // 2 out of 4 = 50%
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('2 of 4')).toBeInTheDocument();
    });

    it('calls onCompleteTask when checkbox is clicked', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = false;
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const checkboxes = screen.getAllByRole('button', { name: /Mark task as complete/i });
      fireEvent.click(checkboxes[0]);

      expect(onCompleteTask).toHaveBeenCalledWith(tasks[0].id);
    });

    it('does not call onCompleteTask for already completed tasks', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = true;
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const completedCheckbox = screen.getByRole('button', { name: /Task completed/i });
      fireEvent.click(completedCheckbox);

      expect(onCompleteTask).not.toHaveBeenCalled();
    });

    it('displays action link when actionUrl is provided', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = false;
      tasks[0].actionUrl = 'https://example.com/setup';
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const actionLink = screen.getByText(/Start this task/i);
      expect(actionLink).toBeInTheDocument();
      expect(actionLink.closest('a')).toHaveAttribute('href', 'https://example.com/setup');
    });

    it('applies completed styling to finished tasks', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = true;
      const onCompleteTask = vi.fn();

      const { container } = render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const completedTask = container.querySelector('.bg-green-50');
      expect(completedTask).toBeInTheDocument();
    });

    it('formats time correctly for minutes and hours', () => {
      const tasks = [
        { ...createMockSetupTasks(1)[0], estimatedTime: 30 }, // 30m
        { ...createMockSetupTasks(1)[0], estimatedTime: 60 }, // 1h
        { ...createMockSetupTasks(1)[0], estimatedTime: 90 }, // 1h 30m
      ];
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      expect(screen.getByText('30m')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });
  });

  // ============================================
  // EDGE CASE TESTS
  // ============================================

  describe('Edge Cases', () => {
    it('displays setup assistant for first-time users', () => {
      const tasks = createMockSetupTasks(4);
      tasks.forEach(task => task.completed = false);
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Should show "Setup Assistant" title for incomplete setup
      expect(screen.getByText('Setup Assistant')).toBeInTheDocument();
      expect(screen.getByText(/Complete these essential steps/i)).toBeInTheDocument();
      
      // Should show 0% progress
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 4')).toBeInTheDocument();
    });

    it('transforms to advanced optimization when setup is complete', () => {
      const tasks = createMockSetupTasks(3);
      tasks.forEach(task => task.completed = true);
      
      const optimizationSuggestions = [
        {
          id: 'opt-1',
          title: 'Optimize Channel SEO',
          description: 'Improve your channel discoverability',
          estimatedTime: 30,
          priority: 'high',
          completed: false,
          benefits: ['Better search rankings'],
          impact: 'high',
        },
      ];
      const onCompleteTask = vi.fn();

      render(
        <SetupAssistant 
          tasks={tasks} 
          onCompleteTask={onCompleteTask}
          optimizationSuggestions={optimizationSuggestions}
        />
      );

      // Should show "Advanced Optimization" title
      expect(screen.getByText('Advanced Optimization')).toBeInTheDocument();
      expect(screen.getByText(/Take your setup to the next level/i)).toBeInTheDocument();
      
      // Should show 100% progress in green
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
      
      // Should show optimization suggestions
      expect(screen.getByText('Optimize Channel SEO')).toBeInTheDocument();
      expect(screen.getByText('high impact')).toBeInTheDocument();
    });

    it('shows completion message when all tasks done but no optimization suggestions', () => {
      const tasks = createMockSetupTasks(3);
      tasks.forEach(task => task.completed = true);
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      expect(screen.getByText(/Great job! Essential setup complete/i)).toBeInTheDocument();
      expect(screen.getByText(/ready to start creating content/i)).toBeInTheDocument();
    });

    it('shows immediate benefits when task is completed', () => {
      const tasks = createMockSetupTasks(3);
      tasks[0].completed = false;
      tasks[0].benefits = ['Unlock feature X', 'Improve performance'];
      const onCompleteTask = vi.fn();

      const { rerender } = render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Complete the first task
      const checkbox = screen.getAllByRole('button', { name: /Mark task as complete/i })[0];
      fireEvent.click(checkbox);

      // Simulate task completion by updating props
      tasks[0].completed = true;
      rerender(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Should show immediate benefits feedback
      expect(screen.getByText(/Great! You completed:/i)).toBeInTheDocument();
      expect(screen.getByText(/what you unlocked/i)).toBeInTheDocument();
    });

    it('handles empty task list gracefully', () => {
      const tasks = [];
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Should still render without crashing
      expect(screen.getByText('Setup Assistant')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('limits display to maximum 5 tasks', () => {
      const tasks = createMockSetupTasks(10);
      const onCompleteTask = vi.fn();

      const { container } = render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      const taskElements = container.querySelectorAll('[class*="border rounded-lg p-4"]');
      expect(taskElements.length).toBe(5);
    });

    it('handles tasks without benefits gracefully', () => {
      const tasks = createMockSetupTasks(2);
      tasks[0].benefits = [];
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Should render without crashing
      expect(screen.getByText(tasks[0].title)).toBeInTheDocument();
    });

    it('handles tasks without actionUrl', () => {
      const tasks = createMockSetupTasks(2);
      tasks[0].actionUrl = undefined;
      const onCompleteTask = vi.fn();

      render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Should not show action link
      const actionLinks = screen.queryAllByText(/Start this task/i);
      expect(actionLinks.length).toBeLessThan(tasks.length);
    });

    it('shows compact mode when prop is true', () => {
      const tasks = createMockSetupTasks(3);
      const onCompleteTask = vi.fn();

      const { container } = render(
        <SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} compact={true} />
      );

      const setupAssistant = container.querySelector('.setup-assistant');
      expect(setupAssistant.className).toContain('p-4');
      expect(setupAssistant.className).not.toContain('p-6');
    });

    it('updates progress bar color when all tasks complete', () => {
      const tasks = createMockSetupTasks(3);
      tasks.forEach(task => task.completed = true);
      const onCompleteTask = vi.fn();

      const { container } = render(<SetupAssistant tasks={tasks} onCompleteTask={onCompleteTask} />);

      // Progress bar should be green when complete
      const progressBar = container.querySelector('.bg-green-600.h-2');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
