import { API_URL } from '../config/api';

/**
 * Backend API Client for persistence layer
 * Implements offline-first architecture with retry logic and pending operations queue
 */

// Sync state management
const syncState = {
  lastSyncedAt: null,
  pendingChanges: [],
  syncStatus: 'idle', // 'idle' | 'syncing' | 'error'
};

// Configuration
const CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  storageKey: 'viralcuts_pending_changes',
};

/**
 * Load pending changes from localStorage
 */
function loadPendingChanges() {
  try {
    const stored = localStorage.getItem(CONFIG.storageKey);
    if (stored) {
      syncState.pendingChanges = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load pending changes:', error);
    syncState.pendingChanges = [];
  }
}

/**
 * Save pending changes to localStorage
 */
function savePendingChanges() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(syncState.pendingChanges));
  } catch (error) {
    console.error('Failed to save pending changes:', error);
  }
}

/**
 * Add a pending change to the queue
 */
function addPendingChange(change) {
  const pendingChange = {
    id: crypto.randomUUID(),
    ...change,
    timestamp: new Date().toISOString(),
  };
  syncState.pendingChanges.push(pendingChange);
  savePendingChanges();
  return pendingChange;
}

/**
 * Remove a pending change from the queue
 */
function removePendingChange(id) {
  syncState.pendingChanges = syncState.pendingChanges.filter(c => c.id !== id);
  savePendingChanges();
}

/**
 * Calculate delay with exponential backoff
 */
function calculateBackoff(attempt) {
  const delay = Math.min(
    CONFIG.baseDelay * Math.pow(2, attempt),
    CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Sleep for a given duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors, 5xx errors)
 */
function isRetryableError(error, status) {
  if (!navigator.onLine) return true;
  if (status >= 500 && status < 600) return true;
  if (error.message === 'Failed to fetch') return true;
  if (error.message.includes('NetworkError')) return true;
  return false;
}

/**
 * Fetch wrapper with authentication, retry logic, and error handling
 */
async function fetchWithRetry(endpoint, options = {}, retries = CONFIG.maxRetries) {
  const url = `${API_URL}${endpoint}`;
  
  const defaults = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send cookies for session auth
  };

  const config = {
    ...defaults,
    ...options,
    headers: {
      ...defaults.headers,
      ...options.headers,
    },
  };

  let lastError;
  let lastStatus;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);
      lastStatus = response.status;

      if (!response.ok) {
        if (response.status === 401) {
          throw new BackendError('Unauthorized', 401, 'AUTH_ERROR');
        }
        
        const errorData = await response.json().catch(() => ({}));
        const error = new BackendError(
          errorData.error || `Request failed with status ${response.status}`,
          response.status,
          'API_ERROR'
        );

        // Don't retry client errors (4xx) except for rate limiting
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }

        lastError = error;
      } else {
        // Success
        syncState.lastSyncedAt = new Date();
        syncState.syncStatus = 'idle';
        return response.json();
      }
    } catch (error) {
      lastError = error;
      
      // If it's already a BackendError with non-retryable status, throw immediately
      if (error instanceof BackendError && !isRetryableError(error, error.status)) {
        throw error;
      }
    }

    // Check if we should retry
    if (attempt < retries && isRetryableError(lastError, lastStatus)) {
      const delay = calculateBackoff(attempt);
      console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  // All retries exhausted
  syncState.syncStatus = 'error';
  throw lastError || new BackendError('Request failed after retries', 0, 'NETWORK_ERROR');
}

/**
 * Custom error class for backend errors
 */
export class BackendError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Execute an operation with offline fallback
 * If offline or request fails, queue the operation for later sync
 */
async function executeWithOfflineFallback(operation, fallbackData = null) {
  // Check if online
  if (!navigator.onLine) {
    if (operation.type && operation.action) {
      addPendingChange(operation);
    }
    return fallbackData;
  }

  try {
    return await operation.execute();
  } catch (error) {
    // If network error, queue for later
    if (isRetryableError(error, error.status)) {
      if (operation.type && operation.action) {
        addPendingChange(operation);
      }
      return fallbackData;
    }
    throw error;
  }
}

// Initialize pending changes from storage
loadPendingChanges();

// ============================================
// Progress API
// ============================================

export const progressAPI = {
  /**
   * Get user's journey progress
   */
  async get() {
    return fetchWithRetry('/api/progress', { method: 'GET' });
  },

  /**
   * Update journey progress
   */
  async update(data) {
    return fetchWithRetry('/api/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete a milestone
   */
  async completeMilestone(milestoneId, points = 0) {
    return fetchWithRetry('/api/progress/milestone', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, points }),
    });
  },
};

// ============================================
// Uploads API
// ============================================

export const uploadsAPI = {
  /**
   * List upload queue
   */
  async list() {
    return fetchWithRetry('/api/uploads', { method: 'GET' });
  },

  /**
   * Add to upload queue
   */
  async add(upload) {
    return fetchWithRetry('/api/uploads', {
      method: 'POST',
      body: JSON.stringify(upload),
    });
  },

  /**
   * Update upload status
   */
  async update(id, data) {
    return fetchWithRetry(`/api/uploads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove from queue
   */
  async remove(id) {
    return fetchWithRetry(`/api/uploads/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// Achievements API
// ============================================

export const achievementsAPI = {
  /**
   * List user achievements
   */
  async list() {
    return fetchWithRetry('/api/achievements', { method: 'GET' });
  },

  /**
   * Unlock achievement
   */
  async unlock(achievementId) {
    return fetchWithRetry('/api/achievements', {
      method: 'POST',
      body: JSON.stringify({ achievementId }),
    });
  },
};

// ============================================
// Settings API
// ============================================

export const settingsAPI = {
  /**
   * Get user settings
   */
  async get() {
    return fetchWithRetry('/api/settings', { method: 'GET' });
  },

  /**
   * Update settings
   */
  async update(data) {
    return fetchWithRetry('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// Videos API
// ============================================

export const videosAPI = {
  /**
   * List user videos
   */
  async list() {
    return fetchWithRetry('/api/videos', { method: 'GET' });
  },
};

// ============================================
// Sync Management
// ============================================

export const syncManager = {
  /**
   * Get current sync state
   */
  getState() {
    return { ...syncState };
  },

  /**
   * Get pending changes count
   */
  getPendingCount() {
    return syncState.pendingChanges.length;
  },

  /**
   * Process all pending changes
   */
  async processPendingChanges() {
    if (syncState.pendingChanges.length === 0) return { processed: 0, failed: 0 };
    if (!navigator.onLine) return { processed: 0, failed: 0, offline: true };

    syncState.syncStatus = 'syncing';
    let processed = 0;
    let failed = 0;

    // Process changes in order
    const changesToProcess = [...syncState.pendingChanges];
    
    for (const change of changesToProcess) {
      try {
        await processChange(change);
        removePendingChange(change.id);
        processed++;
      } catch (error) {
        console.error('Failed to process pending change:', change, error);
        failed++;
        // Keep the change in queue for later retry
      }
    }

    syncState.syncStatus = failed > 0 ? 'error' : 'idle';
    return { processed, failed };
  },

  /**
   * Clear all pending changes
   */
  clearPending() {
    syncState.pendingChanges = [];
    savePendingChanges();
  },

  /**
   * Add listener for online status to auto-sync
   */
  enableAutoSync() {
    window.addEventListener('online', async () => {
      console.log('Connection restored, syncing pending changes...');
      await this.processPendingChanges();
    });
  },
};

/**
 * Process a single pending change
 */
async function processChange(change) {
  const { type, action, data } = change;

  switch (type) {
    case 'progress':
      if (action === 'update') {
        return progressAPI.update(data);
      } else if (action === 'milestone') {
        return progressAPI.completeMilestone(data.milestoneId, data.points);
      }
      break;

    case 'upload':
      if (action === 'create') {
        return uploadsAPI.add(data);
      } else if (action === 'update') {
        return uploadsAPI.update(data.id, data);
      } else if (action === 'delete') {
        return uploadsAPI.remove(data.id);
      }
      break;

    case 'achievement':
      if (action === 'create') {
        return achievementsAPI.unlock(data.achievementId);
      }
      break;

    case 'settings':
      if (action === 'update') {
        return settingsAPI.update(data);
      }
      break;

    default:
      console.warn('Unknown change type:', type);
  }
}

// ============================================
// Offline-First Wrappers
// ============================================

export const offlineFirst = {
  /**
   * Update progress with offline support
   */
  async updateProgress(data, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'progress',
        action: 'update',
        data,
        execute: () => progressAPI.update(data),
      },
      localFallback
    );
  },

  /**
   * Complete milestone with offline support
   */
  async completeMilestone(milestoneId, points, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'progress',
        action: 'milestone',
        data: { milestoneId, points },
        execute: () => progressAPI.completeMilestone(milestoneId, points),
      },
      localFallback
    );
  },

  /**
   * Add upload with offline support
   */
  async addUpload(upload, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'upload',
        action: 'create',
        data: upload,
        execute: () => uploadsAPI.add(upload),
      },
      localFallback
    );
  },

  /**
   * Update upload with offline support
   */
  async updateUpload(id, data, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'upload',
        action: 'update',
        data: { id, ...data },
        execute: () => uploadsAPI.update(id, data),
      },
      localFallback
    );
  },

  /**
   * Remove upload with offline support
   */
  async removeUpload(id, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'upload',
        action: 'delete',
        data: { id },
        execute: () => uploadsAPI.remove(id),
      },
      localFallback
    );
  },

  /**
   * Unlock achievement with offline support
   */
  async unlockAchievement(achievementId, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'achievement',
        action: 'create',
        data: { achievementId },
        execute: () => achievementsAPI.unlock(achievementId),
      },
      localFallback
    );
  },

  /**
   * Update settings with offline support
   */
  async updateSettings(data, localFallback) {
    return executeWithOfflineFallback(
      {
        type: 'settings',
        action: 'update',
        data,
        execute: () => settingsAPI.update(data),
      },
      localFallback
    );
  },
};

// ============================================
// Combined Backend API Export
// ============================================

export const backendAPI = {
  progress: progressAPI,
  uploads: uploadsAPI,
  achievements: achievementsAPI,
  settings: settingsAPI,
  videos: videosAPI,
  sync: syncManager,
  offline: offlineFirst,
  BackendError,
};

// ============================================
// Named exports for useSupabaseDashboard
// ============================================

export async function getSession() {
  return fetchWithRetry('/api/auth/get-session', { method: 'GET' });
}

export async function getQueue() {
  return uploadsAPI.list();
}

export async function getHistory() {
  return videosAPI.list();
}

export async function getSettings() {
  return settingsAPI.get();
}

export async function saveSettings(data) {
  return settingsAPI.update(data);
}

export async function addToQueue(item) {
  return uploadsAPI.add(item);
}

export async function removeFromQueue(id) {
  return uploadsAPI.remove(id);
}

export default backendAPI;
