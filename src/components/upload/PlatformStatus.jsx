import { 
    Youtube, 
    CheckCircle2, 
    Clock, 
    Loader2, 
    AlertCircle,
    ExternalLink,
    RefreshCw,
    XCircle
} from 'lucide-react';
import { Button } from '../ui/button';

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

/**
 * Platform configuration
 */
const PLATFORM_CONFIG = {
    youtube: {
        name: 'YouTube',
        icon: Youtube,
        color: 'red',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        baseUrl: 'https://youtube.com/watch?v='
    },
    tiktok: {
        name: 'TikTok',
        icon: TikTokIcon,
        color: 'cyan',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        textColor: 'text-cyan-400',
        baseUrl: 'https://tiktok.com/@user/video/'
    },
    instagram: {
        name: 'Instagram',
        icon: InstagramIcon,
        color: 'pink',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        textColor: 'text-pink-400',
        baseUrl: 'https://instagram.com/reel/'
    }
};

/**
 * Status configuration with icons and colors
 */
const STATUS_CONFIG = {
    pending: {
        label: 'Pendente',
        icon: Clock,
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400',
        iconColor: 'text-slate-400'
    },
    uploading: {
        label: 'Enviando',
        icon: Loader2,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        iconColor: 'text-blue-400',
        animate: true
    },
    processing: {
        label: 'Processando',
        icon: Loader2,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        iconColor: 'text-amber-400',
        animate: true
    },
    published: {
        label: 'Publicado',
        icon: CheckCircle2,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        iconColor: 'text-green-400'
    },
    scheduled: {
        label: 'Agendado',
        icon: Clock,
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-400',
        iconColor: 'text-purple-400'
    },
    failed: {
        label: 'Falhou',
        icon: XCircle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        iconColor: 'text-red-400'
    }
};

/**
 * PlatformStatus - Shows upload status for a single platform
 * Requirements: 3.3
 * 
 * @param {Object} props
 * @param {string} props.platform - Platform ID (youtube, tiktok, instagram)
 * @param {string} props.status - Current status
 * @param {string} props.platformVideoId - Video ID on the platform
 * @param {string} props.platformVideoUrl - Direct URL to the video
 * @param {string} props.error - Error message if failed
 * @param {Date} props.scheduledAt - Scheduled publish time
 * @param {Date} props.publishedAt - Actual publish time
 * @param {Function} props.onRetry - Callback for retry action
 * @param {boolean} props.compact - Use compact layout
 */
export function PlatformStatus({
    platform,
    status = 'pending',
    platformVideoId,
    platformVideoUrl,
    error,
    scheduledAt,
    publishedAt,
    onRetry,
    compact = false
}) {
    const platformConfig = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.youtube;
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    
    const PlatformIcon = platformConfig.icon;
    const StatusIcon = statusConfig.icon;

    // Build video URL
    const videoUrl = platformVideoUrl || (platformVideoId ? `${platformConfig.baseUrl}${platformVideoId}` : null);

    // Format dates
    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (compact) {
        return (
            <div className={`
                inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                ${statusConfig.bgColor} ${statusConfig.borderColor} border
            `}>
                <PlatformIcon className={`w-4 h-4 ${platformConfig.textColor}`} />
                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconColor} ${statusConfig.animate ? 'animate-spin' : ''}`} />
                {videoUrl && status === 'published' && (
                    <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className={`
            flex items-center justify-between p-3 rounded-xl border transition-all
            ${platformConfig.bgColor} ${platformConfig.borderColor}
        `}>
            {/* Platform Info */}
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${platformConfig.bgColor} border ${platformConfig.borderColor} flex items-center justify-center`}>
                    <PlatformIcon className={`w-5 h-5 ${platformConfig.textColor}`} />
                </div>
                
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                            {platformConfig.name}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                            ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}
                        `}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                            {statusConfig.label}
                        </span>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="text-xs text-slate-400 mt-0.5">
                        {status === 'published' && publishedAt && (
                            <span>Publicado em {formatDate(publishedAt)}</span>
                        )}
                        {status === 'scheduled' && scheduledAt && (
                            <span>Agendado para {formatDate(scheduledAt)}</span>
                        )}
                        {status === 'failed' && error && (
                            <span className="text-red-400">{error}</span>
                        )}
                        {status === 'uploading' && (
                            <span>Enviando vídeo...</span>
                        )}
                        {status === 'processing' && (
                            <span>Processando no servidor...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Link to video */}
                {videoUrl && status === 'published' && (
                    <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-blue-500/10 text-blue-400 border border-blue-500/30
                            hover:bg-blue-500/20 transition-colors
                        `}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver vídeo
                    </a>
                )}

                {/* Retry button */}
                {status === 'failed' && onRetry && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRetry(platform)}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Tentar novamente
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * PlatformStatusList - Shows status for multiple platforms
 * Requirements: 3.3
 * 
 * @param {Object} props
 * @param {Array} props.platformStatuses - Array of platform status objects
 * @param {Function} props.onRetry - Callback for retry action
 * @param {boolean} props.compact - Use compact layout
 */
export function PlatformStatusList({
    platformStatuses = [],
    onRetry,
    compact = false
}) {
    if (platformStatuses.length === 0) {
        return (
            <div className="text-center py-4 text-slate-500 text-sm">
                Nenhuma plataforma selecionada
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {platformStatuses.map((ps) => (
                    <PlatformStatus
                        key={ps.platform}
                        platform={ps.platform}
                        status={ps.status}
                        platformVideoId={ps.platformVideoId}
                        platformVideoUrl={ps.platformVideoUrl}
                        compact={true}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {platformStatuses.map((ps) => (
                <PlatformStatus
                    key={ps.platform}
                    platform={ps.platform}
                    status={ps.status}
                    platformVideoId={ps.platformVideoId}
                    platformVideoUrl={ps.platformVideoUrl}
                    error={ps.error}
                    scheduledAt={ps.scheduledAt}
                    publishedAt={ps.publishedAt}
                    onRetry={onRetry}
                />
            ))}
        </div>
    );
}

export default PlatformStatus;
