import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadState, saveState, defaultState, exportCSV } from './useStorage';

describe('useStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.getItem.mockReturnValue(null);
    });

    describe('loadState', () => {
        it('should return defaultState when localStorage is empty', () => {
            localStorage.getItem.mockReturnValue(null);
            
            const state = loadState();
            
            expect(state).toEqual(defaultState);
        });

        it('should load and merge state from localStorage', () => {
            const savedState = {
                settings: { channelName: 'TestChannel', dailyGoal: 5 },
                history: { '2024-01-01': { completedItems: [], uploads: 2 } }
            };
            localStorage.getItem.mockReturnValue(JSON.stringify(savedState));
            
            const state = loadState();
            
            expect(state.settings.channelName).toBe('TestChannel');
            expect(state.settings.dailyGoal).toBe(5);
            expect(state.settings.timezone).toBe(defaultState.settings.timezone); // Default preserved
            expect(state.history['2024-01-01'].uploads).toBe(2);
        });

        it('should handle corrupted localStorage data', () => {
            localStorage.getItem.mockReturnValue('invalid json');
            
            const state = loadState();
            
            expect(state).toEqual(defaultState);
        });

        it('should preserve auth connectedAccounts', () => {
            const savedState = {
                auth: {
                    connectedAccounts: [{ id: 'acc1', name: 'Test Account' }],
                    activeAccountId: 'acc1'
                }
            };
            localStorage.getItem.mockReturnValue(JSON.stringify(savedState));
            
            const state = loadState();
            
            expect(state.auth.connectedAccounts).toHaveLength(1);
            expect(state.auth.activeAccountId).toBe('acc1');
        });
    });

    describe('saveState', () => {
        it('should save state to localStorage', () => {
            const state = { ...defaultState, settings: { ...defaultState.settings, channelName: 'NewChannel' } };
            
            saveState(state);
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'viralcuts_workflow_v1',
                expect.any(String)
            );
        });

        it('should handle localStorage errors gracefully', () => {
            localStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });
            
            // Should not throw
            expect(() => saveState(defaultState)).not.toThrow();
        });
    });

    describe('exportCSV', () => {
        it('should create and download CSV file', () => {
            const mockClick = vi.fn();
            const mockAnchor = { href: '', download: '', click: mockClick };
            vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
            
            const rows = [
                { name: 'Video 1', views: 100 },
                { name: 'Video 2', views: 200 }
            ];
            
            exportCSV(rows, 'test.csv');
            
            expect(mockClick).toHaveBeenCalled();
            expect(mockAnchor.download).toBe('test.csv');
        });

        it('should handle empty rows', () => {
            const mockClick = vi.fn();
            const mockAnchor = { href: '', download: '', click: mockClick };
            vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
            
            exportCSV([], 'empty.csv');
            
            expect(mockClick).toHaveBeenCalled();
        });
    });
});
