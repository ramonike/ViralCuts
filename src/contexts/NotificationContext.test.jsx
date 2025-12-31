/**
 * NotificationContext Tests
 * Tests for notification system core functionality
 * Requirements: 1.1, 1.3, 1.4, 1.5, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotification } from './NotificationContext';

// Wrapper component
const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Notification History (Requirements 1.1, 1.4)', () => {
        it('should add notification to history', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({
                    type: 'upload_complete',
                    title: 'Upload Complete',
                    message: 'Video uploaded successfully',
                });
            });

            expect(result.current.notificationHistory).toHaveLength(1);
            expect(result.current.notificationHistory[0].type).toBe('upload_complete');
            expect(result.current.notificationHistory[0].title).toBe('Upload Complete');
            expect(result.current.notificationHistory[0].read).toBe(false);
        });

        it('should persist notifications to localStorage', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({
                    type: 'upload_complete',
                    title: 'Test',
                    message: 'Test message',
                });
            });

            // Check localStorage was called
            const stored = localStorage.getItem('notification_history');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored);
            expect(parsed).toHaveLength(1);
        });

        it('should limit notifications to 100', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            // Add 105 notifications
            act(() => {
                for (let i = 0; i < 105; i++) {
                    result.current.addToHistory({
                        type: 'system',
                        title: `Notification ${i}`,
                        message: `Message ${i}`,
                    });
                }
            });

            expect(result.current.notificationHistory.length).toBeLessThanOrEqual(100);
        });

        it('should include actionUrl and metadata in notification', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({
                    type: 'video_published',
                    title: 'Video Published',
                    message: 'Your video is live',
                    actionUrl: '/videos/123',
                    metadata: { videoId: '123' },
                });
            });

            expect(result.current.notificationHistory[0].actionUrl).toBe('/videos/123');
            expect(result.current.notificationHistory[0].metadata).toEqual({ videoId: '123' });
        });
    });

    describe('Read/Unread Management (Requirement 1.3)', () => {
        it('should mark notification as read', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            let notificationId;
            act(() => {
                notificationId = result.current.addToHistory({
                    type: 'upload_complete',
                    title: 'Test',
                    message: 'Test',
                });
            });

            // Get the actual ID from history
            const id = result.current.notificationHistory[0].id;

            act(() => {
                result.current.markAsRead(id);
            });

            expect(result.current.notificationHistory[0].read).toBe(true);
        });

        it('should mark all notifications as read', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
                result.current.addToHistory({ type: 'system', title: 'Test 3', message: 'Msg 3' });
            });

            act(() => {
                result.current.markAllAsRead();
            });

            expect(result.current.notificationHistory.every(n => n.read)).toBe(true);
        });

        it('should clear single notification', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
            });

            const idToRemove = result.current.notificationHistory[0].id;

            act(() => {
                result.current.clearNotification(idToRemove);
            });

            expect(result.current.notificationHistory).toHaveLength(1);
            expect(result.current.notificationHistory[0].title).toBe('Test 2');
        });

        it('should clear all notifications', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
            });

            act(() => {
                result.current.clearAll();
            });

            expect(result.current.notificationHistory).toHaveLength(0);
        });
    });

    describe('Unread Count (Requirement 1.5)', () => {
        it('should calculate unread count correctly', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
                result.current.addToHistory({ type: 'system', title: 'Test 3', message: 'Msg 3' });
            });

            expect(result.current.unreadCount).toBe(3);
        });

        it('should decrease unread count when marking as read', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
            });

            expect(result.current.unreadCount).toBe(2);

            const id = result.current.notificationHistory[0].id;
            act(() => {
                result.current.markAsRead(id);
            });

            expect(result.current.unreadCount).toBe(1);
        });

        it('should set unread count to 0 when marking all as read', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addToHistory({ type: 'system', title: 'Test 1', message: 'Msg 1' });
                result.current.addToHistory({ type: 'system', title: 'Test 2', message: 'Msg 2' });
            });

            act(() => {
                result.current.markAllAsRead();
            });

            expect(result.current.unreadCount).toBe(0);
        });
    });

    describe('Notification Preferences (Requirements 3.3, 3.4)', () => {
        it('should have default preferences', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            expect(result.current.preferences.inApp.enabled).toBe(true);
            expect(result.current.preferences.push.enabled).toBe(false);
        });

        it('should update in-app preferences', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.updatePreferences({
                    inApp: { enabled: false }
                });
            });

            expect(result.current.preferences.inApp.enabled).toBe(false);
        });

        it('should update push preferences', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.updatePreferences({
                    push: { enabled: true }
                });
            });

            expect(result.current.preferences.push.enabled).toBe(true);
        });

        it('should update individual notification type preferences', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.updatePreferences({
                    inApp: {
                        types: { streak_reminder: false }
                    }
                });
            });

            expect(result.current.preferences.inApp.types.streak_reminder).toBe(false);
            // Other types should remain unchanged
            expect(result.current.preferences.inApp.types.upload_complete).toBe(true);
        });

        it('should persist preferences to localStorage', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.updatePreferences({
                    inApp: { types: { quota_warning: false } }
                });
            });

            const stored = localStorage.getItem('notification_preferences');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored);
            expect(parsed.inApp.types.quota_warning).toBe(false);
        });

        it('should check if notification type is enabled', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            expect(result.current.isNotificationTypeEnabled('upload_complete')).toBe(true);

            act(() => {
                result.current.updatePreferences({
                    inApp: { types: { upload_complete: false } }
                });
            });

            expect(result.current.isNotificationTypeEnabled('upload_complete')).toBe(false);
        });

        it('should return false for all types when in-app is disabled', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.updatePreferences({
                    inApp: { enabled: false }
                });
            });

            expect(result.current.isNotificationTypeEnabled('upload_complete')).toBe(false);
            expect(result.current.isNotificationTypeEnabled('achievement_unlocked')).toBe(false);
        });
    });

    describe('Toast Notifications', () => {
        it('should add toast notification', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            act(() => {
                result.current.addNotification({
                    type: 'success',
                    message: 'Test toast',
                });
            });

            expect(result.current.notifications).toHaveLength(1);
        });

        it('should dismiss toast notification', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            let toastId;
            act(() => {
                toastId = result.current.addNotification({
                    type: 'info',
                    message: 'Test toast',
                    duration: 0, // Don't auto-dismiss
                });
            });

            act(() => {
                result.current.dismissNotification(toastId);
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should provide helper methods for different types', () => {
            const { result } = renderHook(() => useNotification(), { wrapper });

            expect(typeof result.current.success).toBe('function');
            expect(typeof result.current.error).toBe('function');
            expect(typeof result.current.warning).toBe('function');
            expect(typeof result.current.info).toBe('function');
        });
    });

    describe('Context Error Handling', () => {
        it('should throw error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useNotification());
            }).toThrow('useNotification must be used within a NotificationProvider');

            consoleSpy.mockRestore();
        });
    });
});
