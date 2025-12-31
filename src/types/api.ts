/**
 * Tipos para respostas de API
 */

// ============================================
// GENERIC API RESPONSE
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

// ============================================
// AUTH API
// ============================================

export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    user: User;
    session: {
        id: string;
        expiresAt: string;
    };
}

export interface SignUpRequest {
    email: string;
    password: string;
    name?: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// ============================================
// YOUTUBE API
// ============================================

export interface YouTubeTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
}

export interface YouTubeChannelResponse {
    kind: string;
    etag: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        title: string;
        description: string;
        customUrl?: string;
        publishedAt: string;
        thumbnails: {
            default?: { url: string; width: number; height: number };
            medium?: { url: string; width: number; height: number };
            high?: { url: string; width: number; height: number };
        };
        localized?: {
            title: string;
            description: string;
        };
        country?: string;
    };
    statistics: {
        viewCount: string;
        subscriberCount: string;
        hiddenSubscriberCount: boolean;
        videoCount: string;
    };
    brandingSettings?: {
        channel?: {
            title: string;
            description?: string;
            keywords?: string;
        };
        image?: {
            bannerExternalUrl?: string;
        };
    };
}

export interface YouTubeVideoItem {
    kind: string;
    etag: string;
    id: string | { kind: string; videoId: string };
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            default?: { url: string; width: number; height: number };
            medium?: { url: string; width: number; height: number };
            high?: { url: string; width: number; height: number };
            standard?: { url: string; width: number; height: number };
            maxres?: { url: string; width: number; height: number };
        };
        channelTitle: string;
        tags?: string[];
        categoryId?: string;
        liveBroadcastContent?: string;
        localized?: {
            title: string;
            description: string;
        };
        resourceId?: {
            kind: string;
            videoId: string;
        };
    };
    statistics?: {
        viewCount: string;
        likeCount: string;
        dislikeCount?: string;
        favoriteCount: string;
        commentCount: string;
    };
}

export interface YouTubeUploadResponse {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: Record<string, { url: string; width: number; height: number }>;
        channelTitle: string;
        categoryId: string;
    };
    status: {
        uploadStatus: string;
        privacyStatus: string;
        license: string;
        embeddable: boolean;
        publicStatsViewable: boolean;
        madeForKids: boolean;
    };
}

// ============================================
// OPUS API
// ============================================

export interface OpusProjectResponse {
    projectId: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    originalName?: string;
    createdAt?: string;
}

export interface OpusClipResponse {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    duration?: number;
    score?: number;
    transcript?: string;
}

export interface OpusStatusResponse {
    projectId: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress?: number;
    error?: string;
}

// ============================================
// DASHBOARD API (Backend)
// ============================================

export interface DashboardDataResponse {
    settings?: {
        channel_name?: string;
        timezone?: string;
        daily_goal?: number;
        cta_text?: string;
        cta_link?: string;
    };
    queue?: Array<{
        id: string;
        title: string;
        platform: string;
        status: string;
        scheduled_at?: string;
        created_at: string;
    }>;
    history?: Array<{
        id: string;
        title: string;
        date: string;
        url?: string;
        views?: number;
        likes?: number;
    }>;
}

export interface QueueItemResponse {
    id: string;
    title: string;
    platform: string;
    status: string;
    scheduled_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// MULTI-PLATFORM TYPES
// ============================================

export type PlatformType = 'youtube' | 'tiktok' | 'instagram';

export type PlatformUploadStatusType = 'pending' | 'uploading' | 'processing' | 'published' | 'failed';

export interface PlatformUploadStatus {
    id: string;
    uploadId: string;
    platform: PlatformType;
    status: PlatformUploadStatusType;
    platformVideoId?: string;
    platformVideoUrl?: string;
    scheduledAt?: string;
    publishedAt?: string;
    error?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface Platform {
    id: PlatformType;
    name: string;
    connected: boolean;
    accountName?: string;
    avatar?: string;
}

export interface MultiPlatformUpload {
    id: string;
    videoId?: string;
    platforms: PlatformType[];
    status: string;
    scheduledAt?: string;
    publishedAt?: string;
    userId: string;
    metadata?: Record<string, unknown>;
    platformStatuses: PlatformUploadStatus[];
    createdAt: string;
    updatedAt: string;
}

export interface UploadResult {
    platform: PlatformType;
    status: 'success' | 'failed' | 'pending';
    videoId?: string;
    videoUrl?: string;
    error?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

export interface Notification {
    id: string;
    type: NotificationType;
    title?: string;
    message: string;
    action?: NotificationAction;
    duration?: number;
}
