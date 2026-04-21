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
import { CheckCircle, Clock, Target, TrendingUp, Plus, Calendar } from 'lucide-react';
import { useDailyTasks } from '../../hooks/useCommandCenterAPI';
import WidgetWrapper from '../shared/WidgetWrapper';

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

  const getTypeBorderColor = (type) => {
    switch (type) {
      case 'creation': return 'border-blue-800/30';
      case 'optimization': return 'border-emerald-800/30';
      case 'analysis': return 'border-purple-800/30';
      case 'planning': return 'border-orange-800/30';
      default: return 'border-slate-800';
    }
  };

  const getTypeBackgroundColor = (type) => {
    switch (type) {
      case 'creation': return 'bg-blue-950/50';
      case 'optimization': return 'bg-emerald-950/50';
      case 'analysis': return 'bg-purple-950/50';
      case 'planning': return 'bg-orange-950/50';
      default: return 'bg-slate-900/60';
    }
  };

  return (
    <div className={`p-4 md:p-5 transition-all duration-300 ${getTypeBackgroundColor(task.type)} border ${getTypeBorderColor(task.type)} rounded-xl ${task.completed ? 'opacity-60 scale-[0.98]' : 'hover:border-slate-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${getTypeColor(task.type)}`}>
              {getTypeIcon(task.type)}
            </div>
            <h3 className={`text-sm md:text-base font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
              {task.title}
            </h3>
          </div>
          
          <p className="text-xs md:text-sm text-slate-400 mb-2 md:mb-3">
            {task.description}
          </p>
          
          <div className="flex items-center gap-2 text-xs mb-2 md:mb-3">
            <div className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 bg-slate-800/50 rounded-lg text-slate-400">
              <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="font-medium">{task.estimatedTime} min</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 bg-slate-800/50 rounded-lg text-slate-400">
              <Target className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="font-medium">Prioridade {task.priority}/10</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2 md:p-3 mb-2 md:mb-3">
            <p className="text-xs md:text-sm text-slate-300">
              <strong className="text-slate-200">Resultado esperado:</strong> {task.expectedOutcome}
            </p>
          </div>
          
          {/* Progress tracking - Requirements: 2.4 - Subtask 8.4: Mobile-optimized */}
          {!task.completed && (
            <div className="mb-2 md:mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progresso</span>
                <span>{localProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2 md:mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${localProgress}%` }}
                />
              </div>
              <div className="flex gap-1.5 md:gap-2">
                {[25, 50, 75, 100].map(progress => (
                  <button
                    key={progress}
                    onClick={() => handleProgressUpdate(progress)}
                    className={`px-2 md:px-3 py-1 md:py-1.5 text-xs rounded-lg font-semibold transition-colors ${
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
 * Empty state component for when no tasks are planned - Subtask 8.4: Mobile-optimized
 */
const EmptyTasksState = ({ onSuggestContent }) => (
  <div className="p-6 md:p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
    <div className="w-16 md:w-20 h-16 md:h-20 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
      <Clock className="w-8 md:w-10 h-8 md:h-10 text-purple-400" />
    </div>
    <h3 className="text-base md:text-lg font-semibold text-slate-100 mb-2">Nenhuma tarefa planejada para hoje</h3>
    <p className="text-sm md:text-base text-slate-400 mb-4 md:mb-6">Vamos começar com algumas ideias de criação de conteúdo!</p>
    
    <Button onClick={onSuggestContent} className="flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 text-sm md:text-base">
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
      <WidgetWrapper
        title="Plano de Hoje"
        icon={<Calendar className="w-5 h-5" />}
        loading={true}
        className={className}
      />
    );
  }

  if (tasksError) {
    return (
      <WidgetWrapper
        title="Plano de Hoje"
        icon={<Calendar className="w-5 h-5" />}
        className={className}
      >
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
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper
      title="Plano de Hoje"
      icon={<Calendar className="w-5 h-5" />}
      actions={
        completionStats.total > 0 && (
          <div className="text-right">
            <div className="text-xl md:text-2xl font-black text-slate-100">
              {completionStats.percentage}%
            </div>
            <div className="text-xs text-slate-500 font-medium">Completo</div>
          </div>
        )
      }
      className={className}
    >
      <div className="space-y-4 md:space-y-5">
        {/* Header with stats - Subtask 8.4: Mobile-optimized */}
        <div>
          <p className="text-xs md:text-sm text-slate-400">
            {completionStats.completed} de {completionStats.total} tarefas concluídas
            {completionStats.remainingTime > 0 && (
              <span> • {completionStats.remainingTime} min restantes</span>
            )}
          </p>
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
        <div className="space-y-3 md:space-y-4">
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
    </WidgetWrapper>
  );
};

export default DailyPlanner;