/**
 * TopVideosTable Component
 * Displays top performing videos with metrics
 * Requirements: 3.3
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Eye, ThumbsUp, MessageSquare, TrendingUp, ExternalLink } from 'lucide-react';
import { useDashboardState } from '../../hooks/useDashboardState';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Format number for display
 */
function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

export function TopVideosTable({ videos: propVideos, sortBy = 'views', limit = 5, loading = false }) {
    const [currentSort, setCurrentSort] = useState(sortBy);
    const { state } = useDashboardState();
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Use provided videos, or get from state (recentUploads), or empty array
    const recentVideos = state.recentUploads || [];
    
    // Map recentUploads to the expected format
    const mappedVideos = recentVideos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || video.thumbnails?.medium?.url || video.thumbnails?.default?.url || 'https://via.placeholder.com/120x68/1e293b/3b82f6?text=Video',
        views: video.viewCount || 0,
        likes: video.likeCount || 0,
        comments: video.commentCount || 0,
        ctr: 0, // CTR requires YouTube Analytics API
        retention: 0, // Retention requires YouTube Analytics API
        url: video.url || `https://youtube.com/watch?v=${video.id}`
    }));
    
    let videos = propVideos || mappedVideos;
    
    // If no videos available, show empty state
    if (videos.length === 0) {
        return (
            <div className={`rounded-xl overflow-hidden ${isDark ? 'vc-card' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`p-4 border-b ${isDark ? 'border-[var(--border-default)]' : 'border-gray-200'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Top {limit} Vídeos
                    </h3>
                </div>
                <div className="p-8 text-center">
                    <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Nenhum vídeo encontrado no canal.</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Os vídeos aparecerão aqui quando você tiver uploads no canal.</p>
                </div>
            </div>
        );
    }
    
    // Sort videos based on current sort option
    const sortedVideos = [...videos].sort((a, b) => {
        switch (currentSort) {
            case 'views':
                return b.views - a.views;
            case 'ctr':
                return b.ctr - a.ctr;
            case 'retention':
                return b.retention - a.retention;
            case 'engagement':
                return (b.likes + b.comments) - (a.likes + a.comments);
            default:
                return 0;
        }
    }).slice(0, limit);

    if (loading) {
        return (
            <div className={`rounded-xl overflow-hidden ${isDark ? 'vc-card' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`p-4 border-b ${isDark ? 'border-[var(--border-default)]' : 'border-gray-200'}`}>
                    <div className={`h-6 rounded animate-pulse w-48 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                </div>
                <div className="p-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4 mb-4 animate-pulse">
                            <div className={`w-32 h-18 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                            <div className="flex-1">
                                <div className={`h-4 rounded w-3/4 mb-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-xl overflow-hidden ${isDark ? 'vc-card' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[var(--border-default)]' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Top {limit} Vídeos
                    </h3>
                    
                    {/* Sort selector */}
                    <select
                        value={currentSort}
                        onChange={(e) => setCurrentSort(e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${
                            isDark 
                                ? 'bg-slate-800 border-slate-700 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                        <option value="views">Por Visualizações</option>
                        <option value="ctr">Por CTR</option>
                        <option value="retention">Por Retenção</option>
                        <option value="engagement">Por Engajamento</option>
                    </select>
                </div>
            </div>

            <div className="p-4">
                {sortedVideos.map((video, index) => (
                    <div 
                        key={video.id}
                        className={`flex gap-4 mb-4 last:mb-0 p-3 rounded-lg transition-colors group ${
                            isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                        }`}
                    >
                        {/* Rank badge */}
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500' : ''}
                                ${index === 1 ? 'bg-slate-400/20 text-slate-300 border-2 border-slate-400' : ''}
                                ${index === 2 ? 'bg-orange-600/20 text-orange-400 border-2 border-orange-600' : ''}
                                ${index > 2 ? 'bg-slate-700/50 text-slate-400' : ''}
                            `}>
                                {index + 1}
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                            <img 
                                src={video.thumbnail} 
                                alt={video.title}
                                className="w-32 h-18 object-cover rounded-lg border border-slate-700"
                            />
                        </div>

                        {/* Video info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {video.title}
                                </h4>
                                <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex-shrink-0 p-1 hover:text-blue-400 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
                                    title="Abrir no YouTube"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Metrics */}
                            <div className={`flex flex-wrap gap-4 mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(video.views)}</span>
                                    <span>views</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(video.likes)}</span>
                                    <span>likes</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(video.comments)}</span>
                                    <span>comentários</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{video.ctr.toFixed(1)}%</span>
                                    <span>CTR</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{video.retention.toFixed(1)}%</span>
                                    <span>retenção</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Total de visualizações dos top {limit}: <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatNumber(sortedVideos.reduce((sum, v) => sum + v.views, 0))}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default TopVideosTable;
