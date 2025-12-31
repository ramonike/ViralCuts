import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  progressAPI,
  uploadsAPI,
  achievementsAPI,
  settingsAPI,
  videosAPI,
  syncManager,
  offlineFirst,
  BackendError,
} from './backend';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
let isOnline = true;
Object.defineProperty(navigator, 'onLine', {
  get: () => isOnline,
  configurable: true,
});

describe('Backend API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isOnline = true;
    localStorage.clear();
    syncManager.clearPending();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Progress API', () => {
    it('should fetch user progress', async () => {
      const mockProgress = {
        id: 'prog1',
        currentStage: 'setup',
        completedMilestones: ['milestone1'],
        experienceLevel: 'beginner',
        totalPoints: 100,
        currentStreak: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProgress),
      });

      const result = await progressAPI.get();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/progress'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockProgress);
    });

    it('should update user progress', async () => {
      const updateData = { currentStage: 'growth', totalPoints: 200 };
      const mockResponse = { ...updateData, id: 'prog1' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await progressAPI.update(updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/progress'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(updateData),
        })
      );
      expect(result.currentStage).toBe('growth');
    });

    it('should complete a milestone', async () => {
      const mockResponse = {
        id: 'prog1',
        completedMilestones: ['milestone1', 'milestone2'],
        totalPoints: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await progressAPI.completeMilestone('milestone2', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/progress/milestone'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ milestoneId: 'milestone2', points: 50 }),
        })
      );
      expect(result.completedMilestones).toContain('milestone2');
    });
  });

  describe('Uploads API', () => {
    it('should list uploads', async () => {
      const mockUploads = [
        { id: 'up1', platform: 'YouTube', status: 'pending' },
        { id: 'up2', platform: 'TikTok', status: 'completed' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUploads),
      });

      const result = await uploadsAPI.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/uploads'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toHaveLength(2);
    });

    it('should add upload to queue', async () => {
      const newUpload = { platform: 'YouTube', status: 'pending' };
      const mockResponse = { id: 'up3', ...newUpload };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await uploadsAPI.add(newUpload);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/uploads'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newUpload),
        })
      );
      expect(result.id).toBe('up3');
    });

    it('should update upload status', async () => {
      const updateData = { status: 'completed' };
      const mockResponse = { id: 'up1', status: 'completed' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await uploadsAPI.update('up1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/uploads/up1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result.status).toBe('completed');
    });

    it('should remove upload from queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await uploadsAPI.remove('up1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/uploads/up1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Achievements API', () => {
    it('should list achievements', async () => {
      const mockAchievements = [
        { id: 'ach1', achievementId: 'first_video', unlockedAt: '2024-01-01' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAchievements),
      });

      const result = await achievementsAPI.list();

      expect(result).toHaveLength(1);
      expect(result[0].achievementId).toBe('first_video');
    });

    it('should unlock achievement', async () => {
      const mockResponse = { id: 'ach2', achievementId: 'streak_7' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await achievementsAPI.unlock('streak_7');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/achievements'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ achievementId: 'streak_7' }),
        })
      );
      expect(result.achievementId).toBe('streak_7');
    });
  });

  describe('Settings API', () => {
    it('should get user settings', async () => {
      const mockSettings = {
        id: 'set1',
        theme: 'dark',
        notifications: true,
        defaultPrivacy: 'private',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSettings),
      });

      const result = await settingsAPI.get();

      expect(result.theme).toBe('dark');
      expect(result.notifications).toBe(true);
    });

    it('should update settings', async () => {
      const updateData = { theme: 'light', notifications: false };
      const mockResponse = { id: 'set1', ...updateData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await settingsAPI.update(updateData);

      expect(result.theme).toBe('light');
      expect(result.notifications).toBe(false);
    });
  });

  describe('Videos API', () => {
    it('should list user videos', async () => {
      const mockVideos = [
        { id: 'vid1', title: 'Video 1', status: 'published' },
        { id: 'vid2', title: 'Video 2', status: 'draft' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockVideos),
      });

      const result = await videosAPI.list();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Video 1');
    });
  });

  describe('Error Handling', () => {
    it('should throw BackendError on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await expect(progressAPI.get()).rejects.toThrow(BackendError);
    });

    it('should throw BackendError on 400 bad request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid data' }),
      });

      await expect(progressAPI.update({})).rejects.toThrow(BackendError);
    });

    it('should retry on 500 server error', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'prog1' }),
      });

      const result = await progressAPI.get();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('prog1');
    });
  });

  describe('Offline Support', () => {
    it('should queue changes when offline', async () => {
      isOnline = false;

      const result = await offlineFirst.updateProgress(
        { currentStage: 'growth' },
        { currentStage: 'growth', local: true }
      );

      expect(result).toEqual({ currentStage: 'growth', local: true });
      expect(syncManager.getPendingCount()).toBe(1);
    });

    it('should return fallback data when offline', async () => {
      isOnline = false;
      const fallbackData = { theme: 'dark', local: true };

      const result = await offlineFirst.updateSettings(
        { theme: 'light' },
        fallbackData
      );

      expect(result).toEqual(fallbackData);
    });

    it('should process pending changes when back online', async () => {
      // Add pending change while offline
      isOnline = false;
      await offlineFirst.updateProgress(
        { currentStage: 'growth' },
        { local: true }
      );

      expect(syncManager.getPendingCount()).toBe(1);

      // Come back online
      isOnline = true;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'prog1', currentStage: 'growth' }),
      });

      const result = await syncManager.processPendingChanges();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(syncManager.getPendingCount()).toBe(0);
    });
  });

  describe('Sync Manager', () => {
    it('should track sync state', () => {
      const state = syncManager.getState();

      expect(state).toHaveProperty('lastSyncedAt');
      expect(state).toHaveProperty('pendingChanges');
      expect(state).toHaveProperty('syncStatus');
    });

    it('should clear pending changes', async () => {
      isOnline = false;
      await offlineFirst.updateProgress({ currentStage: 'growth' }, {});

      expect(syncManager.getPendingCount()).toBeGreaterThan(0);

      syncManager.clearPending();

      expect(syncManager.getPendingCount()).toBe(0);
    });
  });
});
