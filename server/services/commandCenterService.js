/**
 * Command Center Backend Service
 * Handles all database operations for the Command Center functionality
 */

import { prisma } from '../db/prisma.js';

/**
 * Command Center State Service
 */
export class CommandCenterStateService {
  /**
   * Get or create command center state for user
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getOrCreateState(userId) {
    let state = await prisma.commandCenterState.findUnique({
      where: { userId }
    });

    if (!state) {
      state = await prisma.commandCenterState.create({
        data: {
          userId,
          setupCompleted: false,
          completedSetupTasks: [],
          setupProgress: 0,
          focusAreas: ['growth'],
          dailyUploadTarget: 1,
          weeklyUploadTarget: 3,
          enabledFeatures: [
            'enableCommandCenter',
            'enableFocusMode',
            'enableSmartSuggestions',
            'enableNotifications',
            'enableWidgetCustomization'
          ],
          widgetLayout: {
            widgets: [
              { id: 'setup-assistant', visible: true, order: 0 },
              { id: 'quick-actions', visible: true, order: 1 },
              { id: 'daily-planner', visible: true, order: 2 },
              { id: 'progress-dashboard', visible: true, order: 3 },
              { id: 'content-workflow', visible: true, order: 4 },
              { id: 'smart-suggestions', visible: true, order: 5 },
              { id: 'notifications', visible: true, order: 6 }
            ]
          }
        }
      });
    }

    return state;
  }

  /**
   * Update command center state
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateState(userId, updates) {
    return await prisma.commandCenterState.upsert({
      where: { userId },
      update: {
        ...updates,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...updates
      }
    });
  }

  /**
   * Update setup progress
   * @param {string} userId 
   * @param {string} taskId 
   * @returns {Promise<Object>}
   */
  async completeSetupTask(userId, taskId) {
    const state = await this.getOrCreateState(userId);
    
    if (!state.completedSetupTasks.includes(taskId)) {
      const updatedTasks = [...state.completedSetupTasks, taskId];
      const totalTasks = 5; // Based on DEFAULT_SETUP_TASKS
      const progress = Math.round((updatedTasks.length / totalTasks) * 100);
      
      return await this.updateState(userId, {
        completedSetupTasks: updatedTasks,
        setupProgress: progress,
        setupCompleted: progress === 100
      });
    }
    
    return state;
  }

  /**
   * Update widget layout
   * @param {string} userId 
   * @param {Object} layout 
   * @returns {Promise<Object>}
   */
  async updateWidgetLayout(userId, layout) {
    return await this.updateState(userId, {
      widgetLayout: layout
    });
  }

  /**
   * Update user goals and preferences
   * @param {string} userId 
   * @param {Object} goals 
   * @returns {Promise<Object>}
   */
  async updateUserGoals(userId, goals) {
    return await this.updateState(userId, {
      focusAreas: goals.focusAreas || [],
      dailyUploadTarget: goals.dailyUploadTarget || 1,
      weeklyUploadTarget: goals.weeklyUploadTarget || 3
    });
  }
}

/**
 * Daily Tasks Service
 */
export class DailyTasksService {
  /**
   * Get tasks for a specific date
   * @param {string} userId 
   * @param {Date} date 
   * @returns {Promise<Array>}
   */
  async getTasksForDate(userId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.dailyTask.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  }

  /**
   * Create a new daily task
   * @param {string} userId 
   * @param {Object} taskData 
   * @returns {Promise<Object>}
   */
  async createTask(userId, taskData) {
    return await prisma.dailyTask.create({
      data: {
        userId,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        estimatedTime: taskData.estimatedTime,
        expectedOutcome: taskData.expectedOutcome,
        priority: taskData.priority || 5,
        scheduledDate: taskData.scheduledDate || new Date(),
        deadline: taskData.deadline,
        metadata: taskData.metadata || {}
      }
    });
  }

  /**
   * Update task progress
   * @param {string} taskId 
   * @param {number} progress 
   * @returns {Promise<Object>}
   */
  async updateTaskProgress(taskId, progress) {
    return await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        progress: Math.max(0, Math.min(100, progress)),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Complete a task
   * @param {string} taskId 
   * @returns {Promise<Object>}
   */
  async completeTask(taskId) {
    return await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        progress: 100,
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Generate daily tasks based on user goals
   * @param {string} userId 
   * @param {Date} date 
   * @returns {Promise<Array>}
   */
  async generateDailyTasks(userId, date = new Date()) {
    // Get user's command center state for goals
    const stateService = new CommandCenterStateService();
    const state = await stateService.getOrCreateState(userId);
    
    // Check if tasks already exist for this date
    const existingTasks = await this.getTasksForDate(userId, date);
    if (existingTasks.length > 0) {
      return existingTasks;
    }

    // Task templates based on focus areas
    const taskTemplates = [
      {
        type: 'creation',
        title: 'Create new video content',
        description: 'Plan and create engaging video content for your audience',
        estimatedTime: 120,
        expectedOutcome: 'New video ready for editing and upload',
        priority: 8,
        focusAreas: ['growth', 'engagement']
      },
      {
        type: 'optimization',
        title: 'Optimize video metadata',
        description: 'Review and improve titles, descriptions, and tags for better discoverability',
        estimatedTime: 30,
        expectedOutcome: 'Improved SEO and click-through rates',
        priority: 6,
        focusAreas: ['growth', 'monetization']
      },
      {
        type: 'analysis',
        title: 'Review channel analytics',
        description: 'Analyze recent video performance and identify improvement opportunities',
        estimatedTime: 20,
        expectedOutcome: 'Data-driven insights for content strategy',
        priority: 5,
        focusAreas: ['monetization', 'growth']
      },
      {
        type: 'planning',
        title: 'Plan upcoming content',
        description: 'Brainstorm and schedule future video ideas',
        estimatedTime: 45,
        expectedOutcome: 'Content calendar with 3-5 new video ideas',
        priority: 7,
        focusAreas: ['growth', 'engagement']
      }
    ];

    // Filter and prioritize tasks based on user's focus areas
    const userFocusAreas = state.focusAreas || ['growth'];
    const targetTaskCount = Math.min(4, Math.max(2, state.dailyUploadTarget || 2));
    
    const prioritizedTemplates = taskTemplates
      .map(template => ({
        ...template,
        relevanceScore: this.calculateRelevanceScore(template, userFocusAreas)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, targetTaskCount);

    // Create tasks from templates
    const createdTasks = [];
    for (const template of prioritizedTemplates) {
      const task = await this.createTask(userId, {
        title: template.title,
        description: template.description,
        type: template.type,
        estimatedTime: template.estimatedTime,
        expectedOutcome: template.expectedOutcome,
        priority: template.priority,
        scheduledDate: date,
        metadata: {
          generated: true,
          focusAreas: template.focusAreas,
          relevanceScore: template.relevanceScore
        }
      });
      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * Calculate relevance score for task template
   * @param {Object} template 
   * @param {Array} userFocusAreas 
   * @returns {number}
   */
  calculateRelevanceScore(template, userFocusAreas) {
    let score = template.priority;
    
    // Boost score based on matching focus areas
    const matchingAreas = template.focusAreas.filter(area => 
      userFocusAreas.includes(area)
    );
    score += matchingAreas.length * 2;
    
    return score;
  }
}

/**
 * User Metrics Service
 */
export class UserMetricsService {
  /**
   * Get metrics for a specific period
   * @param {string} userId 
   * @param {string} periodType - 'daily', 'weekly', 'monthly'
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Promise<Object|null>}
   */
  async getMetrics(userId, periodType = 'weekly', startDate, endDate) {
    if (!startDate || !endDate) {
      const now = new Date();
      if (periodType === 'weekly') {
        endDate = now;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (periodType === 'daily') {
        endDate = now;
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (periodType === 'monthly') {
        endDate = now;
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    return await prisma.userMetrics.findFirst({
      where: {
        userId,
        periodType,
        periodStart: startDate,
        periodEnd: endDate
      }
    });
  }

  /**
   * Create or update metrics
   * @param {string} userId 
   * @param {Object} metricsData 
   * @returns {Promise<Object>}
   */
  async upsertMetrics(userId, metricsData) {
    const { periodType, periodStart, periodEnd, ...metrics } = metricsData;
    
    return await prisma.userMetrics.upsert({
      where: {
        userId_periodStart_periodEnd_periodType: {
          userId,
          periodStart,
          periodEnd,
          periodType
        }
      },
      update: {
        ...metrics,
        updatedAt: new Date()
      },
      create: {
        userId,
        periodType,
        periodStart,
        periodEnd,
        ...metrics
      }
    });
  }

  /**
   * Calculate metrics from user activity and uploads
   * @param {string} userId 
   * @param {string} periodType 
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Promise<Object>}
   */
  async calculateAndStoreMetrics(userId, periodType = 'weekly', startDate, endDate) {
    if (!startDate || !endDate) {
      const now = new Date();
      if (periodType === 'weekly') {
        endDate = now;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Get uploads in period (if upload table exists)
    let uploads = [];
    try {
      uploads = await prisma.upload.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error) {
      // Upload table might not exist yet
      console.log('Upload table not found, using empty array');
    }

    // Get videos created in period (if video table exists)
    let videos = [];
    try {
      videos = await prisma.video.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error) {
      // Video table might not exist yet
      console.log('Video table not found, using empty array');
    }

    // Get completed tasks in period
    const completedTasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        completed: true,
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate streaks
    const streaks = await this.calculateStreaks(userId, endDate);

    // Calculate metrics
    const metrics = {
      periodType,
      periodStart: startDate,
      periodEnd: endDate,
      videosCreated: videos.length,
      videosUploaded: uploads.filter(u => u.status === 'published').length,
      totalViews: 0, // Would be populated from YouTube API
      totalSubscribers: 0, // Would be populated from YouTube API
      subscribersGained: 0, // Would be calculated from API data
      subscribersLost: 0,
      averageViewDuration: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      engagementRate: 0,
      uploadConsistency: this.calculateUploadConsistency(uploads, periodType),
      dailyActivityStreak: streaks.dailyActivity,
      weeklyUploadStreak: streaks.weeklyUploads,
      contentCreationStreak: streaks.contentCreation,
      clickThroughRate: 0,
      retentionRate: 0
    };

    return await this.upsertMetrics(userId, metrics);
  }

  /**
   * Calculate upload consistency percentage
   * @param {Array} uploads 
   * @param {string} periodType 
   * @returns {number}
   */
  calculateUploadConsistency(uploads, periodType) {
    if (periodType === 'weekly') {
      const targetUploads = 3; // 3 uploads per week target
      return Math.min(100, (uploads.length / targetUploads) * 100);
    }
    return 0;
  }

  /**
   * Calculate activity streaks
   * @param {string} userId 
   * @param {Date} endDate 
   * @returns {Promise<Object>}
   */
  async calculateStreaks(userId, endDate = new Date()) {
    // This would implement streak calculation logic
    // For now, return default values
    return {
      dailyActivity: 0,
      weeklyUploads: 0,
      contentCreation: 0
    };
  }
}

/**
 * User Activity Service
 */
export class UserActivityService {
  /**
   * Log user activity
   * @param {string} userId 
   * @param {Object} activityData 
   * @returns {Promise<Object>}
   */
  async logActivity(userId, activityData) {
    return await prisma.userActivity.create({
      data: {
        userId,
        type: activityData.type,
        action: activityData.action,
        description: activityData.description,
        metadata: activityData.metadata || {},
        sessionId: activityData.sessionId,
        timestamp: activityData.timestamp || new Date()
      }
    });
  }

  /**
   * Get user activities for a period
   * @param {string} userId 
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @param {string} type - Optional filter by activity type
   * @returns {Promise<Array>}
   */
  async getActivities(userId, startDate, endDate, type = null) {
    const where = {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (type) {
      where.type = type;
    }

    return await prisma.userActivity.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to recent activities
    });
  }
}

// Export service instances
export const commandCenterStateService = new CommandCenterStateService();
export const dailyTasksService = new DailyTasksService();
export const userMetricsService = new UserMetricsService();
export const userActivityService = new UserActivityService();