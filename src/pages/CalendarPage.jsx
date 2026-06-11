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
import {
    CalendarDays, Clock, CheckCircle2, TrendingUp,
    Plus, GitBranch, Video, Loader2
} from "lucide-react";

// ─── Stat Card do Pipeline ────────────────────────────────────────────────────
function PipelineStat({ icon: Icon, label, value, accent = "neutral" }) {
    return (
        <div className={`vc-metric-card metric-${accent}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: "var(--radius-md)",
                    background: "var(--bg-elevated)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Icon size={15} style={{
                        color: accent === "coral" ? "var(--accent-coral)"
                            : accent === "amber" ? "var(--accent-amber)"
                                : accent === "teal" ? "var(--accent-teal)"
                                    : "var(--text-muted)"
                    }} />
                </div>
                <span className="vc-metric-label" style={{ marginBottom: 0 }}>{label}</span>
            </div>
            <div className="vc-metric-value">{value}</div>
        </div>
    );
}

// ─── Fila lateral redesenhada ─────────────────────────────────────────────────
function QueueSidebar({ queue, onScheduleNow, loadingScheduled }) {
    const now = new Date();

    const upcoming = queue
        .filter(v => {
            const d = new Date(v.scheduledAt || v.publishAt);
            return d > now && v.status !== "done" && v.status !== "success" && v.status !== "published";
        })
        .sort((a, b) => new Date(a.scheduledAt || a.publishAt) - new Date(b.scheduledAt || b.publishAt));

    const posted = queue.filter(v =>
        v.status === "done" || v.status === "success" || v.status === "published"
    );

    const [tab, setTab] = useState("upcoming");

    const items = tab === "upcoming" ? upcoming : posted;

    const platformDot = (p = "") => {
        const s = p.toLowerCase();
        if (s.includes("youtube")) return "youtube";
        if (s.includes("tiktok")) return "tiktok";
        if (s.includes("instagram")) return "instagram";
        return "online";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* CTA Agendar */}
            <button
                onClick={onScheduleNow}
                className="vc-btn vc-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
            >
                <Plus size={15} /> Agendar vídeo agora
            </button>

            {/* Painel de fila */}
            <div className="vc-card">
                {/* Header */}
                <div style={{
                    padding: "14px 16px 0",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 12,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <GitBranch size={14} style={{ color: "var(--accent-coral)" }} />
                        <span className="vc-metric-label" style={{ marginBottom: 0 }}>
                            Fila de uploads
                        </span>
                    </div>
                    <span className="vc-badge vc-badge-muted">
                        {queue.length} {queue.length === 1 ? "item" : "itens"}
                    </span>
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex", gap: 4,
                    padding: "0 12px 12px",
                    borderBottom: "1px solid var(--border-subtle)",
                }}>
                    {[
                        { key: "upcoming", label: "Próximos", count: upcoming.length },
                        { key: "posted", label: "Postados", count: posted.length },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                flex: 1, padding: "6px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: tab === t.key ? "var(--accent-coral-3)" : "transparent",
                                border: `1px solid ${tab === t.key ? "rgba(232,65,42,0.2)" : "transparent"}`,
                                color: tab === t.key ? "var(--accent-coral-2)" : "var(--text-muted)",
                                fontSize: "0.75rem", fontWeight: 600,
                                fontFamily: "var(--font-display)",
                                cursor: "pointer", transition: "all 0.15s",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span style={{
                                    marginLeft: 5, fontSize: "0.625rem",
                                    background: tab === t.key ? "var(--accent-coral)" : "var(--bg-elevated)",
                                    color: tab === t.key ? "#fff" : "var(--text-muted)",
                                    padding: "1px 5px", borderRadius: 10, fontWeight: 700,
                                }}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div style={{ padding: "10px 12px 14px", minHeight: 160 }}>
                    {loadingScheduled ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                            <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : items.length > 0 ? (
                        items.slice(0, 6).map((item, i) => {
                            const statusMap = {
                                agendado: "vc-badge-coral",
                                scheduled: "vc-badge-coral",
                                publicando: "vc-badge-amber",
                                processing: "vc-badge-amber",
                                done: "vc-badge-teal",
                                success: "vc-badge-teal",
                                published: "vc-badge-teal",
                                error: "vc-badge-coral",
                            };
                            const badgeClass = statusMap[item.status] || "vc-badge-muted";
                            const dot = platformDot(item.platform);

                            return (
                                <div key={item.id || i} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "9px 10px",
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--bg-tertiary)",
                                    border: "1px solid var(--border-subtle)",
                                    marginBottom: i < items.length - 1 ? 7 : 0,
                                }}>
                                    <div style={{
                                        width: 32, height: 18, borderRadius: 3, flexShrink: 0,
                                        background: "var(--bg-elevated)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Video size={12} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            margin: 0, fontSize: "0.8125rem", fontWeight: 600,
                                            fontFamily: "var(--font-display)",
                                            color: "var(--text-primary)",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            letterSpacing: "-0.01em",
                                        }}>
                                            {item.title || "Sem título"}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                            <div className={`vc-platform-dot ${dot}`} />
                                            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                                                {item.scheduledAt
                                                    ? new Date(item.scheduledAt).toLocaleString("pt-BR", {
                                                        day: "2-digit", month: "short",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })
                                                    : "—"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`vc-badge ${badgeClass}`} style={{ flexShrink: 0, fontSize: "0.5625rem" }}>
                                        {item.status === "done" || item.status === "success" || item.status === "published"
                                            ? "Publicado"
                                            : item.status === "processing" || item.status === "publicando"
                                                ? "Enviando"
                                                : "Agendado"
                                        }
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: "center", padding: "28px 0" }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: "var(--radius-md)",
                                background: "var(--bg-elevated)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 12px",
                            }}>
                                <CalendarDays size={18} style={{ color: "var(--text-muted)" }} />
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                {tab === "upcoming" ? "Nenhum vídeo agendado" : "Nenhum publicado ainda"}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {tab === "upcoming" ? "Clique em Agendar vídeo agora" : "Os publicados aparecerão aqui"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
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

    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoModalOpen, setVideoModalOpen] = useState(false);
    const [scheduledUploads, setScheduledUploads] = useState([]);
    const [loadingScheduled, setLoadingScheduled] = useState(false);

    // ── Carregar do backend ────────────────────────────────────────────────────
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

    // ── Fila combinada: backend + local (sem duplicatas) ──────────────────────
    const combinedQueue = useMemo(() => {
        const localQueue = supabase.user ? supabase.uploadQueue : state.uploadQueue;
        const backendIds = new Set(scheduledUploads.map(u => u.id));
        return [...scheduledUploads, ...localQueue.filter(item => !backendIds.has(item.id))];
    }, [supabase.user, supabase.uploadQueue, state.uploadQueue, scheduledUploads]);

    // ── Stats derivadas ────────────────────────────────────────────────────────
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const statsWeek = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        return d >= startOfWeek && d < endOfWeek;
    }).length;

    const statsToday = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        return d.toDateString() === now.toDateString();
    }).length;

    const statsUpcoming = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt);
        return d > now && v.status !== "done" && v.status !== "success" && v.status !== "published";
    }).length;

    const statsPosted = combinedQueue.filter(v =>
        v.status === "done" || v.status === "success" || v.status === "published"
    ).length;

    // ── Actions híbridas ──────────────────────────────────────────────────────
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
        setScheduleModalOpen(true);
    };

    const handleScheduleSubmit = async (videoData) => {
        await hybridActions.addToUploadQueue(videoData);
        setScheduleModalOpen(false);
        setSelectedScheduleDate(null);
    };

    const handleRescheduleVideo = async (videoId, newScheduledAt) => {
        try {
            await rescheduleUpload(videoId, newScheduledAt);
            await loadScheduledUploads();
            success("Vídeo reagendado com sucesso!");
        } catch { showError("Erro ao reagendar vídeo"); }
    };

    const handleDeleteVideo = async (videoId) => {
        const backendUpload = scheduledUploads.find(u => u.id === videoId);
        if (backendUpload) {
            try {
                await cancelScheduledUpload(videoId);
                await loadScheduledUploads();
                success("Agendamento cancelado com sucesso!");
            } catch { showError("Erro ao cancelar agendamento"); }
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
        <PageLayout maxWidth="7xl" spacing="standard">

            {/* ── Page header ───────────────────────────────────── */}
            <div style={{
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", flexWrap: "wrap",
                gap: 12, marginBottom: 20,
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <GitBranch size={18} style={{ color: "var(--accent-coral)" }} />
                        <h1 style={{
                            margin: 0,
                            fontFamily: "var(--font-display)", fontWeight: 700,
                            fontSize: "1.875rem", letterSpacing: "-0.035em",
                            color: "var(--text-primary)", lineHeight: 1,
                        }}>
                            Pipeline
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                        Agendamento e distribuição multicanal dos seus Shorts
                    </p>
                </div>

                <button
                    onClick={() => { setSelectedScheduleDate(new Date()); setScheduleModalOpen(true); }}
                    className="vc-btn vc-btn-primary"
                >
                    <Plus size={15} /> Agendar vídeo
                </button>
            </div>

            {/* ── Stats ─────────────────────────────────────────── */}
            <div className="vc-grid-metrics" style={{ marginBottom: 20 }}>
                <PipelineStat icon={CalendarDays} label="Esta semana" value={statsWeek} accent="coral" />
                <PipelineStat icon={Clock} label="Hoje" value={statsToday} accent="amber" />
                <PipelineStat icon={TrendingUp} label="Próximos" value={statsUpcoming} accent="neutral" />
                <PipelineStat icon={CheckCircle2} label="Publicados" value={statsPosted} accent="teal" />
            </div>

            {/* ── Grid principal ─────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

                {/* Calendário — mantém componente existente, envolto em card */}
                <div className="vc-card" style={{ overflow: "hidden", padding: 0 }}>
                    {/* Cabeçalho do card */}
                    <div style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        position: "relative",
                    }}>
                        {/* Traço coral no topo */}
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0,
                            height: 2, background: "var(--accent-coral)",
                        }} />
                        <div>
                            <span className="vc-metric-label" style={{ marginBottom: 2 }}>Calendário</span>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Agendamentos e histórico
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-teal)" }} />
                                Publicado
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-coral)" }} />
                                Agendado
                            </span>
                        </div>
                    </div>

                    {/* ModernCalendar — preservado sem alterações */}
                    <div style={{ padding: "0 4px 4px" }}>
                        <ModernCalendar
                            history={supabase.user ? supabase.history : state.history}
                            uploadQueue={combinedQueue}
                            onScheduleVideo={handleScheduleVideo}
                            onEditVideo={(video) => { setSelectedVideo(video); setVideoModalOpen(true); }}
                            onDeleteVideo={handleDeleteVideo}
                            onViewVideo={(video) => { setSelectedVideo(video); setVideoModalOpen(true); }}
                            loading={loadingScheduled}
                        />
                    </div>
                </div>

                {/* Sidebar — fila redesenhada */}
                <QueueSidebar
                    queue={combinedQueue}
                    onScheduleNow={() => { setSelectedScheduleDate(new Date()); setScheduleModalOpen(true); }}
                    loadingScheduled={loadingScheduled}
                />
            </div>

            {/* ── Modais ─────────────────────────────────────────── */}
            <ScheduleVideoModal
                isOpen={isScheduleModalOpen}
                onClose={() => { setScheduleModalOpen(false); setSelectedScheduleDate(null); }}
                selectedDate={selectedScheduleDate}
                onSchedule={handleScheduleSubmit}
            />

            <VideoDetailModal
                video={selectedVideo}
                isOpen={isVideoModalOpen}
                onClose={() => { setVideoModalOpen(false); setSelectedVideo(null); }}
                onReschedule={handleRescheduleVideo}
                onDelete={handleDeleteVideo}
                onEdit={actions.updateVideoMetadata}
            />
        </PageLayout>
    );
}