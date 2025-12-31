import { useCallback, useEffect } from "react";
import { uploadVideo } from "../api/upload";

/**
 * Hook para gerenciar a fila de uploads
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 * @param {Function} trackQuota - Função para rastrear uso de quota
 * @param {Object} notification - Objeto de notificação (opcional)
 */
export function useUploadQueue(state, setState, trackQuota, notification = null) {
    const uploadQueue = state.uploadQueue;
    const youtubeToken = state.auth?.youtubeToken;

    const addToUploadQueue = useCallback(({ 
        title, 
        source = "manual", 
        platform = "YouTube Shorts", 
        scheduledAt = null, 
        file = null, 
        privacyStatus = "private", 
        publishAt = null, 
        description = "" 
    }) => {
        const item = {
            id: `q_${Date.now()}`,
            title,
            source,
            platform,
            scheduledAt,
            status: "ready",
            file,
            privacyStatus,
            publishAt,
            description
        };
        setState(prev => ({ 
            ...prev, 
            uploadQueue: [...prev.uploadQueue, item] 
        }));
    }, [setState]);

    const removeQueueItem = useCallback((id) => {
        setState((prev) => {
            const newQueue = prev.uploadQueue.filter((q) => q.id !== id);
            const newHistory = { ...prev.history };
            let historyChanged = false;

            Object.keys(newHistory).forEach(date => {
                const dayData = newHistory[date];
                if (dayData.uploadedVideos?.some(v => v.id === id)) {
                    const newVideos = dayData.uploadedVideos.filter(v => v.id !== id);
                    newHistory[date] = {
                        ...dayData,
                        uploadedVideos: newVideos,
                        uploads: newVideos.length
                    };
                    historyChanged = true;
                }
            });

            return {
                ...prev,
                uploadQueue: newQueue,
                history: historyChanged ? newHistory : prev.history
            };
        });
    }, [setState]);

    const markQueueStatus = useCallback(async (id, status) => {
        const today = new Date().toLocaleDateString('en-CA');

        setState((prev) => ({
            ...prev,
            uploadQueue: prev.uploadQueue.map((q) =>
                q.id === id ? { ...q, status, error: undefined, url: undefined } : q
            ),
        }));

        if (status === "uploading") {
            const item = state.uploadQueue.find((q) => q.id === id);
            if (!item) return;
            
            try {
                const result = await uploadVideo(item, youtubeToken, item.file);
                trackQuota?.(1600);

                setState((prev) => {
                    const safeHistory = prev.history || {};
                    const currentHistory = safeHistory[today] || { completedItems: [], uploads: 0, uploadedVideos: [] };

                    let newUploadedVideos = currentHistory.uploadedVideos || [];
                    let newCompletedItems = currentHistory.completedItems || [];

                    if (result.status === "success") {
                        const videoEntry = {
                            id: item.id,
                            title: item.title,
                            platform: item.platform,
                            url: result.url,
                            timestamp: Date.now(),
                            type: 'youtube_video',
                            thumbnail: item.thumbnail || null,
                            views: 0
                        };

                        newUploadedVideos = [...newUploadedVideos, videoEntry];

                        if (!newCompletedItems.some(i => i.id === item.id)) {
                            newCompletedItems = [...newCompletedItems, videoEntry];
                        }
                        
                        // Notificação de sucesso
                        notification?.success?.(`"${item.title}" enviado com sucesso!`, {
                            title: 'Upload Concluído'
                        });
                    }

                    return {
                        ...prev,
                        uploadQueue: prev.uploadQueue.map((q) =>
                            q.id === id
                                ? {
                                    ...q,
                                    status: result.status === "success" ? "done" : "error",
                                    url: result.url,
                                    error: result.error,
                                }
                                : q
                        ),
                        history: result.status === "success" ? {
                            ...safeHistory,
                            [today]: {
                                ...currentHistory,
                                uploadedVideos: newUploadedVideos,
                                completedItems: newCompletedItems,
                                uploads: newUploadedVideos.length
                            }
                        } : safeHistory
                    };
                });
            } catch (err) {
                // Notificação de erro
                notification?.error?.(`Falha ao enviar "${item?.title || 'vídeo'}"`, {
                    title: 'Erro no Upload',
                    action: {
                        label: 'Tentar novamente',
                        onClick: () => markQueueStatus(id, "uploading")
                    }
                });
                
                setState((prev) => ({
                    ...prev,
                    uploadQueue: prev.uploadQueue.map((q) =>
                        q.id === id
                            ? { ...q, status: "error", error: "Erro inesperado no upload." }
                            : q
                    ),
                }));
            }
        } else if (status === "done") {
            setState((prev) => {
                const item = prev.uploadQueue.find((q) => q.id === id);
                if (!item) return prev;

                const safeHistory = prev.history || {};
                const currentHistory = safeHistory[today] || { completedItems: [], uploads: 0, uploadedVideos: [] };
                let newUploadedVideos = currentHistory.uploadedVideos || [];
                let newCompletedItems = currentHistory.completedItems || [];

                const videoEntry = {
                    id: item.id,
                    title: item.title,
                    platform: item.platform,
                    url: item.url,
                    timestamp: Date.now(),
                    type: 'youtube_video',
                    thumbnail: item.thumbnail || null,
                    views: 0
                };

                if (!newUploadedVideos.find(v => v.id === id)) {
                    newUploadedVideos = [...newUploadedVideos, videoEntry];
                }

                if (!newCompletedItems.some(i => i.id === item.id)) {
                    newCompletedItems = [...newCompletedItems, videoEntry];
                }

                return {
                    ...prev,
                    history: {
                        ...safeHistory,
                        [today]: {
                            ...currentHistory,
                            uploadedVideos: newUploadedVideos,
                            completedItems: newCompletedItems,
                            uploads: newUploadedVideos.length
                        }
                    }
                };
            });
        }
    }, [state.uploadQueue, youtubeToken, setState, trackQuota]);

    const startUploadQueue = useCallback(() => {
        state.uploadQueue.forEach((item) => {
            if (item.status === "ready" || item.status === "error") {
                markQueueStatus(item.id, "uploading");
            }
        });
    }, [state.uploadQueue, markQueueStatus]);

    const rescheduleVideo = useCallback((videoId, newDate) => {
        setState(prev => ({
            ...prev,
            uploadQueue: prev.uploadQueue.map(item =>
                item.id === videoId
                    ? { ...item, scheduledAt: new Date(newDate).toISOString() }
                    : item
            )
        }));
    }, [setState]);

    const updateVideoMetadata = useCallback((videoId, metadata) => {
        setState(prev => {
            const newQueue = prev.uploadQueue.map(item =>
                item.id === videoId ? { ...item, ...metadata } : item
            );

            const newHistory = { ...prev.history };
            Object.keys(newHistory).forEach(date => {
                const dayData = newHistory[date];
                if (dayData.completedItems) {
                    newHistory[date] = {
                        ...dayData,
                        completedItems: dayData.completedItems.map(item =>
                            item.id === videoId ? { ...item, ...metadata } : item
                        )
                    };
                }
            });

            return {
                ...prev,
                uploadQueue: newQueue,
                history: newHistory
            };
        });
    }, [setState]);

    // Polling para uploads agendados
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            uploadQueue.forEach(item => {
                if (item.status === "ready" && item.publishAt) {
                    console.log(`[AutoUpload] Triggering IMMEDIATE upload for ${item.title}`);
                    markQueueStatus(item.id, "uploading");
                    return;
                }

                if (item.status === "ready" && item.scheduledAt && !item.publishAt) {
                    const scheduledTime = new Date(item.scheduledAt);
                    if (scheduledTime <= now) {
                        console.log(`[AutoUpload] Triggering upload for ${item.title}`);
                        markQueueStatus(item.id, "uploading");
                    }
                }
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [uploadQueue, markQueueStatus]);

    return {
        uploadQueue,
        addToUploadQueue,
        removeQueueItem,
        markQueueStatus,
        startUploadQueue,
        rescheduleVideo,
        updateVideoMetadata
    };
}
