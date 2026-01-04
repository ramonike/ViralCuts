/**
 * Smart Suggestions Component
 * Displays intelligent suggestions based on user behavior
 */

import React, { useState, useEffect, useMemo } from 'react';

/**
 * Analyzes user behavior patterns to generate insights
 * @param {import('./types').UserActivity[]} userActivity
 * @returns {import('./types').BehaviorInsights}
 */
function analyzeBehavior(userActivity) {
  if (!userActivity || userActivity.length === 0) {
    return {
      uploadFrequency: 0,
      preferredContentTypes: [],
      mostUsedTools: [],
      peakActivityTimes: [],
      engagementPatterns: {},
    };
  }

  // Calculate upload frequency (uploads per week)
  const uploads = userActivity.filter(activity => activity.type === 'upload');
  const timeSpan = Math.max(1, (Date.now() - Math.min(...userActivity.map(a => a.timestamp.getTime()))) / (1000 * 60 * 60 * 24 * 7));
  const uploadFrequency = uploads.length / timeSpan;

  // Analyze preferred content types
  const contentTypeCount = {};
  userActivity
    .filter(activity => activity.type === 'content_creation' && activity.metadata.contentType)
    .forEach(activity => {
      const type = activity.metadata.contentType;
      contentTypeCount[type] = (contentTypeCount[type] || 0) + 1;
    });
  
  const preferredContentTypes = Object.entries(contentTypeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  // Analyze most used tools
  const toolCount = {};
  userActivity
    .filter(activity => activity.metadata.tools)
    .forEach(activity => {
      activity.metadata.tools.forEach(tool => {
        toolCount[tool] = (toolCount[tool] || 0) + 1;
      });
    });
  
  const mostUsedTools = Object.entries(toolCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tool]) => tool);

  // Analyze peak activity times (hours of day)
  const hourCount = {};
  userActivity.forEach(activity => {
    const hour = activity.timestamp.getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });
  
  const peakActivityTimes = Object.entries(hourCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Analyze engagement patterns
  const engagementPatterns = {};
  userActivity
    .filter(activity => activity.type === 'engagement' && activity.metadata.metric)
    .forEach(activity => {
      const metric = activity.metadata.metric;
      const value = activity.metadata.value || 0;
      if (!engagementPatterns[metric]) {
        engagementPatterns[metric] = [];
      }
      engagementPatterns[metric].push(value);
    });

  // Calculate averages for engagement patterns
  Object.keys(engagementPatterns).forEach(metric => {
    const values = engagementPatterns[metric];
    engagementPatterns[metric] = values.reduce((sum, val) => sum + val, 0) / values.length;
  });

  return {
    uploadFrequency,
    preferredContentTypes,
    mostUsedTools,
    peakActivityTimes,
    engagementPatterns,
  };
}

/**
 * Checks if user has recent uploads (within last 3 days)
 * @param {import('./types').UserActivity[]} userActivity
 * @returns {boolean}
 */
function hasRecentUploads(userActivity) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return userActivity.some(activity => 
    activity.type === 'upload' && activity.timestamp > threeDaysAgo
  );
}

/**
 * Detects declining performance based on metrics comparison
 * @param {import('./types').UserMetrics} currentMetrics
 * @param {import('./types').UserMetrics} [previousMetrics]
 * @returns {boolean}
 */
function hasDeclineInPerformance(currentMetrics, previousMetrics) {
  if (!previousMetrics) return false;
  
  const currentEngagement = currentMetrics.channelGrowth.engagement;
  const previousEngagement = previousMetrics.channelGrowth.engagement;
  const currentViews = currentMetrics.channelGrowth.views;
  const previousViews = previousMetrics.channelGrowth.views;
  
  // Consider declining if engagement dropped by 20% or views dropped by 15%
  const engagementDecline = (previousEngagement - currentEngagement) / previousEngagement > 0.2;
  const viewsDecline = (previousViews - currentViews) / previousViews > 0.15;
  
  return engagementDecline || viewsDecline;
}

/**
 * Generates contextual suggestions based on specific triggers
 * @param {import('./types').UserActivity[]} userActivity
 * @param {import('./types').UserMetrics} currentMetrics
 * @param {import('./types').UserMetrics} [previousMetrics]
 * @param {import('./types').TrendingTopic[]} trendingTopics
 * @returns {import('./types').Suggestion[]}
 */
function generateContextualSuggestions(userActivity, currentMetrics, previousMetrics, trendingTopics) {
  const suggestions = [];
  const now = new Date();

  // Requirement 6.2: Suggestions for users without recent uploads
  if (!hasRecentUploads(userActivity)) {
    suggestions.push({
      id: 'no-recent-uploads',
      type: 'action',
      title: 'Time to Create New Content',
      description: "You haven't uploaded in the last 3 days. Consistent uploads help maintain audience engagement and channel growth.",
      confidence: 0.9,
      impact: 'high',
      actionable: true,
      actionUrl: '/upload',
      dismissible: true,
      createdAt: now,
    });

    // Additional suggestion for content planning
    suggestions.push({
      id: 'plan-content-batch',
      type: 'tip',
      title: 'Batch Create Content',
      description: 'Consider creating multiple videos in one session to maintain consistent uploads even during busy periods.',
      confidence: 0.7,
      impact: 'medium',
      actionable: true,
      actionUrl: '/planner',
      dismissible: true,
      createdAt: now,
    });
  }

  // Requirement 6.3: Performance-based optimization suggestions
  if (hasDeclineInPerformance(currentMetrics, previousMetrics)) {
    const engagementDrop = previousMetrics && 
      ((previousMetrics.channelGrowth.engagement - currentMetrics.channelGrowth.engagement) / previousMetrics.channelGrowth.engagement * 100);
    
    suggestions.push({
      id: 'performance-decline',
      type: 'warning',
      title: 'Performance Optimization Needed',
      description: `Your engagement has declined by ${Math.round(engagementDrop || 0)}%. Let's analyze your recent content and optimize your strategy.`,
      confidence: 0.85,
      impact: 'high',
      actionable: true,
      actionUrl: '/analytics',
      dismissible: true,
      createdAt: now,
    });

    // Specific optimization suggestions based on metrics
    if (currentMetrics.channelGrowth.engagement < 3) {
      suggestions.push({
        id: 'improve-engagement-tactics',
        type: 'action',
        title: 'Boost Engagement with Interactive Elements',
        description: 'Try adding polls, questions, or calls-to-action in your videos. Ask viewers to comment their thoughts or experiences.',
        confidence: 0.8,
        impact: 'high',
        actionable: true,
        dismissible: true,
        createdAt: now,
      });
    }

    if (currentMetrics.uploadConsistency < 70) {
      suggestions.push({
        id: 'improve-consistency',
        type: 'action',
        title: 'Create an Upload Schedule',
        description: 'Inconsistent uploads can hurt your channel growth. Set up a regular posting schedule that you can maintain.',
        confidence: 0.9,
        impact: 'high',
        actionable: true,
        actionUrl: '/schedule',
        dismissible: true,
        createdAt: now,
      });
    }
  }

  // Requirement 6.4: Trending topic content suggestions
  if (trendingTopics && trendingTopics.length > 0) {
    // Find topics with low competition and high relevance
    const opportunityTopics = trendingTopics.filter(topic => 
      topic.competition === 'low' && topic.relevanceScore > 0.7
    );

    if (opportunityTopics.length > 0) {
      const topTopic = opportunityTopics[0];
      suggestions.push({
        id: `trending-${topTopic.id}`,
        type: 'opportunity',
        title: 'Trending Topic Opportunity',
        description: `"${topTopic.topic}" is trending with ${topTopic.searchVolume.toLocaleString()} searches and low competition. Perfect time to create content!`,
        confidence: 0.8,
        impact: 'high',
        actionable: true,
        actionUrl: '/create',
        dismissible: true,
        createdAt: now,
      });
    }

    // General trending topics suggestion
    const highVolumeTopics = trendingTopics.filter(topic => topic.searchVolume > 20000);
    if (highVolumeTopics.length > 0) {
      suggestions.push({
        id: 'trending-topics-general',
        type: 'tip',
        title: 'Capitalize on Trending Topics',
        description: `${highVolumeTopics.length} trending topics are gaining traction. Consider creating content around these themes to increase visibility.`,
        confidence: 0.7,
        impact: 'medium',
        actionable: true,
        dismissible: true,
        createdAt: now,
      });
    }
  }

  return suggestions;
}

/**
 * Generates suggestions based on behavior insights
 * @param {import('./types').BehaviorInsights} insights
 * @param {import('./types').UserMetrics} [userMetrics]
 * @returns {import('./types').Suggestion[]}
 */
function generateSuggestions(insights, userMetrics) {
  const suggestions = [];
  const now = new Date();

  // Low upload frequency suggestions
  if (insights.uploadFrequency < 1) {
    suggestions.push({
      id: 'low-upload-frequency',
      type: 'action',
      title: 'Increase Upload Consistency',
      description: 'Your upload frequency is below average. Consider creating a content calendar to maintain regular uploads.',
      confidence: 0.8,
      impact: 'high',
      actionable: true,
      actionUrl: '/calendar',
      dismissible: true,
      createdAt: now,
    });
  }

  // Content type diversification
  if (insights.preferredContentTypes.length === 1) {
    suggestions.push({
      id: 'diversify-content',
      type: 'tip',
      title: 'Diversify Your Content',
      description: `You primarily create ${insights.preferredContentTypes[0]} content. Try experimenting with other formats to reach new audiences.`,
      confidence: 0.7,
      impact: 'medium',
      actionable: true,
      dismissible: true,
      createdAt: now,
    });
  }

  // Tool usage optimization
  if (insights.mostUsedTools.length > 0) {
    suggestions.push({
      id: 'optimize-workflow',
      type: 'tip',
      title: 'Optimize Your Workflow',
      description: `You frequently use ${insights.mostUsedTools[0]}. Consider exploring advanced features or shortcuts to improve efficiency.`,
      confidence: 0.6,
      impact: 'medium',
      actionable: true,
      dismissible: true,
      createdAt: now,
    });
  }

  // Peak activity time optimization
  if (insights.peakActivityTimes.length > 0 && userMetrics) {
    const peakHour = insights.peakActivityTimes[0];
    suggestions.push({
      id: 'optimize-timing',
      type: 'opportunity',
      title: 'Optimize Publishing Time',
      description: `You're most active around ${peakHour}:00. Consider scheduling uploads during your peak productivity hours.`,
      confidence: 0.7,
      impact: 'medium',
      actionable: true,
      actionUrl: '/schedule',
      dismissible: true,
      createdAt: now,
    });
  }

  // Performance-based suggestions
  if (userMetrics && userMetrics.channelGrowth.engagement < 5) {
    suggestions.push({
      id: 'improve-engagement',
      type: 'warning',
      title: 'Boost Engagement',
      description: 'Your engagement rate is below average. Try adding more interactive elements like polls, questions, or calls-to-action.',
      confidence: 0.9,
      impact: 'high',
      actionable: true,
      dismissible: true,
      createdAt: now,
    });
  }

  return suggestions;
}

/**
 * Mock function to get trending topics
 * @returns {Promise<import('./types').TrendingTopic[]>}
 */
async function getTrendingTopics() {
  // In a real implementation, this would fetch from an API
  return [
    {
      id: 'trend-1',
      topic: 'AI Content Creation',
      category: 'Technology',
      relevanceScore: 0.9,
      searchVolume: 50000,
      competition: 'medium',
    },
    {
      id: 'trend-2',
      topic: 'Short Form Video Tips',
      category: 'Content Strategy',
      relevanceScore: 0.8,
      searchVolume: 30000,
      competition: 'high',
    },
    {
      id: 'trend-3',
      topic: 'Creator Economy',
      category: 'Business',
      relevanceScore: 0.7,
      searchVolume: 25000,
      competition: 'low',
    },
  ];
}

/**
 * Gets optimization tips based on user data
 * @returns {import('./types').OptimizationTip[]}
 */
function getOptimizationTips() {
  return [
    {
      id: 'tip-1',
      title: 'Optimize Thumbnails',
      description: 'Use bright colors and clear text to improve click-through rates',
      category: 'Visual Design',
      impact: 'high',
      difficulty: 'easy',
    },
    {
      id: 'tip-2',
      title: 'Improve Audio Quality',
      description: 'Invest in a good microphone to enhance viewer retention',
      category: 'Production',
      impact: 'medium',
      difficulty: 'medium',
    },
    {
      id: 'tip-3',
      title: 'Analyze Competitor Content',
      description: 'Study successful creators in your niche for inspiration',
      category: 'Strategy',
      impact: 'medium',
      difficulty: 'easy',
    },
  ];
}

/**
 * Smart Suggestions component for contextual recommendations
 * @param {Object} props
 * @param {import('./types').Suggestion[]} [props.suggestions] - Pre-generated suggestions
 * @param {import('./types').UserActivity[]} [props.userActivity] - User activity data for analysis
 * @param {import('./types').UserMetrics} [props.userMetrics] - Current user metrics
 * @param {import('./types').UserMetrics} [props.previousMetrics] - Previous period metrics for comparison
 * @param {(suggestionId: string) => void} [props.onDismiss] - Callback when suggestion is dismissed
 * @param {(suggestionId: string) => void} [props.onAction] - Callback when suggestion action is taken
 */
export function SmartSuggestions({ 
  suggestions: propSuggestions, 
  userActivity = [], 
  userMetrics,
  previousMetrics,
  onDismiss,
  onAction 
}) {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  // Analyze behavior and generate suggestions
  const behaviorInsights = useMemo(() => analyzeBehavior(userActivity), [userActivity]);
  
  // Generate both behavioral and contextual suggestions
  const behaviorSuggestions = useMemo(() => 
    generateSuggestions(behaviorInsights, userMetrics), 
    [behaviorInsights, userMetrics]
  );

  const contextualSuggestions = useMemo(() => 
    generateContextualSuggestions(userActivity, userMetrics, previousMetrics, trendingTopics),
    [userActivity, userMetrics, previousMetrics, trendingTopics]
  );

  // Combine all suggestions, prioritizing contextual ones
  const allSuggestions = propSuggestions || [
    ...contextualSuggestions,
    ...behaviorSuggestions
  ];

  const optimizationTips = useMemo(() => getOptimizationTips(), []);

  // Filter out dismissed suggestions and remove duplicates
  const visibleSuggestions = allSuggestions
    .filter((suggestion, index, self) => 
      !dismissedSuggestions.has(suggestion.id) &&
      self.findIndex(s => s.id === suggestion.id) === index
    )
    .sort((a, b) => {
      // Sort by impact (high first) then by confidence
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.confidence - a.confidence;
    });

  // Load trending topics on mount
  useEffect(() => {
    getTrendingTopics().then(setTrendingTopics);
  }, []);

  const handleDismiss = (suggestionId) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    onDismiss?.(suggestionId);
  };

  const handleAction = (suggestionId) => {
    onAction?.(suggestionId);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'action': return '🎯';
      case 'tip': return '💡';
      case 'opportunity': return '🚀';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-300 bg-red-950/50';
      case 'medium': return 'text-amber-300 bg-amber-950/50';
      case 'low': return 'text-emerald-300 bg-emerald-950/50';
      default: return 'text-slate-300 bg-slate-800/50';
    }
  };

  return (
    <div className="smart-suggestions space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Sugestões Inteligentes</h2>
        <div className="text-sm text-slate-400">
          Baseado nos seus padrões de atividade
        </div>
      </div>

      {/* Main Suggestions */}
      {visibleSuggestions.length > 0 && (
        <div className="space-y-3">
          {visibleSuggestions.slice(0, 5).map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl" role="img" aria-label={suggestion.type}>
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-100">{suggestion.title}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{suggestion.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                      {suggestion.actionable && (
                        <span className="text-blue-400">• Actionable</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {suggestion.actionable && suggestion.actionUrl && (
                    <button
                      onClick={() => handleAction(suggestion.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-500 transition-colors"
                    >
                      Take Action
                    </button>
                  )}
                  {suggestion.dismissible && (
                    <button
                      onClick={() => handleDismiss(suggestion.id)}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Dismiss suggestion"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/50 to-pink-950/50 border border-purple-800/30 rounded-xl p-5">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center text-base">
            <span className="mr-2">📈</span>
            Tópicos em Alta
          </h3>
          <div className="space-y-3">
            {trendingTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-slate-900/50 rounded-xl p-4 border border-purple-800/20 hover:border-purple-700/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-100 mb-1">
                      {topic.topic}
                    </div>
                    <div className="text-sm text-slate-400">
                      {topic.category}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-emerald-400 font-semibold">
                      {topic.searchVolume.toLocaleString()} buscas
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      topic.competition === 'low' ? 'bg-emerald-950/50 text-emerald-300' :
                      topic.competition === 'medium' ? 'bg-amber-950/50 text-amber-300' :
                      'bg-red-950/50 text-red-300'
                    }`}>
                      {topic.competition === 'low' ? 'Baixa' : topic.competition === 'medium' ? 'Média' : 'Alta'} competição
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {optimizationTips.length > 0 && (
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-5">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center text-base">
            <span className="mr-2">🔧</span>
            Dicas Rápidas de Otimização
          </h3>
          <div className="space-y-3">
            {optimizationTips.slice(0, 3).map((tip) => (
              <div
                key={tip.id}
                className="bg-slate-900/50 rounded-xl p-4 border border-blue-800/20 hover:border-blue-700/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="font-semibold text-slate-100 mb-1">
                      {tip.title}
                    </div>
                    <div className="text-sm text-slate-400">
                      {tip.description}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getImpactColor(tip.impact)}`}>
                      {tip.impact === 'high' ? 'Alto' : tip.impact === 'medium' ? 'Médio' : 'Baixo'} impacto
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs bg-slate-800/50 text-slate-300 font-semibold">
                      {tip.difficulty === 'easy' ? 'Fácil' : tip.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {visibleSuggestions.length === 0 && trendingTopics.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">🤖</div>
          <p className="text-sm">
            No suggestions available right now. Keep creating content and we'll provide personalized recommendations!
          </p>
        </div>
      )}
    </div>
  );
}

// Export the service functions for testing
export { 
  analyzeBehavior, 
  generateSuggestions, 
  generateContextualSuggestions,
  hasRecentUploads,
  hasDeclineInPerformance,
  getTrendingTopics, 
  getOptimizationTips 
};
