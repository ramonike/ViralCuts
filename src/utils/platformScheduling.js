/**
 * Platform Scheduling Utilities
 * Handles per-platform scheduling validation and limits
 * Requirements: 3.4
 */

/**
 * Platform-specific scheduling limits and requirements
 */
export const PLATFORM_LIMITS = {
    youtube: {
        name: 'YouTube',
        maxScheduleAhead: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
        minScheduleAhead: 5 * 60 * 1000, // 5 minutes in ms
        maxDuration: 43200, // 12 hours in seconds
        maxFileSize: 256 * 1024 * 1024 * 1024, // 256GB
        supportsNativeScheduling: true,
        supportedFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
        privacyOptions: ['public', 'unlisted', 'private'],
    },
    tiktok: {
        name: 'TikTok',
        maxScheduleAhead: 10 * 24 * 60 * 60 * 1000, // 10 days in ms
        minScheduleAhead: 15 * 60 * 1000, // 15 minutes in ms
        maxDuration: 600, // 10 minutes in seconds
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        supportsNativeScheduling: false, // TikTok doesn't support native scheduling via API
        supportedFormats: ['mp4', 'webm', 'mov'],
        privacyOptions: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
    },
    instagram: {
        name: 'Instagram Reels',
        maxScheduleAhead: 75 * 24 * 60 * 60 * 1000, // 75 days in ms
        minScheduleAhead: 20 * 60 * 1000, // 20 minutes in ms
        maxDuration: 90, // 90 seconds
        maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
        supportsNativeScheduling: true, // Instagram supports scheduling via Graph API
        supportedFormats: ['mp4', 'mov'],
        privacyOptions: ['public'], // Instagram Reels are always public
    },
};

/**
 * Validate if a scheduled time is valid for a specific platform
 * @param {string} platform - Platform ID
 * @param {Date|string} scheduledAt - Scheduled time
 * @returns {Object} Validation result with isValid and error message
 */
export function validatePlatformSchedule(platform, scheduledAt) {
    const limits = PLATFORM_LIMITS[platform];
    if (!limits) {
        return { isValid: false, error: `Unknown platform: ${platform}` };
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    // Check if date is valid
    if (isNaN(scheduledDate.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    // Check minimum schedule ahead time
    const minScheduleTime = new Date(now.getTime() + limits.minScheduleAhead);
    if (scheduledDate < minScheduleTime) {
        const minMinutes = Math.ceil(limits.minScheduleAhead / (60 * 1000));
        return { 
            isValid: false, 
            error: `${limits.name} requires at least ${minMinutes} minutes advance scheduling` 
        };
    }

    // Check maximum schedule ahead time
    const maxScheduleTime = new Date(now.getTime() + limits.maxScheduleAhead);
    if (scheduledDate > maxScheduleTime) {
        const maxDays = Math.floor(limits.maxScheduleAhead / (24 * 60 * 60 * 1000));
        return { 
            isValid: false, 
            error: `${limits.name} allows scheduling up to ${maxDays} days in advance` 
        };
    }

    return { isValid: true, error: null };
}

/**
 * Validate video file for a specific platform
 * @param {string} platform - Platform ID
 * @param {File} file - Video file
 * @param {number} duration - Video duration in seconds (optional)
 * @returns {Object} Validation result
 */
export function validatePlatformVideo(platform, file, duration = null) {
    const limits = PLATFORM_LIMITS[platform];
    if (!limits) {
        return { isValid: false, error: `Unknown platform: ${platform}` };
    }

    // Check file size
    if (file.size > limits.maxFileSize) {
        const maxSizeGB = (limits.maxFileSize / (1024 * 1024 * 1024)).toFixed(1);
        return { 
            isValid: false, 
            error: `${limits.name} has a maximum file size of ${maxSizeGB}GB` 
        };
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !limits.supportedFormats.includes(extension)) {
        return { 
            isValid: false, 
            error: `${limits.name} doesn't support .${extension} files. Supported: ${limits.supportedFormats.join(', ')}` 
        };
    }

    // Check duration if provided
    if (duration !== null && duration > limits.maxDuration) {
        const maxDurationStr = formatDuration(limits.maxDuration);
        return { 
            isValid: false, 
            error: `${limits.name} has a maximum duration of ${maxDurationStr}` 
        };
    }

    return { isValid: true, error: null };
}

/**
 * Validate schedules for multiple platforms
 * @param {Object} platformSchedules - Object with platform IDs as keys and dates as values
 * @returns {Object} Validation results per platform
 */
export function validateMultiPlatformSchedules(platformSchedules) {
    const results = {};
    
    for (const [platform, scheduledAt] of Object.entries(platformSchedules)) {
        results[platform] = validatePlatformSchedule(platform, scheduledAt);
    }

    return {
        results,
        allValid: Object.values(results).every(r => r.isValid),
        errors: Object.entries(results)
            .filter(([_, r]) => !r.isValid)
            .map(([platform, r]) => ({ platform, error: r.error })),
    };
}

/**
 * Get the earliest valid schedule time for a platform
 * @param {string} platform - Platform ID
 * @returns {Date} Earliest valid schedule time
 */
export function getEarliestScheduleTime(platform) {
    const limits = PLATFORM_LIMITS[platform];
    if (!limits) return new Date();
    
    return new Date(Date.now() + limits.minScheduleAhead);
}

/**
 * Get the latest valid schedule time for a platform
 * @param {string} platform - Platform ID
 * @returns {Date} Latest valid schedule time
 */
export function getLatestScheduleTime(platform) {
    const limits = PLATFORM_LIMITS[platform];
    if (!limits) return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    return new Date(Date.now() + limits.maxScheduleAhead);
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
}

/**
 * Get common schedule time across platforms
 * Returns the most restrictive time window that works for all platforms
 * @param {string[]} platforms - Array of platform IDs
 * @returns {Object} Common schedule window
 */
export function getCommonScheduleWindow(platforms) {
    let minAhead = 0;
    let maxAhead = Infinity;

    for (const platform of platforms) {
        const limits = PLATFORM_LIMITS[platform];
        if (limits) {
            minAhead = Math.max(minAhead, limits.minScheduleAhead);
            maxAhead = Math.min(maxAhead, limits.maxScheduleAhead);
        }
    }

    const now = Date.now();
    return {
        earliest: new Date(now + minAhead),
        latest: new Date(now + maxAhead),
        minAheadMs: minAhead,
        maxAheadMs: maxAhead,
    };
}

/**
 * Suggest optimal schedule times for multiple platforms
 * @param {string[]} platforms - Array of platform IDs
 * @param {Date} preferredTime - User's preferred time
 * @returns {Object} Suggested times per platform
 */
export function suggestScheduleTimes(platforms, preferredTime) {
    const suggestions = {};
    const preferred = new Date(preferredTime);

    for (const platform of platforms) {
        const validation = validatePlatformSchedule(platform, preferred);
        
        if (validation.isValid) {
            suggestions[platform] = {
                time: preferred,
                adjusted: false,
            };
        } else {
            // Suggest the earliest valid time
            const earliest = getEarliestScheduleTime(platform);
            const latest = getLatestScheduleTime(platform);
            
            if (preferred < earliest) {
                suggestions[platform] = {
                    time: earliest,
                    adjusted: true,
                    reason: `Adjusted to minimum ${PLATFORM_LIMITS[platform].name} scheduling time`,
                };
            } else if (preferred > latest) {
                suggestions[platform] = {
                    time: latest,
                    adjusted: true,
                    reason: `Adjusted to maximum ${PLATFORM_LIMITS[platform].name} scheduling time`,
                };
            }
        }
    }

    return suggestions;
}

/**
 * Check if a platform supports native scheduling
 * @param {string} platform - Platform ID
 * @returns {boolean} Whether platform supports native scheduling
 */
export function supportsNativeScheduling(platform) {
    return PLATFORM_LIMITS[platform]?.supportsNativeScheduling ?? false;
}

/**
 * Get platform-specific privacy options
 * @param {string} platform - Platform ID
 * @returns {string[]} Available privacy options
 */
export function getPlatformPrivacyOptions(platform) {
    return PLATFORM_LIMITS[platform]?.privacyOptions ?? ['private'];
}

/**
 * Map privacy status between platforms
 * @param {string} fromPlatform - Source platform
 * @param {string} toPlatform - Target platform
 * @param {string} privacyStatus - Privacy status to map
 * @returns {string} Mapped privacy status
 */
export function mapPrivacyStatus(fromPlatform, toPlatform, privacyStatus) {
    // YouTube to TikTok mapping
    if (fromPlatform === 'youtube' && toPlatform === 'tiktok') {
        const mapping = {
            'public': 'PUBLIC_TO_EVERYONE',
            'unlisted': 'MUTUAL_FOLLOW_FRIENDS',
            'private': 'SELF_ONLY',
        };
        return mapping[privacyStatus] || 'SELF_ONLY';
    }

    // TikTok to YouTube mapping
    if (fromPlatform === 'tiktok' && toPlatform === 'youtube') {
        const mapping = {
            'PUBLIC_TO_EVERYONE': 'public',
            'MUTUAL_FOLLOW_FRIENDS': 'unlisted',
            'SELF_ONLY': 'private',
        };
        return mapping[privacyStatus] || 'private';
    }

    // Instagram only supports public
    if (toPlatform === 'instagram') {
        return 'public';
    }

    return privacyStatus;
}

export default {
    PLATFORM_LIMITS,
    validatePlatformSchedule,
    validatePlatformVideo,
    validateMultiPlatformSchedules,
    getEarliestScheduleTime,
    getLatestScheduleTime,
    getCommonScheduleWindow,
    suggestScheduleTimes,
    supportsNativeScheduling,
    getPlatformPrivacyOptions,
    mapPrivacyStatus,
};
