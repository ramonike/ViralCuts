import { useCallback, useEffect } from "react";
import { fetchChannelDetails, fetchChannelVideos, fetchChannelAnalytics, searchVideos } from "../api/youtube";

/**
 * Sincroniza vídeos do YouTube com o histórico do calendário
 */
function syncVideosToCalendar(videos, currentHistory) {
    const newHistory = { ...currentHistory };
    const videosByDate = {};

    videos.forEach(video => {
        const publishDate = new Date(video.publishedAt);
        const localDateStr = publishDate.toLocaleDateString('en-CA');

        if (!videosByDate[localDateStr]) {
            videosByDate[localDateStr] = [];
        }
        videosByDate[localDateStr].push({
            id: video.id,
            title: video.title,
            type: 'youtube_video',
            url: video.url,
            thumbnail: video.thumbnail,
            views: video.viewCount || 0,
            publishedAt: video.publishedAt
        });
    });

    Object.keys(videosByDate).forEach(date => {
        const existingDay = newHistory[date] || { completedItems: [], uploads: 0 };
        const otherItems = (existingDay.completedItems || []).filter(item => item.type !== 'youtube_video');
        const newCompletedItems = [...otherItems, ...videosByDate[date]];

        newHistory[date] = {
            ...existingDay,
            completedItems: newCompletedItems,
            uploads: videosByDate[date].length
        };
    });

    return newHistory;
}

/**
 * Hook para gerenciar autenticação e contas do YouTube
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 * @param {Function} trackQuota - Função para rastrear uso de quota
 */
export function useYouTubeAuth(state, setState, trackQuota) {
    const auth = state.auth;
    const channelStats = state.channelStats;

    const setYouTubeToken = useCallback(async (tokenResponse) => {
        const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
        const token = tokenResponse.access_token;

        if (!token) {
            setState(prev => ({
                ...prev,
                auth: { ...prev.auth, youtubeToken: null, activeAccountId: null }
            }));
            return;
        }

        let stats = null;
        try {
            stats = await fetchChannelDetails(token);
            if (stats) trackQuota?.(1);
        } catch (e) {
            console.error("Failed to fetch initial stats", e);
        }

        if (!stats && !token.startsWith("MOCK_TOKEN")) {
            console.error("Aborting account addition: Could not fetch channel details.");
            alert("Não foi possível obter os detalhes do canal. Verifique a cota da API ou tente novamente.");
            return;
        }

        const accountId = stats?.id || `mock_account_${Date.now()}`;

        const newAccount = {
            id: accountId,
            name: stats?.title || "Novo Canal",
            avatar: stats?.thumbnails?.default?.url || null,
            token: token,
            expiresAt: expiresAt,
            stats: stats
        };

        setState(prev => {
            const existingIndex = prev.auth.connectedAccounts.findIndex(a => a.id === accountId);
            let newConnectedAccounts = [...prev.auth.connectedAccounts];

            if (existingIndex >= 0) {
                newConnectedAccounts[existingIndex] = newAccount;
            } else {
                newConnectedAccounts.push(newAccount);
            }

            const currentChannelsData = { ...prev.channelsData };
            if (prev.auth.activeAccountId) {
                currentChannelsData[prev.auth.activeAccountId] = {
                    history: prev.history,
                    uploadQueue: prev.uploadQueue,
                    suggestions: prev.suggestions,
                    recentUploads: prev.recentUploads,
                    analytics: prev.analytics,
                    channelStats: prev.channelStats
                };
            }

            let newChannelData;
            if (existingIndex === -1) {
                newChannelData = {
                    history: {},
                    uploadQueue: [],
                    suggestions: [],
                    recentUploads: [],
                    analytics: { views24h: [] },
                    channelStats: stats
                };
                currentChannelsData[accountId] = newChannelData;
            } else {
                newChannelData = currentChannelsData[accountId] || {
                    history: {},
                    uploadQueue: [],
                    suggestions: [],
                    recentUploads: [],
                    analytics: { views24h: [] },
                    channelStats: stats
                };
            }

            return {
                ...prev,
                auth: {
                    ...prev.auth,
                    youtubeToken: token,
                    youtubeTokenExpiresAt: expiresAt,
                    connectedAccounts: newConnectedAccounts,
                    activeAccountId: accountId
                },
                channelsData: currentChannelsData,
                history: newChannelData.history || {},
                uploadQueue: newChannelData.uploadQueue || [],
                suggestions: newChannelData.suggestions || [],
                recentUploads: newChannelData.recentUploads || [],
                analytics: newChannelData.analytics || { views24h: [] },
                channelStats: stats || newChannelData.channelStats || prev.channelStats
            };
        });
    }, [setState, trackQuota]);

    const switchAccount = useCallback((accountId) => {
        setState(prev => {
            const account = prev.auth.connectedAccounts.find(a => a.id === accountId);
            if (!account) return prev;

            const currentChannelsData = { ...prev.channelsData };
            if (prev.auth.activeAccountId) {
                currentChannelsData[prev.auth.activeAccountId] = {
                    history: prev.history,
                    uploadQueue: prev.uploadQueue,
                    suggestions: prev.suggestions,
                    recentUploads: prev.recentUploads,
                    analytics: prev.analytics,
                    channelStats: prev.channelStats
                };
            }

            const targetChannelData = currentChannelsData[accountId] || {
                history: {},
                uploadQueue: [],
                suggestions: [],
                recentUploads: [],
                analytics: { views24h: [] },
                channelStats: account.stats
            };

            return {
                ...prev,
                auth: {
                    ...prev.auth,
                    youtubeToken: account.token,
                    youtubeTokenExpiresAt: account.expiresAt,
                    activeAccountId: account.id
                },
                channelsData: currentChannelsData,
                history: targetChannelData.history || {},
                uploadQueue: targetChannelData.uploadQueue || [],
                suggestions: targetChannelData.suggestions || [],
                recentUploads: targetChannelData.recentUploads || [],
                analytics: targetChannelData.analytics || { views24h: [] },
                channelStats: account.stats || targetChannelData.channelStats || prev.channelStats
            };
        });
    }, [setState]);

    const disconnectAccount = useCallback((accountId) => {
        setState(prev => {
            const newConnectedAccounts = prev.auth.connectedAccounts.filter(a => a.id !== accountId);

            let newActiveId = prev.auth.activeAccountId;
            let newToken = prev.auth.youtubeToken;
            let newExpires = prev.auth.youtubeTokenExpiresAt;
            let newStats = prev.channelStats;
            let newHistory = prev.history;
            let newQueue = prev.uploadQueue;
            let newSuggestions = prev.suggestions;
            let newRecent = prev.recentUploads;
            let newAnalytics = prev.analytics;

            if (accountId === prev.auth.activeAccountId) {
                if (newConnectedAccounts.length > 0) {
                    const nextAccount = newConnectedAccounts[0];
                    newActiveId = nextAccount.id;
                    newToken = nextAccount.token;
                    newExpires = nextAccount.expiresAt;
                    newStats = nextAccount.stats;

                    const nextData = prev.channelsData[nextAccount.id] || {};
                    newHistory = nextData.history || {};
                    newQueue = nextData.uploadQueue || [];
                    newSuggestions = nextData.suggestions || [];
                    newRecent = nextData.recentUploads || [];
                    newAnalytics = nextData.analytics || { views24h: [] };
                } else {
                    newActiveId = null;
                    newToken = null;
                    newExpires = null;
                    newStats = null;
                    newHistory = {};
                    newQueue = [];
                    newSuggestions = [];
                    newRecent = [];
                    newAnalytics = { views24h: [] };
                }
            }

            return {
                ...prev,
                auth: {
                    ...prev.auth,
                    connectedAccounts: newConnectedAccounts,
                    activeAccountId: newActiveId,
                    youtubeToken: newToken,
                    youtubeTokenExpiresAt: newExpires
                },
                channelStats: newStats,
                history: newHistory,
                uploadQueue: newQueue,
                suggestions: newSuggestions,
                recentUploads: newRecent,
                analytics: newAnalytics
            };
        });
    }, [setState]);

    const refreshChannelStats = useCallback(async (forceRefresh = false, customQuery = null) => {
        if (!auth.youtubeToken) return;

        const CACHE_DURATION = 60 * 60 * 1000;
        const now = Date.now();

        const shouldUseCache = !forceRefresh && !customQuery && state.cache?.channelStats?.timestamp &&
            (now - state.cache.channelStats.timestamp) < CACHE_DURATION;

        if (shouldUseCache) {
            console.log("[refreshChannelStats] Using cached data");
            return true;
        }

        try {
            console.log("[refreshChannelStats] Fetching fresh data (Parallel)");

            let queryToUse = customQuery;
            if (!queryToUse) {
                const queries = ["curiosidades mundo", "ciência tecnologia", "fatos históricos", "animais incríveis", "mistérios universo"];
                queryToUse = queries[Math.floor(Math.random() * queries.length)];
            }

            const results = await Promise.allSettled([
                fetchChannelDetails(auth.youtubeToken),
                fetchChannelVideos(auth.youtubeToken),
                searchVideos(auth.youtubeToken, queryToUse)
            ]);

            const stats = results[0].status === 'fulfilled' ? results[0].value : null;
            const videos = results[1].status === 'fulfilled' ? results[1].value : null;
            const suggestions = results[2].status === 'fulfilled' ? results[2].value : null;

            const quotaError = results.some(r =>
                r.status === 'rejected' && r.reason?.message && /quota/i.test(r.reason.message)
            );

            if (quotaError) {
                console.warn("YouTube API quota exceeded. Switching to fallback mode.");
                setState(prev => ({ ...prev, quotaExceeded: true }));

                try {
                    const mockStats = stats || await fetchChannelDetails("MOCK_TOKEN").catch(() => null);
                    const mockVideos = videos || await fetchChannelVideos("MOCK_TOKEN").catch(() => []);
                    const mockSuggestions = suggestions || await searchVideos("MOCK_TOKEN", queryToUse).catch(() => []);

                    setState(prev => {
                        const newHistory = mockVideos ? syncVideosToCalendar(mockVideos, prev.history) : prev.history;

                        return {
                            ...prev,
                            channelStats: mockStats || prev.channelStats,
                            recentUploads: mockVideos || prev.recentUploads,
                            suggestions: mockSuggestions || prev.suggestions,
                            history: newHistory,
                            quotaExceeded: true,
                            cache: {
                                ...prev.cache,
                                channelStats: mockStats ? { data: mockStats, timestamp: now } : prev.cache.channelStats,
                                recentUploads: mockVideos ? { data: mockVideos, timestamp: now } : prev.cache.recentUploads,
                                suggestions: mockSuggestions ? { data: mockSuggestions, timestamp: now } : prev.cache.suggestions
                            }
                        };
                    });
                } catch (mockError) {
                    console.error("Failed to load MOCK fallback data:", mockError);
                    setState(prev => ({ ...prev, quotaExceeded: true }));
                }

                return true;
            }

            trackQuota?.(110);

            setState(prev => {
                const newHistory = videos ? syncVideosToCalendar(videos, prev.history) : prev.history;

                return {
                    ...prev,
                    channelStats: stats || prev.channelStats,
                    recentUploads: videos || prev.recentUploads,
                    suggestions: suggestions || prev.suggestions,
                    history: newHistory,
                    quotaExceeded: false,
                    cache: {
                        ...prev.cache,
                        channelStats: stats ? { data: stats, timestamp: now } : prev.cache.channelStats,
                        recentUploads: videos ? { data: videos, timestamp: now } : prev.cache.recentUploads,
                        suggestions: suggestions ? { data: suggestions, timestamp: now } : prev.cache.suggestions
                    }
                };
            });

            return true;
        } catch (e) {
            console.error("Failed to refresh stats", e);

            if (e.message && /quota/i.test(e.message)) {
                setState(prev => ({ ...prev, quotaExceeded: true }));

                if (state.cache?.channelStats?.data) {
                    setState(prev => ({
                        ...prev,
                        channelStats: prev.cache.channelStats.data,
                        recentUploads: prev.cache.recentUploads?.data || prev.recentUploads,
                        suggestions: prev.cache.suggestions?.data || prev.suggestions,
                    }));
                } else {
                    try {
                        const mockStats = await fetchChannelDetails("MOCK_TOKEN");
                        const mockVideos = await fetchChannelVideos("MOCK_TOKEN");
                        const mockSuggestions = await searchVideos("MOCK_TOKEN", "mock query");

                        if (mockStats) {
                            setState(prev => ({
                                ...prev,
                                channelStats: mockStats,
                                recentUploads: mockVideos || [],
                                suggestions: mockSuggestions || [],
                            }));
                        }
                    } catch (mockErr) {
                        console.error("Failed to load mock fallback", mockErr);
                    }
                }
            }

            return false;
        }
    }, [auth.youtubeToken, state.cache, setState, trackQuota]);

    // Auto-fetch quando token muda
    useEffect(() => {
        if (auth.youtubeToken) {
            fetchChannelDetails(auth.youtubeToken)
                .then(stats => {
                    if (stats) {
                        setState(prev => ({ ...prev, channelStats: stats }));
                    }
                })
                .catch(err => console.error("Error fetching stats:", err));

            fetchChannelVideos(auth.youtubeToken)
                .then(videos => {
                    if (videos) {
                        setState(prev => {
                            const newHistory = syncVideosToCalendar(videos, prev.history);
                            return { ...prev, recentUploads: videos, history: newHistory };
                        });
                    }
                })
                .catch(err => console.error("Error fetching videos:", err));

            fetchChannelAnalytics(auth.youtubeToken)
                .then(data => {
                    if (data?.length > 0) {
                        setState(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, views24h: data }
                        }));
                    }
                })
                .catch(err => console.error("Error fetching analytics:", err));

            searchVideos(auth.youtubeToken, "podcast ciência curiosidades")
                .then(videos => {
                    if (videos) {
                        setState(prev => ({ ...prev, suggestions: videos }));
                    }
                })
                .catch(err => console.error("Error fetching suggestions:", err));
        } else {
            setState(prev => ({ ...prev, channelStats: null }));
        }
    }, [auth.youtubeToken, setState]);

    return {
        auth,
        channelStats,
        connectedAccounts: auth.connectedAccounts,
        activeAccountId: auth.activeAccountId,
        youtubeToken: auth.youtubeToken,
        setYouTubeToken,
        switchAccount,
        disconnectAccount,
        refreshChannelStats
    };
}
