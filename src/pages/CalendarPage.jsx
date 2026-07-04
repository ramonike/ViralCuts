import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { ModernCalendar } from "../components/calendar/ModernCalendar";
import { ScheduleVideoModal } from "../components/calendar/ScheduleVideoModal";
import { VideoDetailModal } from "../components/dashboard/VideoDetailModal";
import { PageLayout } from "../components/layout/PageLayout";
import { useNotification } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { rescheduleUpload, cancelScheduledUpload } from "../api/youtube";
import { RefreshCw, Plus } from "lucide-react";
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

    const getStatusColor = (status) => {
        if (["done","success","published","completed"].includes(status)) return 'var(--accent-teal)';
        if (status === 'scheduled') return 'var(--accent-coral)';
        return 'var(--accent-amber)';
    };

    return (
        <div className="vc-card" style={{ overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Fila de uploads{' '}
                    <span className="vc-badge vc-badge-coral" style={{ marginLeft: 6 }}>{queue.length}</span>
                </h3>
                <RefreshCw size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onRefresh} />
            </div>
            <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                    className="font-display font-medium text-xs px-5 py-2.5 border-none cursor-pointer transition-all duration-150"
                    style={{
                        color: tab === 'upcoming' ? 'var(--accent-coral)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${tab === 'upcoming' ? 'var(--accent-coral)' : 'transparent'}`,
                        background: 'transparent',
                    }}
                    onClick={() => setTab('upcoming')}
                >
                    Próximos
                </button>
                <button
                    className="font-display font-medium text-xs px-5 py-2.5 border-none cursor-pointer transition-all duration-150"
                    style={{
                        color: tab === 'posted' ? 'var(--accent-coral)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${tab === 'posted' ? 'var(--accent-coral)' : 'transparent'}`,
                        background: 'transparent',
                    }}
                    onClick={() => setTab('posted')}
                >
                    Postados
                </button>
            </div>
            {items.slice(0, 8).map((item, i) => (
                <div key={item.id || i} className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                        <PlatformIcon platform={item.platform} size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.title || "Sem título"}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)', opacity: 0.65 }}>
                            {item.scheduledAt
                                ? new Date(item.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                                : item.publishedAt
                                    ? new Date(item.publishedAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                                    : "—"}
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(item.status) }} />
                </div>
            ))}
            {items.length === 0 && (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    {tab === "upcoming" ? "Nenhum vídeo agendado" : "Nenhum publicado ainda"}
                </div>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { success, error: showError } = useNotification();
    const { theme } = useTheme();

    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
    const [scheduleInitialData, setScheduleInitialData] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoModalOpen, setVideoModalOpen] = useState(false);

    const connectedAccounts = state.auth?.connectedAccounts || [];
    const activeAccountId = state.auth?.activeAccountId;
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const draft = location.state?.pipelineDraft;
        if (!draft) return;

        setScheduleInitialData({
            title: draft.title || '',
            description: draft.description || '',
            tags: draft.tags || '',
            thumbnailUrl: draft.thumbnailUrl || '',
            script: draft.script || '',
        });
        setSelectedScheduleDate(null);
        setScheduleModalOpen(true);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const channelFilter = useMemo(() => {
        return connectedAccounts.map(a => ({
            id: a.id,
            name: a.name || 'Canal',
            platform: a.platform || 'youtube',
            avatar: a.stats?.thumbnails?.default?.url || a.avatar,
        }));
    }, [connectedAccounts]);

    // ── Queue: usa supabase.uploadQueue (mesma fonte do Dashboard) ─────────
    // Não faz fetch próprio — evita 504 em cold start do Render
    const backendUploads = useMemo(() => {
        const rawUploads = supabase.uploadQueue || state.uploadQueue || [];
        // Primeiro filtra pelo activeAccountId ANTES de normalizar
        // O useSupabaseDashboard já filtra, mas aqui garantimos filtro duplicado por segurança
        const activeId = state.auth?.activeAccountId;
        const filtered = rawUploads.filter(item => {
            const itemAccountId = item.metadata?.accountId || item.accountId || item.channelId;
            if (!itemAccountId) return true; // legado — mostra em todos
            return itemAccountId === activeId;
        });
        return filtered.map(item => ({
            ...item,
            // Garante campos normalizados
            title: item.metadata?.title || item.fileName || item.title || 'Sem título',
            platform: (item.platform || item.platforms?.[0] || 'youtube').toLowerCase(),
            scheduledAt: item.scheduledAt || item.publishAt || null,
            channelId: item.metadata?.accountId || item.accountId || item.channelId || null,
        }));
    }, [supabase.uploadQueue, state.uploadQueue, state.auth?.activeAccountId]);

    const loadingUploads = supabase.loading || false;
    const hasFetchedRef = useRef(true); // sempre true — dados vêm do supabase hook

    // Refresh manual da fila (botão de reload na sidebar)
    const loadUploads = useCallback(async (silent = false) => {
        // supabase.uploadQueue é atualizado automaticamente pelo useSupabaseDashboard
        // Não precisamos de fetch manual — apenas force re-render aguardando o hook
        await supabase.actions.reloadQueue?.();
    }, [supabase.actions]);

    // ── Títulos publicados no histórico ( usado por combinedQueue + stats ) ─
    // Precisa ser declarado antes de combinedQueue pois este filtra por esses títulos
    const publishedTitles = useMemo(() => {
        const titles = new Set();
        const allHistory = state.history || {};
        const channelsDataHistory = state.channelsData || {};
        const backendHistory = (supabase.user ? supabase.history : {}) || {};
        const allSources = [allHistory, ...Object.values(channelsDataHistory).map(d => d?.history || {}), backendHistory];
        allSources.forEach(src => {
            Object.values(src).forEach(day => {
                (day?.completedItems || []).forEach(item => {
                    if (item.title) titles.add(item.title.trim().toLowerCase());
                });
            });
        });
        return titles;
    }, [state.history, state.channelsData, supabase.user, supabase.history]);

    // ── Queue combinada: backend é sempre incluído ─────────────────────────
    const combinedQueue = useMemo(() => {
        // backendUploads já foi filtrado por activeAccountId acima
        // localQueue só adiciona itens que ainda não chegaram ao backend
        const localQueue = state.uploadQueue || [];
        const backendIds = new Set(backendUploads.map(u => u.id));
        const merged = [
            ...backendUploads,
            ...localQueue.filter(item => !backendIds.has(item.id)),
        ];

        // Remove vídeos já publicados: se o título está no histórico de publicados,
        // não deve aparecer mais como "Pendente" na fila
        // TAMBÉM remove por status publicado direto
        const filtered = merged.filter(item => {
            const isPublishedStatus = ['done', 'success', 'published', 'completed', 'scheduled'].includes(item.status);
            if (isPublishedStatus) return false; // publicados não pertencem à fila de pendentes

            const titleNormalized = item.title?.trim().toLowerCase();
            const isAlreadyInHistory = titleNormalized && publishedTitles.has(titleNormalized);
            if (isAlreadyInHistory) return false; // já está no histórico — remover da fila

            return true;
        });

        if (activeFilter === 'all') return filtered;
        return filtered.filter(item => {
            const cid = item.channelId || item.accountId;
            if (!cid) return true;
            return cid === activeFilter;
        });
    }, [backendUploads, state.uploadQueue, activeFilter, publishedTitles]);

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

        // Mescla backend history (supabase.history = tabela Video)
        // FILTRA pelo activeAccountId ANTES de mesclar
        const backendHistory = (supabase.user ? supabase.history : {}) || {};
        const merged = { ...mergedYoutube };
        Object.entries(backendHistory).forEach(([date, day]) => {
            // Filtra itens do backend history pelo canal ativo
            const filteredItems = (day.completedItems || []).filter(item => {
                const itemAccountId = item.channelId || item.accountId;
                if (!itemAccountId) return true; // legado
                return itemAccountId === activeAccountId;
            });
            if (filteredItems.length === 0) return;

            if (!merged[date]) {
                merged[date] = { ...day, completedItems: filteredItems };
            } else {
                const existingIds = new Set((merged[date].completedItems || []).map(i => i.id));
                const newItems = filteredItems.filter(i => !existingIds.has(i.id));
                merged[date] = {
                    ...merged[date],
                    completedItems: [...(merged[date].completedItems || []), ...newItems],
                };
            }
        });

        // Mescla uploads agendados/publicados do banco (tabela Upload)
            // FILTRA pelo activeAccountId
            const uploadItems = (supabase.user ? supabase.uploadQueue || [] : []);
            uploadItems.forEach(upload => {
                const uploadAccountId = upload.metadata?.accountId || upload.channelId;
                if (uploadAccountId && uploadAccountId !== activeAccountId) return;

                const dateRef = upload.scheduledAt || upload.publishedAt || upload.publishAt;
                if (!dateRef) return;
                const dateStr = new Date(dateRef).toLocaleDateString('en-CA');
                const item = {
                    id: upload.id,
                    title: upload.metadata?.title || upload.title || upload.fileName || 'Sem título',
                    type: `${upload.platform || 'youtube'}_video`,
                    platform: upload.platform || 'youtube',
                    channelId: upload.metadata?.accountId || upload.channelId || null,
                    status: upload.status,
                    thumbnail: upload.metadata?.thumbnail || null,
                    scheduledAt: upload.scheduledAt,
                    publishedAt: upload.publishedAt,
                    publishAt: upload.publishAt,
                };
                // Only consider as completed if actually published (not just scheduled)
                const isPublishedStatus = ['done', 'success', 'published', 'completed'].includes(upload.status);
                if (!merged[dateStr]) {
                    merged[dateStr] = { 
                        ...day, 
                        completedItems: isPublishedStatus ? [item] : [], 
                        uploads: isPublishedStatus ? 1 : 0 
                    };
                } else {
                    const existingIds = new Set((merged[dateStr].completedItems || []).map(i => i.id));
                    if (!existingIds.has(item.id) && isPublishedStatus) {
                        merged[dateStr] = {
                            ...merged[dateStr],
                            completedItems: [...(merged[dateStr].completedItems || []), item],
                            uploads: (merged[dateStr].uploads || 0) + 1
                        };
                    }
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
    }, [state.history, state.channelsData, supabase.user, supabase.history, supabase.uploadQueue, activeFilter, activeAccountId]);

    // ── Stats ──────────────────────────────────────────────────────────────
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Coleciona títulos publicados para evitar contar duplicados da fila que já estão no histórico (sync delay)
    // (declarado acima, antes de combinedQueue — reutiliza publishedTitles já criado)

    // Contar itens do histórico local como publicados também
    const historyPublishedCount = useMemo(() => {
        let count = 0;
        Object.values(filteredHistory || {}).forEach(day => {
            count += (day?.completedItems || []).length;
        });
        return count;
    }, [filteredHistory]);

    const statsWeek = useMemo(() => {
        return combinedQueue.filter(v => {
            const d = new Date(v.scheduledAt || v.publishAt || 0);
            const isPending = !["done", "success", "published", "completed"].includes(v.status);
            const titleNormalized = v.title?.trim().toLowerCase();
            const isAlreadyPublished = titleNormalized && publishedTitles.has(titleNormalized);
            return isPending && !isAlreadyPublished && d >= startOfWeek && d < endOfWeek;
        }).length;
    }, [combinedQueue, startOfWeek, endOfWeek, publishedTitles]);

    const statsToday = useMemo(() => {
        return combinedQueue.filter(v => {
            const d = new Date(v.scheduledAt || v.publishAt || 0);
            const isPending = !["done", "success", "published", "completed"].includes(v.status);
            const titleNormalized = v.title?.trim().toLowerCase();
            const isAlreadyPublished = titleNormalized && publishedTitles.has(titleNormalized);
            return isPending && !isAlreadyPublished && d.toDateString() === now.toDateString();
        }).length;
    }, [combinedQueue, now, publishedTitles]);

    const statsUpcoming = useMemo(() => {
        return combinedQueue.filter(v => {
            const d = new Date(v.scheduledAt || v.publishAt || 0);
            const isPending = !["done", "success", "published", "completed"].includes(v.status);
            const titleNormalized = v.title?.trim().toLowerCase();
            const isAlreadyPublished = titleNormalized && publishedTitles.has(titleNormalized);
            return isPending && !isAlreadyPublished && d > now;
        }).length;
    }, [combinedQueue, now, publishedTitles]);

    const statsPosted = useMemo(() => {
        let count = historyPublishedCount;
        combinedQueue.forEach(v => {
            if (["done", "success", "published", "completed"].includes(v.status)) {
                const titleNormalized = v.title?.trim().toLowerCase();
                const alreadyInHistory = Object.values(filteredHistory || {}).some(day =>
                    (day?.completedItems || []).some(item =>
                        item.id === v.id || (item.title?.trim().toLowerCase() === titleNormalized)
                    )
                );
                if (!alreadyInHistory) {
                    count++;
                }
            }
        });
        return count;
    }, [combinedQueue, filteredHistory, historyPublishedCount]);

    // ── Ações ──────────────────────────────────────────────────────────────
    const handleScheduleVideo = (date) => {
        setScheduleInitialData(null);
        setSelectedScheduleDate(date);
        setScheduleModalOpen(true);
    };

    const handleScheduleSubmit = async (videoData) => {
        const supabaseItem = await supabase.actions.addToQueue(videoData);
        const uploadId = supabaseItem.id;
        const platform = (videoData.platform || 'youtube').toLowerCase();

        // ── YouTube: upload client-side direto ao Google ──────────────────
        if (platform === 'youtube' && videoData.file && videoData._accessToken) {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 45000);
                let uploadUrl;
                try {
                    const initRes = await fetch(
                        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
                        {
                            signal: ctrl.signal,
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${videoData._accessToken}`,
                                'Content-Type': 'application/json',
                                'X-Upload-Content-Length': String(videoData.file.size),
                                'X-Upload-Content-Type': videoData.file.type || 'video/mp4',
                            },
                            body: JSON.stringify({
                                snippet: {
                                    title: videoData.title || '',
                                    description: videoData.description || '',
                                    tags: videoData.tags || [],
                                    categoryId: '22',
                                },
                                status: {
                                    privacyStatus: 'private',
                                    selfDeclaredMadeForKids: false,
                                    // Agendamento nativo do YouTube — ele publica no horário sem depender do nosso job
                                    ...(videoData.scheduledAt && !videoData.publishNow && {
                                        publishAt: new Date(videoData.scheduledAt).toISOString(),
                                    }),
                                },
                            }),
                        }
                    );
                    if (!initRes.ok) {
                        const errData = await initRes.json().catch(() => ({}));
                        throw new Error(errData.error?.message || `HTTP ${initRes.status}`);
                    }
                    uploadUrl = initRes.headers.get('Location');
                    if (!uploadUrl) throw new Error('YouTube não retornou URL de upload');
                } finally {
                    clearTimeout(timer);
                }

                supabase.actions.markQueueStatus(uploadId, 'uploading', { uploadProgress: 0 });

                const uploadResult = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', videoData.file.type || 'video/mp4');
                    xhr.timeout = 300000;
                    if (videoData._onProgress) {
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                videoData._onProgress(uploadId, Math.round((e.loaded / e.total) * 100));
                            }
                        };
                    }
                    xhr.onload = () => {
                        if (xhr.status === 200 || xhr.status === 201) resolve(JSON.parse(xhr.responseText));
                        else reject(new Error(`Upload falhou: HTTP ${xhr.status}`));
                    };
                    xhr.onerror = () => reject(new Error('Erro de rede no upload'));
                    xhr.ontimeout = () => reject(new Error('Upload excedeu tempo limite (5 min)'));
                    xhr.send(videoData.file);
                });

                const youtubeVideoId = uploadResult.id;

                // Awaita upload-complete para garantir DB atualizado
                try {
                    const completeRes = await fetch('/api/youtube/upload-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            uploadId,
                            youtubeVideoId,
                            scheduledAt: videoData.scheduledAt || null,
                            title: videoData.title,
                            description: videoData.description || '',
                            tags: videoData.tags || [],
                            privacyStatus: videoData.privacyStatus || 'private',
                        }),
                    });
                    if (!completeRes.ok) console.warn('[ScheduleSubmit] upload-complete HTTP', completeRes.status);
                } catch (completeErr) {
                    console.error('[ScheduleSubmit] upload-complete falhou:', completeErr.message);
                }

                supabase.actions.markQueueStatus(uploadId, 'scheduled', { youtubeVideoId, uploadProgress: 100 });
                return { ...supabaseItem, youtubeVideoId };

            } catch (err) {
                console.error('[ScheduleSubmit] YouTube upload failed:', err);
                supabase.actions.markQueueStatus(uploadId, 'failed', { errorMsg: err.message });
                throw err;
            }
        }

        // ── TikTok: salva arquivo no Storage para upload agendado ─────────
        if (platform === 'tiktok' && videoData.file) {
            try {
                supabase.actions.markQueueStatus(uploadId, 'uploading', { uploadProgress: 0 });

                const formData = new FormData();
                formData.append('file', videoData.file);
                formData.append('uploadId', uploadId);

                const storageRes = await fetch('/api/uploads/store-video', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (!storageRes.ok) {
                    const err = await storageRes.json().catch(() => ({}));
                    throw new Error(err.error || `Storage falhou: HTTP ${storageRes.status}`);
                }

                const { fileUrl } = await storageRes.json();

                await fetch(`/api/uploads/${uploadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        status: 'scheduled',
                        metadata: {
                            ...(supabaseItem.metadata || {}),
                            fileUrl,
                            title: videoData.title,
                            description: videoData.description || '',
                            tags: videoData.tags || [],
                            privacyStatus: videoData.privacyStatus || 'public',
                        },
                    }),
                });

                supabase.actions.markQueueStatus(uploadId, 'scheduled', { uploadProgress: 100 });
                return { ...supabaseItem, status: 'scheduled' };

            } catch (err) {
                console.error('[ScheduleSubmit] TikTok storage failed:', err);
                supabase.actions.markQueueStatus(uploadId, 'failed', { errorMsg: err.message });
                throw err;
            }
        }

        return supabaseItem;
    };

    const handleScheduleDone = () => {
        setScheduleModalOpen(false);
        setSelectedScheduleDate(null);
        setScheduleInitialData(null);
        success('Vídeo(s) agendado(s) com sucesso!');
        // Recarrega fila do banco para refletir status corretos (scheduled)
        supabase.actions.reloadQueue?.();
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

    const isFirstLoad = supabase.loading && backendUploads.length === 0;

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {/* Header */}
            <div className="vc-page-header">
                <div className="vc-page-header-text">
                    <h2>Pipeline</h2>
                    <p>Agendamento e distribuição multicanal dos seus Shorts.</p>
                </div>
                <div className="vc-page-actions">
                    <button className="vc-btn vc-btn-primary" onClick={() => { setScheduleInitialData(null); setSelectedScheduleDate(null); setScheduleModalOpen(true); }}>
                        <Plus size={15} />
                        Novo upload
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="vc-grid-metrics" style={{ marginBottom: 'var(--spacing-md, 16px)' }}>
                <div className="vc-metric-card metric-coral">
                    <div className="vc-metric-label">Esta semana</div>
                    <div className="vc-metric-value">{isFirstLoad ? '—' : statsWeek}</div>
                </div>
                <div className="vc-metric-card metric-amber">
                    <div className="vc-metric-label">Hoje</div>
                    <div className="vc-metric-value">{isFirstLoad ? '—' : statsToday}</div>
                </div>
                <div className="vc-metric-card metric-neutral">
                    <div className="vc-metric-label">Próximos</div>
                    <div className="vc-metric-value">{isFirstLoad ? '—' : statsUpcoming}</div>
                </div>
                <div className="vc-metric-card metric-teal">
                    <div className="vc-metric-label">Publicados</div>
                    <div className="vc-metric-value">{isFirstLoad ? '—' : statsPosted}</div>
                </div>
            </div>


            {/* Grid */}
            <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 24 }}>
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

                <QueueSidebar
                    queue={combinedQueue}
                    onScheduleNow={() => { setScheduleInitialData(null); setSelectedScheduleDate(new Date()); setScheduleModalOpen(true); }}
                    loading={loadingUploads}
                    onRefresh={() => loadUploads(false)}
                />
            </div>

            <ScheduleVideoModal
                isOpen={isScheduleModalOpen}
                onClose={() => { setScheduleModalOpen(false); setSelectedScheduleDate(null); setScheduleInitialData(null); }}
                selectedDate={selectedScheduleDate}
                initialData={scheduleInitialData}
                onSchedule={handleScheduleSubmit}
                onAllDone={handleScheduleDone}
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