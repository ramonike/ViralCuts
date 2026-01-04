/**
 * QuickActions Component Tests
 * 
 * Tests for the QuickActions component with fixed order (no reordering)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { QuickActions, QuickActionsService, DEFAULT_ACTIONS, NOTIFICATION_SOURCES } from '../QuickActions';
import { actionArbitrary, userStateArbitrary } from './arbitraries';

// Mock the UI components
vi.mock('../../ui/card', () => ({
  Card: ({ children, className, ...props }) => (
    <div className={className} {...props}>{children}</div>
  )
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Play: () => <div data-testid="play-icon" />,
  X: () => <div data-testid="x-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

describe('QuickActions', () => {
  // ============================================
  // PROPERTY-BASED TESTS
  // ============================================

  /**
   * Property 7: Quick Actions Count Constraint
   * Feature: daily-command-center, Property 7: Quick actions count constraint
   * Validates: Requirements 5.1
   * 
   * For any user state and any set of available actions, 
   * the system should display exactly 6 action buttons (fixed).
   */
  test('Feature: daily-command-center, Property 7: Quick actions count constraint', () => {
    fc.assert(fc.property(
      userStateArbitrary,
      fc.array(actionArbitrary, { minLength: 0, maxLength: 20 }),
      (userState, customActions) => {
        // Render the component
        const { container } = render(
          <QuickActions 
            userState={userState} 
            actions={customActions}
          />
        );
        
        // Count rendered action buttons
        const actionButtons = container.querySelectorAll('[data-testid^="quick-action-"]');
        const actionCount = actionButtons.length;
        
        // Cleanup
        container.remove();
        
        // Verify count is exactly 6 (fixed order)
        return actionCount === 6;
      }
    ), { numRuns: 20 });
  });

  /**
   * Property: Actions maintain fixed order
   * Cards should never swap positions regardless of clicks
   */
  test('Feature: daily-command-center, Property: Actions maintain fixed order', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 5 }),
      fc.integer({ min: 1, max: 10 }),
      (actionIndex, clickCount) => {
        const { container, rerender } = render(<QuickActions />);
        
        // Get initial order
        const getActionIds = () => {
          const buttons = container.querySelectorAll('[data-testid^="quick-action-"]');
          return Array.from(buttons).map(btn => btn.getAttribute('data-testid'));
        };
        
        const initialOrder = getActionIds();
        
        // Click an action multiple times
        const buttons = container.querySelectorAll('[data-testid^="quick-action-"]');
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(buttons[actionIndex]);
        }
        
        // Re-render and check order
        rerender(<QuickActions />);
        const finalOrder = getActionIds();
        
        // Cleanup
        container.remove();
        
        // Order should be identical
        return JSON.stringify(initialOrder) === JSON.stringify(finalOrder);
      }
    ), { numRuns: 10 });
  });

  // ============================================
  // UNIT TESTS
  // ============================================

  describe('Unit Tests', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('renders quick actions component', () => {
      render(<QuickActions />);
      
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    });

    test('displays all 6 default actions', () => {
      render(<QuickActions />);
      
      // Should show all required actions
      expect(screen.getByTestId('quick-action-upload-video')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-schedule-content')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-check-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-optimize-channel')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-ai-tools')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-notifications')).toBeInTheDocument();
    });

    test('displays exactly 6 action buttons', () => {
      const { container } = render(<QuickActions />);
      
      const actionButtons = container.querySelectorAll('[data-testid^="quick-action-"]');
      expect(actionButtons.length).toBe(6);
    });

    test('handles action click and opens panel', () => {
      const mockOnActionClick = vi.fn();
      
      render(<QuickActions onActionClick={mockOnActionClick} />);
      
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      fireEvent.click(uploadButton);
      
      expect(mockOnActionClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'upload-video' })
      );
      
      // Panel should be open
      expect(screen.getByText('Enviar Novo Vídeo')).toBeInTheDocument();
    });

    test('tracks action usage', () => {
      const mockOnActionUsed = vi.fn();
      
      render(<QuickActions onActionUsed={mockOnActionUsed} />);
      
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      fireEvent.click(uploadButton);
      
      expect(mockOnActionUsed).toHaveBeenCalledWith('upload-video');
    });

    test('shows keyboard shortcuts hint', () => {
      render(<QuickActions />);
      
      expect(screen.getByText(/atalhos de teclado/i)).toBeInTheDocument();
    });

    test('displays action descriptions on hover', () => {
      render(<QuickActions />);
      
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      expect(uploadButton).toHaveAttribute('title', 'Envie um novo vídeo para seu canal');
    });

    // Requirements: 5.5 - Show notification badges for items requiring attention
    test('displays notification badges when notificationCounts provided', () => {
      const notificationCounts = {
        'upload-video': 3,
        'schedule-content': 5,
      };
      
      render(<QuickActions notificationCounts={notificationCounts} />);
      
      const uploadBadge = screen.getByTestId('notification-badge-upload-video');
      expect(uploadBadge).toBeInTheDocument();
      expect(uploadBadge).toHaveTextContent('3');
      
      const scheduleBadge = screen.getByTestId('notification-badge-schedule-content');
      expect(scheduleBadge).toBeInTheDocument();
      expect(scheduleBadge).toHaveTextContent('5');
    });

    // Requirements: 5.5 - Show notification badges for items requiring attention
    test('displays attention count in header when notifications exist', () => {
      const notificationCounts = {
        'upload-video': 3,
        'schedule-content': 5,
      };
      
      render(<QuickActions notificationCounts={notificationCounts} />);
      
      const attentionCount = screen.getByTestId('attention-count');
      expect(attentionCount).toBeInTheDocument();
      expect(attentionCount).toHaveTextContent('8 itens precisam de atenção');
    });

    // Requirements: 5.5 - Show notification badges for items requiring attention
    test('caps notification badge at 9+', () => {
      const notificationCounts = {
        'upload-video': 15,
      };
      
      render(<QuickActions notificationCounts={notificationCounts} />);
      
      const uploadBadge = screen.getByTestId('notification-badge-upload-video');
      expect(uploadBadge).toHaveTextContent('9+');
    });

    test('actions maintain fixed order after multiple clicks', () => {
      const { container } = render(<QuickActions />);
      
      // Get initial order
      const getActionIds = () => {
        const buttons = container.querySelectorAll('[data-testid^="quick-action-"]');
        return Array.from(buttons).map(btn => btn.getAttribute('data-testid'));
      };
      
      const initialOrder = getActionIds();
      
      // Click various actions multiple times
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      const analyticsButton = screen.getByTestId('quick-action-check-analytics');
      
      fireEvent.click(uploadButton);
      fireEvent.click(analyticsButton);
      fireEvent.click(analyticsButton);
      fireEvent.click(uploadButton);
      
      // Close any open panels
      const closeButtons = container.querySelectorAll('[aria-label="Fechar"]');
      closeButtons.forEach(btn => fireEvent.click(btn));
      
      // Order should be unchanged
      const finalOrder = getActionIds();
      expect(finalOrder).toEqual(initialOrder);
    });

    test('panel closes when clicking close button', () => {
      render(<QuickActions />);
      
      // Open panel
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      fireEvent.click(uploadButton);
      
      expect(screen.getByText('Enviar Novo Vídeo')).toBeInTheDocument();
      
      // Close panel
      const closeButton = screen.getByLabelText('Fechar');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Enviar Novo Vídeo')).not.toBeInTheDocument();
    });

    test('panel closes when clicking backdrop', () => {
      render(<QuickActions />);
      
      // Open panel
      const uploadButton = screen.getByTestId('quick-action-upload-video');
      fireEvent.click(uploadButton);
      
      expect(screen.getByText('Enviar Novo Vídeo')).toBeInTheDocument();
      
      // Click backdrop (the fixed overlay)
      const backdrop = document.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop);
      
      expect(screen.queryByText('Enviar Novo Vídeo')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // SERVICE TESTS
  // ============================================

  describe('QuickActionsService', () => {
    let service;

    beforeEach(() => {
      service = new QuickActionsService();
    });

    test('calculates notification counts correctly', () => {
      const externalCounts = {
        'upload-video': 3,
        'pending-uploads': 2,
      };
      
      const counts = service.getNotificationCounts(externalCounts, {});
      
      // upload-video should have 3 (direct) + 2 (from pending-uploads source)
      expect(counts['upload-video']).toBe(5);
    });

    test('calculates total notifications correctly', () => {
      const counts = {
        'upload-video': 3,
        'schedule-content': 5,
        'check-analytics': 0,
      };
      
      const total = service.getTotalNotifications(counts);
      expect(total).toBe(8);
    });

    test('handles empty notification counts', () => {
      const counts = service.getNotificationCounts({}, {});
      
      expect(counts['upload-video']).toBe(0);
      expect(counts['schedule-content']).toBe(0);
    });

    test('merges system state with external counts', () => {
      const externalCounts = {
        'upload-video': 1,
      };
      
      const systemState = {
        'draft-videos': 2,
      };
      
      const counts = service.getNotificationCounts(externalCounts, systemState);
      
      // upload-video should have 1 (direct) + 2 (from draft-videos in system state)
      expect(counts['upload-video']).toBe(3);
    });
  });

  // ============================================
  // DEFAULT ACTIONS TESTS
  // ============================================

  describe('Default Actions', () => {
    test('has exactly 6 default actions', () => {
      expect(DEFAULT_ACTIONS.length).toBe(6);
    });

    test('includes required actions', () => {
      const actionIds = DEFAULT_ACTIONS.map(a => a.id);
      
      expect(actionIds).toContain('upload-video');
      expect(actionIds).toContain('schedule-content');
      expect(actionIds).toContain('check-analytics');
      expect(actionIds).toContain('optimize-channel');
    });

    test('all actions have required properties', () => {
      DEFAULT_ACTIONS.forEach(action => {
        expect(action.id).toBeDefined();
        expect(action.title).toBeDefined();
        expect(action.icon).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.category).toBeDefined();
      });
    });

    test('all actions have Portuguese titles', () => {
      // Verify titles are in Portuguese
      expect(DEFAULT_ACTIONS.find(a => a.id === 'upload-video').title).toBe('Enviar Vídeo');
      expect(DEFAULT_ACTIONS.find(a => a.id === 'schedule-content').title).toBe('Agendar');
      expect(DEFAULT_ACTIONS.find(a => a.id === 'check-analytics').title).toBe('Analytics');
      expect(DEFAULT_ACTIONS.find(a => a.id === 'optimize-channel').title).toBe('Otimizar');
    });
  });

  // ============================================
  // NOTIFICATION SOURCES TESTS
  // ============================================

  describe('Notification Sources', () => {
    test('all default actions have notification sources defined', () => {
      DEFAULT_ACTIONS.forEach(action => {
        expect(NOTIFICATION_SOURCES[action.id]).toBeDefined();
        expect(Array.isArray(NOTIFICATION_SOURCES[action.id])).toBe(true);
      });
    });
  });
});
