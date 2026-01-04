/**
 * DailyPlanner Component
 * 
 * Displays daily task recommendations with time estimates and outcomes.
 * Implements task generation logic based on user goals and schedule.
 * 
 * Requirements: 2.1, 2.3
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Clock, Target, TrendingUp, Plus } from 'lucide-react';
import { useDailyTasks } from '../../hooks/useCommandCenterAPI';

/**
 * Task display component
 */
const TaskCard = ({ task, onComplete, onUpdateProgress }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [localProgress, setLocalProgress] = useState(task.progress);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleProgressUpdate = (newProgress) => {
    setLocalProgress(newProgress);
    if (onUpdateProgress) {
      onUpdateProgress(task.id, newProgress);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'creation': return <Plus className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'analysis': return <Target className="w-4 h-4" />;
      case 'planning': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'creation': return 'text-blue-400 bg-blue-950/50';
      case 'optimization': return 'text-emerald-400 bg-emerald-950/50';
      case 'analysis': return 'text-purple-400 bg-purple-950/50';
      case 'planning': return 'text-orange-400 bg-orange-950/50';
      default: return 'text-slate-400 bg-slate-800/50';
    }
  };

  return (
    <div className={`p-5 transition-all duration-200 bg-slate-900/60 border border-slate-800 rounded-xl ${task.completed ? 'opacity-60' : 'hover:border-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${getTypeColor(task.type)}`}>
              {getTypeIcon(task.type)}
            </div>
            <h3 className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
              {task.title}
            </h3>
          </div>
          
          <p className="text-sm text-slate-400 mb-3">
            {task.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>Prioridade {task.priority}/10</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-200">Resultado esperado:</strong> {task.expectedOutcome}
            </p>
          </div>
          
          {/* Progress tracking - Requirements: 2.4 */}
          {!task.completed && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progresso</span>
                <span>{localProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${localProgress}%` }}
                />
              </div>
              <div className="flex gap-2">
                {[25, 50, 75, 100].map(progress => (
                  <button
                    key={progress}
                    onClick={() => handleProgressUpdate(progress)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                      localProgress >= progress 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {progress}%
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {localProgress > 0 && localProgress < 100 && !task.completed && (
            <div className="text-xs text-blue-400 mb-2">
              Continue assim! Você está progredindo bem.
            </div>
          )}
        </div>
        
        <div className="ml-4">
          {!task.completed ? (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleting ? 'Concluindo...' : 'Concluir'}
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Feito</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component for when no tasks are planned
 */
const EmptyTasksState = ({ onSuggestContent }) => (
  <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
    <div className="mb-4">
      <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-100 mb-2">Nenhuma tarefa planejada para hoje</h3>
      <p className="text-slate-400">Vamos começar com algumas ideias de criação de conteúdo!</p>
    </div>
    
    <Button onClick={onSuggestContent} className="flex items-center gap-2 mx-auto bg-purple-600 hover:bg-purple-500 text-white">
      <TrendingUp className="w-4 h-4" />
      Obter Sugestões de Conteúdo
    </Button>
  </div>
);

/**
 * Main DailyPlanner component
 */
export const DailyPlanner = ({ 
  userGoals, 
  onTaskComplete, 
  onTaskProgressUpdate,
  onSuggestContent,
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Use API hooks for task management
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    generateTasks,
    updateTaskProgress,
    completeTask: apiCompleteTask
  } = useDailyTasks();

  // Generate tasks on mount if none exist
  useEffect(() => {
    const initializeTasks = async () => {
      if (tasks.length === 0 && !tasksLoading) {
        try {
          await generateTasks();
        } catch (error) {
          console.error('Error generating tasks:', error);
        }
      }
      setIsLoading(false);
    };

    initializeTasks();
  }, [tasks.length, tasksLoading, generateTasks]);

  // Handle task completion with next action suggestions
  const handleTaskComplete = async (taskId) => {
    try {
      await apiCompleteTask(taskId);
      
      // Notify parent component with completion data
      if (onTaskComplete) {
        onTaskComplete(taskId, { 
          nextActions: [
            {
              id: 'upload-video',
              title: 'Upload Video',
              icon: 'upload',
              description: 'Upload your completed video to YouTube',
              category: 'creation',
            },
            {
              id: 'schedule-content',
              title: 'Schedule Content',
              icon: 'calendar',
              description: 'Schedule your next video for optimal timing',
              category: 'planning',
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Handle task progress update
  const handleTaskProgressUpdate = async (taskId, progress) => {
    try {
      await updateTaskProgress(taskId, progress);
      
      if (onTaskProgressUpdate) {
        onTaskProgressUpdate(taskId, progress);
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  // Handle content suggestions for empty state
  const handleSuggestContent = async () => {
    if (onSuggestContent) {
      onSuggestContent();
    } else {
      // Generate content creation suggestions based on trending topics
      try {
        await generateTasks();
      } catch (error) {
        console.error('Error generating content suggestions:', error);
      }
    }
  };

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const totalTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const completedTime = tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + task.estimatedTime, 0);
    
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalTime,
      completedTime,
      remainingTime: totalTime - completedTime,
    };
  }, [tasks]);

  if (isLoading || tasksLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Erro ao carregar tarefas</h3>
          <p className="text-red-300 text-sm mb-4">{tasksError}</p>
          <Button 
            onClick={() => generateTasks()} 
            variant="outline" 
            size="sm"
            className="border-red-700 text-red-400 hover:bg-red-900/30"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Plano de Hoje</h2>
          <p className="text-sm text-slate-400">
            {completionStats.completed} de {completionStats.total} tarefas concluídas
            {completionStats.remainingTime > 0 && (
              <span> • {completionStats.remainingTime} min restantes</span>
            )}
          </p>
        </div>
        
        {completionStats.total > 0 && (
          <div className="text-right">
            <div className="text-2xl font-black text-slate-100">
              {completionStats.percentage}%
            </div>
            <div className="text-xs text-slate-500 font-medium">Completo</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {completionStats.total > 0 && (
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionStats.percentage}%` }}
          />
        </div>
      )}

      {/* Tasks list or empty state */}
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleTaskComplete}
              onUpdateProgress={handleTaskProgressUpdate}
            />
          ))}
        </div>
      ) : (
        <EmptyTasksState onSuggestContent={handleSuggestContent} />
      )}
    </div>
  );
};

export default DailyPlanner;