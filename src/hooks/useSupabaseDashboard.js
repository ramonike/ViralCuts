import { useEffect, useState } from 'react';
import { api } from '../lib/api-client';

/**
 * Hook that syncs dashboard state with Secure Go Backend
 */
export function useSupabaseDashboard() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [history, setHistory] = useState({});
    const [settings, setSettings] = useState(null);

    // Load data from Backend
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Check Session
                const sessionData = await api.getSession().catch(() => null);
                if (!sessionData?.user) {
                    setLoading(false);
                    return;
                }
                setUser(sessionData.user);

                // Load Dashboard Data
                const data = await api.getDashboardData();

                if (data.settings) setSettings(data.settings);
                if (data.queue) setUploadQueue(data.queue);

                // Process History
                const historyByDate = {};
                (data.history || []).forEach(video => {
                    // Normalize date string (remove time if present)
                    const dateStr = video.date.split('T')[0];
                    if (!historyByDate[dateStr]) {
                        historyByDate[dateStr] = {
                            completedItems: [],
                            uploads: 0
                        };
                    }
                    historyByDate[dateStr].completedItems.push({
                        id: video.id,
                        title: video.title,
                        type: 'youtube_video',
                        url: video.url,
                        views: video.views || 0,
                        likes: video.likes || 0
                    });
                    historyByDate[dateStr].uploads += 1;
                });
                setHistory(historyByDate);

            } catch (error) {
                console.error('Error loading data from Backend:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Save settings
    const saveSettings = async (newSettings) => {
        try {
            await api.updateSettings(newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    // Add to upload queue
    const addToQueue = async (item) => {
        try {
            const res = await api.addToQueue(item);
            const newItem = { ...item, id: res.id, status: res.status };
            setUploadQueue(prev => [...prev, newItem]);
            return newItem;
        } catch (error) {
            console.error('Error adding to queue:', error);
            throw error;
        }
    };

    // Update queue item status (Local only for now, or implement PATCH endpoint)
    // TODO: Implement PATCH /api/queue/:id
    const updateQueueStatus = async (itemId, status, updates = {}) => {
        // Optimistic update
        setUploadQueue(prev =>
            prev.map(item => item.id === itemId ? { ...item, status, ...updates } : item)
        );
        return { id: itemId, status, ...updates };
    };

    // Remove from queue
    const removeFromQueue = async (itemId) => {
        try {
            await api.deleteQueueItem(itemId);
            setUploadQueue(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing from queue:', error);
            throw error;
        }
    };

    // Add to video history
    const addToHistory = async (date, video) => {
        // TODO: Implement POST /api/history
        console.warn("addToHistory backend endpoint not yet implemented");
        return { id: `temp_${Date.now()}`, ...video };
    };

    return {
        user,
        loading,
        uploadQueue,
        history,
        settings,
        actions: {
            saveSettings,
            addToQueue,
            updateQueueStatus,
            removeFromQueue,
            addToHistory,
        }
    };
}
