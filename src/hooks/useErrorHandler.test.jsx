/**
 * Error Handler Hook Tests
 * Tests for centralized error handling
 * Requirements: 2.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useErrorHandler } from './useErrorHandler';
import { NotificationProvider } from '../contexts/NotificationContext';

// Wrapper component with NotificationProvider
const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
);

describe('useErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleError', () => {
        it('should log error to console', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleError(new Error('Test error'));
            });

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle string errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleError('String error message');
            });

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle Error objects', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleError(new Error('Error object'));
            });

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should not show notification when silent is true', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleError(new Error('Silent error'), { silent: true });
            });

            // Should still log but not show notification
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should include context in log message', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleError(new Error('Test'), { context: 'upload' });
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('upload'),
                expect.anything()
            );
        });

        it('should return error code and message', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError(new Error('Test error'));
            });

            expect(errorResult).toBeDefined();
            expect(errorResult.message).toBeDefined();
        });

        it('should recognize known error codes', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError({ code: 'NETWORK_ERROR' });
            });

            expect(errorResult.errorCode).toBe('NETWORK_ERROR');
        });

        it('should use fallback message for unknown errors', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError(
                    new Error('Unknown error'),
                    { fallbackMessage: 'Custom fallback' }
                );
            });

            expect(errorResult.message).toBeDefined();
        });
    });

    describe('withErrorHandling', () => {
        it('should wrap async function with error handling', async () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            const successFn = vi.fn().mockResolvedValue('success');
            const wrappedFn = result.current.withErrorHandling(successFn);

            const response = await wrappedFn();
            expect(response).toBe('success');
            expect(successFn).toHaveBeenCalled();
        });

        it('should catch and handle errors from wrapped function', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            const failingFn = vi.fn().mockRejectedValue(new Error('Async error'));
            const wrappedFn = result.current.withErrorHandling(failingFn);

            await expect(wrappedFn()).rejects.toThrow('Async error');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should pass arguments to wrapped function', async () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            const fn = vi.fn().mockResolvedValue('result');
            const wrappedFn = result.current.withErrorHandling(fn);

            await wrappedFn('arg1', 'arg2');
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should apply options to error handling', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            const failingFn = vi.fn().mockRejectedValue(new Error('Error'));
            const wrappedFn = result.current.withErrorHandling(failingFn, {
                context: 'test-context',
            });

            await expect(wrappedFn()).rejects.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-context'),
                expect.anything()
            );
        });
    });

    describe('handleYouTubeError', () => {
        it('should handle quota exceeded errors', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorType;
            act(() => {
                errorType = result.current.handleYouTubeError(new Error('quota exceeded'));
            });

            expect(errorType).toBe('quota');
        });

        it('should handle auth/token errors', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorType;
            act(() => {
                errorType = result.current.handleYouTubeError(new Error('auth token expired'));
            });

            expect(errorType).toBe('auth');
        });

        it('should return unknown for unrecognized errors', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorType;
            act(() => {
                errorType = result.current.handleYouTubeError(new Error('random error'));
            });

            expect(errorType).toBe('unknown');
        });

        it('should handle errors without message', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorType;
            act(() => {
                errorType = result.current.handleYouTubeError({});
            });

            expect(errorType).toBe('unknown');
        });
    });

    describe('handleUploadError', () => {
        it('should handle upload errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleUploadError(new Error('Upload failed'));
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('upload'),
                expect.anything()
            );
        });

        it('should accept retry callback', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const retryFn = vi.fn();

            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            act(() => {
                result.current.handleUploadError(new Error('Upload failed'), retryFn);
            });

            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('returned functions', () => {
        it('should return all error handling functions', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            expect(typeof result.current.handleError).toBe('function');
            expect(typeof result.current.withErrorHandling).toBe('function');
            expect(typeof result.current.handleYouTubeError).toBe('function');
            expect(typeof result.current.handleUploadError).toBe('function');
        });
    });

    describe('error code extraction', () => {
        it('should extract code from error.code', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError({ code: 'TIMEOUT' });
            });

            expect(errorResult.errorCode).toBe('TIMEOUT');
        });

        it('should extract code from error.response.data.code', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError({
                    response: { data: { code: 'UNAUTHORIZED' } }
                });
            });

            expect(errorResult.errorCode).toBe('UNAUTHORIZED');
        });

        it('should extract code from error message', () => {
            const { result } = renderHook(() => useErrorHandler(), { wrapper });

            let errorResult;
            act(() => {
                errorResult = result.current.handleError(new Error('quotaExceeded error'));
            });

            expect(errorResult.errorCode).toBe('quotaExceeded');
        });
    });
});
