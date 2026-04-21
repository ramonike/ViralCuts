/**
 * ContentWorkflow Component
 * Provides guided content creation process with tool integration
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDashboardState } from '../../hooks/useDashboardState';
import { useSupabaseDashboard } from '../../hooks/useSupabaseDashboard';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import WidgetWrapper from '../shared/WidgetWrapper';
import { 
  Play, 
  Video, 
  Zap, 
  Calendar, 
  Upload, 
  Settings,
  ChevronRight,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react';

/**
 * ContentWorkflow component for guided content creation
 * @param {Object} props
 * @param {import('./types').ContentWorkflowState} [props.currentWorkflow] - Current workflow state
 * @param {Function} [props.onWorkflowStart] - Callback when workflow starts
 * @param {Function} [props.onWorkflowComplete] - Callback when workflow completes
 * @param {Function} [props.onToolLaunch] - Callback when tool is launched
 */
export function ContentWorkflow({ 
  currentWorkflow, 
  onWorkflowStart, 
  onWorkflowComplete,
  onToolLaunch 
}) {
  const { state, actions } = useDashboardState();
  const supabase = useSupabaseDashboard();
  
  const [selectedContentType, setSelectedContentType] = useState(null);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [workflowState, setWorkflowState] = useState(currentWorkflow);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Update workflow state when prop changes
  useEffect(() => {
    setWorkflowState(currentWorkflow);
  }, [currentWorkflow]);

  // Auto-save workflow progress
  useEffect(() => {
    if (workflowState && workflowState.id) {
      const saveTimeout = setTimeout(() => {
        saveWorkflowProgress();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimeout);
    }
  }, [workflowState]);

  // Calculate progress based on completed steps
  const calculateProgress = useCallback((workflow) => {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) return 0;
    
    const completedSteps = workflow.steps.filter(step => step.completed).length;
    const totalSteps = workflow.steps.length;
    const currentStepProgress = workflow.currentStep / totalSteps * 100;
    const completedProgress = (completedSteps / totalSteps) * 100;
    
    return Math.max(completedProgress, currentStepProgress);
  }, []);

  // Save workflow progress to localStorage and optionally to backend
  const saveWorkflowProgress = useCallback(async () => {
    if (!workflowState) return;

    setIsSaving(true);
    try {
      // Update progress
      const updatedWorkflow = {
        ...workflowState,
        progress: calculateProgress(workflowState),
        lastSavedAt: new Date()
      };

      // Save to localStorage
      const savedWorkflows = JSON.parse(localStorage.getItem('contentWorkflows') || '{}');
      savedWorkflows[updatedWorkflow.id] = updatedWorkflow;
      localStorage.setItem('contentWorkflows', JSON.stringify(savedWorkflows));

      // TODO: Save to backend if user is authenticated
      if (supabase.user) {
        // This would integrate with a backend API to save workflow state
        console.log('Would save to backend:', updatedWorkflow.id);
      }

      setWorkflowState(updatedWorkflow);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving workflow progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [workflowState, calculateProgress, supabase.user]);

  // Resume workflow from saved state
  const resumeWorkflow = useCallback(async (workflowId) => {
    try {
      // Try to load from localStorage first
      const savedWorkflows = JSON.parse(localStorage.getItem('contentWorkflows') || '{}');
      const savedWorkflow = savedWorkflows[workflowId];

      if (savedWorkflow) {
        setWorkflowState(savedWorkflow);
        return savedWorkflow;
      }

      // TODO: Try to load from backend if not found locally
      if (supabase.user) {
        console.log('Would load from backend:', workflowId);
      }

      return null;
    } catch (error) {
      console.error('Error resuming workflow:', error);
      return null;
    }
  }, [supabase.user]);

  // Complete current step and advance workflow
  const completeCurrentStep = useCallback(async () => {
    if (!workflowState) return;

    const updatedSteps = [...workflowState.steps];
    const currentStepIndex = workflowState.currentStep;
    
    // Mark current step as completed
    if (updatedSteps[currentStepIndex]) {
      updatedSteps[currentStepIndex].completed = true;
    }

    // Advance to next step or complete workflow
    const nextStep = currentStepIndex + 1;
    const isWorkflowComplete = nextStep >= updatedSteps.length;

    const updatedWorkflow = {
      ...workflowState,
      steps: updatedSteps,
      currentStep: isWorkflowComplete ? currentStepIndex : nextStep,
      progress: calculateProgress({ ...workflowState, steps: updatedSteps }),
      lastSavedAt: new Date()
    };

    setWorkflowState(updatedWorkflow);

    // Save progress
    await saveWorkflowProgress();

    // If workflow is complete, notify parent and clean up
    if (isWorkflowComplete && onWorkflowComplete) {
      onWorkflowComplete(updatedWorkflow);
      
      // Remove from localStorage after completion
      const savedWorkflows = JSON.parse(localStorage.getItem('contentWorkflows') || '{}');
      delete savedWorkflows[updatedWorkflow.id];
      localStorage.setItem('contentWorkflows', JSON.stringify(savedWorkflows));
    }
  }, [workflowState, calculateProgress, saveWorkflowProgress, onWorkflowComplete]);

  // Get estimated completion time
  const getEstimatedCompletionTime = useCallback((workflow) => {
    if (!workflow || !workflow.steps) return 0;
    
    const remainingSteps = workflow.steps.slice(workflow.currentStep);
    return remainingSteps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  }, []);

  // Format time for display
  const formatTime = useCallback((minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);
  const contentTypes = [
    {
      id: 'short',
      title: 'Short-form Video',
      description: 'Quick, engaging videos under 60 seconds',
      icon: Zap,
      estimatedTime: 30,
      tools: ['Opus Clip', 'Upload Queue', 'Scheduler'],
      workflow: [
        { id: 'source', name: 'Choose Source', description: 'Select or upload video content' },
        { id: 'generate', name: 'Generate Clips', description: 'Use AI to create short clips' },
        { id: 'review', name: 'Review & Edit', description: 'Select and customize clips' },
        { id: 'schedule', name: 'Schedule & Publish', description: 'Add to upload queue' }
      ]
    },
    {
      id: 'long',
      title: 'Long-form Video',
      description: 'In-depth content over 10 minutes',
      icon: Video,
      estimatedTime: 120,
      tools: ['Upload Queue', 'Scheduler', 'Analytics'],
      workflow: [
        { id: 'plan', name: 'Plan Content', description: 'Outline and structure your video' },
        { id: 'record', name: 'Record/Upload', description: 'Create or upload your content' },
        { id: 'optimize', name: 'Optimize', description: 'Add metadata, thumbnails, descriptions' },
        { id: 'publish', name: 'Publish', description: 'Schedule or upload immediately' }
      ]
    },
    {
      id: 'live',
      title: 'Live Stream',
      description: 'Real-time streaming content',
      icon: Play,
      estimatedTime: 60,
      tools: ['Scheduler', 'Analytics'],
      workflow: [
        { id: 'setup', name: 'Setup Stream', description: 'Configure streaming settings' },
        { id: 'promote', name: 'Promote', description: 'Announce and schedule stream' },
        { id: 'stream', name: 'Go Live', description: 'Start your live stream' },
        { id: 'follow-up', name: 'Follow-up', description: 'Engage with audience post-stream' }
      ]
    },
    {
      id: 'story',
      title: 'Story/Short Update',
      description: 'Quick updates and behind-the-scenes',
      icon: Circle,
      estimatedTime: 15,
      tools: ['Upload Queue'],
      workflow: [
        { id: 'capture', name: 'Capture Moment', description: 'Record or select content' },
        { id: 'enhance', name: 'Quick Edit', description: 'Add text, filters, or effects' },
        { id: 'share', name: 'Share', description: 'Post to platforms immediately' }
      ]
    }
  ];

  // Get suggested tools based on content type
  const getSuggestedTools = useCallback((contentType) => {
    const type = contentTypes.find(t => t.id === contentType);
    if (!type) return [];

    return type.tools.map(toolName => {
      switch (toolName) {
        case 'Opus Clip':
          return {
            toolId: 'opus-clip',
            toolName: 'Opus Clip',
            description: 'AI-powered short clip generation',
            category: 'AI Tools',
            relevanceScore: 0.95,
            action: () => handleToolLaunch('opus-clip')
          };
        case 'Upload Queue':
          return {
            toolId: 'upload-queue',
            toolName: 'Upload Queue',
            description: 'Manage and schedule video uploads',
            category: 'Publishing',
            relevanceScore: 0.9,
            action: () => handleToolLaunch('upload-queue')
          };
        case 'Scheduler':
          return {
            toolId: 'scheduler',
            toolName: 'Content Scheduler',
            description: 'Schedule content across platforms',
            category: 'Planning',
            relevanceScore: 0.85,
            action: () => handleToolLaunch('scheduler')
          };
        case 'Analytics':
          return {
            toolId: 'analytics',
            toolName: 'Analytics Dashboard',
            description: 'Track performance and insights',
            category: 'Analysis',
            relevanceScore: 0.8,
            action: () => handleToolLaunch('analytics')
          };
        default:
          return null;
      }
    }).filter(Boolean);
  }, []);

  // Handle tool launch
  const handleToolLaunch = useCallback((toolId) => {
    if (onToolLaunch) {
      onToolLaunch(toolId);
    }
    
    // Navigate to appropriate tool/page
    switch (toolId) {
      case 'opus-clip':
        // Integration with existing Opus functionality
        window.location.href = '/dashboard#opus';
        break;
      case 'upload-queue':
        // Show upload queue panel
        window.location.href = '/videos';
        break;
      case 'scheduler':
        window.location.href = '/calendar';
        break;
      case 'analytics':
        window.location.href = '/analytics';
        break;
      default:
        console.log(`Launching tool: ${toolId}`);
    }
  }, [onToolLaunch]);

  // Handle workflow start
  const handleStartCreating = useCallback(async () => {
    if (!selectedContentType) {
      setShowTypeSelection(true);
      return;
    }

    setIsStarting(true);
    
    try {
      const contentType = contentTypes.find(t => t.id === selectedContentType);
      
      // Create new workflow state
      const newWorkflow = {
        id: `workflow_${Date.now()}`,
        contentType: selectedContentType,
        currentStep: 0,
        steps: contentType.workflow.map((step, index) => ({
          ...step,
          completed: false,
          tools: getSuggestedTools(selectedContentType).map(t => t.toolId),
          estimatedTime: Math.ceil(contentType.estimatedTime / contentType.workflow.length)
        })),
        progress: 0,
        startedAt: new Date(),
        lastSavedAt: new Date(),
        metadata: {
          selectedTools: getSuggestedTools(selectedContentType)
        }
      };

      setWorkflowState(newWorkflow);

      if (onWorkflowStart) {
        await onWorkflowStart(newWorkflow);
      }

      // Save initial workflow state
      await saveWorkflowProgress();

      setShowTypeSelection(false);
    } catch (error) {
      console.error('Error starting workflow:', error);
    } finally {
      setIsStarting(false);
    }
  }, [selectedContentType, getSuggestedTools, onWorkflowStart]);

  // Handle content type selection
  const handleContentTypeSelect = useCallback((typeId) => {
    setSelectedContentType(typeId);
    handleStartCreating();
  }, [handleStartCreating]);

  // If no workflow is active, show the start button
  if (!workflowState) {
    return (
      <WidgetWrapper
        title="Fluxo de Criação"
        icon={<Play className="w-5 h-5" />}
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-blue-950/50 rounded-full flex items-center justify-center mx-auto border border-blue-800/30">
            <Play className="w-8 h-8 text-blue-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Pronto para Criar Conteúdo?
            </h3>
            <p className="text-slate-400 mb-4">
              Inicie um fluxo guiado para criar conteúdo envolvente com ferramentas de IA
            </p>
          </div>

          <Button 
            onClick={() => setShowTypeSelection(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Iniciando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Começar a Criar
              </>
            )}
          </Button>

          {/* Content Type Selection Modal */}
          {showTypeSelection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4 text-slate-100">Escolha o Tipo de Conteúdo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {contentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.id}
                        onClick={() => handleContentTypeSelect(type.id)}
                        className="p-4 border border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-950/30 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-950/50 rounded-lg flex items-center justify-center border border-blue-800/30">
                            <IconComponent className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-100">{type.title}</h4>
                            <p className="text-sm text-slate-400 mb-2">{type.description}</p>
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="w-3 h-3 mr-1" />
                              ~{type.estimatedTime} min
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTypeSelection(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </WidgetWrapper>
    );
  }

  // Show active workflow
  const currentContentType = contentTypes.find(t => t.id === workflowState.contentType);
  const currentStep = workflowState.steps[workflowState.currentStep];
  const suggestedTools = getSuggestedTools(workflowState.contentType);
  const estimatedTimeRemaining = getEstimatedCompletionTime(workflowState);

  return (
    <WidgetWrapper
      title={`${currentContentType?.title} Workflow`}
      icon={<Play className="w-5 h-5" />}
      actions={
        <div className="text-right">
          <div className="text-sm text-slate-400">Progresso</div>
          <div className="text-lg font-semibold text-blue-400">
            {Math.round(workflowState.progress)}%
          </div>
          {estimatedTimeRemaining > 0 && (
            <div className="text-xs text-slate-500">
              ~{formatTime(estimatedTimeRemaining)} restantes
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step info */}
        <p className="text-sm text-slate-400">
          Passo {workflowState.currentStep + 1} de {workflowState.steps.length}
        </p>

        {/* Save Status */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                <span>Salvando...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Salvo {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : null}
          </div>
          <div>
            Iniciado {workflowState.startedAt.toLocaleTimeString()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${workflowState.progress}%` }}
          />
        </div>

        {/* Current Step */}
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {workflowState.currentStep + 1}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-slate-100">{currentStep?.name}</h4>
                <p className="text-sm text-slate-400">{currentStep?.description}</p>
              </div>
            </div>
            <Button
              onClick={completeCurrentStep}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={currentStep?.completed}
            >
              {currentStep?.completed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Concluído
                </>
              ) : (
                'Marcar Completo'
              )}
            </Button>
          </div>

          {/* Suggested Tools for Current Step */}
          {suggestedTools.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-slate-300">Ferramentas Recomendadas:</h5>
              <div className="flex flex-wrap gap-2">
                {suggestedTools.map((tool) => (
                  <Button
                    key={tool.toolId}
                    variant="outline"
                    size="sm"
                    onClick={tool.action}
                    className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    {tool.toolName}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* All Steps Overview */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-slate-300">Passos do Workflow:</h5>
          {workflowState.steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-3 p-2 rounded ${
                index === workflowState.currentStep 
                  ? 'bg-blue-950/30 border border-blue-800/30' 
                  : ''
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : index === workflowState.currentStep ? (
                <div className="w-5 h-5 border-2 border-blue-600 rounded-full" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600" />
              )}
              <div className="flex-1">
                <span className={`text-sm ${
                  step.completed ? 'text-green-400' : 
                  index === workflowState.currentStep ? 'text-blue-400 font-medium' : 
                  'text-slate-400'
                }`}>
                  {step.name}
                </span>
              </div>
              {step.estimatedTime && (
                <span className="text-xs text-slate-500">
                  {step.estimatedTime}m
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
}