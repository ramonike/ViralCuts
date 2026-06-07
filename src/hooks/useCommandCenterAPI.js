/**
 * Command Center API Hook
 * Provides React hooks for interacting with Command Center API endpoints
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/command-center';

/**
 * Custom hook for API requests with error handling
 */
function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
}

/**
 * Hook for Command Center State management
 */
export function useCommandCenterState() {
  const [state, setState] = useState(null);
  const { request, loading, error } = useAPI();

  // Fetch state
  const fetchState = useCallback(async () => {
    try {
      const data = await request(`${API_BASE}/state`);
      setState(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch command center state:', err);
      throw err;
    }
  }, [request]);

  // Update state
  const updateState = useCallback(async (updates) => {
    try {
      const data = await request(`${API_BASE}/state`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setState(data);
      return data;
    } catch (err) {
      console.error('Failed to update command center state:', err);
      throw err;
    }
  }, [request]);

  // Complete setup task
  const completeSetupTask = useCallback(async (taskId) => {
    try {
      const data = await request(`${API_BASE}/setup/complete-task`, {
        method: 'POST',
        body: JSON.stringify({ taskId }),
      });
      setState(data);
      return data;
    } catch (err) {
      console.error('Failed to complete setup task:', err);
      throw err;
    }
  }, [request]);

  // Update widget layout
  const updateWidgetLayout = useCallback(async (layout) => {
    try {
      const data = await request(`${API_BASE}/widget-layout`, {
        method: 'PUT',
        body: JSON.stringify({ layout }),
      });
      setState(data);
      return data;
    } catch (err) {
      console.error('Failed to update widget layout:', err);
      throw err;
    }
  }, [request]);

  // Update user goals
  const updateUserGoals = useCallback(async (goals) => {
    try {
      const data = await request(`${API_BASE}/goals`, {
        method: 'PUT',
        body: JSON.stringify(goals),
      });
      setState(data);
      return data;
    } catch (err) {
      console.error('Failed to update user goals:', err);
      throw err;
    }
  }, [request]);

  // Load state on mount
  useEffect(() => {
    fetchState().catch(err => {
      // Don't throw errors that could crash the component
      console.error('Failed to load command center state:', err);
    });
  }, [fetchState]);

  return {
    state,
    loading,
    error,
    fetchState,
    updateState,
    completeSetupTask,
    updateWidgetLayout,
    updateUserGoals,
  };
}

/**
 * Hook for Daily Tasks management
 */
export function useDailyTasks(date = null) {
  const [tasks, setTasks] = useState([]);
  const { request, loading, error } = useAPI();

  // Fetch tasks for date
  const fetchTasks = useCallback(async (taskDate = date) => {
    try {
      const params = taskDate ? `?date=${taskDate.toISOString()}` : '';
      const data = await request(`${API_BASE}/tasks${params}`);
      setTasks(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch daily tasks:', err);
      throw err;
    }
  }, [request, date]);

  // Generate daily tasks
  const generateTasks = useCallback(async (taskDate = date) => {
    try {
      const data = await request(`${API_BASE}/tasks/generate`, {
        method: 'POST',
        body: JSON.stringify({ date: taskDate?.toISOString() }),
      });
      setTasks(data);
      return data;
    } catch (err) {
      console.error('Failed to generate daily tasks:', err);
      throw err;
    }
  }, [request, date]);

  // Create new task
  const createTask = useCallback(async (taskData) => {
    try {
      const data = await request(`${API_BASE}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      // Refresh tasks list
      await fetchTasks();
      return data;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  }, [request, fetchTasks]);

  // Update task progress
  const updateTaskProgress = useCallback(async (taskId, progress) => {
    try {
      const data = await request(`${API_BASE}/tasks/${taskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ progress }),
      });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, progress } : task
      ));
      
      return data;
    } catch (err) {
      console.error('Failed to update task progress:', err);
      throw err;
    }
  }, [request]);

  // Complete task
  const completeTask = useCallback(async (taskId) => {
    try {
      const data = await request(`${API_BASE}/tasks/${taskId}/complete`, {
        method: 'POST',
      });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: true, progress: 100, completedAt: new Date() } : task
      ));
      
      return data;
    } catch (err) {
      console.error('Failed to complete task:', err);
      throw err;
    }
  }, [request]);

  // Load tasks on mount or date change
  useEffect(() => {
    fetchTasks().catch(err => {
      // Don't throw errors that could crash the component
      console.error('Failed to load daily tasks:', err);
    });
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    generateTasks,
    createTask,
    updateTaskProgress,
    completeTask,
  };
}

/**
 * Hook for User Metrics
 */
export function useUserMetrics(periodType = 'weekly', startDate = null, endDate = null) {
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const { request, loading, error } = useAPI();

  // Fetch metrics
  const fetchMetrics = useCallback(async (period = periodType, start = startDate, end = endDate) => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('periodType', period);
      if (start) params.append('startDate', start.toISOString());
      if (end) params.append('endDate', end.toISOString());

      const data = await request(`${API_BASE}/metrics?${params}`);
      setMetrics(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      throw err;
    }
  }, [request, periodType, startDate, endDate]);

  // Fetch previous period metrics for comparison
  const fetchPreviousMetrics = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const prevEnd = new Date(startDate.getTime());

      const params = new URLSearchParams();
      params.append('periodType', periodType);
      params.append('startDate', prevStart.toISOString());
      params.append('endDate', prevEnd.toISOString());

      const data = await request(`${API_BASE}/metrics?${params}`);
      setPreviousMetrics(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch previous metrics:', err);
      // Don't throw here, previous metrics are optional
    }
  }, [request, periodType, startDate, endDate]);

  // Recalculate metrics
  const recalculateMetrics = useCallback(async () => {
    try {
      const data = await request(`${API_BASE}/metrics/calculate`, {
        method: 'POST',
        body: JSON.stringify({
          periodType,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      });
      setMetrics(data);
      return data;
    } catch (err) {
      console.error('Failed to recalculate metrics:', err);
      throw err;
    }
  }, [request, periodType, startDate, endDate]);

  // Load metrics on mount or parameter change
  useEffect(() => {
    fetchMetrics().catch(err => {
      console.error('Failed to load metrics:', err);
    });
    fetchPreviousMetrics().catch(err => {
      console.error('Failed to load previous metrics:', err);
    });
  }, [fetchMetrics, fetchPreviousMetrics]);

  return {
    metrics,
    previousMetrics,
    loading,
    error,
    fetchMetrics,
    recalculateMetrics,
  };
}

/**
 * Hook for User Activity tracking
 */
export function useUserActivity() {
  const [activities, setActivities] = useState([]);
  const { request, loading, error } = useAPI();

  // Fetch activities
  const fetchActivities = useCallback(async (startDate = null, endDate = null, type = null) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (type) params.append('type', type);

      const data = await request(`${API_BASE}/activity?${params}`);
      setActivities(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      throw err;
    }
  }, [request]);

  // Log activity
  const logActivity = useCallback(async (activityData) => {
    try {
      const data = await request(`${API_BASE}/activity`, {
        method: 'POST',
        body: JSON.stringify(activityData),
      });
      
      // Add to local state
      setActivities(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Failed to log activity:', err);
      throw err;
    }
  }, [request]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    logActivity,
  };
}

/**
 * Combined hook for all Command Center functionality
 */
export function useCommandCenter() {
  const state = useCommandCenterState();
  const tasks = useDailyTasks();
  const metrics = useUserMetrics();
  const activity = useUserActivity();

  return {
    state,
    tasks,
    metrics,
    activity,
  };
}