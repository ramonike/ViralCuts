import { useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { UploadCloud, FileCheck, Trash2, Clock, Calendar, CheckCircle2, RefreshCw, Youtube, ExternalLink } from 'lucide-react';

// Platform icons - using custom SVG for TikTok and Instagram
const TikTokIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
);

const InstagramIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

// Platform configuration for icons and colors
const PLATFORM_CONFIG = {
    youtube: {
        name: 'YouTube',
        icon: Youtube,
        color: 'red',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400'
    },
    tiktok: {
        name: 'TikTok',
        icon: TikTokIcon,
        color: 'cyan',
        bgColor: 'bg-cyan-500/20',
        borderColor: 'border-cyan-500/30',
        textColor: 'text-cyan-400'
    },
    instagram: {
        name: 'Instagram',
        icon: InstagramIcon,
        color: 'pink',
        bgColor: 'bg-pink-500/20',
        borderColor: 'border-pink-500/30',
        textColor: 'text-pink-400'
    }
};

// Status configuration
const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
    uploading: { label: 'Enviando', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    processing: { label: 'Processando', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    published: { label: 'Publicado', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    failed: { label: 'Falhou', color: 'text-red-400', bgColor: 'bg-red-500/20' }
};

export function UploadQueuePanel({ uploadQueue, markQueueStatus, removeQueueItem, isLoading }) {
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'posted'

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-CA');

    // Separate videos into categories
    const categorizeVideos = () => {
        const posted = [];
        const todayVideos = [];
        const upcoming = [];

        uploadQueue.forEach(item => {
            const isUploaded = item.status === 'done' || item.status === 'success';
            const hasFuturePublish = item.publishAt && new Date(item.publishAt) > new Date();

            // If uploaded BUT has a future publish date, treat as UPCOMING (Scheduled)
            if (isUploaded && !hasFuturePublish) {
                posted.push(item);
            } else if (item.scheduledAt || item.publishAt) {
                const itemDate = new Date(item.scheduledAt || item.publishAt);
                itemDate.setHours(0, 0, 0, 0);
                const itemDateStr = itemDate.toLocaleDateString('en-CA');

                if (itemDateStr === todayStr) {
                    todayVideos.push(item);
                } else if (itemDate > today) {
                    upcoming.push(item);
                }
            } else {
                todayVideos.push(item);
            }
        });

        return { posted, todayVideos, upcoming };
    };

    const { posted, todayVideos, upcoming } = categorizeVideos();

    // Group upcoming by date (next 7 days)
    const groupUpcomingByDate = () => {
        const grouped = {};
        const next7Days = [];

        // Generate next 7 days
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toLocaleDateString('en-CA');
            next7Days.push(dateStr);
            grouped[dateStr] = [];
        }

        // Assign videos to dates
        upcoming.forEach(item => {
            const itemDate = new Date(item.scheduledAt || item.publishAt);
            const itemDateStr = itemDate.toLocaleDateString('en-CA');
            if (grouped[itemDateStr]) {
                grouped[itemDateStr].push(item);
            }
        });

        return { grouped, next7Days };
    };

    const { grouped: upcomingGrouped, next7Days } = groupUpcomingByDate();

    // Render platform badges for multi-platform uploads
    const renderPlatformBadges = (q) => {
        // Support both single platform and multi-platform (platforms array)
        const platforms = q.platforms || [q.platform || 'youtube'];
        const platformStatuses = q.platformStatuses || [];

        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {platforms.map(platformId => {
                    const config = PLATFORM_CONFIG[platformId] || PLATFORM_CONFIG.youtube;
                    const Icon = config.icon;
                    const platformStatus = platformStatuses.find(ps => ps.platform === platformId);
                    const status = platformStatus?.status || q.status || 'pending';
                    const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

                    return (
                        <div
                            key={platformId}
                            className={`
                                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                                ${config.bgColor} ${config.borderColor} border
                            `}
                            title={`${config.name}: ${statusConf.label}`}
                        >
                            <Icon className={`w-3 h-3 ${config.textColor}`} />
                            <span className={statusConf.color}>{statusConf.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Handle retry for a specific platform
    const handlePlatformRetry = (uploadId, platformId) => {
        // This would trigger a retry for a specific platform
        markQueueStatus?.(uploadId, 'uploading', platformId);
    };

    const renderVideoItem = (q, showDate = false) => {
        // Support both single platform and multi-platform
        const platforms = q.platforms || [q.platform || 'youtube'];
        const platformStatuses = q.platformStatuses || [];
        const hasMultiplePlatforms = platforms.length > 1;
        const hasFailedPlatform = platformStatuses.some(ps => ps.status === 'failed');

        return (
            <div key={q.id} className="group bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-[var(--border-default)] hover:border-[var(--border-strong)] rounded-xl p-3 transition-all duration-300 hover:from-slate-700/50 hover:to-slate-600/30 hover:scale-[1.01] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl"></div>
                
                <div className="relative">
                    {/* Title and main info */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-200 text-sm truncate group-hover:text-white transition-colors" title={q.title}>
                                {q.title}
                            </p>
                            {showDate && (q.scheduledAt || q.publishAt) && (
                                <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(q.scheduledAt || q.publishAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ml-3">
                            {q.status !== "done" && q.status !== "success" && (
                                <>
                                    <Button
                                        size="icon"
                                        className="h-7 w-7 hover:bg-blue-500/20 hover:border-blue-500/30 border border-transparent transition-all"
                                        onClick={() => markQueueStatus(q.id, 'uploading')}
                                        variant="ghost"
                                        disabled={q.status === "uploading"}
                                        title="Iniciar upload"
                                    >
                                        <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-7 w-7 hover:bg-green-500/20 hover:border-green-500/30 border border-transparent transition-all"
                                        onClick={() => markQueueStatus(q.id, 'done')}
                                        variant="ghost"
                                        disabled={q.status === "uploading"}
                                        title="Marcar como concluído"
                                    >
                                        <FileCheck className="w-3.5 h-3.5 text-green-400" />
                                    </Button>
                                </>
                            )}
                            {hasFailedPlatform && (
                                <Button
                                    size="icon"
                                    className="h-7 w-7 hover:bg-amber-500/20 hover:border-amber-500/30 border border-transparent transition-all"
                                    onClick={() => handlePlatformRetry(q.id)}
                                    variant="ghost"
                                    title="Tentar novamente"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                className="h-7 w-7 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all"
                                onClick={() => removeQueueItem(q.id)}
                                variant="ghost"
                                title="Remover"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                        </div>
                    </div>

                    {/* Platform badges with status */}
                    <div className="mt-2">
                        {hasMultiplePlatforms || platformStatuses.length > 0 ? (
                            renderPlatformBadges(q)
                        ) : (
                            // Legacy single platform display
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold bg-slate-700/50 px-2 py-0.5 rounded">
                                    {q.platform || 'youtube'}
                                </span>
                                {q.status === "uploading" && (
                                    <div className="flex items-center gap-1">
                                        <div className="flex space-x-0.5">
                                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-[10px] text-blue-400 font-medium">Enviando...</span>
                                    </div>
                                )}
                                {(q.status === "done" || q.status === "success") && (
                                    <span className="text-[10px] text-green-400 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3 h-3" /> Concluído
                                    </span>
                                )}
                                {q.status === "error" && (
                                    <span className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                                        <span className="w-3 h-3 flex items-center justify-center">⚠</span> Erro
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Platform-specific status details for multi-platform */}
                    {platformStatuses.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {platformStatuses.map(ps => {
                                const config = PLATFORM_CONFIG[ps.platform] || PLATFORM_CONFIG.youtube;
                                const Icon = config.icon;
                                
                                // Show link if published
                                if (ps.status === 'published' && ps.platformVideoUrl) {
                                    return (
                                        <a
                                            key={ps.platform}
                                            href={ps.platformVideoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`
                                                inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded
                                                ${config.bgColor} ${config.textColor} hover:opacity-80 transition-opacity
                                            `}
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span>Ver no {config.name}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    );
                                }
                                
                                // Show error message if failed
                                if (ps.status === 'failed' && ps.error) {
                                    return (
                                        <div
                                            key={ps.platform}
                                            className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded"
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span className="truncate">{ps.error}</span>
                                        </div>
                                    );
                                }
                                
                                return null;
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="vc-card rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
            {/* Enhanced Header */}
            <div className="p-4 border-b border-[var(--border-default)] bg-gradient-to-r from-blue-900/20 via-cyan-900/10 to-blue-900/20 relative overflow-hidden flex-shrink-0">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <UploadCloud className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-heading-sm text-white">Fila de Uploads</h3>
                            <p className="text-caption text-blue-300">
                                Gerencie seus vídeos agendados
                            </p>
                        </div>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-6 w-16 rounded-full" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-full text-blue-300">
                                {uploadQueue.length} itens
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="p-4 space-y-4">
                    <div className="flex gap-2 border-b border-[var(--border-default)] pb-2 mb-2">
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton className="h-8 flex-1 rounded-md" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            ) : (
                <>
                    {/* Enhanced Tabs */}
                    <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex-shrink-0">
                        <button
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'upcoming'
                                ? 'bg-[var(--bg-card)] text-blue-400 border-b-2 border-blue-400 shadow-lg'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--bg-card)]'
                                }`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            <Calendar className="w-4 h-4" />
                            Próximos
                        </button>
                        <button
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'posted'
                                ? 'bg-[var(--bg-card)] text-green-400 border-b-2 border-green-400 shadow-lg'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--bg-card)]'
                                }`}
                            onClick={() => setActiveTab('posted')}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Postados ({posted.length})
                        </button>
                    </div>

                    <div className="p-4 flex-1 overflow-hidden">
                        <div className="space-y-4 h-full overflow-y-auto pr-1 custom-scrollbar">{activeTab === 'upcoming' ? (
                                <>
                                    {/* Today Section */}
                                    {todayVideos.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 sticky top-0 bg-[var(--bg-secondary)] backdrop-blur-sm py-2 z-10">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                                                    Hoje
                                                </h4>
                                                <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                                            </div>
                                            {todayVideos.map(q => renderVideoItem(q, true))}
                                        </div>
                                    )}

                                    {/* Next 7 Days */}
                                    {next7Days.map((dateStr, idx) => {
                                        const videos = upcomingGrouped[dateStr];
                                        if (videos.length === 0) return null;

                                        const date = new Date(dateStr + 'T12:00:00');
                                        const isTomorrow = idx === 0;
                                        const dayLabel = isTomorrow
                                            ? 'Amanhã'
                                            : date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });

                                        return (
                                            <div key={dateStr} className="space-y-2">
                                                <div className="flex items-center gap-2 sticky top-0 bg-[var(--bg-secondary)] backdrop-blur-sm py-2 z-10">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider capitalize">
                                                        {dayLabel}
                                                    </h4>
                                                    <div className="flex-1 h-px bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {videos.map(q => renderVideoItem(q, true))}
                                            </div>
                                        );
                                    })}

                                    {todayVideos.length === 0 && upcoming.length === 0 && (
                                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-card)]">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">Nenhum vídeo agendado</p>
                                            <p className="text-xs mt-1 opacity-70">Agende uploads pelo calendário</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Posted Videos */}
                                    {posted.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider">
                                                    Vídeos Publicados
                                                </h4>
                                                <div className="flex-1 h-px bg-gradient-to-r from-green-400/50 to-transparent"></div>
                                            </div>
                                            {posted.map(q => renderVideoItem(q, false))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-card)]">
                                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">Nenhum vídeo postado ainda</p>
                                            <p className="text-xs mt-1 opacity-70">Seus vídeos publicados aparecerão aqui</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
