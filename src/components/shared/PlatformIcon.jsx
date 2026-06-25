/** SVG inline por plataforma, sem dependência externa
 * 
 * Uso:
 *   <PlatformIcon platform="youtube" size={16} />
 *   <PlatformIcon platform="tiktok" size={20} showLabel />
 */

const PLATFORMS = {
    youtube: {
        label: 'YouTube',
        color: '#FF0000',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#FF0000" />
                <polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" fill="white" />
            </svg>
        ),
    },
    'youtube-shorts': {
        label: 'YouTube Shorts',
        color: '#FF0000',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#FF0000" />
                <polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" fill="white" />
            </svg>
        ),
    },
    tiktok: {
        label: 'TikTok',
        color: '#010101',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" fill="currentColor" />
            </svg>
        ),
    },
    instagram: {
        label: 'Instagram',
        color: '#E1306C',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad)" />
                <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
            </svg>
        ),
    },
    'instagram-reels': {
        label: 'Instagram Reels',
        color: '#E1306C',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="ig-reels-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-reels-grad)" />
                <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
            </svg>
        ),
    },
    facebook: {
        label: 'Facebook',
        color: '#1877F2',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#1877F2" />
                <path d="M15.5 8H13.5C13.2 8 13 8.2 13 8.5V10H15.5L15.1 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.6 11.6 5.5 13.5 5.5H15.5V8Z" fill="white" />
            </svg>
        ),
    },
    'facebook-reels': {
        label: 'Facebook Reels',
        color: '#1877F2',
        svg: (size) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#1877F2" />
                <path d="M15.5 8H13.5C13.2 8 13 8.2 13 8.5V10H15.5L15.1 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.6 11.6 5.5 13.5 5.5H15.5V8Z" fill="white" />
            </svg>
        ),
    },
};

export function PlatformIcon({ platform, size = 16, showLabel = false, className = '' }) {
    const key = (platform || 'youtube').toLowerCase();
    const config = PLATFORMS[key] || PLATFORMS['youtube'];

    if (showLabel) {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className={className}>
                {config.svg(size)}
                <span style={{ fontSize: size * 0.875, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                    {config.label}
                </span>
            </span>
        );
    }

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} className={className} title={config.label}>
            {config.svg(size)}
        </span>
    );
}

// Helper: retorna a cor da marca por plataforma
export function getPlatformColor(platform) {
    const key = (platform || 'youtube').toLowerCase();
    return PLATFORMS[key]?.color || '#FF0000';
}

// Helper: retorna o label legível
export function getPlatformLabel(platform) {
    const key = (platform || 'youtube').toLowerCase();
    return PLATFORMS[key]?.label || 'YouTube';
}