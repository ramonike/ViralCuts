/**
 * Dashboard State Hook Tests
 * Tests for main dashboard state management
 * Requirements: 2.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { defaultState, defaultSettings } from './useStorage';

// Mock all the API dependencies
vi.mock('../api/youtube', () => ({
    fetchChannelDetails: vi.fn().mockResolvedValue(null),
    fetchChannelVideos: vi.fn().mockResolvedValue([]),
    fetchChannelAnalytics: vi.fn().mockResolvedValue([]),
    searchVideos: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/opus', () => ({
    uploadToOpus: vi.fn(),
    checkProjectStatus: vi.fn(),
    getClips: vi.fn(),
    createProjectFromUrl: vi.fn(),
}));

vi.mock('../api/upload', () => ({
    uploadVideo: vi.fn(),
}));

vi.mock('../api/backend', () => ({
    uploadsAPI: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    offlineFirst: {
        addUpload: vi.fn().mockResolvedValue({ id: 'test-id' }),
        updateUpload: vi.fn(),
        removeUpload: vi.fn(),
    },
    syncManager: {
        processPendingChanges: vi.fn().mockResolvedValue(undefined),
        enableAutoSync: vi.fn(),
    },
}));

vi.mock('../lib/useSupabaseAuth', () => ({
    useSupabaseAuth: vi.fn(() => ({
        user: null,
        loading: false,
    })),
}));

// Import after mocks
import { useDashboardState } from './useDashboardState';

describe('useDashboardState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('initialization', () => {
        it('should initialize with default state when localStorage is empty', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state).toBeDefined();
            });

            expect(result.current.state.settings).toBeDefined();
            expect(result.current.actions).toBeDefined();
        });

        it('should load state from localStorage if available', async () => {
            const savedState = {
                ...defaultState,
                settings: {
                    ...defaultSettings,
                    channelName: 'Saved Channel',
                },
            };
            localStorage.setItem('viralcuts_workflow_v1', JSON.stringify(savedState));

            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.settings.channelName).toBe('Saved Channel');
            });
        });

        it('should return actions object with core methods', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            expect(typeof result.current.actions.toggleItem).toBe('function');
            expect(typeof result.current.actions.addToUploadQueue).toBe('function');
            expect(typeof result.current.actions.removeQueueItem).toBe('function');
            expect(typeof result.current.actions.updateSettings).toBe('function');
            expect(typeof result.current.actions.setYouTubeToken).toBe('function');
        });
    });

    describe('upload queue actions', () => {
        it('should add item to upload queue', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.addToUploadQueue({
                    title: 'Test Video',
                    source: 'manual',
                    platform: 'youtube',
                });
            });

            await waitFor(() => {
                expect(result.current.state.uploadQueue.length).toBeGreaterThan(0);
            });
        });

        it('should add item with correct properties', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.addToUploadQueue({
                    title: 'My Video',
                    source: 'opus',
                    platform: 'youtube',
                    description: 'Test description',
                });
            });

            await waitFor(() => {
                const item = result.current.state.uploadQueue[0];
                expect(item.title).toBe('My Video');
                expect(item.source).toBe('opus');
            });
        });
    });

    describe('localStorage persistence', () => {
        it('should save state to localStorage on changes', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            await act(async () => {
                result.current.actions.updateSettings({ channelName: 'New Channel' });
            });

            await waitFor(() => {
                const saved = localStorage.getItem('viralcuts_workflow_v1');
                expect(saved).toBeTruthy();
                const parsed = JSON.parse(saved);
                expect(parsed.settings.channelName).toBe('New Channel');
            });
        });

        it('should persist upload queue changes', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.addToUploadQueue({
                    title: 'Persisted Video',
                    source: 'manual',
                });
            });

            await waitFor(() => {
                const saved = localStorage.getItem('viralcuts_workflow_v1');
                expect(saved).toBeTruthy();
                const parsed = JSON.parse(saved);
                expect(parsed.uploadQueue.length).toBeGreaterThan(0);
            });
        });
    });

    describe('settings management', () => {
        it('should update settings', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.actions).toBeDefined();
            });

            act(() => {
                result.current.actions.updateSettings({
                    dailyGoal: 5,
                    timezone: 'America/New_York',
                });
            });

            await waitFor(() => {
                expect(result.current.state.settings.dailyGoal).toBe(5);
                expect(result.current.state.settings.timezone).toBe('America/New_York');
            });
        });

        it('should preserve other settings when updating', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.settings).toBeDefined();
            });

            const originalChannelName = result.current.state.settings.channelName;

            act(() => {
                result.current.actions.updateSettings({ dailyGoal: 10 });
            });

            await waitFor(() => {
                expect(result.current.state.settings.channelName).toBe(originalChannelName);
                expect(result.current.state.settings.dailyGoal).toBe(10);
            });
        });
    });

    describe('checklist management', () => {
        it('should toggle checklist item', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.checklists).toBeDefined();
                expect(result.current.state.checklists.length).toBeGreaterThan(0);
            });

            const firstChecklist = result.current.state.checklists[0];
            const firstItem = firstChecklist.items[0];
            const initialDone = firstItem.done;

            act(() => {
                result.current.actions.toggleItem(firstChecklist.id, firstItem.id);
            });

            await waitFor(() => {
                const updatedChecklist = result.current.state.checklists.find(c => c.id === firstChecklist.id);
                const updatedItem = updatedChecklist.items.find(i => i.id === firstItem.id);
                expect(updatedItem.done).toBe(!initialDone);
            });
        });

        it('should add new checklist item', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.checklists).toBeDefined();
            });

            const firstChecklist = result.current.state.checklists[0];
            const initialLength = firstChecklist.items.length;

            act(() => {
                result.current.actions.addChecklistItem(firstChecklist.id, 'New Task');
            });

            await waitFor(() => {
                const updatedChecklist = result.current.state.checklists.find(c => c.id === firstChecklist.id);
                expect(updatedChecklist.items.length).toBe(initialLength + 1);
            });
        });

        it('should reset checklist', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.checklists).toBeDefined();
            });

            const firstChecklist = result.current.state.checklists[0];

            // First toggle some items
            act(() => {
                result.current.actions.toggleItem(firstChecklist.id, firstChecklist.items[0].id);
            });

            // Then reset
            act(() => {
                result.current.actions.resetChecklist(firstChecklist.id);
            });

            await waitFor(() => {
                const updatedChecklist = result.current.state.checklists.find(c => c.id === firstChecklist.id);
                expect(updatedChecklist.items.every(item => !item.done)).toBe(true);
            });
        });
    });

    describe('quota tracking', () => {
        it('should have quota state structure', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state.quota).toBeDefined();
            });

            expect(result.current.state.quota.used).toBeDefined();
            expect(result.current.state.quota.limit).toBe(10000);
        });
    });

    describe('state structure', () => {
        it('should have all required state properties', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.state).toBeDefined();
            });

            expect(result.current.state.settings).toBeDefined();
            expect(result.current.state.checklists).toBeDefined();
            expect(result.current.state.uploadQueue).toBeDefined();
            expect(result.current.state.auth).toBeDefined();
            expect(result.current.state.pipeline).toBeDefined();
            expect(result.current.state.history).toBeDefined();
        });

        it('should have setState function for direct state updates', async () => {
            const { result } = renderHook(() => useDashboardState());

            await waitFor(() => {
                expect(result.current.setState).toBeDefined();
            });

            expect(typeof result.current.setState).toBe('function');
        });
    });
});
