/**
 * Progress Dashboard Component
 * Displays key metrics, streak counters, and performance analysis
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect } from 'react';
import { fetchChannelAnalytics } from '../../api/analytics';
import WidgetWrapper from '../shared/WidgetWrapper';
import { TrendingUp } from 'lucide-react';

/**
 * ProgressDashboard Component
 * @param {Object} props
 * @param {import('./types').UserMetrics} props.metrics - User metrics data
 * @param {import('./types').UserMetrics} props.previousMetrics - Previous period metrics for comparison
 * @param {string} props.token - OAuth token for analytics API
 * @param {Function} props.onMetricsUpdate - Callback when metrics are updated
 * @param {boolean} props.loading - Loading state
 * @param {Error} props.error - Error state
 */
export function ProgressDashboard({ 
  metrics, 
  previousMetrics,
  token, 
  onMetricsUpdate, 
  loading = false, 
  error = null 
}) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [previousAnalyticsData, setPreviousAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Fetch analytics data on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return;
      
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      try {
        // Fetch current and previous period data
        const [currentData, previousData] = await Promise.all([
          fetchChannelAnalytics(token, '7d'),
          fetchChannelAnalytics(token, '14d') // Previous 14 days to compare with current 7 days
        ]);
        
        setAnalyticsData(currentData);
        setPreviousAnalyticsData(previousData);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setAnalyticsError(err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  // Calculate derived metrics
  const calculateConsistencyPercentage = () => {
    if (!metrics?.videosCreatedThisWeek) return 0;
    const targetVideos = 7; // Assuming daily upload target
    return Math.min(100, (metrics.videosCreatedThisWeek / targetVideos) * 100);
  };

  const getGrowthTrend = () => {
    if (!analyticsData) return 'stable';
    
    const { subscribersGained = 0, subscribersLost = 0 } = analyticsData;
    const netGrowth = subscribersGained - subscribersLost;
    
    if (netGrowth > 10) return 'improving';
    if (netGrowth < -5) return 'declining';
    return 'stable';
  };

  // Performance comparison analysis
  const analyzePerformance = () => {
    if (!metrics || !previousMetrics || !analyticsData || !previousAnalyticsData) {
      return { trend: 'stable', suggestions: [] };
    }

    const suggestions = [];
    let overallTrend = 'stable';

    // Compare video creation
    const videoChange = metrics.videosCreatedThisWeek - (previousMetrics.videosCreatedThisWeek || 0);
    if (videoChange < -2) {
      suggestions.push({
        type: 'warning',
        title: 'Content Creation Declining',
        description: `You've created ${Math.abs(videoChange)} fewer videos this week. Consider setting daily creation reminders.`,
        actionable: true,
        priority: 'high'
      });
      overallTrend = 'declining';
    }

    // Compare consistency
    const currentConsistency = calculateConsistencyPercentage();
    const previousConsistency = previousMetrics.videosCreatedThisWeek ? 
      Math.min(100, (previousMetrics.videosCreatedThisWeek / 7) * 100) : 0;
    
    if (currentConsistency < previousConsistency - 20) {
      suggestions.push({
        type: 'warning',
        title: 'Upload Consistency Dropping',
        description: 'Your upload consistency has decreased significantly. Try scheduling content in advance.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Compare subscriber growth
    const currentGrowth = analyticsData.subscribersGained - analyticsData.subscribersLost;
    const previousGrowth = previousAnalyticsData.subscribersGained - previousAnalyticsData.subscribersLost;
    
    if (currentGrowth < previousGrowth * 0.5 && previousGrowth > 0) {
      suggestions.push({
        type: 'tip',
        title: 'Subscriber Growth Slowing',
        description: 'Consider optimizing your thumbnails and titles to improve click-through rates.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Compare engagement (watch time)
    const currentWatchTime = analyticsData.averageViewDuration || 0;
    const previousWatchTime = previousAnalyticsData.averageViewDuration || 0;
    
    if (currentWatchTime < previousWatchTime * 0.8 && previousWatchTime > 0) {
      suggestions.push({
        type: 'opportunity',
        title: 'Engagement Declining',
        description: 'Average view duration has decreased. Focus on stronger hooks in your first 15 seconds.',
        actionable: true,
        priority: 'high'
      });
      overallTrend = 'declining';
    }

    // Positive trends and achievements
    if (videoChange > 2) {
      suggestions.push({
        type: 'achievement',
        title: 'Content Creation Boost!',
        description: `Great job! You've created ${videoChange} more videos this week than last week.`,
        actionable: false,
        priority: 'low'
      });
      overallTrend = 'improving';
    }

    if (currentGrowth > previousGrowth * 1.5 && currentGrowth > 5) {
      suggestions.push({
        type: 'achievement',
        title: 'Subscriber Growth Accelerating!',
        description: 'Your subscriber growth is significantly higher than last week. Keep up the momentum!',
        actionable: false,
        priority: 'low'
      });
      overallTrend = 'improving';
    }

    return { trend: overallTrend, suggestions };
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-emerald-400';
      case 'declining': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'tip': return '💡';
      case 'opportunity': return '🎯';
      case 'achievement': return '🏆';
      default: return 'ℹ️';
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-red-950/50 border-red-800/50 text-red-200';
      case 'tip': return 'bg-blue-950/50 border-blue-800/50 text-blue-200';
      case 'opportunity': return 'bg-purple-950/50 border-purple-800/50 text-purple-200';
      case 'achievement': return 'bg-emerald-950/50 border-emerald-800/50 text-emerald-200';
      default: return 'bg-slate-800/50 border-slate-700/50 text-slate-200';
    }
  };

  if (loading || analyticsLoading) {
    return (
      <WidgetWrapper
        title="Painel de Progresso"
        icon={<TrendingUp className="w-5 h-5" />}
        loading={true}
      />
    );
  }

  if (error || analyticsError) {
    return (
      <WidgetWrapper
        title="Painel de Progresso"
        icon={<TrendingUp className="w-5 h-5" />}
      >
        <div className="text-center py-8">
          <div className="text-red-400 text-lg mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Unable to Load Progress Data
          </h3>
          <p className="text-slate-400 text-sm">
            {error?.message || analyticsError?.message || 'Please try again later'}
          </p>
        </div>
      </WidgetWrapper>
    );
  }

  const consistencyPercentage = calculateConsistencyPercentage();
  const growthTrend = getGrowthTrend();
  const performanceAnalysis = analyzePerformance();

  return (
    <WidgetWrapper
      title="Painel de Progresso"
      icon={<TrendingUp className="w-5 h-5" />}
      actions={
        <div className="text-xs md:text-sm text-slate-400 font-medium">
          Últimos 7 dias
        </div>
      }
    >
      <div data-testid="progress-dashboard">

      {/* Key Metrics Grid - Dark Theme - Subtask 8.4: Mobile-optimized padding and font sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Videos Created This Week */}
        <div className="bg-gradient-to-br from-blue-950/80 to-blue-900/50 rounded-xl p-4 md:p-5 border border-blue-800/30" data-testid="videos-metric">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="text-2xl md:text-3xl">🎬</div>
            <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">VÍDEOS</div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-blue-100 mb-1">
            {metrics?.videosCreatedThisWeek || 0}
          </div>
          <div className="text-xs md:text-sm text-blue-300/80">
            Vídeos criados esta semana
          </div>
        </div>

        {/* Upload Consistency */}
        <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/50 rounded-xl p-4 md:p-5 border border-emerald-800/30" data-testid="consistency-metric">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="text-2xl md:text-3xl">📅</div>
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">CONSISTÊNCIA</div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-100 mb-1">
            {Math.round(consistencyPercentage)}%
          </div>
          <div className="text-xs md:text-sm text-emerald-300/80">
            Consistência de uploads
          </div>
          <div className="mt-2 bg-emerald-950/50 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${consistencyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Channel Growth */}
        <div className="bg-gradient-to-br from-purple-950/80 to-purple-900/50 rounded-xl p-4 md:p-5 border border-purple-800/30" data-testid="growth-metric">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="text-2xl md:text-3xl">📊</div>
            <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">CRESCIMENTO</div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl md:text-3xl font-black text-purple-100">
              {formatNumber(metrics?.channelGrowth?.subscribers || 0)}
            </div>
            <div className={`text-base md:text-lg ${getTrendColor(growthTrend)}`}>
              {getTrendIcon(growthTrend)}
            </div>
          </div>
          <div className="text-xs md:text-sm text-purple-300/80">
            Total de inscritos
          </div>
        </div>
      </div>

      {/* Performance Analysis Section - Subtask 8.4: Mobile-optimized padding */}
      {performanceAnalysis.suggestions.length > 0 && (
        <div className="mb-4 md:mb-6" data-testid="performance-analysis">
          <h3 className="text-base md:text-lg font-bold text-slate-100 mb-3 md:mb-4">Análise de Desempenho</h3>
          <div className="space-y-2 md:space-y-3">
            {performanceAnalysis.suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className={`p-3 md:p-4 rounded-xl border ${getSuggestionColor(suggestion.type)}`}
                data-testid={`suggestion-${suggestion.type}-${index}`}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="text-base md:text-lg">{getSuggestionIcon(suggestion.type)}</div>
                  <div className="flex-1">
                    <h4 className="text-sm md:text-base font-semibold mb-1">{suggestion.title}</h4>
                    <p className="text-xs md:text-sm opacity-80">{suggestion.description}</p>
                    {suggestion.actionable && (
                      <div className="mt-2">
                        <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-lg">
                          Ação Necessária
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak Counters - Subtask 8.4: Mobile-optimized padding and font sizes */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-slate-100 mb-3 md:mb-4">Sequências de Atividade</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {/* Daily Activity Streak */}
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-br from-orange-950/80 to-orange-900/50 border border-orange-800/30 rounded-xl" data-testid="daily-streak">
            <div className={`text-orange-400 text-3xl md:text-4xl ${(metrics?.streaks?.dailyActivity || 0) > 0 ? 'animate-pulse' : ''}`}>🔥</div>
            <div>
              <div className="text-xl md:text-2xl font-black text-orange-100">
                {metrics?.streaks?.dailyActivity || 0} dias
              </div>
              <div className="text-xs md:text-sm text-orange-300/80">Atividade diária</div>
            </div>
          </div>

          {/* Weekly Uploads Streak */}
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-br from-indigo-950/80 to-indigo-900/50 border border-indigo-800/30 rounded-xl" data-testid="weekly-streak">
            <div className={`text-indigo-400 text-3xl md:text-4xl ${(metrics?.streaks?.weeklyUploads || 0) > 0 ? 'animate-pulse' : ''}`}>📈</div>
            <div>
              <div className="text-xl md:text-2xl font-black text-indigo-100">
                {metrics?.streaks?.weeklyUploads || 0} semanas
              </div>
              <div className="text-xs md:text-sm text-indigo-300/80">Uploads semanais</div>
            </div>
          </div>

          {/* Content Creation Streak */}
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-br from-teal-950/80 to-teal-900/50 border border-teal-800/30 rounded-xl" data-testid="creation-streak">
            <div className={`text-teal-400 text-3xl md:text-4xl ${(metrics?.streaks?.contentCreation || 0) > 0 ? 'animate-pulse' : ''}`}>✨</div>
            <div>
              <div className="text-xl md:text-2xl font-black text-teal-100">
                {metrics?.streaks?.contentCreation || 0} dias
              </div>
              <div className="text-xs md:text-sm text-teal-300/80">Criação de conteúdo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Integration */}
      {analyticsData && (
        <div className="border-t border-slate-700/50 pt-5">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Visão Geral de Analytics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl" data-testid="analytics-views">
              <div className="text-lg font-bold text-slate-100">
                {formatNumber(analyticsData.views)}
              </div>
              <div className="text-sm text-slate-400">Visualizações</div>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl" data-testid="analytics-watch-time">
              <div className="text-lg font-bold text-slate-100">
                {Math.round((analyticsData.watchTimeMinutes || 0) / 60)}h
              </div>
              <div className="text-sm text-slate-400">Tempo assistido</div>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl" data-testid="analytics-subscribers">
              <div className="text-lg font-bold text-slate-100">
                +{analyticsData.subscribersGained || 0}
              </div>
              <div className="text-sm text-slate-400">Novos inscritos</div>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl" data-testid="analytics-engagement">
              <div className="text-lg font-bold text-slate-100">
                {Math.round(analyticsData.averageViewDuration || 0)}s
              </div>
              <div className="text-sm text-slate-400">Duração média</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {metrics?.achievements && metrics.achievements.length > 0 && (
        <div className="border-t border-slate-700/50 pt-5 mt-5">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Conquistas Recentes</h3>
          <div className="space-y-3">
            {metrics.achievements.slice(0, 3).map((achievement) => (
              <div 
                key={achievement.id} 
                className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-950/80 to-amber-900/50 border-2 border-amber-500 rounded-xl shadow-lg shadow-amber-500/20"
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-amber-100">{achievement.title}</div>
                  <div className="text-sm text-amber-300/80">{achievement.description}</div>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                  <div className="text-xs text-amber-300 font-semibold uppercase">Pontos</div>
                  <div className="text-xl font-black text-amber-100">
                    +{achievement.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </WidgetWrapper>
  );
}

export default ProgressDashboard;