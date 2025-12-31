/**
 * Platform Scheduling Tests
 * Tests for multi-platform scheduling validation and limits
 * Requirements: 3.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from './platformScheduling';

describe('Platform Scheduling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('PLATFORM_LIMITS', () => {
        it('should have configuration for all supported platforms', () => {
            expect(PLATFORM_LIMITS).toHaveProperty('youtube');
            expect(PLATFORM_LIMITS).toHaveProperty('tiktok');
            expect(PLATFORM_LIMITS).toHaveProperty('instagram');
        });

        it('should have required properties for each platform', () => {
            const requiredProps = ['name', 'maxScheduleAhead', 'minScheduleAhead', 'maxDuration', 'maxFileSize'];
            
            for (const platform of Object.keys(PLATFORM_LIMITS)) {
                for (const prop of requiredProps) {
                    expect(PLATFORM_LIMITS[platform]).toHaveProperty(prop);
                }
            }
        });
    });

    describe('validatePlatformSchedule', () => {
        it('should return valid for a schedule within limits', () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day ahead
            
            const result = validatePlatformSchedule('youtube', futureDate);
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should reject schedule too soon for TikTok', () => {
            const tooSoon = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (TikTok needs 15)
            
            const result = validatePlatformSchedule('tiktok', tooSoon);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('TikTok');
            expect(result.error).toContain('15 minutes');
        });

        it('should reject schedule too far ahead for TikTok', () => {
            const tooFar = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days (TikTok max is 10)
            
            const result = validatePlatformSchedule('tiktok', tooFar);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('TikTok');
            expect(result.error).toContain('10 days');
        });

        it('should reject invalid date format', () => {
            const result = validatePlatformSchedule('youtube', 'invalid-date');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid date format');
        });

        it('should reject unknown platform', () => {
            const result = validatePlatformSchedule('unknown', new Date());
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Unknown platform');
        });
    });

    describe('validatePlatformVideo', () => {
        it('should validate video within limits', () => {
            const mockFile = {
                name: 'video.mp4',
                size: 100 * 1024 * 1024, // 100MB
            };
            
            const result = validatePlatformVideo('youtube', mockFile, 300);
            
            expect(result.isValid).toBe(true);
        });

        it('should reject video exceeding file size limit', () => {
            const mockFile = {
                name: 'video.mp4',
                size: 5 * 1024 * 1024 * 1024, // 5GB (TikTok max is 4GB)
            };
            
            const result = validatePlatformVideo('tiktok', mockFile);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('4.0GB');
        });

        it('should reject unsupported format', () => {
            const mockFile = {
                name: 'video.avi',
                size: 100 * 1024 * 1024,
            };
            
            const result = validatePlatformVideo('instagram', mockFile);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('.avi');
        });

        it('should reject video exceeding duration limit', () => {
            const mockFile = {
                name: 'video.mp4',
                size: 100 * 1024 * 1024,
            };
            
            const result = validatePlatformVideo('instagram', mockFile, 120); // 2 minutes (Instagram max is 90s)
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Instagram Reels');
            expect(result.error).toContain('duration');
        });
    });

    describe('validateMultiPlatformSchedules', () => {
        it('should validate schedules for multiple platforms', () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const schedules = {
                youtube: futureDate,
                tiktok: futureDate,
            };
            
            const result = validateMultiPlatformSchedules(schedules);
            
            expect(result.allValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should report errors for invalid schedules', () => {
            const tooSoon = new Date(Date.now() + 5 * 60 * 1000);
            const schedules = {
                youtube: tooSoon, // Valid for YouTube (5 min minimum)
                tiktok: tooSoon,  // Invalid for TikTok (15 min minimum)
            };
            
            const result = validateMultiPlatformSchedules(schedules);
            
            expect(result.allValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.platform === 'tiktok')).toBe(true);
        });
    });

    describe('getEarliestScheduleTime', () => {
        it('should return correct earliest time for each platform', () => {
            const youtubeEarliest = getEarliestScheduleTime('youtube');
            const tiktokEarliest = getEarliestScheduleTime('tiktok');
            const instagramEarliest = getEarliestScheduleTime('instagram');
            
            const now = Date.now();
            
            // YouTube: 5 minutes
            expect(youtubeEarliest.getTime()).toBeGreaterThanOrEqual(now + 5 * 60 * 1000);
            
            // TikTok: 15 minutes
            expect(tiktokEarliest.getTime()).toBeGreaterThanOrEqual(now + 15 * 60 * 1000);
            
            // Instagram: 20 minutes
            expect(instagramEarliest.getTime()).toBeGreaterThanOrEqual(now + 20 * 60 * 1000);
        });
    });

    describe('getLatestScheduleTime', () => {
        it('should return correct latest time for each platform', () => {
            const youtubeLatest = getLatestScheduleTime('youtube');
            const tiktokLatest = getLatestScheduleTime('tiktok');
            
            const now = Date.now();
            
            // YouTube: 1 year
            expect(youtubeLatest.getTime()).toBeLessThanOrEqual(now + 365 * 24 * 60 * 60 * 1000);
            
            // TikTok: 10 days
            expect(tiktokLatest.getTime()).toBeLessThanOrEqual(now + 10 * 24 * 60 * 60 * 1000);
        });
    });

    describe('getCommonScheduleWindow', () => {
        it('should return most restrictive window for multiple platforms', () => {
            const window = getCommonScheduleWindow(['youtube', 'tiktok', 'instagram']);
            
            // Should use Instagram's 20 min minimum (most restrictive)
            expect(window.minAheadMs).toBe(20 * 60 * 1000);
            
            // Should use TikTok's 10 day maximum (most restrictive)
            expect(window.maxAheadMs).toBe(10 * 24 * 60 * 60 * 1000);
        });
    });

    describe('suggestScheduleTimes', () => {
        it('should suggest valid times for all platforms', () => {
            const preferredTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            const suggestions = suggestScheduleTimes(['youtube', 'tiktok'], preferredTime);
            
            expect(suggestions.youtube.adjusted).toBe(false);
            expect(suggestions.tiktok.adjusted).toBe(false);
        });

        it('should adjust times when preferred is too soon', () => {
            const tooSoon = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
            
            const suggestions = suggestScheduleTimes(['tiktok'], tooSoon);
            
            expect(suggestions.tiktok.adjusted).toBe(true);
            expect(suggestions.tiktok.time.getTime()).toBeGreaterThan(tooSoon.getTime());
        });
    });

    describe('supportsNativeScheduling', () => {
        it('should return correct values for each platform', () => {
            expect(supportsNativeScheduling('youtube')).toBe(true);
            expect(supportsNativeScheduling('tiktok')).toBe(false);
            expect(supportsNativeScheduling('instagram')).toBe(true);
        });
    });

    describe('getPlatformPrivacyOptions', () => {
        it('should return correct privacy options for each platform', () => {
            expect(getPlatformPrivacyOptions('youtube')).toContain('public');
            expect(getPlatformPrivacyOptions('youtube')).toContain('private');
            
            expect(getPlatformPrivacyOptions('tiktok')).toContain('PUBLIC_TO_EVERYONE');
            expect(getPlatformPrivacyOptions('tiktok')).toContain('SELF_ONLY');
            
            // Instagram only supports public
            expect(getPlatformPrivacyOptions('instagram')).toEqual(['public']);
        });
    });

    describe('mapPrivacyStatus', () => {
        it('should map YouTube to TikTok privacy correctly', () => {
            expect(mapPrivacyStatus('youtube', 'tiktok', 'public')).toBe('PUBLIC_TO_EVERYONE');
            expect(mapPrivacyStatus('youtube', 'tiktok', 'unlisted')).toBe('MUTUAL_FOLLOW_FRIENDS');
            expect(mapPrivacyStatus('youtube', 'tiktok', 'private')).toBe('SELF_ONLY');
        });

        it('should map TikTok to YouTube privacy correctly', () => {
            expect(mapPrivacyStatus('tiktok', 'youtube', 'PUBLIC_TO_EVERYONE')).toBe('public');
            expect(mapPrivacyStatus('tiktok', 'youtube', 'MUTUAL_FOLLOW_FRIENDS')).toBe('unlisted');
            expect(mapPrivacyStatus('tiktok', 'youtube', 'SELF_ONLY')).toBe('private');
        });

        it('should always return public for Instagram', () => {
            expect(mapPrivacyStatus('youtube', 'instagram', 'private')).toBe('public');
            expect(mapPrivacyStatus('tiktok', 'instagram', 'SELF_ONLY')).toBe('public');
        });
    });
});
