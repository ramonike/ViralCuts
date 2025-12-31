import React, { useState, useEffect, useCallback } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { ModernCalendar } from "../components/calendar/ModernCalendar";
import { ScheduleVideoModal } from "../components/calendar/ScheduleVideoModal";
import { SharedUploadQueue } from "../components/shared/SharedUploadQueue";
import { VideoDetailModal } from "../components/dashboard/VideoDetailModal";
import { PageLayout } from "../components/layout/PageLayout";
import { useNotification } from "../contexts/NotificationContext";
import { fetchScheduledUploads, rescheduleUpload, cancelScheduledUpload } from "../api/youtube";

export default function CalendarPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { success, error: showError } = useNotification();
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [scheduledUploads, setScheduledUploads] = useState([]);
    const [loadingScheduled, setLoadingScheduled] = useState(false);

    // Fetch scheduled uploads from backend
    const loadScheduledUploads = useCallback(async () => {
        if (!supabase.user) return;
        
        setLoadingScheduled(true);
        try {
            const uploads = await fetchScheduledUploads(false, 100);
            // Transform uploads to match the expected format for the calendar
            const transformedUploads = uploads.map(upload => ({
                id: upload.id,
                title: upload.metadata?.title || upload.fileName || 'Untitled',
                description: upload.metadata?.description || '',
                platform: upload.platform || 'youtube',
                scheduledAt: upload.scheduledAt,
                publishAt: upload.scheduledAt,
                privacyStatus: upload.metadata?.privacyStatus || 'private',
                status: upload.status,
                youtubeVideoId: upload.youtubeVideoId,
                source: 'backend',
            }));
            setScheduledUploads(transformedUploads);
        } catch (err) {
            console.error('Failed to load scheduled uploads:', err);
        } finally {
            setLoadingScheduled(false);
        }
    }, [supabase.user]);

    // Load scheduled uploads on mount and when user changes
    useEffect(() => {
        loadScheduledUploads();
    }, [loadScheduledUploads]);

    // Combine local upload queue with backend scheduled uploads
    const combinedUploadQueue = React.useMemo(() => {
        const localQueue = supabase.user ? supabase.uploadQueue : state.uploadQueue;
        // Filter out duplicates (prefer backend data)
        const backendIds = new Set(scheduledUploads.map(u => u.id));
        const filteredLocal = localQueue.filter(item => !backendIds.has(item.id));
        return [...scheduledUploads, ...filteredLocal];
    }, [supabase.user, supabase.uploadQueue, state.uploadQueue, scheduledUploads]);

    // Hybrid actions: Use Supabase when available, fallback to localStorage
    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.addToQueue(item);
                    // Reload scheduled uploads to get the new item
                    await loadScheduledUploads();
                    success('Vídeo agendado com sucesso!');
                } catch (error) {
                    console.error('Supabase upload failed, falling back to localStorage:', error);
                    actions.addToUploadQueue(item);
                    showError('Erro ao agendar no servidor. Salvo localmente.');
                }
            } else {
                actions.addToUploadQueue(item);
            }
        },
        markQueueStatus: supabase.user ? supabase.actions.markQueueStatus : actions.markQueueStatus,
        removeQueueItem: supabase.user ? supabase.actions.removeQueueItem : actions.removeQueueItem,
    };

    const handleScheduleVideo = (date) => {
        setSelectedScheduleDate(date);
        setIsScheduleModalOpen(true);
    };

    const handleScheduleSubmit = async (videoData) => {
        await hybridActions.addToUploadQueue(videoData);
        setIsScheduleModalOpen(false);
        setSelectedScheduleDate(null);
    };

    const handleEditVideo = async (video) => {
        // If it's a backend scheduled upload, open reschedule modal
        if (video.source === 'backend') {
            setSelectedVideo(video);
            setIsVideoModalOpen(true);
        } else {
            setSelectedVideo(video);
            setIsVideoModalOpen(true);
        }
    };

    const handleRescheduleVideo = async (videoId, newScheduledAt) => {
        try {
            await rescheduleUpload(videoId, newScheduledAt);
            await loadScheduledUploads();
            success('Vídeo reagendado com sucesso!');
        } catch (err) {
            console.error('Failed to reschedule video:', err);
            showError('Erro ao reagendar vídeo');
        }
    };

    const handleDeleteVideo = async (videoId) => {
        // Check if it's a backend scheduled upload
        const backendUpload = scheduledUploads.find(u => u.id === videoId);
        
        if (backendUpload) {
            try {
                await cancelScheduledUpload(videoId);
                await loadScheduledUploads();
                success('Agendamento cancelado com sucesso!');
            } catch (err) {
                console.error('Failed to cancel scheduled upload:', err);
                showError('Erro ao cancelar agendamento');
            }
        } else {
            // Remove from local upload queue
            const queueItem = (supabase.user ? supabase.uploadQueue : state.uploadQueue)
                .find(item => item.id === videoId);
            
            if (queueItem) {
                hybridActions.removeQueueItem(videoId);
            } else {
                // Remove from history if it's posted
                Object.keys(state.history).forEach(date => {
                    const dayData = state.history[date];
                    if (dayData?.completedItems?.some(item => item.id === videoId)) {
                        actions.removeHistoryItem(date, videoId);
                    }
                });
            }
        }
    };

    const handleViewVideo = (video) => {
        setSelectedVideo(video);
        setIsVideoModalOpen(true);
    };

    return (
        <PageLayout 
            title="Calendário"
            subtitle="Gerencie seus agendamentos e acompanhe seu histórico de publicações"
            maxWidth="6xl"
        >
            {/* Main Content Grid - Layout mais equilibrado */}
            <div className="flex justify-center">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                    {/* Calendar - Ocupa 2 colunas no XL */}
                    <div className="xl:col-span-2">
                        <ModernCalendar
                            history={supabase.user ? supabase.history : state.history}
                            uploadQueue={combinedUploadQueue}
                            onScheduleVideo={handleScheduleVideo}
                            onEditVideo={handleEditVideo}
                            onDeleteVideo={handleDeleteVideo}
                            onViewVideo={handleViewVideo}
                            loading={loadingScheduled}
                        />
                    </div>

                    {/* Upload Queue - Ocupa 1 coluna no XL */}
                    <div className="xl:col-span-1">
                        <SharedUploadQueue />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ScheduleVideoModal
                isOpen={isScheduleModalOpen}
                onClose={() => {
                    setIsScheduleModalOpen(false);
                    setSelectedScheduleDate(null);
                }}
                selectedDate={selectedScheduleDate}
                onSchedule={handleScheduleSubmit}
            />

            <VideoDetailModal
                video={selectedVideo}
                isOpen={isVideoModalOpen}
                onClose={() => {
                    setIsVideoModalOpen(false);
                    setSelectedVideo(null);
                }}
                onReschedule={handleRescheduleVideo}
                onDelete={handleDeleteVideo}
                onEdit={actions.updateVideoMetadata}
            />
        </PageLayout>
    );
}