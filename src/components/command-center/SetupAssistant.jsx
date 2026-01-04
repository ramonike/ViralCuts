/**
 * Setup Assistant Component
 * Guides users through initial setup and configuration
 */

import React, { useState, useEffect } from 'react';

/**
 * Setup Assistant component for initial configuration
 * @param {Object} props
 * @param {import('./types').SetupTask[]} props.tasks - Array of 3-5 essential setup tasks
 * @param {(taskId: string) => void} props.onCompleteTask - Handler for task completion
 * @param {boolean} [props.compact=false] - Whether to display in compact mode
 * @param {import('./types').OptimizationTask[]} [props.optimizationSuggestions=[]] - Advanced optimization suggestions
 */
export function SetupAssistant({ tasks, onCompleteTask, compact = false, optimizationSuggestions = [] }) {
  // Filter to show only essential tasks (3-5 items)
  const essentialTasks = tasks.slice(0, 5);
  
  // Track recently completed task for showing benefits
  const [recentlyCompleted, setRecentlyCompleted] = useState(null);
  
  // Calculate progress
  const completedCount = essentialTasks.filter(task => task.completed).length;
  const totalCount = essentialTasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allEssentialComplete = completedCount === totalCount && totalCount > 0;
  
  // Handle task completion with immediate feedback
  const handleCompleteTask = (taskId) => {
    const task = essentialTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      onCompleteTask(taskId);
      setRecentlyCompleted(task);
      
      // Clear the completion message after 5 seconds
      setTimeout(() => {
        setRecentlyCompleted(null);
      }, 5000);
    }
  };
  
  // Priority badge styling
  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[priority] || styles.medium;
  };
  
  // Format estimated time
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  return (
    <div className={`setup-assistant bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {allEssentialComplete ? 'Advanced Optimization' : 'Setup Assistant'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {allEssentialComplete 
              ? 'Take your setup to the next level with these optimizations'
              : 'Complete these essential steps to get started'
            }
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${allEssentialComplete ? 'text-green-600' : 'text-blue-600'}`}>
            {progressPercentage}%
          </div>
          <div className="text-xs text-gray-500">{completedCount} of {totalCount}</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              allEssentialComplete ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Recently Completed Task Benefits */}
      {recentlyCompleted && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                Great! You completed: {recentlyCompleted.title}
              </h3>
              <p className="text-sm text-blue-800 mb-2">Here's what you unlocked:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {recentlyCompleted.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Essential Setup Complete - Show Optimization Suggestions */}
      {allEssentialComplete && optimizationSuggestions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-800">Essential setup complete!</span>
          </div>
          
          {optimizationSuggestions.slice(0, 3).map((suggestion) => (
            <div
              key={suggestion.id}
              className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    suggestion.impact === 'high' ? 'bg-purple-100 text-purple-800' :
                    suggestion.impact === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {suggestion.impact} impact
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(suggestion.estimatedTime)}
                    </span>
                  </div>
                  {suggestion.actionUrl && (
                    <a
                      href={suggestion.actionUrl}
                      className="inline-block mt-2 text-xs font-medium text-purple-600 hover:text-purple-700"
                    >
                      Start optimization →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Task Checklist */
        <div className="space-y-3">
          {essentialTasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 transition-all ${
                task.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  disabled={task.completed}
                  aria-label={task.completed ? 'Task completed' : 'Mark task as complete'}
                >
                  {task.completed && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                
                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  
                  {/* Task Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(task.estimatedTime)}
                    </span>
                    {task.benefits && task.benefits.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {task.benefits.length} benefit{task.benefits.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Benefits List (shown when not completed) */}
                  {!task.completed && task.benefits && task.benefits.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-blue-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Benefits:</p>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {task.benefits.map((benefit, idx) => (
                          <li key={idx}>• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {!task.completed && task.actionUrl && (
                    <a
                      href={task.actionUrl}
                      className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Start this task →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Completion Message (only for essential tasks) */}
      {allEssentialComplete && optimizationSuggestions.length === 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Great job! Essential setup complete.</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            You're ready to start creating content. Check out advanced optimization suggestions below.
          </p>
        </div>
      )}
    </div>
  );
}
