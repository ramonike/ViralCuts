import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChecklists } from './useChecklists';
import { defaultChecklists } from './useStorage';

describe('useChecklists', () => {
    let mockState;
    let mockSetState;

    beforeEach(() => {
        mockState = {
            checklists: JSON.parse(JSON.stringify(defaultChecklists)),
            history: {}
        };
        mockSetState = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockState = updater(mockState);
            } else {
                mockState = updater;
            }
        });
    });

    describe('toggleItem', () => {
        it('should toggle item done status', () => {
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            act(() => {
                result.current.toggleItem('setup', 'g_account');
            });
            
            expect(mockSetState).toHaveBeenCalled();
        });

        it('should add item to history when marked done', () => {
            // Item starts as not done (default)
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            act(() => {
                result.current.toggleItem('setup', 'g_account');
            });
            
            // Verify setState was called
            expect(mockSetState).toHaveBeenCalled();
            
            // Get the updater function and execute it
            const setStateCall = mockSetState.mock.calls[0][0];
            expect(typeof setStateCall).toBe('function');
            
            // Create a fresh state to pass to the updater
            const freshState = {
                checklists: JSON.parse(JSON.stringify(defaultChecklists)),
                history: {}
            };
            
            const newState = setStateCall(freshState);
            const today = new Date().toLocaleDateString('en-CA');
            
            // After toggle from false -> true, item should be done
            const setupChecklist = newState.checklists.find(c => c.id === 'setup');
            const item = setupChecklist.items.find(i => i.id === 'g_account');
            expect(item.done).toBe(true);
            
            // History should have the item
            expect(newState.history[today]).toBeDefined();
            expect(newState.history[today].completedItems.length).toBeGreaterThan(0);
        });

        it('should remove item from history when unmarked', () => {
            const today = new Date().toLocaleDateString('en-CA');
            
            // Create state with item already done
            const stateWithDoneItem = {
                checklists: JSON.parse(JSON.stringify(defaultChecklists)),
                history: {
                    [today]: {
                        completedItems: [{ id: 'g_account', title: 'Test', type: 'checklist_item' }],
                        uploads: 0
                    }
                }
            };
            stateWithDoneItem.checklists[0].items[0].done = true;
            
            const { result } = renderHook(() => useChecklists(stateWithDoneItem, mockSetState));
            
            act(() => {
                result.current.toggleItem('setup', 'g_account');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(stateWithDoneItem);
            
            // After toggle from true -> false, item should not be done
            const setupChecklist = newState.checklists.find(c => c.id === 'setup');
            const item = setupChecklist.items.find(i => i.id === 'g_account');
            expect(item.done).toBe(false);
            
            // History should not have the item
            expect(newState.history[today].completedItems).toHaveLength(0);
        });
    });

    describe('addChecklistItem', () => {
        it('should add new item to checklist', () => {
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            act(() => {
                result.current.addChecklistItem('setup', 'New custom item');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            const setupChecklist = newState.checklists.find(c => c.id === 'setup');
            const newItem = setupChecklist.items.find(i => i.text === 'New custom item');
            
            expect(newItem).toBeDefined();
            expect(newItem.done).toBe(false);
            expect(newItem.id).toContain('setup_custom_');
        });

        it('should not add empty items', () => {
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            act(() => {
                result.current.addChecklistItem('setup', '   ');
            });
            
            expect(mockSetState).not.toHaveBeenCalled();
        });
    });

    describe('resetChecklist', () => {
        it('should reset all items to not done', () => {
            // Mark some items as done
            mockState.checklists[0].items[0].done = true;
            mockState.checklists[0].items[1].done = true;
            
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            act(() => {
                result.current.resetChecklist('setup');
            });
            
            const setStateCall = mockSetState.mock.calls[0][0];
            const newState = setStateCall(mockState);
            
            const setupChecklist = newState.checklists.find(c => c.id === 'setup');
            const allNotDone = setupChecklist.items.every(item => !item.done);
            
            expect(allNotDone).toBe(true);
        });
    });

    describe('getChecklistProgress', () => {
        it('should return 0 for empty checklist', () => {
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            const progress = result.current.getChecklistProgress('setup');
            
            expect(progress).toBe(0);
        });

        it('should calculate correct percentage', () => {
            // Mark 2 of 5 items as done (40%)
            mockState.checklists[0].items[0].done = true;
            mockState.checklists[0].items[1].done = true;
            
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            const progress = result.current.getChecklistProgress('setup');
            
            expect(progress).toBe(40);
        });

        it('should return 100 when all items done', () => {
            mockState.checklists[0].items.forEach(item => item.done = true);
            
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            const progress = result.current.getChecklistProgress('setup');
            
            expect(progress).toBe(100);
        });

        it('should return 0 for non-existent checklist', () => {
            const { result } = renderHook(() => useChecklists(mockState, mockSetState));
            
            const progress = result.current.getChecklistProgress('nonexistent');
            
            expect(progress).toBe(0);
        });
    });
});
