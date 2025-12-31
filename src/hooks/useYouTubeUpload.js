/**
 * YouTube Upload Hook
 * Manages upload state, chunked uploads, progress tracking, and resume functionality
 * Requirements: 2.2
 */

import { useState, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks

/**
 * Upload status types
 * @typedef {'idle' | 'initiating' | 'uploading' | 'paused' | 'processing' | 'complete' | 'error'} UploadStatus
 */

/**
 * Upload state
 * @typedef {Object} UploadState
 * @property {string|null} uploadId - Server-side upload ID
 * @property {string|null} sessionUri - YouTube resumable session URI
 * @property {number} progress - Upload progress (0-100)
 * @property {number} bytesUploaded - Bytes uploaded so far
 * @property {number} totalBytes - Total file size
 * @property {UploadStatus} status - Current upload status
 * @property {string|null} videoId - YouTube video ID (after completion)
 * @property {string|null} error - Error message if any
 */

/**
 * Hook for managing YouTube video uploads with chunked upload support
 * @param {Object} options - Hook options
 * @param {string} options.accountId - YouTube account ID (optional)
 * @param {number} options.chunkSize - Chunk size in bytes (default: 8MB)
 * @returns {Object} Upload controls and state
 */
export function useYouTubeUpload(options = {}) {
  const { accountId, chunkSize = DEFAULT_CHUNK_SIZE } = options;

  const [state, setState] = useState({
    uploadId: null,
    sessionUri: null,
    progress: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    status: 'idle',
    videoId: null,
    error: null,
  });

  // Refs for managing upload state across renders
  const abortControllerRef = useRef(null);
  const isPausedRef = useRef(false);
  const fileRef = useRef(null);
  const metadataRef = useRef(null);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isPausedRef.current = false;
    fileRef.current = null;
    metadataRef.current = null;
    setState({
      uploadId: null,
      sessionUri: null,
      progress: 0,
      bytesUploaded: 0,
      totalBytes: 0,
      status: 'idle',
      videoId: null,
      error: null,
    });
  }, []);

  /**
   * Initiate upload session with YouTube
   */
  const initiateUpload = useCallback(async (file, metadata) => {
    const response = await fetch(`${API_URL}/api/youtube/upload/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...metadata,
        fileSize: file.size,
        mimeType: file.type,
        accountId,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to initiate upload');
    }

    return response.json();
  }, [accountId]);

  /**
   * Upload a single chunk
   */
  const uploadChunk = useCallback(async (sessionUri, uploadId, chunk, startByte, totalBytes) => {
    const endByte = startByte + chunk.size - 1;

    const response = await fetch(`${API_URL}/api/youtube/upload/chunk`, {
      method: 'POST',
      headers: {
        'Content-Range': `bytes ${startByte}-${endByte}/${totalBytes}`,
        'X-Session-Uri': sessionUri,
        'X-Upload-Id': uploadId,
        'X-Account-Id': accountId || '',
      },
      credentials: 'include',
      body: chunk,
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || 'Chunk upload failed');
      error.retryable = data.retryable;
      throw error;
    }

    return response.json();
  }, [accountId]);

  /**
   * Upload file in chunks
   */
  const uploadChunks = useCallback(async (file, sessionUri, uploadId, startFrom = 0) => {
    const totalBytes = file.size;
    let bytesUploaded = startFrom;

    while (bytesUploaded < totalBytes) {
      // Check if paused
      if (isPausedRef.current) {
        setState(prev => ({ ...prev, status: 'paused' }));
        return { paused: true, bytesUploaded };
      }

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const chunkEnd = Math.min(bytesUploaded + chunkSize, totalBytes);
      const chunk = file.slice(bytesUploaded, chunkEnd);

      const result = await uploadChunk(sessionUri, uploadId, chunk, bytesUploaded, totalBytes);

      bytesUploaded = result.bytesUploaded;
      const progress = Math.round((bytesUploaded / totalBytes) * 100);

      setState(prev => ({
        ...prev,
        bytesUploaded,
        progress,
        status: result.status === 'complete' ? 'processing' : 'uploading',
        videoId: result.videoId || prev.videoId,
      }));

      if (result.status === 'complete') {
        return { complete: true, videoId: result.videoId, bytesUploaded };
      }
    }

    return { complete: true, bytesUploaded };
  }, [chunkSize, uploadChunk]);

  /**
   * Start upload
   * @param {File} file - Video file to upload
   * @param {Object} metadata - Video metadata
   */
  const upload = useCallback(async (file, metadata) => {
    try {
      reset();
      fileRef.current = file;
      metadataRef.current = metadata;
      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        status: 'initiating',
        totalBytes: file.size,
        error: null,
      }));

      // Initiate upload session
      const session = await initiateUpload(file, metadata);

      setState(prev => ({
        ...prev,
        uploadId: session.uploadId,
        sessionUri: session.sessionUri,
        status: 'uploading',
      }));

      // Upload chunks
      const result = await uploadChunks(file, session.sessionUri, session.uploadId);

      if (result.complete) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: 100,
          videoId: result.videoId,
        }));

        return {
          status: 'success',
          videoId: result.videoId,
          url: result.videoId ? `https://youtube.com/watch?v=${result.videoId}` : null,
        };
      }

      return { status: 'paused' };
    } catch (error) {
      if (error.message === 'Upload cancelled') {
        setState(prev => ({ ...prev, status: 'idle', error: null }));
        return { status: 'cancelled' };
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));

      return { status: 'error', error: error.message };
    }
  }, [reset, initiateUpload, uploadChunks]);

  /**
   * Pause upload
   */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  /**
   * Resume upload
   */
  const resume = useCallback(async () => {
    if (!state.sessionUri || !fileRef.current) {
      return { status: 'error', error: 'No upload to resume' };
    }

    try {
      isPausedRef.current = false;
      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, status: 'uploading', error: null }));

      // Check current upload status with server
      const response = await fetch(`${API_URL}/api/youtube/upload/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploadId: state.uploadId,
          sessionUri: state.sessionUri,
          totalBytes: fileRef.current.size,
          accountId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to resume upload');
      }

      const resumeStatus = await response.json();

      if (resumeStatus.status === 'expired') {
        // Session expired, need to restart
        return upload(fileRef.current, metadataRef.current);
      }

      if (resumeStatus.status === 'complete') {
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: 100,
          videoId: resumeStatus.videoId,
        }));
        return { status: 'success', videoId: resumeStatus.videoId };
      }

      // Continue uploading from where we left off
      const result = await uploadChunks(
        fileRef.current,
        state.sessionUri,
        state.uploadId,
        resumeStatus.resumeFrom || resumeStatus.bytesUploaded
      );

      if (result.complete) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: 100,
          videoId: result.videoId,
        }));
        return { status: 'success', videoId: result.videoId };
      }

      return { status: 'paused' };
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      return { status: 'error', error: error.message };
    }
  }, [state.sessionUri, state.uploadId, accountId, upload, uploadChunks]);

  /**
   * Cancel upload
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isPausedRef.current = false;
    setState(prev => ({
      ...prev,
      status: 'idle',
      error: null,
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    upload,
    pause,
    resume,
    cancel,
    reset,
    
    // Computed
    isUploading: state.status === 'uploading' || state.status === 'initiating',
    isPaused: state.status === 'paused',
    isComplete: state.status === 'complete',
    isError: state.status === 'error',
    canResume: state.status === 'paused' && !!state.sessionUri,
  };
}

export default useYouTubeUpload;
