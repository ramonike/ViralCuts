/**
 * Command Center Frontend Service
 * Handles API calls to the Command Center backend endpoints
 */

const API_BASE = '/api/command-center';

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
    const response = await fetch(`${API_BASE}/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch state: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update command center state
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateState(userId, updates) {
    const response = await fetch(`${API_BASE}/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update state: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update setup progress
   * @param {string} userId 
   * @param {string} taskId 
   * @returns {Promise<Object>}
   */
  async completeSetupTask(userId, taskId) {
    const response = await fetch(`${API_BASE}/setup/complete-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete setup task: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update widget layout
   * @param {string} userId 
   * @param {Object} layout 
   * @returns {Promise<Object>}
   */
  async updateWidgetLayout(userId, layout) {
    const response = await fetch(`${API_BASE}/widget-layout`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ layout }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update widget layout: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update user goals and preferences
   * @param {string} userId 
   * @param {Object} goals 
   * @returns {Promise<Object>}
   */
  async updateUserGoals(userId, goals) {
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goals),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user goals: ${response.statusText}`);
    }

    return await response.json();
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
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date.toISOString());
    }

    const response = await fetch(`${API_BASE}/tasks?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new daily task
   * @param {string} userId 
   * @param {Object} taskData 
   * @returns {Promise<Object>}
   */
  async createTask(userId, taskData) {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update task progress
   * @param {string} taskId 
   * @param {number} progress 
   * @returns {Promise<Object>}
   */
  async updateTaskProgress(taskId, progress) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task progress: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Complete a task
   * @param {string} taskId 
   * @returns {Promise<Object>}
   */
  async completeTask(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate daily tasks based on user goals
   * @param {string} userId 
   * @param {Date} date 
   * @returns {Promise<Array>}
   */
  async generateDailyTasks(userId, date = new Date()) {
    const response = await fetch(`${API_BASE}/tasks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: date.toISOString() }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate tasks: ${response.statusText}`);
    }

    return await response.json();
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
    const params = new URLSearchParams();
    if (periodType) params.append('periodType', periodType);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await fetch(`${API_BASE}/metrics?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Recalculate metrics
   * @param {string} userId 
   * @param {Object} metricsData 
   * @returns {Promise<Object>}
   */
  async recalculateMetrics(userId, metricsData) {
    const response = await fetch(`${API_BASE}/metrics/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metricsData),
    });

    if (!response.ok) {
      throw new Error(`Failed to recalculate metrics: ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${API_BASE}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.statusText}`);
    }

    return await response.json();
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
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (type) params.append('type', type);

    const response = await fetch(`${API_BASE}/activity?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export service instances
export const commandCenterStateService = new CommandCenterStateService();
export const dailyTasksService = new DailyTasksService();
export const userMetricsService = new UserMetricsService();
export const userActivityService = new UserActivityService();