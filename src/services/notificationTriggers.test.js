/**
 * Notification Triggers Tests
 * Tests for notification trigger functions
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotificationTriggers, NotificationTypes } from './notificationTriggers';

describe('notificationTriggers', () => {
    let mockContext;
    let triggers;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Create mock notification context
        mockContext = {
            addNotification: vi.fn(),
            addToHistory: vi.fn(),
            isNotificationTypeEnabled: vi.fn().mockReturnValue(true),
        };

        triggers = createNotificationTriggers(mockContext);
    });

    describe('NotificationTypes', () => {
        it('should export all notification types', () => {
            expect(NotificationTypes.UPLOAD_COMPLETE).toBe('upload_complete');
            expect(NotificationTypes.UPLOAD_ERROR).toBe('upload_error');
            expect(NotificationTypes.VIDEO_PUBLISHED).toBe('video_published');
            expect(NotificationTypes.ACHIEVEMENT_UNLOCKED).toBe('achievement_unlocked');
            expect(NotificationTypes.STREAK_REMINDER).toBe('streak_reminder');
            expect(NotificationTypes.QUOTA_WARNING).toBe('quota_warning');
            expect(NotificationTypes.SYSTEM).toBe('system');
        });
    });

    describe('triggerUploadComplete (Requirement 2.1)', () => {
        it('should trigger upload complete notification', () => {
            triggers.triggerUploadComplete({
                title: 'My Video',
                videoId: 'abc123',
                url: 'https://youtube.com/watch?v=abc123',
                platform: 'YouTube',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'success',
                    notificationType: 'upload_complete',
                    persist: true,
                })
            );
        });

        it('should include video title in message', () => {
            triggers.triggerUploadComplete({
                title: 'My Awesome Video',
                videoId: 'abc123',
                url: 'https://youtube.com/watch?v=abc123',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('My Awesome Video'),
                })
            );
        });

        it('should include action URL for navigation', () => {
            const url = 'https://youtube.com/watch?v=abc123';
            triggers.triggerUploadComplete({
                title: 'Test',
                videoId: 'abc123',
                url,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionUrl: url,
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerUploadComplete({
                title: 'Test',
                videoId: 'abc123',
                url: 'https://youtube.com/watch?v=abc123',
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });

        it('should support different platforms', () => {
            triggers.triggerUploadComplete({
                title: 'TikTok Video',
                videoId: 'xyz789',
                url: 'https://tiktok.com/@user/video/xyz789',
                platform: 'TikTok',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('TikTok'),
                })
            );
        });
    });

    describe('triggerUploadError (Requirement 2.1)', () => {
        it('should trigger upload error notification', () => {
            triggers.triggerUploadError({
                title: 'My Video',
                error: 'Network error',
                platform: 'YouTube',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    notificationType: 'upload_error',
                    persist: true,
                })
            );
        });

        it('should include error message', () => {
            triggers.triggerUploadError({
                title: 'Test Video',
                error: 'Quota exceeded',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Quota exceeded'),
                })
            );
        });

        it('should include retry action when provided', () => {
            const onRetry = vi.fn();
            triggers.triggerUploadError({
                title: 'Test',
                error: 'Error',
                onRetry,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: expect.objectContaining({
                        label: 'Tentar novamente',
                    }),
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerUploadError({
                title: 'Test',
                error: 'Error',
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('triggerVideoPublished (Requirement 2.2)', () => {
        it('should trigger video published notification', () => {
            triggers.triggerVideoPublished({
                title: 'Scheduled Video',
                videoId: 'vid123',
                url: 'https://youtube.com/watch?v=vid123',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'success',
                    notificationType: 'video_published',
                    persist: true,
                })
            );
        });

        it('should include video title and link', () => {
            const url = 'https://youtube.com/watch?v=vid123';
            triggers.triggerVideoPublished({
                title: 'My Scheduled Video',
                videoId: 'vid123',
                url,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('My Scheduled Video'),
                    actionUrl: url,
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerVideoPublished({
                title: 'Test',
                videoId: 'vid123',
                url: 'https://youtube.com/watch?v=vid123',
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('triggerAchievementUnlocked (Requirement 2.3)', () => {
        it('should trigger achievement notification', () => {
            triggers.triggerAchievementUnlocked({
                title: 'First Upload',
                description: 'Upload your first video',
                icon: '🎬',
                points: 100,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'success',
                    notificationType: 'achievement_unlocked',
                    persist: true,
                })
            );
        });

        it('should include achievement icon and points', () => {
            triggers.triggerAchievementUnlocked({
                title: 'Streak Master',
                description: '7 day streak',
                icon: '🔥',
                points: 500,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('🔥'),
                    message: expect.stringContaining('+500 pontos'),
                })
            );
        });

        it('should handle achievements without points', () => {
            triggers.triggerAchievementUnlocked({
                title: 'Welcome',
                description: 'Welcome to the app',
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.not.stringContaining('pontos'),
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerAchievementUnlocked({
                title: 'Test',
                description: 'Test',
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('triggerStreakReminder (Requirement 2.4)', () => {
        it('should trigger streak reminder notification', () => {
            triggers.triggerStreakReminder({
                currentStreak: 5,
                hoursRemaining: 4,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'warning',
                    notificationType: 'streak_reminder',
                    persist: true,
                })
            );
        });

        it('should include current streak in message', () => {
            triggers.triggerStreakReminder({
                currentStreak: 10,
                hoursRemaining: 6,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('10 dias'),
                })
            );
        });

        it('should show urgency for low hours remaining', () => {
            triggers.triggerStreakReminder({
                currentStreak: 5,
                hoursRemaining: 1,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: expect.stringContaining('Últimas horas'),
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerStreakReminder({
                currentStreak: 5,
                hoursRemaining: 4,
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('triggerQuotaWarning (Requirement 2.5)', () => {
        it('should trigger quota warning notification', () => {
            triggers.triggerQuotaWarning({
                usedQuota: 8000,
                totalQuota: 10000,
                percentUsed: 80,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    notificationType: 'quota_warning',
                    persist: true,
                })
            );
        });

        it('should include quota percentage in message', () => {
            triggers.triggerQuotaWarning({
                usedQuota: 9000,
                totalQuota: 10000,
                percentUsed: 90,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('90%'),
                })
            );
        });

        it('should use error type for critical quota (>95%)', () => {
            triggers.triggerQuotaWarning({
                usedQuota: 9600,
                totalQuota: 10000,
                percentUsed: 96,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                })
            );
        });

        it('should use warning type for high quota (90-95%)', () => {
            triggers.triggerQuotaWarning({
                usedQuota: 9200,
                totalQuota: 10000,
                percentUsed: 92,
            });

            expect(mockContext.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'warning',
                })
            );
        });

        it('should not trigger if notification type is disabled', () => {
            mockContext.isNotificationTypeEnabled.mockReturnValue(false);

            triggers.triggerQuotaWarning({
                usedQuota: 8000,
                totalQuota: 10000,
                percentUsed: 80,
            });

            expect(mockContext.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('createNotificationTriggers', () => {
        it('should return all trigger functions', () => {
            expect(typeof triggers.triggerUploadComplete).toBe('function');
            expect(typeof triggers.triggerUploadError).toBe('function');
            expect(typeof triggers.triggerVideoPublished).toBe('function');
            expect(typeof triggers.triggerAchievementUnlocked).toBe('function');
            expect(typeof triggers.triggerStreakReminder).toBe('function');
            expect(typeof triggers.triggerQuotaWarning).toBe('function');
        });

        it('should include NotificationTypes in return value', () => {
            expect(triggers.NotificationTypes).toBeDefined();
            expect(triggers.NotificationTypes.UPLOAD_COMPLETE).toBe('upload_complete');
        });
    });
});
