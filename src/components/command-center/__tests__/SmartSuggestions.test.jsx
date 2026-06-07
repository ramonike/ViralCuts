/**
 * Unit tests for SmartSuggestions component
 * Tests contextual suggestion triggers and behavior analysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  SmartSuggestions, 
  hasRecentUploads, 
  hasDeclineInPerformance,
  generateContextualSuggestions,
  analyzeBehavior,
  getTrendingTopics 
} from '../SmartSuggestions';
import { createMockUserMetrics } from './test-utils';

describe('SmartSuggestions', () => {
  const mockOnDismiss = vi.fn();
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with empty state when no suggestions', () => {
      render(
        <SmartSuggestions 
          suggestions={[]}
          onDismiss={mockOnDismiss}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/No suggestions available right now/)).toBeInTheDocument();
    });

    it('renders suggestions when provided', () => {
      const mockSuggestions = [
        {
          id: 'test-suggestion',
          type: 'tip',
          title: 'Test Suggestion',
          description: 'This is a test suggestion',
          confidence: 0.8,
          impact: 'medium',
          actionable: true,
          dismissible: true,
          createdAt: new Date(),
        }
      ];

      render(
        <SmartSuggestions 
          suggestions={mockSuggestions}
          onDismiss={mockOnDismiss}
          onAction={mockOnAction}
        />
      );

      expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
      expect(screen.getByText('This is a test suggestion')).toBeInTheDocument();
      expect(screen.getByText('medium impact')).toBeInTheDocument();
    });

    it('handles suggestion dismissal', () => {
      const mockSuggestions = [
        {
          id: 'dismissible-suggestion',
          type: 'tip',
          title: 'Dismissible Suggestion',
          description: 'This can be dismissed',
          confidence: 0.8,
          impact: 'medium',
          actionable: false,
          dismissible: true,
          createdAt: new Date(),
        }
      ];

      render(
        <SmartSuggestions 
          suggestions={mockSuggestions}
          onDismiss={mockOnDismiss}
          onAction={mockOnAction}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss suggestion');
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledWith('dismissible-suggestion');
    });
  });

  describe('hasRecentUploads', () => {
    it('returns true when user has uploads within 3 days', () => {
      const recentActivity = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          metadata: {}
        }
      ];

      expect(hasRecentUploads(recentActivity)).toBe(true);
    });

    it('returns false when user has no recent uploads', () => {
      const oldActivity = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          metadata: {}
        }
      ];

      expect(hasRecentUploads(oldActivity)).toBe(false);
    });

    it('returns false when user has no upload activities', () => {
      const nonUploadActivity = [
        {
          id: '1',
          type: 'view',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      expect(hasRecentUploads(nonUploadActivity)).toBe(false);
    });

    it('returns false for empty activity array', () => {
      expect(hasRecentUploads([])).toBe(false);
    });
  });

  describe('hasDeclineInPerformance', () => {
    it('detects engagement decline', () => {
      const currentMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 3 }
      });
      const previousMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 5 }
      });

      expect(hasDeclineInPerformance(currentMetrics, previousMetrics)).toBe(true);
    });

    it('detects views decline', () => {
      const currentMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 8000, engagement: 5 }
      });
      const previousMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 5 }
      });

      expect(hasDeclineInPerformance(currentMetrics, previousMetrics)).toBe(true);
    });

    it('returns false when performance is stable', () => {
      const currentMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 5 }
      });
      const previousMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 9500, engagement: 4.8 }
      });

      expect(hasDeclineInPerformance(currentMetrics, previousMetrics)).toBe(false);
    });

    it('returns false when no previous metrics provided', () => {
      const currentMetrics = createMockUserMetrics();
      expect(hasDeclineInPerformance(currentMetrics, null)).toBe(false);
    });
  });

  describe('generateContextualSuggestions', () => {
    it('generates no-upload suggestion when user has no recent uploads', () => {
      const oldActivity = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          metadata: {}
        }
      ];
      const currentMetrics = createMockUserMetrics();

      const suggestions = generateContextualSuggestions(oldActivity, currentMetrics, null, []);

      expect(suggestions).toHaveLength(2); // no-recent-uploads + plan-content-batch
      expect(suggestions[0].id).toBe('no-recent-uploads');
      expect(suggestions[0].title).toBe('Time to Create New Content');
      expect(suggestions[0].type).toBe('action');
      expect(suggestions[0].impact).toBe('high');
    });

    it('generates performance decline suggestions', () => {
      const userActivity = [];
      const currentMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 8000, engagement: 2 },
        uploadConsistency: 60
      });
      const previousMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 5 }
      });

      const suggestions = generateContextualSuggestions(userActivity, currentMetrics, previousMetrics, []);

      const performanceSuggestion = suggestions.find(s => s.id === 'performance-decline');
      const engagementSuggestion = suggestions.find(s => s.id === 'improve-engagement-tactics');
      const consistencySuggestion = suggestions.find(s => s.id === 'improve-consistency');

      expect(performanceSuggestion).toBeDefined();
      expect(performanceSuggestion.type).toBe('warning');
      expect(performanceSuggestion.impact).toBe('high');

      expect(engagementSuggestion).toBeDefined();
      expect(engagementSuggestion.title).toBe('Boost Engagement with Interactive Elements');

      expect(consistencySuggestion).toBeDefined();
      expect(consistencySuggestion.title).toBe('Create an Upload Schedule');
    });

    it('generates trending topic suggestions', () => {
      const userActivity = [];
      const currentMetrics = createMockUserMetrics();
      const trendingTopics = [
        {
          id: 'trend-1',
          topic: 'AI Content Creation',
          category: 'Technology',
          relevanceScore: 0.8,
          searchVolume: 50000,
          competition: 'low'
        },
        {
          id: 'trend-2',
          topic: 'Popular Topic',
          category: 'General',
          relevanceScore: 0.6,
          searchVolume: 30000,
          competition: 'high'
        }
      ];

      const suggestions = generateContextualSuggestions(userActivity, currentMetrics, null, trendingTopics);

      const trendingSuggestion = suggestions.find(s => s.id === 'trending-trend-1');
      const generalTrendingSuggestion = suggestions.find(s => s.id === 'trending-topics-general');

      expect(trendingSuggestion).toBeDefined();
      expect(trendingSuggestion.title).toBe('Trending Topic Opportunity');
      expect(trendingSuggestion.type).toBe('opportunity');
      expect(trendingSuggestion.description).toContain('AI Content Creation');
      expect(trendingSuggestion.description).toContain('50.000 searches');

      expect(generalTrendingSuggestion).toBeDefined();
      expect(generalTrendingSuggestion.title).toBe('Capitalize on Trending Topics');
    });

    it('returns empty array when no triggers are met', () => {
      const recentActivity = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          metadata: {}
        }
      ];
      const currentMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 1000, views: 10000, engagement: 8 }
      });
      const previousMetrics = createMockUserMetrics({
        channelGrowth: { subscribers: 900, views: 9000, engagement: 7 }
      });

      const suggestions = generateContextualSuggestions(recentActivity, currentMetrics, previousMetrics, []);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('analyzeBehavior', () => {
    it('analyzes upload frequency correctly', () => {
      const userActivity = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          metadata: {}
        },
        {
          id: '2',
          type: 'upload',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          metadata: {}
        }
      ];

      const insights = analyzeBehavior(userActivity);

      expect(insights.uploadFrequency).toBeCloseTo(1, 1); // ~1 upload per week
    });

    it('identifies preferred content types', () => {
      const userActivity = [
        {
          id: '1',
          type: 'content_creation',
          timestamp: new Date(),
          metadata: { contentType: 'short' }
        },
        {
          id: '2',
          type: 'content_creation',
          timestamp: new Date(),
          metadata: { contentType: 'short' }
        },
        {
          id: '3',
          type: 'content_creation',
          timestamp: new Date(),
          metadata: { contentType: 'long' }
        }
      ];

      const insights = analyzeBehavior(userActivity);

      expect(insights.preferredContentTypes).toEqual(['short', 'long']);
    });

    it('identifies most used tools', () => {
      const userActivity = [
        {
          id: '1',
          type: 'creation',
          timestamp: new Date(),
          metadata: { tools: ['AI Tool', 'Editor'] }
        },
        {
          id: '2',
          type: 'creation',
          timestamp: new Date(),
          metadata: { tools: ['AI Tool', 'Thumbnail Creator'] }
        }
      ];

      const insights = analyzeBehavior(userActivity);

      expect(insights.mostUsedTools).toContain('AI Tool');
    });

    it('identifies peak activity times', () => {
      const userActivity = [
        {
          id: '1',
          type: 'creation',
          timestamp: new Date('2024-01-01T14:00:00'), // 2 PM
          metadata: {}
        },
        {
          id: '2',
          type: 'creation',
          timestamp: new Date('2024-01-01T14:30:00'), // 2:30 PM
          metadata: {}
        },
        {
          id: '3',
          type: 'creation',
          timestamp: new Date('2024-01-01T10:00:00'), // 10 AM
          metadata: {}
        }
      ];

      const insights = analyzeBehavior(userActivity);

      expect(insights.peakActivityTimes).toContain(14); // 2 PM should be peak
    });

    it('returns default values for empty activity', () => {
      const insights = analyzeBehavior([]);

      expect(insights.uploadFrequency).toBe(0);
      expect(insights.preferredContentTypes).toEqual([]);
      expect(insights.mostUsedTools).toEqual([]);
      expect(insights.peakActivityTimes).toEqual([]);
      expect(insights.engagementPatterns).toEqual({});
    });
  });

  describe('getTrendingTopics', () => {
    it('returns trending topics', async () => {
      const topics = await getTrendingTopics();

      expect(topics).toHaveLength(3);
      expect(topics[0]).toHaveProperty('id');
      expect(topics[0]).toHaveProperty('topic');
      expect(topics[0]).toHaveProperty('category');
      expect(topics[0]).toHaveProperty('relevanceScore');
      expect(topics[0]).toHaveProperty('searchVolume');
      expect(topics[0]).toHaveProperty('competition');
    });
  });
});