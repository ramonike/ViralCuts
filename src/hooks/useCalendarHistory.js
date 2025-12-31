import { useCallback } from "react";

/**
 * Hook para gerenciar histórico do calendário
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 */
export function useCalendarHistory(state, setState) {
    const history = state.history;

    const removeHistoryItem = useCallback((date, videoId) => {
        setState((prev) => {
            const safeHistory = prev.history || {};
            const dayData = safeHistory[date];
            if (!dayData || !dayData.uploadedVideos) return prev;

            const newVideos = dayData.uploadedVideos.filter(v => v.id !== videoId);

            return {
                ...prev,
                history: {
                    ...safeHistory,
                    [date]: {
                        ...dayData,
                        uploadedVideos: newVideos,
                        uploads: newVideos.length
                    }
                }
            };
        });
    }, [setState]);

    const moveVideoInHistory = useCallback((videoId, fromDate, toDate) => {
        setState(prev => {
            const safeHistory = prev.history || {};
            const fromDayData = safeHistory[fromDate];

            if (!fromDayData || !fromDayData.completedItems) return prev;

            const videoToMove = fromDayData.completedItems.find(item => item.id === videoId);
            if (!videoToMove) return prev;

            const newFromDayItems = fromDayData.completedItems.filter(item => item.id !== videoId);
            const toDayData = safeHistory[toDate] || { completedItems: [], uploads: 0 };
            const newToDayItems = [...(toDayData.completedItems || []), videoToMove];

            return {
                ...prev,
                history: {
                    ...safeHistory,
                    [fromDate]: {
                        ...fromDayData,
                        completedItems: newFromDayItems,
                        uploads: newFromDayItems.filter(i => i.type === 'youtube_video').length
                    },
                    [toDate]: {
                        ...toDayData,
                        completedItems: newToDayItems,
                        uploads: newToDayItems.filter(i => i.type === 'youtube_video').length
                    }
                }
            };
        });
    }, [setState]);

    const getHistoryForDate = useCallback((date) => {
        return history[date] || { completedItems: [], uploads: 0, uploadedVideos: [] };
    }, [history]);

    const getVideosForDate = useCallback((date) => {
        const dayData = history[date];
        if (!dayData) return [];
        
        return (dayData.completedItems || []).filter(item => item.type === 'youtube_video');
    }, [history]);

    const getChecklistItemsForDate = useCallback((date) => {
        const dayData = history[date];
        if (!dayData) return [];
        
        return (dayData.completedItems || []).filter(item => item.type === 'checklist_item');
    }, [history]);

    const getTotalUploadsForMonth = useCallback((year, month) => {
        let total = 0;
        
        Object.keys(history).forEach(date => {
            const [dateYear, dateMonth] = date.split('-').map(Number);
            if (dateYear === year && dateMonth === month) {
                total += history[date].uploads || 0;
            }
        });
        
        return total;
    }, [history]);

    return {
        history,
        removeHistoryItem,
        moveVideoInHistory,
        getHistoryForDate,
        getVideosForDate,
        getChecklistItemsForDate,
        getTotalUploadsForMonth
    };
}
