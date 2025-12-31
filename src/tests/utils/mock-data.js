/**
 * Mock Data Factories for Testing
 * Provides consistent, realistic test data for all entities
 */

let idCounter = 0;
const generateId = () => `test-id-${++idCounter}`;

/**
 * Reset ID counter (call in beforeEach)
 */
export function resetIdCounter() {
    idCounter = 0;
}

// ============================================
// USER FACTORIES
// ============================================

/**
 * Create a mock user
 */
export function createUser(overrides = {}) {
    const id = generateId();
    return {
        id,
        email: `user-${id}@example.com`,
        name: `Test User ${id}`,
        image: null,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock session
 */
export function createSession(userOverrides = {}) {
    const user = createUser(userOverrides);
    return {
        user,
        session: {
            id: generateId(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
    };
}

// ============================================
// VIDEO FACTORIES
// ============================================

/**
 * Create a mock video item
 */
export function createVideo(overrides = {}) {
    const id = generateId();
    return {
        id,
        title: `Test Video ${id}`,
        publishedAt: new Date().toISOString(),
        thumbnail: `https://example.com/thumb-${id}.jpg`,
        thumbnails: {
            default: { url: `https://example.com/thumb-${id}-default.jpg` },
            medium: { url: `https://example.com/thumb-${id}-medium.jpg` },
            high: { url: `https://example.com/thumb-${id}-high.jpg` },
        },
        viewCount: Math.floor(Math.random() * 10000),
        likeCount: Math.floor(Math.random() * 500),
        url: `https://youtube.com/watch?v=${id}`,
        channelTitle: 'Test Channel',
        ...overrides,
    };
}

/**
 * Create multiple videos
 */
export function createVideos(count = 5, overrides = {}) {
    return Array.from({ length: count }, () => createVideo(overrides));
}

// ============================================
// UPLOAD FACTORIES
// ============================================

/**
 * Create a mock upload queue item
 */
export function createUpload(overrides = {}) {
    const id = generateId();
    return {
        id,
        title: `Upload ${id}`,
        source: 'manual',
        platform: 'YouTube Shorts',
        scheduledAt: null,
        status: 'ready',
        file: null,
        privacyStatus: 'public',
        publishAt: null,
        description: `Description for upload ${id}`,
        thumbnail: null,
        url: null,
        error: null,
        ...overrides,
    };
}

/**
 * Create upload with specific status
 */
export function createUploadWithStatus(status, overrides = {}) {
    return createUpload({ status, ...overrides });
}

/**
 * Create multiple uploads
 */
export function createUploads(count = 3, overrides = {}) {
    return Array.from({ length: count }, () => createUpload(overrides));
}

// ============================================
// JOURNEY FACTORIES
// ============================================

/**
 * Create a mock journey state
 */
export function createJourneyState(overrides = {}) {
    return {
        currentStage: 'setup',
        completedMilestones: [],
        progressPercentage: 0,
        experienceLevel: 'beginner',
        onboardingCompleted: false,
        lastActiveDate: new Date(),
        isFirstLogin: true,
        ...overrides,
    };
}

/**
 * Create journey state with progress
 */
export function createJourneyStateWithProgress(completedMilestones = [], overrides = {}) {
    return createJourneyState({
        completedMilestones,
        progressPercentage: Math.min(completedMilestones.length * 10, 100),
        isFirstLogin: false,
        ...overrides,
    });
}

/**
 * Create a mock milestone
 */
export function createMilestone(overrides = {}) {
    const id = generateId();
    return {
        id: `milestone-${id}`,
        title: `Milestone ${id}`,
        description: `Complete milestone ${id}`,
        completed: false,
        category: 'setup',
        points: 100,
        actionUrl: '/settings',
        ...overrides,
    };
}

/**
 * Create a mock journey stage
 */
export function createStage(overrides = {}) {
    const id = generateId();
    return {
        id: `stage-${id}`,
        name: `Stage ${id}`,
        description: `Description for stage ${id}`,
        icon: '🚀',
        order: 1,
        estimatedTime: 15,
        difficulty: 'easy',
        unlocked: true,
        milestones: [createMilestone(), createMilestone()],
        ...overrides,
    };
}

// ============================================
// ACHIEVEMENT FACTORIES
// ============================================

/**
 * Create a mock achievement
 */
export function createAchievement(overrides = {}) {
    const id = generateId();
    return {
        id: `achievement-${id}`,
        title: `Achievement ${id}`,
        description: `Unlock achievement ${id}`,
        icon: '🏆',
        category: 'setup',
        points: 100,
        rarity: 'common',
        unlockedAt: null,
        ...overrides,
    };
}

/**
 * Create an unlocked achievement
 */
export function createUnlockedAchievement(overrides = {}) {
    return createAchievement({
        unlockedAt: new Date(),
        ...overrides,
    });
}

// ============================================
// USER STATS FACTORIES
// ============================================

/**
 * Create mock user stats
 */
export function createUserStats(overrides = {}) {
    return {
        videosCreated: 0,
        toolsUsed: [],
        channelOptimizationScore: 0,
        daysActive: 0,
        totalPoints: 0,
        achievements: [],
        currentStreak: 0,
        ...overrides,
    };
}

/**
 * Create user stats with achievements
 */
export function createUserStatsWithAchievements(achievementCount = 2, overrides = {}) {
    const achievements = Array.from({ length: achievementCount }, () =>
        createUnlockedAchievement()
    );
    return createUserStats({
        achievements,
        totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
        ...overrides,
    });
}

// ============================================
// CHANNEL STATS FACTORIES
// ============================================

/**
 * Create mock channel stats
 */
export function createChannelStats(overrides = {}) {
    const id = generateId();
    return {
        id,
        title: `Test Channel ${id}`,
        description: 'A test YouTube channel',
        customUrl: `@testchannel${id}`,
        publishedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnails: {
            default: { url: 'https://example.com/avatar-default.jpg' },
            medium: { url: 'https://example.com/avatar-medium.jpg' },
            high: { url: 'https://example.com/avatar-high.jpg' },
        },
        statistics: {
            viewCount: '100000',
            subscriberCount: '1000',
            hiddenSubscriberCount: false,
            videoCount: '50',
        },
        brandingSettings: {
            image: {
                bannerExternalUrl: 'https://example.com/banner.jpg',
            },
        },
        ...overrides,
    };
}

// ============================================
// YOUTUBE ACCOUNT FACTORIES
// ============================================

/**
 * Create a mock YouTube account
 */
export function createYouTubeAccount(overrides = {}) {
    const id = generateId();
    return {
        id,
        name: `YouTube Account ${id}`,
        avatar: `https://example.com/avatar-${id}.jpg`,
        token: `mock-token-${id}`,
        expiresAt: Date.now() + 3600 * 1000,
        stats: createChannelStats(),
        ...overrides,
    };
}

// ============================================
// CHECKLIST FACTORIES
// ============================================

/**
 * Create a mock checklist item
 */
export function createChecklistItem(overrides = {}) {
    const id = generateId();
    return {
        id,
        text: `Checklist item ${id}`,
        done: false,
        actions: [],
        ...overrides,
    };
}

/**
 * Create a mock checklist
 */
export function createChecklist(overrides = {}) {
    const id = generateId();
    return {
        id,
        title: `Checklist ${id}`,
        items: [createChecklistItem(), createChecklistItem(), createChecklistItem()],
        ...overrides,
    };
}

// ============================================
// SETTINGS FACTORIES
// ============================================

/**
 * Create mock dashboard settings
 */
export function createSettings(overrides = {}) {
    return {
        channelName: 'Test Channel',
        timezone: 'America/Sao_Paulo',
        uploadTargets: ['YouTube Shorts'],
        dailyGoal: 1,
        ctaText: 'Subscribe!',
        ctaLink: 'https://youtube.com',
        opusApiKey: '',
        defaultVisibility: 'public',
        defaultCategory: '22',
        defaultTags: 'test, video',
        notifyUpload: true,
        notifyError: true,
        notifyWeekly: false,
        ...overrides,
    };
}

// ============================================
// API RESPONSE FACTORIES
// ============================================

/**
 * Create a successful API response
 */
export function createApiResponse(data, overrides = {}) {
    return {
        success: true,
        data,
        ...overrides,
    };
}

/**
 * Create an error API response
 */
export function createApiError(message = 'An error occurred', code = 'ERROR', overrides = {}) {
    return {
        success: false,
        error: {
            code,
            message,
            ...overrides.errorDetails,
        },
        ...overrides,
    };
}
