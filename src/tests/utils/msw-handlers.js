/**
 * MSW Handlers for API Mocking
 * Provides mock handlers for all API endpoints
 */

import { http, HttpResponse } from 'msw';
import {
    createUser,
    createSession,
    createJourneyState,
    createUserStats,
    createUpload,
    createAchievement,
    createChannelStats,
    createVideo,
    createSettings,
} from './mock-data';

const API_URL = 'http://localhost:3001';

// ============================================
// AUTH HANDLERS
// ============================================

export const authHandlers = [
    // Sign up
    http.post(`${API_URL}/api/auth/sign-up/email`, async ({ request }) => {
        const body = await request.json();
        const user = createUser({
            email: body.email,
            name: body.name,
        });
        return HttpResponse.json({
            user,
            session: { id: 'session-1', expiresAt: new Date(Date.now() + 86400000).toISOString() },
        });
    }),

    // Sign in
    http.post(`${API_URL}/api/auth/sign-in/email`, async ({ request }) => {
        const body = await request.json();
        if (body.email === 'invalid@example.com') {
            return HttpResponse.json(
                { error: { message: 'Invalid credentials' } },
                { status: 401 }
            );
        }
        const session = createSession({ email: body.email });
        return HttpResponse.json(session);
    }),

    // Sign out
    http.post(`${API_URL}/api/auth/sign-out`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Get session
    http.get(`${API_URL}/api/auth/get-session`, () => {
        const session = createSession();
        return HttpResponse.json({ data: session });
    }),

    // Forgot password
    http.post(`${API_URL}/api/auth/forgot-password`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Reset password
    http.post(`${API_URL}/api/auth/reset-password`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Verify email
    http.post(`${API_URL}/api/auth/verify-email`, () => {
        return HttpResponse.json({ success: true });
    }),
];

// ============================================
// PROGRESS HANDLERS
// ============================================

export const progressHandlers = [
    // Get progress
    http.get(`${API_URL}/api/progress`, () => {
        const journeyState = createJourneyState();
        return HttpResponse.json(journeyState);
    }),

    // Update progress
    http.post(`${API_URL}/api/progress`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            ...createJourneyState(),
            ...body,
        });
    }),

    // Complete milestone
    http.post(`${API_URL}/api/progress/milestone`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            success: true,
            milestoneId: body.milestoneId,
            points: body.points,
        });
    }),
];

// ============================================
// UPLOADS HANDLERS
// ============================================

export const uploadsHandlers = [
    // List uploads
    http.get(`${API_URL}/api/uploads`, () => {
        const uploads = [createUpload(), createUpload(), createUpload()];
        return HttpResponse.json(uploads);
    }),

    // Add upload
    http.post(`${API_URL}/api/uploads`, async ({ request }) => {
        const body = await request.json();
        const upload = createUpload(body);
        return HttpResponse.json(upload);
    }),

    // Update upload
    http.put(`${API_URL}/api/uploads/:id`, async ({ request, params }) => {
        const body = await request.json();
        return HttpResponse.json({
            id: params.id,
            ...body,
        });
    }),

    // Delete upload
    http.delete(`${API_URL}/api/uploads/:id`, ({ params }) => {
        return HttpResponse.json({ success: true, id: params.id });
    }),
];

// ============================================
// ACHIEVEMENTS HANDLERS
// ============================================

export const achievementsHandlers = [
    // List achievements
    http.get(`${API_URL}/api/achievements`, () => {
        const achievements = [
            { achievementId: 'first-connection', unlockedAt: new Date().toISOString() },
        ];
        return HttpResponse.json(achievements);
    }),

    // Unlock achievement
    http.post(`${API_URL}/api/achievements`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            achievementId: body.achievementId,
            unlockedAt: new Date().toISOString(),
        });
    }),
];

// ============================================
// SETTINGS HANDLERS
// ============================================

export const settingsHandlers = [
    // Get settings
    http.get(`${API_URL}/api/settings`, () => {
        return HttpResponse.json(createSettings());
    }),

    // Update settings
    http.put(`${API_URL}/api/settings`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            ...createSettings(),
            ...body,
        });
    }),
];

// ============================================
// VIDEOS HANDLERS
// ============================================

export const videosHandlers = [
    // List videos
    http.get(`${API_URL}/api/videos`, () => {
        const videos = [createVideo(), createVideo(), createVideo()];
        return HttpResponse.json(videos);
    }),
];

// ============================================
// YOUTUBE API HANDLERS
// ============================================

export const youtubeHandlers = [
    // Get channel info
    http.get('https://www.googleapis.com/youtube/v3/channels', ({ request }) => {
        const url = new URL(request.url);
        const channelStats = createChannelStats();
        return HttpResponse.json({
            kind: 'youtube#channelListResponse',
            etag: 'test-etag',
            pageInfo: { totalResults: 1, resultsPerPage: 1 },
            items: [
                {
                    kind: 'youtube#channel',
                    etag: 'channel-etag',
                    id: channelStats.id,
                    snippet: {
                        title: channelStats.title,
                        description: channelStats.description,
                        customUrl: channelStats.customUrl,
                        publishedAt: channelStats.publishedAt,
                        thumbnails: channelStats.thumbnails,
                    },
                    statistics: channelStats.statistics,
                    brandingSettings: channelStats.brandingSettings,
                },
            ],
        });
    }),

    // Search videos
    http.get('https://www.googleapis.com/youtube/v3/search', () => {
        const videos = [createVideo(), createVideo()];
        return HttpResponse.json({
            kind: 'youtube#searchListResponse',
            etag: 'search-etag',
            pageInfo: { totalResults: 2, resultsPerPage: 2 },
            items: videos.map((v) => ({
                kind: 'youtube#searchResult',
                etag: `video-${v.id}-etag`,
                id: { kind: 'youtube#video', videoId: v.id },
                snippet: {
                    publishedAt: v.publishedAt,
                    channelId: 'test-channel-id',
                    title: v.title,
                    description: 'Test description',
                    thumbnails: v.thumbnails,
                    channelTitle: v.channelTitle,
                },
            })),
        });
    }),

    // Upload video
    http.post('https://www.googleapis.com/upload/youtube/v3/videos', () => {
        const video = createVideo();
        return HttpResponse.json({
            kind: 'youtube#video',
            etag: 'upload-etag',
            id: video.id,
            snippet: {
                publishedAt: video.publishedAt,
                channelId: 'test-channel-id',
                title: video.title,
                description: 'Uploaded video',
                thumbnails: video.thumbnails,
                channelTitle: video.channelTitle,
                categoryId: '22',
            },
            status: {
                uploadStatus: 'uploaded',
                privacyStatus: 'public',
                license: 'youtube',
                embeddable: true,
                publicStatsViewable: true,
                madeForKids: false,
            },
        });
    }),
];

// ============================================
// ERROR HANDLERS (for testing error scenarios)
// ============================================

export const errorHandlers = {
    // Network error
    networkError: http.get(`${API_URL}/api/progress`, () => {
        return HttpResponse.error();
    }),

    // 500 error
    serverError: http.get(`${API_URL}/api/progress`, () => {
        return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }),

    // 401 unauthorized
    unauthorized: http.get(`${API_URL}/api/progress`, () => {
        return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }),

    // 404 not found
    notFound: http.get(`${API_URL}/api/progress`, () => {
        return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
        );
    }),
};

// ============================================
// ALL HANDLERS
// ============================================

export const handlers = [
    ...authHandlers,
    ...progressHandlers,
    ...uploadsHandlers,
    ...achievementsHandlers,
    ...settingsHandlers,
    ...videosHandlers,
    ...youtubeHandlers,
];

export default handlers;
