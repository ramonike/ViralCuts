import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { ModernCalendar } from "../components/calendar/ModernCalendar";
import { ScheduleVideoModal } from "../components/calendar/ScheduleVideoModal";
import { UploadQueuePanel } from "../components/dashboard/UploadQueuePanel";
import { VideoDetailModal } from "../components/dashboard/VideoDetailModal";
import { PageLayout } from "../components/layout/PageLayout";
import { useNotification } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { fetchScheduledUploads, rescheduleUpload, cancelScheduledUpload } from "../api/youtube";
import { CalendarDays, Clock, CheckCircle2, TrendingUp, Plus } from "lucide-react";

// ─── Resumo semanal ───────────────────────────────────────────────────────────
function WeeklySummary({ queue, isDark }) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const thisWeek = queue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        return d >= startOfWeek && d < endOfWeek;
    });

    const posted = queue.filter(v => v.status === "done" || v.status === "success" || v.status === "published");
    const upcoming = queue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        return d > now && v.status !== "done" && v.status !== "success";
    });
    const today = queue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        const t = new Date();
        return d.toDateString() === t.toDateString();
    });

    const items = [
        { icon: <CalendarDays className="w-4 h-4 text-primary" />, label: "Esta semana", value: thisWeek.length, bg: "bg-primary/10 border-primary/20" },
        { icon: <Clock className="w-4 h-4 text-amber-400" />, label: "Hoje", value: today.length, bg: "bg-amber-500/10 border-amber-500/20" },
        { icon: <TrendingUp className="w-4 h-4 text-blue-400" />, label: "Próximos", value: upcoming.length, bg: "bg-blue-500/10 border-blue-500/20" },
        { icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, label: "Publicados", value: posted.length, bg: "bg-green-500/10 border-green-500/20" },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {items.map((item, i) => (
                <div key={i} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${item.bg} ${isDark ? "" : "bg-opacity-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-surface-800/60" : "bg-white/60"}`}>
                        {item.icon}
                    </div>
                    <div>
                        <p className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>{item.value}</p>
                        <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-500"}`}>{item.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { success, error: showError } = useNotification();
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [scheduledUploads, setScheduledUploads] = useState([]);
    const [loadingScheduled, setLoadingScheduled] = useState(false);

    // Carrega uploads agendados do backend
    const loadScheduledUploads = useCallback(async () => {
        if (!supabase.user) return;
        setLoadingScheduled(true);
        try {
            const uploads = await fetchScheduledUploads(false, 100);
            setScheduledUploads(uploads.map(u => ({
                id: u.id,
                title: u.metadata?.title || u.fileName || "Sem título",
                description: u.metadata?.description || "",
                platform: u.platform || "youtube",
                scheduledAt: u.scheduledAt,
                publishAt: u.scheduledAt,
                privacyStatus: u.metadata?.privacyStatus || "private",
                status: u.status,
                youtubeVideoId: u.youtubeVideoId,
                source: "backend",
            })));
        } catch (err) {
            console.error("Failed to load scheduled uploads:", err);
        } finally {
            setLoadingScheduled(false);
        }
    }, [supabase.user]);

    useEffect(() => { loadScheduledUploads(); }, [loadScheduledUploads]);

    // Fila combinada: backend + local (sem duplicatas)
    const combinedQueue = useMemo(() => {
        const localQueue = supabase.user ? supabase.uploadQueue : state.uploadQueue;
        const backendIds = new Set(scheduledUploads.map(u => u.id));
        return [...scheduledUploads, ...localQueue.filter(item => !backendIds.has(item.id))];
    }, [supabase.user, supabase.uploadQueue, state.uploadQueue, scheduledUploads]);

    // Actions híbridas
    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.addToQueue(item);
                    await loadScheduledUploads();
                    success("Vídeo agendado com sucesso!");
                } catch {
                    actions.addToUploadQueue(item);
                    showError("Erro ao agendar no servidor. Salvo localmente.");
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

    const handleEditVideo = (video) => {
        setSelectedVideo(video);
        setIsVideoModalOpen(true);
    };

    const handleRescheduleVideo = async (videoId, newScheduledAt) => {
        try {
            await rescheduleUpload(videoId, newScheduledAt);
            await loadScheduledUploads();
            success("Vídeo reagendado com sucesso!");
        } catch {
            showError("Erro ao reagendar vídeo");
        }
    };

    const handleDeleteVideo = async (videoId) => {
        const backendUpload = scheduledUploads.find(u => u.id === videoId);
        if (backendUpload) {
            try {
                await cancelScheduledUpload(videoId);
                await loadScheduledUploads();
                success("Agendamento cancelado com sucesso!");
            } catch {
                showError("Erro ao cancelar agendamento");
            }
        } else {
            const queueItem = (supabase.user ? supabase.uploadQueue : state.uploadQueue).find(i => i.id === videoId);
            if (queueItem) {
                hybridActions.removeQueueItem(videoId);
            } else {
                Object.keys(state.history).forEach(date => {
                    if (state.history[date]?.completedItems?.some(i => i.id === videoId)) {
                        actions.removeHistoryItem(date, videoId);
                    }
                });
            }
        }
    };

    return (
        <PageLayout
            title="Calendário"
            subtitle="Agende publicações e acompanhe seu histórico de posts."
            maxWidth="7xl"
        >
            {/* Resumo semanal */}
            <WeeklySummary queue={combinedQueue} isDark={isDark} />

            {/* Grid principal */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Calendário — 2/3 da tela */}
                <div className="xl:col-span-2">
                    <ModernCalendar
                        history={supabase.user ? supabase.history : state.history}
                        uploadQueue={combinedQueue}
                        onScheduleVideo={handleScheduleVideo}
                        onEditVideo={handleEditVideo}
                        onDeleteVideo={handleDeleteVideo}
                        onViewVideo={(video) => { setSelectedVideo(video); setIsVideoModalOpen(true); }}
                        loading={loadingScheduled}
                    />
                </div>

                {/* Fila de uploads — 1/3 da tela */}
                <div className="xl:col-span-1">
                    {/* Botão de agendar rápido */}
                    <button
                        onClick={() => { setSelectedScheduleDate(new Date()); setIsScheduleModalOpen(true); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors mb-4"
                    >
                        <Plus className="w-4 h-4" />
                        Agendar vídeo agora
                    </button>

                    {/* Fila — sem passar isLoading do supabase (causa skeleton infinito) */}
                    <UploadQueuePanel
                        uploadQueue={combinedQueue}
                        markQueueStatus={hybridActions.markQueueStatus}
                        removeQueueItem={hybridActions.removeQueueItem}
                        isLoading={loadingScheduled}
                    />
                </div>
            </div>

            {/* Modais */}
            <ScheduleVideoModal
                isOpen={isScheduleModalOpen}
                onClose={() => { setIsScheduleModalOpen(false); setSelectedScheduleDate(null); }}
                selectedDate={selectedScheduleDate}
                onSchedule={handleScheduleSubmit}
            />

            <VideoDetailModal
                video={selectedVideo}
                isOpen={isVideoModalOpen}
                onClose={() => { setIsVideoModalOpen(false); setSelectedVideo(null); }}
                onReschedule={handleRescheduleVideo}
                onDelete={handleDeleteVideo}
                onEdit={actions.updateVideoMetadata}
            />
        </PageLayout>
    );
}
