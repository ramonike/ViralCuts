import { useState, useEffect } from 'react';
import { 
    Youtube, 
    CheckCircle2, 
    AlertCircle,
    Link2,
    Link2Off
} from 'lucide-react';

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
 * Platform configuration with metadata
 */
const PLATFORMS = [
    {
        id: 'youtube',
        name: 'YouTube',
        icon: Youtube,
        color: 'red',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        hoverBg: 'hover:bg-red-500/20',
        selectedBg: 'bg-red-500/20',
        selectedBorder: 'border-red-400',
        description: 'Vídeos e Shorts'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: TikTokIcon,
        color: 'slate',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400',
        hoverBg: '',
        selectedBg: 'bg-slate-500/20',
        selectedBorder: 'border-slate-400',
        description: 'Em breve'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: InstagramIcon,
        color: 'pink',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        textColor: 'text-pink-400',
        hoverBg: 'hover:bg-pink-500/20',
        selectedBg: 'bg-pink-500/20',
        selectedBorder: 'border-pink-400',
        description: 'Reels até 90s'
    }
];

/**
 * PlatformSelector - Component for selecting multiple upload destinations
 * Requirements: 3.2
 * 
 * @param {Object} props
 * @param {Array} props.availablePlatforms - Platforms with connection status
 * @param {Array} props.selectedPlatforms - Currently selected platform IDs
 * @param {Function} props.onSelectionChange - Callback when selection changes
 * @param {boolean} props.disabled - If the selector is disabled
 * @param {boolean} props.showConnectionStatus - Show connection status indicators
 */
export function PlatformSelector({
    availablePlatforms = [],
    selectedPlatforms = [],
    onSelectionChange,
    disabled = false,
    showConnectionStatus = true
}) {
    // Merge platform config with availability data
    const platforms = PLATFORMS.map(platform => {
        const available = availablePlatforms.find(p => p.id === platform.id);
        return {
            ...platform,
            connected: available?.connected ?? false,
            accountName: available?.accountName,
            avatar: available?.avatar
        };
    });

    const handleToggle = (platformId) => {
        if (disabled) return;
        
        const platform = platforms.find(p => p.id === platformId);
        if (!platform?.connected) return;

        const isSelected = selectedPlatforms.includes(platformId);
        let newSelection;
        
        if (isSelected) {
            newSelection = selectedPlatforms.filter(id => id !== platformId);
        } else {
            newSelection = [...selectedPlatforms, platformId];
        }
        
        onSelectionChange?.(newSelection);
    };

    const selectedCount = selectedPlatforms.length;
    const connectedCount = platforms.filter(p => p.connected).length;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-white">
                    Publicar em
                </label>
                <span className="text-xs text-slate-400">
                    {selectedCount} de {connectedCount} selecionadas
                </span>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {platforms.map(platform => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isDisabled = disabled || !platform.connected;

                    return (
                        <button
                            key={platform.id}
                            type="button"
                            onClick={() => handleToggle(platform.id)}
                            disabled={isDisabled}
                            className={`
                                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                                ${isSelected
                                    ? `${platform.selectedBg} ${platform.selectedBorder} ring-2 ring-offset-2 ring-offset-slate-900 ring-${platform.color}-500/30`
                                    : `${platform.bgColor} ${platform.borderColor} ${platform.hoverBg}`
                                }
                                ${isDisabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer hover:scale-[1.02]'
                                }
                            `}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle2 className={`w-5 h-5 ${platform.textColor}`} />
                                </div>
                            )}

                            {/* Platform Icon */}
                            <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${platform.textColor}`} />
                            </div>

                            {/* Platform Info */}
                            <div className="text-center">
                                <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                    {platform.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {platform.description}
                                </div>
                            </div>

                            {/* Connection Status */}
                            {showConnectionStatus && (
                                <div className={`
                                    flex items-center gap-1.5 text-xs px-2 py-1 rounded-full
                                    ${platform.connected 
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                        : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                                    }
                                `}>
                                    {platform.connected ? (
                                        <>
                                            <Link2 className="w-3 h-3" />
                                            <span className="truncate max-w-[80px]">
                                                {platform.accountName || 'Conectado'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Link2Off className="w-3 h-3" />
                                            <span>Não conectado</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Warning if no platforms connected */}
            {connectedCount === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Nenhuma plataforma conectada. Vá em Configurações para conectar suas contas.</span>
                </div>
            )}

            {/* Warning if no platforms selected */}
            {connectedCount > 0 && selectedCount === 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Selecione pelo menos uma plataforma para publicar.</span>
                </div>
            )}
        </div>
    );
}

export default PlatformSelector;
