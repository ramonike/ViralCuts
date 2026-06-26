import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { ModernCalendar } from "../components/calendar/ModernCalendar";
import { ScheduleVideoModal } from "../components/calendar/ScheduleVideoModal";
import { VideoDetailModal } from "../components/dashboard/VideoDetailModal";
import { PageLayout } from "../components/layout/PageLayout";
import { useNotification } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { fetchScheduledUploads, rescheduleUpload, cancelScheduledUpload } from "../api/youtube";
import { CalendarDays, Clock, CheckCircle2, TrendingUp, GitBranch, Video, Loader2, RefreshCw } from "lucide-react";
import { PlatformIcon } from "../components/shared/PlatformIcon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUpload(u) {
    return {
        id: u.id,
        title: u.metadata?.title || u.fileName || u.title || "Sem título",
        description: u.metadata?.description || u.description || "",
        platform: (u.platform || u.platforms?.[0] || "youtube").toLowerCase(),
        scheduledAt: u.scheduledAt || u.publishAt || null,
        publishAt: u.scheduledAt || u.publishAt || null,
        publishedAt: u.publishedAt || null,
        privacyStatus: u.metadata?.privacyStatus || u.privacyStatus || "private",
        status: u.status || "pending",
        youtubeVideoId: u.youtubeVideoId || null,
        channelId: u.metadata?.accountId || u.accountId || u.channelId || null,
        source: "backend",
        metadata: u.metadata || {},
        platformStatuses: u.platformStatuses || [],
    };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function PipelineStat({ icon: Icon, label, value, accent = "neutral", loading }) {
    return (
        <div className={`vc-metric-card metric-${accent}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: "var(--radius-md)",
                    background: "var(--bg-elevated)",
                    display: "flex", alignItems: "center", justifyContent: "center",
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
            {loading
                ? <div style={{ height: 32, width: 40, borderRadius: 6, background: "var(--bg-elevated)", animation: "pulse 1.5s ease-in-out infinite" }} />
                : <div className="vc-metric-value">{value}</div>
            }
        </div>
    );
}

// ─── Queue Sidebar ────────────────────────────────────────────────────────────

function QueueSidebar({ queue, onScheduleNow, loading, onRefresh }) {
    const [tab, setTab] = useState("upcoming");
    const now = new Date();

    const upcoming = useMemo(() => queue
        .filter(v => {
            const d = new Date(v.scheduledAt || v.publishAt);
            const isPending = !["done", "success", "published", "completed"].includes(v.status);
            return isPending && (d > now || v.status === "pending" || v.status === "uploading");
        })
        .sort((a, b) => new Date(a.scheduledAt || a.publishAt || 0) - new Date(b.scheduledAt || b.publishAt || 0)),
        [queue]);

    const posted = useMemo(() => queue
        .filter(v => ["done", "success", "published", "completed"].includes(v.status)),
        [queue]);

    const items = tab === "upcoming" ? upcoming : posted;

    const statusLabel = (status) => {
        if (["done", "success", "published", "completed"].includes(status)) return "Publicado";
        if (["uploading", "processing"].includes(status)) return "Enviando";
        if (status === "scheduled") return "Agendado";
        return "Pendente";
    };

    const statusBadge = (status) => {
        if (["done", "success", "published", "completed"].includes(status)) return "vc-badge-teal";
        if (["uploading", "processing"].includes(status)) return "vc-badge-amber";
        if (status === "scheduled") return "vc-badge-coral";
        return "vc-badge-muted";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="vc-card">
                <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <GitBranch size={14} style={{ color: "var(--accent-coral)" }} />
                        <span className="vc-metric-label" style={{ marginBottom: 0 }}>Fila de uploads</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="vc-badge vc-badge-muted">{queue.length} {queue.length === 1 ? "item" : "itens"}</span>
                            {/* Platform breakdown */}
                            {(() => {
                                const counts = {};
                                queue.forEach(item => {
                                    const p = (item.platform || 'youtube').toLowerCase();
                                    counts[p] = (counts[p] || 0) + 1;
                                });
                                const entries = Object.entries(counts);
                                if (entries.length <= 1) return null;
                                return (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                        {entries.map(([platform, count]) => (
                                            <span key={platform} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <PlatformIcon platform={platform} size={10} />
                                                <span>{count}</span>
                                            </span>
                                        ))}
                                    </span>
                                );
                            })()}
                        </div>
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}
                            title="Atualizar fila"
                        >
                            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 4, padding: "0 12px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
                    {[
                        { key: "upcoming", label: "Próximos", count: upcoming.length },
                        { key: "posted", label: "Postados", count: posted.length },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            flex: 1, padding: "6px 8px", borderRadius: "var(--radius-sm)",
                            background: tab === t.key ? "var(--accent-coral-3)" : "transparent",
                            border: `1px solid ${tab === t.key ? "rgba(232,65,42,0.2)" : "transparent"}`,
                            color: tab === t.key ? "var(--accent-coral-2)" : "var(--text-muted)",
                            fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-display)",
                            cursor: "pointer", transition: "all 0.15s", letterSpacing: "-0.01em",
                        }}>
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

                <div style={{ padding: "10px 12px 14px", minHeight: 160 }}>
                    {/* Skeleton durante primeiro load (queue vazia + loading) */}
                    {loading && queue.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    height: 52, borderRadius: "var(--radius-md)",
                                    background: "var(--bg-tertiary)",
                                    animation: "pulse 1.5s ease-in-out infinite",
                                    animationDelay: `${i * 0.1}s`
                                }} />
                            ))}
                        </div>
                    ) : items.length > 0 ? (
                        items.slice(0, 8).map((item, i) => (
                            <div key={item.id || i} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "9px 10px", borderRadius: "var(--radius-md)",
                                background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
                                marginBottom: i < items.length - 1 ? 7 : 0,
                            }}>
                                {/* Thumbnail/ícone */}
                                <div style={{ width: 32, height: 18, borderRadius: 3, flexShrink: 0, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Video size={12} style={{ color: "var(--text-muted)" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                                        {item.title || "Sem título"}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                        <PlatformIcon platform={item.platform} size={11} />
                                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                                            {item.scheduledAt
                                                ? new Date(item.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                                                : item.publishedAt
                                                    ? new Date(item.publishedAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                                                    : "—"}
                                        </span>
                                    </div>
                                </div>
                                <span className={`vc-badge ${statusBadge(item.status)}`} style={{ flexShrink: 0, fontSize: "0.5625rem" }}>
                                    {statusLabel(item.status)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: "center", padding: "28px 0" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <CalendarDays size={18} style={{ color: "var(--text-muted)" }} />
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                {tab === "upcoming" ? "Nenhum vídeo agendado" : "Nenhum publicado ainda"}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {tab === "upcoming" ? "Clique em + Agendar para começar" : "Os publicados aparecerão aqui"}
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

    const [backendUploads, setBackendUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(false);
    // Ref para não limpar dados anteriores durante reload
    const hasFetchedRef = useRef(false);

    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoModalOpen, setVideoModalOpen] = useState(false);

    const connectedAccounts = state.auth?.connectedAccounts || [];
    const activeAccountId = state.auth?.activeAccountId;
    const [activeFilter, setActiveFilter] = useState('all');

    const channelFilter = useMemo(() => {
        return connectedAccounts.map(a => ({
            id: a.id,
            name: a.name || 'Canal',
            platform: a.platform || 'youtube',
            avatar: a.stats?.thumbnails?.default?.url || a.avatar,
        }));
    }, [connectedAccounts]);

    // ── Carrega uploads do backend ─────────────────────────────────────────
    const loadUploads = useCallback(async (silent = false) => {
        if (!silent && !hasFetchedRef.current) setLoadingUploads(true);
        else if (silent) setLoadingUploads(true);
        try {
            // Timeout de 8s para não travar o fluxo em cold start do Render
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const raw = await fetchScheduledUploads(true, 200, controller.signal);
            clearTimeout(timeoutId);
            const normalized = raw.map(normalizeUpload);
            setBackendUploads(normalized);
            hasFetchedRef.current = true;
        } catch (err) {
            if (err?.name === 'AbortError') {
                console.warn('[CalendarPage] loadUploads timeout — mantendo dados anteriores');
            } else {
                console.error('Failed to load uploads:', err);
            }
            // Mantém dados anteriores — nunca zera
        } finally {
            setLoadingUploads(false);
        }
    }, []); // sem deps — estável entre renders

    useEffect(() => { loadUploads(); }, [loadUploads]);

    // ── Queue combinada: backend é fonte única quando logado ───────────────
    const combinedQueue = useMemo(() => {
        let merged;
        if (supabase.user) {
            merged = backendUploads;
        } else {
            const localQueue = state.uploadQueue;
            const backendIds = new Set(backendUploads.map(u => u.id));
            merged = [
                ...backendUploads,
                ...localQueue.filter(item => !backendIds.has(item.id)),
            ];
        }
        if (activeFilter === 'all') return merged;
        return merged.filter(item => {
            const cid = item.channelId || item.accountId;
            if (!cid) return true; // legado sem channelId — mostra sempre
            return cid === activeFilter;
        });
    }, [backendUploads, supabase.user, state.uploadQueue, activeFilter, activeAccountId]);

    // ── Histórico filtrado por canal ───────────────────────────────────────
    const filteredHistory = useMemo(() => {
        // Mescla histórico de TODOS os canais quando filtro = 'all'
        // Cada canal tem seu próprio history em state.channelsData
        const allChannelsHistory = state.channelsData
            ? Object.entries(state.channelsData).reduce((acc, [channelId, data]) => {
                Object.entries(data.history || {}).forEach(([date, day]) => {
                    const items = (day.completedItems || []).map(item => ({
                        ...item,
                        channelId: item.channelId || channelId,
                        platform: item.platform || 'youtube',
                    }));
                    if (!acc[date]) {
                        acc[date] = { ...day, completedItems: items };
                    } else {
                        const existingIds = new Set(acc[date].completedItems.map(i => i.id));
                        const newItems = items.filter(i => !existingIds.has(i.id));
                        acc[date] = {
                            ...acc[date],
                            completedItems: [...acc[date].completedItems, ...newItems],
                        };
                    }
                });
                return acc;
            }, {})
            : {};

        // Inclui também o history do canal ativo (state.history)
        const activeHistory = state.history || {};
        const mergedYoutube = { ...allChannelsHistory };
        Object.entries(activeHistory).forEach(([date, day]) => {
            const items = (day.completedItems || []).map(item => ({
                ...item,
                channelId: item.channelId || activeAccountId,
                platform: item.platform || 'youtube',
            }));
            if (!mergedYoutube[date]) {
                mergedYoutube[date] = { ...day, completedItems: items };
            } else {
                const existingIds = new Set(mergedYoutube[date].completedItems.map(i => i.id));
                const newItems = items.filter(i => !existingIds.has(i.id));
                mergedYoutube[date] = {
                    ...mergedYoutube[date],
                    completedItems: [...mergedYoutube[date].completedItems, ...newItems],
                };
            }
        });

        // Mescla backend history (supabase.history)
        const backendHistory = (supabase.user ? supabase.history : {}) || {};
        const merged = { ...mergedYoutube };
        Object.entries(backendHistory).forEach(([date, day]) => {
            if (!merged[date]) {
                merged[date] = day;
            } else {
                const existingIds = new Set((merged[date].completedItems || []).map(i => i.id));
                const newItems = (day.completedItems || []).filter(i => !existingIds.has(i.id));
                merged[date] = {
                    ...merged[date],
                    completedItems: [...(merged[date].completedItems || []), ...newItems],
                };
            }
        });

        if (activeFilter === 'all') return merged;

        // Filtra por canal específico
        const result = {};
        Object.entries(merged).forEach(([date, day]) => {
            const items = (day.completedItems || []).filter(item => {
                const cid = item.channelId || item.accountId;
                if (!cid) return true; // legado sem channelId — mostra sempre
                return cid === activeFilter;
            });
            if (items.length > 0) result[date] = { ...day, completedItems: items, uploads: items.length };
        });
        return result;
    }, [state.history, state.channelsData, supabase.user, supabase.history, activeFilter, activeAccountId]);

    // ── Stats ──────────────────────────────────────────────────────────────
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Contar itens do histórico local como publicados também
    const historyPublishedCount = useMemo(() => {
        let count = 0;
        Object.values(filteredHistory || {}).forEach(day => {
            count += (day?.completedItems || []).length;
        });
        return count;
    }, [filteredHistory]);

    const statsWeek = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt || v.publishedAt || 0);
        return d >= startOfWeek && d < endOfWeek;
    }).length;

    const statsToday = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt || v.publishedAt || 0);
        return d.toDateString() === now.toDateString();
    }).length;

    const statsUpcoming = combinedQueue.filter(v => {
        const d = new Date(v.scheduledAt || v.publishAt || 0);
        return d > now && !["done", "success", "published", "completed"].includes(v.status);
    }).length;

    const statsPosted = combinedQueue.filter(v =>
        ["done", "success", "published", "completed"].includes(v.status)
    ).length + historyPublishedCount;

    // ── Ações ──────────────────────────────────────────────────────────────
    const handleScheduleVideo = (date) => {
        setSelectedScheduleDate(date);
        setScheduleModalOpen(true);
    };

    const handleScheduleSubmit = async (videoData) => {
        try {
            await supabase.actions.addToQueue(videoData);
            success("Vídeo agendado com sucesso!");
            // Reload silencioso em background — não bloqueia fechamento do modal
            loadUploads(true).catch(() => { });
        } catch (err) {
            // Fallback local se backend falhar
            actions.addToUploadQueue(videoData);
            showError("Erro ao agendar no servidor. Salvo localmente.");
        } finally {
            // Sempre fecha o modal, independente de erro ou timeout
            setScheduleModalOpen(false);
            setSelectedScheduleDate(null);
        }
    };

    const handleRescheduleVideo = async (videoId, newScheduledAt) => {
        try {
            await rescheduleUpload(videoId, newScheduledAt);
            await loadUploads(true);
            success("Vídeo reagendado com sucesso!");
        } catch { showError("Erro ao reagendar vídeo"); }
    };

    const handleDeleteVideo = async (videoId) => {
        const backendItem = backendUploads.find(u => u.id === videoId);
        if (backendItem) {
            try {
                await cancelScheduledUpload(videoId);
                await loadUploads(true);
                success("Agendamento cancelado com sucesso!");
            } catch { showError("Erro ao cancelar agendamento"); }
        } else {
            const localQueue = supabase.user ? supabase.uploadQueue : state.uploadQueue;
            const queueItem = localQueue.find(i => i.id === videoId);
            if (queueItem) {
                if (supabase.user) supabase.actions.removeQueueItem?.(videoId);
                else actions.removeQueueItem(videoId);
            } else {
                Object.keys(state.history).forEach(date => {
                    if (state.history[date]?.completedItems?.some(i => i.id === videoId)) {
                        actions.removeHistoryItem(date, videoId);
                    }
                });
            }
        }
    };

    const isFirstLoad = loadingUploads && !hasFetchedRef.current;

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <GitBranch size={18} style={{ color: "var(--accent-coral)" }} />
                        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.875rem", letterSpacing: "-0.035em", color: "var(--text-primary)", lineHeight: 1 }}>
                            Pipeline
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                        Agendamento e distribuição multicanal dos seus Shorts
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="vc-grid-metrics" style={{ marginBottom: 20 }}>
                <PipelineStat icon={CalendarDays} label="Esta semana" value={statsWeek} accent="coral" loading={isFirstLoad} />
                <PipelineStat icon={Clock} label="Hoje" value={statsToday} accent="amber" loading={isFirstLoad} />
                <PipelineStat icon={TrendingUp} label="Próximos" value={statsUpcoming} accent="neutral" loading={isFirstLoad} />
                <PipelineStat icon={CheckCircle2} label="Publicados" value={statsPosted} accent="teal" loading={isFirstLoad} />
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
                <div className="vc-card" style={{ overflow: "hidden", padding: 0 }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent-coral)" }} />
                        <div>
                            <span className="vc-metric-label" style={{ marginBottom: 2 }}>Calendário</span>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Agendamentos e histórico</p>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-teal)" }} /> Publicado
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-coral)" }} /> Agendado
                            </span>
                        </div>
                    </div>
                    <div style={{ padding: "0 4px 4px" }}>
                        <ModernCalendar
                            history={filteredHistory}
                            uploadQueue={combinedQueue}
                            onScheduleVideo={handleScheduleVideo}
                            onEditVideo={(video) => { setSelectedVideo(video); setVideoModalOpen(true); }}
                            onDeleteVideo={handleDeleteVideo}
                            onViewVideo={(video) => { setSelectedVideo(video); setVideoModalOpen(true); }}
                            channelFilter={channelFilter}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            loading={isFirstLoad}
                        />
                    </div>
                </div>

                <QueueSidebar
                    queue={combinedQueue}
                    onScheduleNow={() => { setSelectedScheduleDate(new Date()); setScheduleModalOpen(true); }}
                    loading={loadingUploads}
                    onRefresh={() => loadUploads(false)}
                />
            </div>

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
