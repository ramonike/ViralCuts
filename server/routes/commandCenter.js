/**
 * Command Center API Routes
 * Handles all API endpoints for Command Center functionality
 */

import { Hono } from 'hono';
import { 
  commandCenterStateService, 
  dailyTasksService, 
  userMetricsService, 
  userActivityService 
} from '../services/commandCenterService.js';
import { auth } from '../auth.js';

const app = new Hono();

// Authentication middleware
const requireAuth = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set('user', session.user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// Apply authentication middleware to all routes
app.use('*', requireAuth);

/**
 * Command Center State Routes
 */

// GET /state - Get user's command center state
app.get('/state', async (c) => {
  try {
    const user = c.get('user');
    const state = await commandCenterStateService.getOrCreateState(user.id);
    return c.json(state);
  } catch (error) {
    console.error('Error fetching command center state:', error);
    return c.json({ error: 'Failed to fetch command center state' }, 500);
  }
});

// PUT /state - Update command center state
app.put('/state', async (c) => {
  try {
    const user = c.get('user');
    const updates = await c.req.json();
    
    const updatedState = await commandCenterStateService.updateState(user.id, updates);
    return c.json(updatedState);
  } catch (error) {
    console.error('Error updating command center state:', error);
    return c.json({ error: 'Failed to update command center state' }, 500);
  }
});

// POST /setup/complete-task - Complete a setup task
app.post('/setup/complete-task', async (c) => {
  try {
    const user = c.get('user');
    const { taskId } = await c.req.json();
    
    if (!taskId) {
      return c.json({ error: 'Task ID is required' }, 400);
    }
    
    const updatedState = await commandCenterStateService.completeSetupTask(user.id, taskId);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'setup',
      action: 'complete_task',
      description: `Completed setup task: ${taskId}`,
      metadata: { taskId }
    });
    
    return c.json(updatedState);
  } catch (error) {
    console.error('Error completing setup task:', error);
    return c.json({ error: 'Failed to complete setup task' }, 500);
  }
});

// PUT /widget-layout - Update widget layout
app.put('/widget-layout', async (c) => {
  try {
    const user = c.get('user');
    const { layout } = await c.req.json();
    
    if (!layout) {
      return c.json({ error: 'Layout data is required' }, 400);
    }
    
    const updatedState = await commandCenterStateService.updateWidgetLayout(user.id, layout);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'customization',
      action: 'update_layout',
      description: 'Updated widget layout',
      metadata: { layout }
    });
    
    return c.json(updatedState);
  } catch (error) {
    console.error('Error updating widget layout:', error);
    return c.json({ error: 'Failed to update widget layout' }, 500);
  }
});

// PUT /goals - Update user goals
app.put('/goals', async (c) => {
  try {
    const user = c.get('user');
    const goals = await c.req.json();
    
    const updatedState = await commandCenterStateService.updateUserGoals(user.id, goals);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'setup',
      action: 'update_goals',
      description: 'Updated user goals and preferences',
      metadata: { goals }
    });
    
    return c.json(updatedState);
  } catch (error) {
    console.error('Error updating user goals:', error);
    return c.json({ error: 'Failed to update user goals' }, 500);
  }
});

/**
 * Daily Tasks Routes
 */

// GET /tasks - Get tasks for a specific date
app.get('/tasks', async (c) => {
  try {
    const user = c.get('user');
    const date = c.req.query('date');
    
    const taskDate = date ? new Date(date) : new Date();
    const tasks = await dailyTasksService.getTasksForDate(user.id, taskDate);
    
    return c.json(tasks);
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return c.json({ error: 'Failed to fetch daily tasks' }, 500);
  }
});

// POST /tasks/generate - Generate daily tasks
app.post('/tasks/generate', async (c) => {
  try {
    const user = c.get('user');
    const { date } = await c.req.json();
    
    const taskDate = date ? new Date(date) : new Date();
    const tasks = await dailyTasksService.generateDailyTasks(user.id, taskDate);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'planning',
      action: 'generate_tasks',
      description: `Generated ${tasks.length} daily tasks`,
      metadata: { date: taskDate, taskCount: tasks.length }
    });
    
    return c.json(tasks);
  } catch (error) {
    console.error('Error generating daily tasks:', error);
    return c.json({ error: 'Failed to generate daily tasks' }, 500);
  }
});

// POST /tasks - Create a new task
app.post('/tasks', async (c) => {
  try {
    const user = c.get('user');
    const taskData = await c.req.json();
    
    const task = await dailyTasksService.createTask(user.id, taskData);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'planning',
      action: 'create_task',
      description: `Created task: ${task.title}`,
      metadata: { taskId: task.id, taskType: task.type }
    });
    
    return c.json(task, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

// PUT /tasks/:taskId/progress - Update task progress
app.put('/tasks/:taskId/progress', async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');
    const { progress } = await c.req.json();
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return c.json({ error: 'Progress must be a number between 0 and 100' }, 400);
    }
    
    const task = await dailyTasksService.updateTaskProgress(taskId, progress);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'content_creation',
      action: 'update_progress',
      description: `Updated task progress to ${progress}%`,
      metadata: { taskId, progress }
    });
    
    return c.json(task);
  } catch (error) {
    console.error('Error updating task progress:', error);
    return c.json({ error: 'Failed to update task progress' }, 500);
  }
});

// POST /tasks/:taskId/complete - Complete a task
app.post('/tasks/:taskId/complete', async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');
    const task = await dailyTasksService.completeTask(taskId);
    
    // Log activity
    await userActivityService.logActivity(user.id, {
      type: 'content_creation',
      action: 'complete_task',
      description: `Completed task: ${task.title}`,
      metadata: { taskId, taskType: task.type }
    });
    
    return c.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    return c.json({ error: 'Failed to complete task' }, 500);
  }
});

/**
 * Metrics Routes
 */

// GET /metrics - Get user metrics
app.get('/metrics', async (c) => {
  try {
    const user = c.get('user');
    const periodType = c.req.query('periodType') || 'weekly';
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const metrics = await userMetricsService.getMetrics(user.id, periodType, start, end);
    
    if (!metrics) {
      // Calculate and store metrics if they don't exist
      const calculatedMetrics = await userMetricsService.calculateAndStoreMetrics(
        user.id, 
        periodType, 
        start, 
        end
      );
      return c.json(calculatedMetrics);
    }
    
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return c.json({ error: 'Failed to fetch metrics' }, 500);
  }
});

// POST /metrics/calculate - Recalculate metrics
app.post('/metrics/calculate', async (c) => {
  try {
    const user = c.get('user');
    const { periodType = 'weekly', startDate, endDate } = await c.req.json();
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const metrics = await userMetricsService.calculateAndStoreMetrics(
      user.id, 
      periodType, 
      start, 
      end
    );
    
    return c.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return c.json({ error: 'Failed to calculate metrics' }, 500);
  }
});

/**
 * Activity Routes
 */

// GET /activity - Get user activity
app.get('/activity', async (c) => {
  try {
    const user = c.get('user');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const type = c.req.query('type');
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const activities = await userActivityService.getActivities(user.id, start, end, type);
    
    return c.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return c.json({ error: 'Failed to fetch activity' }, 500);
  }
});

// POST /activity - Log user activity
app.post('/activity', async (c) => {
  try {
    const user = c.get('user');
    const activityData = await c.req.json();
    
    const activity = await userActivityService.logActivity(user.id, activityData);
    
    return c.json(activity, 201);
  } catch (error) {
    console.error('Error logging activity:', error);
    return c.json({ error: 'Failed to log activity' }, 500);
  }
});

export default app;