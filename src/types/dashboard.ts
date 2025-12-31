/**
 * Tipos principais do Dashboard ViralCuts
 */

// ============================================
// SETTINGS
// ============================================

export interface DashboardSettings {
    channelName: string;
    timezone: string;
    uploadTargets: string[];
    dailyGoal: number;
    ctaText: string;
    ctaLink: string;
    opusApiKey: string;
    defaultVisibility: 'public' | 'private' | 'unlisted';
    defaultCategory: string;
    defaultTags: string;
    notifyUpload: boolean;
    notifyError: boolean;
    notifyWeekly: boolean;
}

// ============================================
// UPLOAD QUEUE
// ============================================

export type UploadStatus = 'ready' | 'uploading' | 'done' | 'error' | 'scheduled';

export interface UploadQueueItem {
    id: string;
    title: string;
    source: 'manual' | 'opus' | 'import';
    platform: 'YouTube Shorts' | 'TikTok' | 'Instagram Reels';
    scheduledAt: string | null;
    status: UploadStatus;
    file: File | null;
    privacyStatus: 'public' | 'private' | 'unlisted';
    publishAt: string | null;
    description: string;
    thumbnail?: string | null;
    url?: string;
    error?: string;
}

// ============================================
// YOUTUBE AUTH
// ============================================

export interface YouTubeAccount {
    id: string;
    name: string;
    avatar: string | null;
    token: string;
    expiresAt: number;
    stats: ChannelStats | null;
}

export interface AuthState {
    youtubeToken: string | null;
    youtubeTokenExpiresAt: number | null;
    connectedAccounts: YouTubeAccount[];
    activeAccountId: string | null;
}

export interface ChannelStats {
    id: string;
    title: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
    };
    statistics: {
        viewCount: string;
        subscriberCount: string;
        hiddenSubscriberCount: boolean;
        videoCount: string;
    };
    brandingSettings?: {
        image?: {
            bannerExternalUrl?: string;
        };
    };
}

// ============================================
// CHECKLISTS
// ============================================

export interface ChecklistAction {
    type: string;
    url: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    done: boolean;
    actions?: ChecklistAction[];
}

export interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

// ============================================
// HISTORY / CALENDAR
// ============================================

export type HistoryItemType = 'youtube_video' | 'checklist_item' | 'tiktok_video';

export interface HistoryItem {
    id: string;
    title: string;
    type: HistoryItemType;
    url?: string;
    thumbnail?: string | null;
    views?: number;
    likes?: number;
    publishedAt?: string;
    timestamp?: number;
}

export interface DayHistory {
    completedItems: HistoryItem[];
    uploads: number;
    uploadedVideos?: HistoryItem[];
}

export type HistoryMap = Record<string, DayHistory>;

// ============================================
// PIPELINE (OPUS)
// ============================================

export type PipelineJobStatus = 'pending' | 'processing' | 'done' | 'error';

export interface OpusClip {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    duration?: number;
    score?: number;
}

export interface PipelineJob {
    projectId: string;
    originalName: string;
    status: PipelineJobStatus;
    clips: OpusClip[];
    createdAt?: string;
}

export interface Pipeline {
    jobs: PipelineJob[];
}

// ============================================
// ANALYTICS
// ============================================

export interface AnalyticsDataPoint {
    name: string;
    views: number;
}

export interface Analytics {
    views24h: AnalyticsDataPoint[];
}

// ============================================
// CACHE
// ============================================

export interface CacheEntry<T> {
    data: T | null;
    timestamp: number | null;
}

export interface DashboardCache {
    channelStats: CacheEntry<ChannelStats>;
    recentUploads: CacheEntry<VideoItem[]>;
    suggestions: CacheEntry<VideoItem[]>;
    analytics: CacheEntry<AnalyticsDataPoint[]>;
}

// ============================================
// VIDEOS
// ============================================

export interface VideoItem {
    id: string;
    title: string;
    publishedAt: string;
    thumbnail?: string;
    thumbnails?: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
    };
    viewCount?: number;
    likeCount?: number;
    url: string;
    channelTitle?: string;
}

// ============================================
// QUOTA
// ============================================

export interface QuotaState {
    used: number;
    limit: number;
    lastReset: number;
}

// ============================================
// CHANNEL DATA (Multi-account)
// ============================================

export interface ChannelData {
    history: HistoryMap;
    uploadQueue: UploadQueueItem[];
    suggestions: VideoItem[];
    recentUploads: VideoItem[];
    analytics: Analytics;
    channelStats: ChannelStats | null;
}

export type ChannelsDataMap = Record<string, ChannelData>;

// ============================================
// FULL STATE
// ============================================

export interface DashboardState {
    settings: DashboardSettings;
    pipeline: Pipeline;
    checklists: Checklist[];
    uploadQueue: UploadQueueItem[];
    analytics: Analytics;
    recentUploads: VideoItem[];
    suggestions: VideoItem[];
    auth: AuthState;
    channelStats: ChannelStats | null;
    history: HistoryMap;
    cache: DashboardCache;
    quotaExceeded: boolean;
    quota: QuotaState;
    channelsData: ChannelsDataMap;
}

// ============================================
// ACTIONS
// ============================================

export interface DashboardActions {
    // Checklists
    toggleItem: (checklistId: string, itemId: string) => void;
    addChecklistItem: (checklistId: string, text: string) => void;
    resetChecklist: (checklistId: string) => void;
    
    // Upload Queue
    addToUploadQueue: (item: Partial<UploadQueueItem>) => void;
    removeQueueItem: (id: string) => void;
    markQueueStatus: (id: string, status: UploadStatus) => Promise<void>;
    startUploadQueue: () => void;
    rescheduleVideo: (videoId: string, newDate: string) => void;
    updateVideoMetadata: (videoId: string, metadata: Partial<UploadQueueItem>) => void;
    
    // Settings
    updateSettings: (settings: Partial<DashboardSettings>) => void;
    
    // YouTube Auth
    setYouTubeToken: (tokenResponse: { access_token: string; expires_in: number }) => Promise<void>;
    switchAccount: (accountId: string) => void;
    disconnectAccount: (accountId: string) => void;
    refreshChannelStats: (forceRefresh?: boolean, customQuery?: string | null) => Promise<boolean>;
    
    // Pipeline
    startOpusJob: (input: string | File) => Promise<PipelineJob>;
    checkOpusJob: (jobId: string) => Promise<void>;
    removeOpusJob: (projectId: string) => void;
    
    // History
    removeHistoryItem: (date: string, videoId: string) => void;
    moveVideoInHistory: (videoId: string, fromDate: string, toDate: string) => void;
    
    // Reset
    resetState: () => void;
}

// ============================================
// HOOK RETURN TYPE
// ============================================

export interface UseDashboardStateReturn {
    state: DashboardState;
    setState: React.Dispatch<React.SetStateAction<DashboardState>>;
    actions: DashboardActions;
    
    // Direct access
    settings: DashboardSettings;
    uploadQueue: UploadQueueItem[];
    checklists: Checklist[];
    history: HistoryMap;
    pipeline: Pipeline;
    auth: AuthState;
    channelStats: ChannelStats | null;
    
    // Helpers
    helpers: {
        getChecklistProgress: (checklistId: string) => number;
        getHistoryForDate: (date: string) => DayHistory;
        getVideosForDate: (date: string) => HistoryItem[];
        getChecklistItemsForDate: (date: string) => HistoryItem[];
        getTotalUploadsForMonth: (year: number, month: number) => number;
        getJobById: (jobId: string) => PipelineJob | undefined;
        getPendingJobs: () => PipelineJob[];
        getCompletedJobs: () => PipelineJob[];
    };
}
