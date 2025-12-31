/**
 * Pipeline Hook Tests
 * Tests for Opus pipeline job management
 * Requirements: 2.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePipeline } from './usePipeline';

// Mock the Opus API
vi.mock('../api/opus', () => ({
    uploadToOpus: vi.fn(),
    checkProjectStatus: vi.fn(),
    getClips: vi.fn(),
    createProjectFromUrl: vi.fn(),
}));

import { uploadToOpus, checkProjectStatus, getClips, createProjectFromUrl } from '../api/opus';

describe('usePipeline', () => {
    let mockState;
    let mockSetState;

    beforeEach(() => {
        vi.clearAllMocks();

        mockState = {
            pipeline: {
                jobs: [],
            },
            settings: {
                opusApiKey: 'test-api-key',
            },
        };

        mockSetState = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockState = updater(mockState);
            } else {
                mockState = { ...mockState, ...updater };
            }
        });
    });

    describe('initial state', () => {
        it('should return pipeline state', () => {
            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            expect(result.current.pipeline).toBeDefined();
            expect(result.current.jobs).toEqual([]);
        });

        it('should return all pipeline functions', () => {
            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            expect(typeof result.current.startOpusJob).toBe('function');
            expect(typeof result.current.checkOpusJob).toBe('function');
            expect(typeof result.current.removeOpusJob).toBe('function');
            expect(typeof result.current.getJobById).toBe('function');
            expect(typeof result.current.getPendingJobs).toBe('function');
            expect(typeof result.current.getCompletedJobs).toBe('function');
        });
    });

    describe('startOpusJob', () => {
        it('should start job from URL', async () => {
            const mockProject = {
                projectId: 'project-123',
                status: 'pending',
            };
            createProjectFromUrl.mockResolvedValue(mockProject);

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                const project = await result.current.startOpusJob('https://youtube.com/watch?v=test');
            });

            expect(createProjectFromUrl).toHaveBeenCalledWith('https://youtube.com/watch?v=test', 'test-api-key');
            expect(mockSetState).toHaveBeenCalled();
        });

        it('should start job from file', async () => {
            const mockProject = {
                projectId: 'project-456',
                status: 'pending',
            };
            uploadToOpus.mockResolvedValue(mockProject);

            const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.startOpusJob(mockFile);
            });

            expect(uploadToOpus).toHaveBeenCalledWith(mockFile, 'test-api-key');
            expect(mockSetState).toHaveBeenCalled();
        });

        it('should add job to pipeline jobs list', async () => {
            const mockProject = {
                projectId: 'project-789',
                status: 'pending',
            };
            createProjectFromUrl.mockResolvedValue(mockProject);

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.startOpusJob('https://youtube.com/watch?v=test');
            });

            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.pipeline.jobs).toContainEqual(mockProject);
        });

        it('should handle API errors', async () => {
            createProjectFromUrl.mockRejectedValue(new Error('API Error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await expect(
                act(async () => {
                    await result.current.startOpusJob('https://youtube.com/watch?v=test');
                })
            ).rejects.toThrow('API Error');

            consoleSpy.mockRestore();
        });
    });

    describe('checkOpusJob', () => {
        it('should check job status', async () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'processing' },
            ];

            checkProjectStatus.mockResolvedValue({ status: 'processing' });
            getClips.mockResolvedValue([]);

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.checkOpusJob('job-1');
            });

            expect(checkProjectStatus).toHaveBeenCalledWith('job-1', 'test-api-key');
        });

        it('should fetch clips when job is done', async () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-2', status: 'processing' },
            ];

            const mockClips = [
                { id: 'clip-1', url: 'https://example.com/clip1.mp4' },
                { id: 'clip-2', url: 'https://example.com/clip2.mp4' },
            ];

            checkProjectStatus.mockResolvedValue({ status: 'done' });
            getClips.mockResolvedValue(mockClips);

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.checkOpusJob('job-2');
            });

            expect(getClips).toHaveBeenCalledWith('job-2', 'test-api-key');
        });

        it('should update job status in state', async () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-3', status: 'processing' },
            ];

            checkProjectStatus.mockResolvedValue({ status: 'done' });
            getClips.mockResolvedValue([{ id: 'clip-1' }]);

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.checkOpusJob('job-3');
            });

            expect(mockSetState).toHaveBeenCalled();
        });

        it('should not check non-existent job', async () => {
            mockState.pipeline.jobs = [];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.checkOpusJob('non-existent');
            });

            expect(checkProjectStatus).not.toHaveBeenCalled();
        });

        it('should handle check errors gracefully', async () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-4', status: 'processing' },
            ];

            checkProjectStatus.mockRejectedValue(new Error('Check failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            await act(async () => {
                await result.current.checkOpusJob('job-4');
            });

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('removeOpusJob', () => {
        it('should remove job from pipeline', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-to-remove', status: 'done' },
                { projectId: 'job-to-keep', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            act(() => {
                result.current.removeOpusJob('job-to-remove');
            });

            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.pipeline.jobs).toHaveLength(1);
            expect(newState.pipeline.jobs[0].projectId).toBe('job-to-keep');
        });

        it('should handle removing non-existent job', () => {
            mockState.pipeline.jobs = [
                { projectId: 'existing-job', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            act(() => {
                result.current.removeOpusJob('non-existent');
            });

            const lastCall = mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0];
            const newState = typeof lastCall === 'function' ? lastCall(mockState) : lastCall;
            expect(newState.pipeline.jobs).toHaveLength(1);
        });
    });

    describe('getJobById', () => {
        it('should return job by ID', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'pending' },
                { projectId: 'job-2', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const job = result.current.getJobById('job-2');
            expect(job).toEqual({ projectId: 'job-2', status: 'done' });
        });

        it('should return undefined for non-existent job', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'pending' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const job = result.current.getJobById('non-existent');
            expect(job).toBeUndefined();
        });
    });

    describe('getPendingJobs', () => {
        it('should return only pending and processing jobs', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'pending' },
                { projectId: 'job-2', status: 'processing' },
                { projectId: 'job-3', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const pendingJobs = result.current.getPendingJobs();
            expect(pendingJobs).toHaveLength(2);
            expect(pendingJobs.map(j => j.projectId)).toEqual(['job-1', 'job-2']);
        });

        it('should return empty array when no pending jobs', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const pendingJobs = result.current.getPendingJobs();
            expect(pendingJobs).toHaveLength(0);
        });
    });

    describe('getCompletedJobs', () => {
        it('should return only completed jobs', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'pending' },
                { projectId: 'job-2', status: 'done' },
                { projectId: 'job-3', status: 'done' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const completedJobs = result.current.getCompletedJobs();
            expect(completedJobs).toHaveLength(2);
            expect(completedJobs.map(j => j.projectId)).toEqual(['job-2', 'job-3']);
        });

        it('should return empty array when no completed jobs', () => {
            mockState.pipeline.jobs = [
                { projectId: 'job-1', status: 'processing' },
            ];

            const { result } = renderHook(() => usePipeline(mockState, mockSetState));

            const completedJobs = result.current.getCompletedJobs();
            expect(completedJobs).toHaveLength(0);
        });
    });
});
