import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarHistory } from './useCalendarHistory';

describe('useCalendarHistory', () => {
    let mockState;
    let mockSetState;

    beforeEach(() => {
        mockState = {
            history: {
                '2024-01-15': {
                    completedItems: [
                        { id: 'video1', title: 'Video 1', type: 'youtube_video', views: 100 },
                        { id: 'item1', title: 'Checklist Item', type: 'checklist_item' }
                    ],
                    uploads: 1,
                    uploadedVideos: [
                        { id: 'video1', title: 'Video 1', type: 'youtube_video' }
                    ]
                },
                '2024-01-16': {
                    completedItems: [
                        { id: 'video2', title: 'Video 2', type: 'youtube_video', views: 200 }
                    ],
                    uploads: 1
                }
            }
        };
        mockSetState = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockState = updater(mockState);
            } else {
                mockState = updater;
            }
        });
    });

    describe('getHistoryForDate', () => {
        it('should return history for existing date', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const history = result.current.getHistoryForDate('2024-01-15');
            
            expect(history.completedItems).toHaveLength(2);
            expect(history.uploads).toBe(1);
        });

        it('should return empty history for non-existent date', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const history = result.current.getHistoryForDate('2024-01-20');
            
            expect(history.completedItems).toHaveLength(0);
            expect(history.uploads).toBe(0);
        });
    });

    describe('getVideosForDate', () => {
        it('should return only youtube videos', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const videos = result.current.getVideosForDate('2024-01-15');
            
            expect(videos).toHaveLength(1);
            expect(videos[0].type).toBe('youtube_video');
        });

        it('should return empty array for date without videos', () => {
            mockState.history['2024-01-17'] = {
                completedItems: [{ id: 'item', type: 'checklist_item' }],
                uploads: 0
            };
            
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const videos = result.current.getVideosForDate('2024-01-17');
            
            expect(videos).toHaveLength(0);
        });
    });

    describe('getChecklistItemsForDate', () => {
        it('should return only checklist items', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const items = result.current.getChecklistItemsForDate('2024-01-15');
            
            expect(items).toHaveLength(1);
            expect(items[0].type).toBe('checklist_item');
        });
    });

    describe('removeHistoryItem', () => {
        it('should remove video from uploadedVideos', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            act(() => {
                result.current.removeHistoryItem('2024-01-15', 'video1');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            expect(newState.history['2024-01-15'].uploadedVideos).toHaveLength(0);
            expect(newState.history['2024-01-15'].uploads).toBe(0);
        });

        it('should not modify state if date does not exist', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            act(() => {
                result.current.removeHistoryItem('2024-01-20', 'video1');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            expect(newState).toEqual(mockState);
        });
    });

    describe('moveVideoInHistory', () => {
        it('should move video from one date to another', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            act(() => {
                result.current.moveVideoInHistory('video1', '2024-01-15', '2024-01-16');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            // Video removed from source
            const sourceVideos = newState.history['2024-01-15'].completedItems.filter(
                i => i.id === 'video1'
            );
            expect(sourceVideos).toHaveLength(0);
            
            // Video added to destination
            const destVideos = newState.history['2024-01-16'].completedItems.filter(
                i => i.id === 'video1'
            );
            expect(destVideos).toHaveLength(1);
        });

        it('should create destination date if it does not exist', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            act(() => {
                result.current.moveVideoInHistory('video1', '2024-01-15', '2024-01-20');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            expect(newState.history['2024-01-20']).toBeDefined();
            expect(newState.history['2024-01-20'].completedItems).toHaveLength(1);
        });

        it('should not modify state if video does not exist', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            act(() => {
                result.current.moveVideoInHistory('nonexistent', '2024-01-15', '2024-01-16');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            expect(newState).toEqual(mockState);
        });
    });

    describe('getTotalUploadsForMonth', () => {
        it('should sum uploads for the month', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const total = result.current.getTotalUploadsForMonth(2024, 1);
            
            expect(total).toBe(2); // 1 + 1 from both dates
        });

        it('should return 0 for month with no uploads', () => {
            const { result } = renderHook(() => useCalendarHistory(mockState, mockSetState));
            
            const total = result.current.getTotalUploadsForMonth(2024, 2);
            
            expect(total).toBe(0);
        });
    });
});
