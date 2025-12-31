import React, { useState, useEffect } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useAnalytics, DATE_RANGE_OPTIONS } from "../hooks/useAnalytics";
import { useTheme } from "../contexts/ThemeContext";
import { analyzeBestPublishingTimes } from "../api/analytics";
import { TrendingUp, Eye, ThumbsUp, Share2, RefreshCw, Calendar } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { PerformanceChart } from "../components/analytics/PerformanceChart";
import { ViewingHeatmap } from "../components/analytics/ViewingHeatmap";
import { TopVideosTable } from "../components/analytics/TopVideosTable";
import { ExportButton } from "../components/analytics/ExportButton";
import { InsightsPanel } from "../components/analytics/InsightsPanel";

export default function AnalyticsPage() {
    const { state } = useDashboardState();
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const token = state.auth?.youtubeToken;
    
    // Use analytics hook with real data
    const {
        loading,
        error,
        period,
        channelAnalytics,
        trafficSources,
        changePeriod,
        refresh
    } = useAnalytics(token);
    
    const [refreshing, setRefreshing] = useState(false);
    const [bestTimes, setBestTimes] = useState(null);

    // Fetch best publishing times
    useEffect(() => {
        if (token && !loading) {
            analyzeBestPublishingTimes(token, period)
                .then(data => setBestTimes(data))
                .catch(err => console.error('Failed to load best times:', err));
        }
    }, [token, period, loading]);

    // Format numbers for display
    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Calculate percentage change (mock for now - would need historical data)
    const calculateChange = () => {
        // Mock calculation - in real scenario, compare with previous period
        const change = Math.random() * 20 - 5; // Random between -5% and +15%
        return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    };

    // Build stats from real analytics data
    const stats = channelAnalytics ? [
        { 
            label: "Visualizações", 
            value: formatNumber(channelAnalytics.views), 
            change: calculateChange(), 
            icon: <Eye className="w-5 h-5" /> 
        },
        { 
            label: "Tempo de Exibição", 
            value: `${formatNumber(channelAnalytics.watchTimeMinutes)}min`, 
            change: calculateChange(), 
            icon: <TrendingUp className="w-5 h-5" /> 
        },
        { 
            label: "Inscritos Ganhos", 
            value: formatNumber(channelAnalytics.subscribersGained), 
            change: calculateChange(), 
            icon: <ThumbsUp className="w-5 h-5" /> 
        },
        { 
            label: "CTR Médio", 
            value: `${channelAnalytics.impressionsCTR.toFixed(1)}%`, 
            change: calculateChange(), 
            icon: <Share2 className="w-5 h-5" /> 
        }
    ] : [
        { label: "Visualizações", value: "...", change: "...", icon: <Eye className="w-5 h-5" /> },
        { label: "Tempo de Exibição", value: "...", change: "...", icon: <TrendingUp className="w-5 h-5" /> },
        { label: "Inscritos Ganhos", value: "...", change: "...", icon: <ThumbsUp className="w-5 h-5" /> },
        { label: "CTR Médio", value: "...", change: "...", icon: <Share2 className="w-5 h-5" /> }
    ];

    const getAnalyticsData = () => {
        const days = [];
        const today = new Date();
        const fetchedData = state.analytics?.views24h || [];

        const dataMap = {};
        fetchedData.forEach(item => {
            dataMap[item.name] = item.views;
        });

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dateStr = `${day}/${month}`;

            days.push({
                name: dateStr,
                views: dataMap[dateStr] || 0
            });
        }
        return days;
    };

    const analyticsData = getAnalyticsData();
    
    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        
        // Also refresh best times
        if (token) {
            try {
                const data = await analyzeBestPublishingTimes(token, period);
                setBestTimes(data);
            } catch (err) {
                console.error('Failed to refresh best times:', err);
            }
        }
        
        setRefreshing(false);
    };

    return (
        <PageLayout 
            title="Analytics & Performance"
            subtitle="Analise o crescimento do seu conteúdo em todas as plataformas."
            maxWidth="6xl"
        >
            {/* Date Range Selector and Refresh Button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                    <select
                        value={period}
                        onChange={(e) => changePeriod(e.target.value)}
                        className={`border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 ${
                            isDark 
                                ? 'bg-slate-800 border-slate-700 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        disabled={loading}
                    >
                        {DATE_RANGE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-3">
                    <ExportButton 
                        data={channelAnalytics} 
                        period={period}
                        disabled={!channelAnalytics || loading}
                    />
                    
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <p className="font-medium">Erro ao carregar analytics</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && !channelAnalytics && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-6 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                {stat.icon}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                stat.change.startsWith('+') 
                                    ? 'text-green-400 bg-green-400/10' 
                                    : stat.change.startsWith('-')
                                    ? 'text-red-400 bg-red-400/10'
                                    : 'text-slate-400 bg-slate-400/10'
                            }`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.label}</h3>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Insights Panel */}
            <div className="mb-8">
                <InsightsPanel 
                    channelAnalytics={channelAnalytics}
                    trafficSources={trafficSources}
                    bestTimes={bestTimes}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Comparative Performance Chart */}
                <PerformanceChart 
                    data={analyticsData} 
                    period={period}
                    loading={loading}
                />
            </div>

            {/* Viewing Heatmap */}
            <div className="mb-8">
                <ViewingHeatmap loading={loading} />
            </div>

            {/* Top Videos */}
            <div className="mb-8">
                <TopVideosTable loading={loading} limit={5} />
            </div>
        </PageLayout>
    );
}
