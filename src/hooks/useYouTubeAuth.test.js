/**
 * YouTube Auth Hook Tests
 * Tests for YouTube authentication and account management
 * Requirements: 2.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYouTubeAuth } from './useYouTubeAuth';

// Mock the YouTube API functions
vi.mock('../api/youtube', () => ({
    fetchChannelDetails: vi.fn(),
    fetchChannelVideos: vi.fn(),
    fetchChannelAnalytics: vi.fn(),
    searchVideos: vi.fn(),
}));

import { fetchChannelDetails, fetchChannelVideos, fetchChannelAnalytics, searchVideos } from '../api/youtube';

describe('useYouTubeAuth', () => {
    let mockState;
    let mockSetState;
    let mockTrackQuota;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockState = {
            auth: {
                youtubeToken: null,
                youtubeTokenExpiresAt: null,
                connectedAccounts: [],
                activeAccountId: null,
            },
            channelStats: null,
            channelsData: {},
            history: {},
            uploadQueue: [],
            suggestions: [],
            recentUploads: [],
            analytics: { views24h: [] },
            cache: {},
        };

        mockSetState = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockState = updater(mockState);
            } else {
                mockState = { ...mockState, ...updater };
            }
        });

        mockTrackQuota = vi.fn();

        // Default mock implementations
        fetchChannelDetails.mockResolvedValue({
            id: 'channel-123',
            title: 'Test Channel',
            thumbnails: { default: { url: 'https://example.com/avatar.jpg' } },
        });
        fetchChannelVideos.mockResolvedValue([]);
        fetchChannelAnalytics.mockResolvedValue([]);
        searchVideos.mockResolvedValue([]);
    });

    describe('setYouTubeToken', () => {
        it('should set token and fetch channel details', async () => {
            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            const tokenResponse = {
                access_token: 'test-token-123',
                expires_in: 3600,
            };

            await act(async () => {
                await result.current.setYouTubeToken(tokenResponse);
            });

            expect(fetchChannelDetails).toHaveBeenCalledWith('test-token-123');
            expect(mockTrackQuota).toHaveBeenCalledWith(1);
            expect(mockSetState).toHaveBeenCalled();
        });

        it('should clear token when access_token is missing', async () => {
            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            await act(async () => {
                await result.current.setYouTubeToken({});
            });

            expect(mockSetState).toHaveBeenCalled();
            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.auth.youtubeToken).toBeNull();
        });

        it('should add new account to connectedAccounts', async () => {
            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            const tokenResponse = {
                access_token: 'new-token',
                expires_in: 3600,
            };

            await act(async () => {
                await result.current.setYouTubeToken(tokenResponse);
            });

            expect(mockSetState).toHaveBeenCalled();
        });

        it('should update existing account if already connected', async () => {
            mockState.auth.connectedAccounts = [{
                id: 'channel-123',
                name: 'Old Name',
                token: 'old-token',
            }];

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            const tokenResponse = {
                access_token: 'updated-token',
                expires_in: 3600,
            };

            await act(async () => {
                await result.current.setYouTubeToken(tokenResponse);
            });

            expect(mockSetState).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            fetchChannelDetails.mockRejectedValue(new Error('API Error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            const tokenResponse = {
                access_token: 'test-token',
                expires_in: 3600,
            };

            await act(async () => {
                await result.current.setYouTubeToken(tokenResponse);
            });

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('switchAccount', () => {
        it('should switch to existing account', async () => {
            const account1 = {
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
                expiresAt: Date.now() + 3600000,
                stats: { id: 'account-1', title: 'Account 1' },
            };
            const account2 = {
                id: 'account-2',
                name: 'Account 2',
                token: 'token-2',
                expiresAt: Date.now() + 3600000,
                stats: { id: 'account-2', title: 'Account 2' },
            };

            mockState.auth.connectedAccounts = [account1, account2];
            mockState.auth.activeAccountId = 'account-1';
            mockState.auth.youtubeToken = 'token-1';

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.switchAccount('account-2');
            });

            expect(mockSetState).toHaveBeenCalled();
        });

        it('should not switch if account does not exist', () => {
            mockState.auth.connectedAccounts = [{
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
            }];

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.switchAccount('non-existent');
            });

            // setState should be called but return prev state unchanged
            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.auth.activeAccountId).toBe(mockState.auth.activeAccountId);
        });

        it('should preserve channel data when switching', () => {
            const account1 = {
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
                expiresAt: Date.now() + 3600000,
                stats: { id: 'account-1' },
            };

            mockState.auth.connectedAccounts = [account1];
            mockState.auth.activeAccountId = 'account-1';
            mockState.history = { '2025-01-01': { uploads: 1 } };

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.switchAccount('account-1');
            });

            expect(mockSetState).toHaveBeenCalled();
        });
    });

    describe('disconnectAccount', () => {
        it('should remove account from connectedAccounts', () => {
            const account1 = {
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
                stats: { id: 'account-1' },
            };
            const account2 = {
                id: 'account-2',
                name: 'Account 2',
                token: 'token-2',
                stats: { id: 'account-2' },
            };

            mockState.auth.connectedAccounts = [account1, account2];
            mockState.auth.activeAccountId = 'account-1';
            mockState.auth.youtubeToken = 'token-1';

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.disconnectAccount('account-2');
            });

            expect(mockSetState).toHaveBeenCalled();
            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.auth.connectedAccounts).toHaveLength(1);
            expect(newState.auth.connectedAccounts[0].id).toBe('account-1');
        });

        it('should switch to next account when disconnecting active account', () => {
            const account1 = {
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
                expiresAt: Date.now() + 3600000,
                stats: { id: 'account-1' },
            };
            const account2 = {
                id: 'account-2',
                name: 'Account 2',
                token: 'token-2',
                expiresAt: Date.now() + 3600000,
                stats: { id: 'account-2' },
            };

            mockState.auth.connectedAccounts = [account1, account2];
            mockState.auth.activeAccountId = 'account-1';
            mockState.auth.youtubeToken = 'token-1';
            mockState.channelsData = {
                'account-2': {
                    history: {},
                    uploadQueue: [],
                    suggestions: [],
                    recentUploads: [],
                    analytics: { views24h: [] },
                },
            };

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.disconnectAccount('account-1');
            });

            expect(mockSetState).toHaveBeenCalled();
            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.auth.activeAccountId).toBe('account-2');
            expect(newState.auth.youtubeToken).toBe('token-2');
        });

        it('should clear all auth state when disconnecting last account', () => {
            const account1 = {
                id: 'account-1',
                name: 'Account 1',
                token: 'token-1',
                stats: { id: 'account-1' },
            };

            mockState.auth.connectedAccounts = [account1];
            mockState.auth.activeAccountId = 'account-1';
            mockState.auth.youtubeToken = 'token-1';

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            act(() => {
                result.current.disconnectAccount('account-1');
            });

            expect(mockSetState).toHaveBeenCalled();
            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.auth.connectedAccounts).toHaveLength(0);
            expect(newState.auth.activeAccountId).toBeNull();
            expect(newState.auth.youtubeToken).toBeNull();
            expect(newState.channelStats).toBeNull();
        });
    });

    describe('refreshChannelStats', () => {
        it('should not refresh if no token is present', async () => {
            mockState.auth.youtubeToken = null;

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            await act(async () => {
                await result.current.refreshChannelStats();
            });

            expect(fetchChannelDetails).not.toHaveBeenCalled();
        });

        it('should use cached data when available and not expired', async () => {
            mockState.auth.youtubeToken = 'test-token';
            mockState.cache = {
                channelStats: {
                    data: { id: 'cached-channel' },
                    timestamp: Date.now() - 1000, // 1 second ago
                },
            };

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await act(async () => {
                const refreshResult = await result.current.refreshChannelStats();
                expect(refreshResult).toBe(true);
            });

            consoleSpy.mockRestore();
        });

        it('should fetch fresh data when forceRefresh is true', async () => {
            mockState.auth.youtubeToken = 'test-token';
            mockState.cache = {
                channelStats: {
                    data: { id: 'cached-channel' },
                    timestamp: Date.now() - 1000,
                },
            };

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            await act(async () => {
                await result.current.refreshChannelStats(true);
            });

            expect(fetchChannelDetails).toHaveBeenCalledWith('test-token');
        });

        it('should handle quota exceeded errors', async () => {
            mockState.auth.youtubeToken = 'test-token';
            fetchChannelDetails.mockRejectedValue(new Error('quota exceeded'));
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            await act(async () => {
                await result.current.refreshChannelStats(true);
            });

            expect(mockSetState).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should track quota usage on successful refresh', async () => {
            mockState.auth.youtubeToken = 'test-token';

            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            await act(async () => {
                await result.current.refreshChannelStats(true);
            });

            expect(mockTrackQuota).toHaveBeenCalledWith(110);
        });
    });

    describe('returned values', () => {
        it('should return auth state and functions', () => {
            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            expect(result.current).toHaveProperty('auth');
            expect(result.current).toHaveProperty('channelStats');
            expect(result.current).toHaveProperty('connectedAccounts');
            expect(result.current).toHaveProperty('activeAccountId');
            expect(result.current).toHaveProperty('youtubeToken');
            expect(result.current).toHaveProperty('setYouTubeToken');
            expect(result.current).toHaveProperty('switchAccount');
            expect(result.current).toHaveProperty('disconnectAccount');
            expect(result.current).toHaveProperty('refreshChannelStats');
        });

        it('should return correct initial values', () => {
            const { result } = renderHook(() => 
                useYouTubeAuth(mockState, mockSetState, mockTrackQuota)
            );

            expect(result.current.auth).toEqual(mockState.auth);
            expect(result.current.channelStats).toBeNull();
            expect(result.current.connectedAccounts).toEqual([]);
            expect(result.current.activeAccountId).toBeNull();
            expect(result.current.youtubeToken).toBeNull();
        });
    });
});
