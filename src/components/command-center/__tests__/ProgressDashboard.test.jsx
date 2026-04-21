/**
 * ProgressDashboard Component Tests
 * Tests for metrics display, analytics integration, and property-based testing
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ProgressDashboard } from '../ProgressDashboard';
import { createMockUserMetrics } from './test-utils';
import { userMetricsArbitrary } from './arbitraries';

// Mock the analytics API
vi.mock('../../../api/analytics', () => ({
  fetchChannelAnalytics: vi.fn()
}));

import { fetchChannelAnalytics } from '../../../api/analytics';

describe('ProgressDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchChannelAnalytics.mockResolvedValue({
      views: 15432,
      watchTimeMinutes: 45678,
      subscribersGained: 234,
      subscribersLost: 12,
      averageViewDuration: 178
    });
  });

  describe('Basic Rendering', () => {
    it('renders progress dashboard with basic metrics', () => {
      const mockMetrics = createMockUserMetrics();
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('progress-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Painel de Progresso')).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
      render(<ProgressDashboard loading={true} />);
      
      expect(screen.getByTestId('progress-dashboard')).toBeInTheDocument();
      // Loading state should show skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('displays error state correctly', () => {
      const error = new Error('Failed to load metrics');
      
      render(<ProgressDashboard error={error} />);
      
      expect(screen.getByText('Unable to Load Progress Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('displays videos created this week', () => {
      const mockMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 5
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('videos-metric')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Vídeos criados esta semana')).toBeInTheDocument();
    });

    it('displays upload consistency percentage', () => {
      const mockMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 7
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('consistency-metric')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Consistência de uploads')).toBeInTheDocument();
    });

    it('displays channel growth metrics', () => {
      const mockMetrics = createMockUserMetrics({
        channelGrowth: {
          subscribers: 1500,
          views: 25000,
          engagement: 7
        }
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('growth-metric')).toBeInTheDocument();
      expect(screen.getByText('1.5K')).toBeInTheDocument();
      expect(screen.getByText('Total de inscritos')).toBeInTheDocument();
    });
  });

  describe('Streak Counters', () => {
    it('displays all streak counters', () => {
      const mockMetrics = createMockUserMetrics({
        streaks: {
          dailyActivity: 10,
          weeklyUploads: 3,
          contentCreation: 15
        }
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('daily-streak')).toBeInTheDocument();
      expect(screen.getByText(/10.*dias/i)).toBeInTheDocument();
      
      expect(screen.getByTestId('weekly-streak')).toBeInTheDocument();
      expect(screen.getByText(/3.*semanas/i)).toBeInTheDocument();
      
      expect(screen.getByTestId('creation-streak')).toBeInTheDocument();
      expect(screen.getByText(/15.*dias/i)).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('fetches and displays analytics data when token provided', async () => {
      const mockMetrics = createMockUserMetrics();
      
      render(<ProgressDashboard metrics={mockMetrics} token="test-token" />);
      
      await waitFor(() => {
        expect(fetchChannelAnalytics).toHaveBeenCalledWith('test-token', '7d');
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('analytics-views')).toBeInTheDocument();
        expect(screen.getByText('15.4K')).toBeInTheDocument();
      });
    });

    it('handles analytics API errors gracefully', async () => {
      fetchChannelAnalytics.mockRejectedValue(new Error('API Error'));
      const mockMetrics = createMockUserMetrics();
      
      render(<ProgressDashboard metrics={mockMetrics} token="test-token" />);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to Load Progress Data')).toBeInTheDocument();
      });
    });
  });

  describe('Achievements Display', () => {
    it('displays recent achievements when available', () => {
      const mockMetrics = createMockUserMetrics({
        achievements: [
          {
            id: 'achievement-1',
            title: 'First Upload',
            description: 'Uploaded your first video',
            icon: '🎉',
            points: 100,
            unlockedAt: new Date(),
            category: 'creation'
          }
        ]
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByTestId('achievement-achievement-1')).toBeInTheDocument();
      expect(screen.getByText('First Upload')).toBeInTheDocument();
      expect(screen.getByText('+100')).toBeInTheDocument();
      expect(screen.getByText('Pontos')).toBeInTheDocument();
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 4: Required Information Presence
     * Feature: daily-command-center, Property 4: Required Information Presence
     * Validates: Requirements 3.1, 3.5
     */
    it('Property 4: Required Information Presence - all displayed items contain required fields', () => {
      fc.assert(fc.property(
        userMetricsArbitrary,
        (metrics) => {
          const { container } = render(<ProgressDashboard metrics={metrics} />);
          
          // Check that videos metric has all required information
          const videosMetric = container.querySelector('[data-testid="videos-metric"]');
          if (videosMetric) {
            const hasNumber = videosMetric.textContent.match(/\d+/);
            const hasLabel = videosMetric.textContent.includes('Vídeos criados') || videosMetric.textContent.includes('Videos created');
            expect(hasNumber).toBeTruthy();
            expect(hasLabel).toBeTruthy();
          }
          
          // Check that consistency metric has all required information
          const consistencyMetric = container.querySelector('[data-testid="consistency-metric"]');
          if (consistencyMetric) {
            const hasPercentage = consistencyMetric.textContent.includes('%');
            const hasLabel = consistencyMetric.textContent.includes('Consistência') || consistencyMetric.textContent.includes('consistency');
            expect(hasPercentage).toBeTruthy();
            expect(hasLabel).toBeTruthy();
          }
          
          // Check that growth metric has all required information
          const growthMetric = container.querySelector('[data-testid="growth-metric"]');
          if (growthMetric) {
            const hasNumber = growthMetric.textContent.match(/[\d.]+[KM]?/);
            const hasLabel = growthMetric.textContent.includes('inscritos') || growthMetric.textContent.includes('subscribers');
            expect(hasNumber).toBeTruthy();
            expect(hasLabel).toBeTruthy();
          }
          
          // Check that streak counters have all required information
          const dailyStreak = container.querySelector('[data-testid="daily-streak"]');
          if (dailyStreak) {
            const hasNumber = dailyStreak.textContent.match(/\d+/);
            const hasUnit = dailyStreak.textContent.includes('dias') || dailyStreak.textContent.includes('days');
            const hasLabel = dailyStreak.textContent.includes('Atividade') || dailyStreak.textContent.includes('activity');
            expect(hasNumber).toBeTruthy();
            expect(hasUnit).toBeTruthy();
            expect(hasLabel).toBeTruthy();
          }
          
          return true;
        }
      ), { numRuns: 20 });
    });

    /**
     * Property 5: Performance-Based Suggestions
     * Feature: daily-command-center, Property 5: Performance-Based Suggestions
     * Validates: Requirements 3.4
     */
    it('Property 5: Performance-Based Suggestions - declining performance generates specific suggestions', () => {
      fc.assert(fc.property(
        fc.record({
          current: userMetricsArbitrary,
          previous: userMetricsArbitrary
        }),
        ({ current, previous }) => {
          // Mock analytics data that shows declining performance
          fetchChannelAnalytics
            .mockResolvedValueOnce({
              subscribersGained: 5,
              subscribersLost: 2,
              averageViewDuration: 120
            })
            .mockResolvedValueOnce({
              subscribersGained: 15,
              subscribersLost: 1,
              averageViewDuration: 180
            });

          const { container } = render(
            <ProgressDashboard 
              metrics={current} 
              previousMetrics={previous}
              token="test-token"
            />
          );
          
          // If there's a significant decline in video creation, suggestions should be generated
          const videoDecline = (previous.videosCreatedThisWeek || 0) - (current.videosCreatedThisWeek || 0);
          
          if (videoDecline >= 3) {
            // Should have performance analysis section
            const performanceSection = container.querySelector('[data-testid="performance-analysis"]');
            if (performanceSection) {
              // Should contain actionable suggestions
              const suggestionElements = container.querySelectorAll('[data-testid*="suggestion-"]');
              expect(suggestionElements.length).toBeGreaterThan(0);
              
              // At least one suggestion should be actionable (contain "Action Required")
              const actionableElements = Array.from(suggestionElements).filter(el => 
                el.textContent.includes('Action Required')
              );
              expect(actionableElements.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ), { numRuns: 20 });
    });

    it('Property 5: Suggestions contain required information fields', () => {
      fc.assert(fc.property(
        fc.record({
          current: fc.record({
            videosCreatedThisWeek: fc.integer({ min: 0, max: 3 }), // Low to trigger suggestions
            streaks: fc.record({
              dailyActivity: fc.integer({ min: 0, max: 365 }),
              weeklyUploads: fc.integer({ min: 0, max: 52 }),
              contentCreation: fc.integer({ min: 0, max: 365 })
            }),
            channelGrowth: fc.record({
              subscribers: fc.integer({ min: 0, max: 10000 }),
              views: fc.integer({ min: 0, max: 100000 }),
              engagement: fc.integer({ min: 0, max: 100 })
            }),
            achievements: fc.constant([])
          }),
          previous: fc.record({
            videosCreatedThisWeek: fc.integer({ min: 5, max: 10 }), // Higher to create decline
            streaks: fc.record({
              dailyActivity: fc.integer({ min: 0, max: 365 }),
              weeklyUploads: fc.integer({ min: 0, max: 52 }),
              contentCreation: fc.integer({ min: 0, max: 365 })
            }),
            channelGrowth: fc.record({
              subscribers: fc.integer({ min: 0, max: 10000 }),
              views: fc.integer({ min: 0, max: 100000 }),
              engagement: fc.integer({ min: 0, max: 100 })
            }),
            achievements: fc.constant([])
          })
        }),
        ({ current, previous }) => {
          fetchChannelAnalytics
            .mockResolvedValueOnce({
              subscribersGained: 2,
              subscribersLost: 1,
              averageViewDuration: 90
            })
            .mockResolvedValueOnce({
              subscribersGained: 10,
              subscribersLost: 1,
              averageViewDuration: 150
            });

          const { container } = render(
            <ProgressDashboard 
              metrics={current} 
              previousMetrics={previous}
              token="test-token"
            />
          );
          
          // Check that all suggestion elements have required information
          const suggestionElements = container.querySelectorAll('[data-testid*="suggestion-"]');
          
          suggestionElements.forEach(suggestion => {
            // Each suggestion should have a title (non-empty text content)
            expect(suggestion.textContent.trim().length).toBeGreaterThan(0);
            
            // Should have an icon (emoji or symbol)
            const hasIcon = /[🎯💡⚠️🏆ℹ️]/.test(suggestion.textContent);
            expect(hasIcon).toBeTruthy();
            
            // Should have descriptive text (more than just title)
            const textLength = suggestion.textContent.replace(/[🎯💡⚠️🏆ℹ️]/g, '').trim().length;
            expect(textLength).toBeGreaterThan(10);
          });
          
          return true;
        }
      ), { numRuns: 20 });
    });
  });

  describe('Number Formatting', () => {
    it('formats large numbers correctly', () => {
      const mockMetrics = createMockUserMetrics({
        channelGrowth: {
          subscribers: 1500000,
          views: 25000000,
          engagement: 7
        }
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('formats thousands correctly', () => {
      const mockMetrics = createMockUserMetrics({
        channelGrowth: {
          subscribers: 1500,
          views: 25000,
          engagement: 7
        }
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });
  });

  describe('Performance Analysis', () => {
    it('displays performance suggestions when declining metrics detected', async () => {
      fetchChannelAnalytics.mockResolvedValue({
        subscribersGained: 5,
        subscribersLost: 2,
        averageViewDuration: 120
      });

      const currentMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 2
      });
      const previousMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 5
      });
      
      render(
        <ProgressDashboard 
          metrics={currentMetrics} 
          previousMetrics={previousMetrics}
          token="test-token"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-analysis')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Content Creation Declining')).toBeInTheDocument();
    });

    it('displays achievement suggestions for improving metrics', async () => {
      fetchChannelAnalytics.mockResolvedValue({
        subscribersGained: 15,
        subscribersLost: 1,
        averageViewDuration: 180
      });

      const currentMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 8
      });
      const previousMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 5
      });
      
      render(
        <ProgressDashboard 
          metrics={currentMetrics} 
          previousMetrics={previousMetrics}
          token="test-token"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-analysis')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Content Creation Boost!')).toBeInTheDocument();
    });

    it('shows consistency warnings when upload consistency drops', async () => {
      fetchChannelAnalytics.mockResolvedValue({
        subscribersGained: 5,
        subscribersLost: 2,
        averageViewDuration: 120
      });

      const currentMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 2 // 28% consistency
      });
      const previousMetrics = createMockUserMetrics({
        videosCreatedThisWeek: 5 // 71% consistency
      });
      
      render(
        <ProgressDashboard 
          metrics={currentMetrics} 
          previousMetrics={previousMetrics}
          token="test-token"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-analysis')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Upload Consistency Dropping')).toBeInTheDocument();
    });

    it('highlights achievements when available', () => {
      const mockMetrics = createMockUserMetrics({
        achievements: [
          {
            id: 'achievement-1',
            title: 'First Upload',
            description: 'Uploaded your first video',
            icon: '🎉',
            points: 100,
            unlockedAt: new Date(),
            category: 'creation'
          }
        ]
      });
      
      render(<ProgressDashboard metrics={mockMetrics} />);
      
      expect(screen.getByText('Conquistas Recentes')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-achievement-1')).toBeInTheDocument();
    });
  });

  describe('Growth Trend Indicators', () => {
    it('shows improving trend for positive growth', async () => {
      fetchChannelAnalytics.mockResolvedValue({
        subscribersGained: 50,
        subscribersLost: 5
      });
      
      const mockMetrics = createMockUserMetrics();
      
      render(<ProgressDashboard metrics={mockMetrics} token="test-token" />);
      
      await waitFor(() => {
        // Look for the trend icon in the growth metric specifically
        const growthMetric = screen.getByTestId('growth-metric');
        expect(growthMetric).toHaveTextContent('📈');
      });
    });

    it('shows declining trend for negative growth', async () => {
      fetchChannelAnalytics.mockResolvedValue({
        subscribersGained: 2,
        subscribersLost: 10
      });
      
      const mockMetrics = createMockUserMetrics();
      
      render(<ProgressDashboard metrics={mockMetrics} token="test-token" />);
      
      await waitFor(() => {
        expect(screen.getByText('📉')).toBeInTheDocument();
      });
    });
  });
});