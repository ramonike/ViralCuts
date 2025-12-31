import React from 'react';
import { ChevronRight, Clock, Lock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useJourney } from '../../contexts/JourneyContext';

export function JourneyRoadmap() {
    const { journeyState, stages, calculateProgress, updateProgress } = useJourney();

    const handleStageClick = (stage) => {
        if (!stage.unlocked) return;
        
        // Navigate to relevant section or show stage details
        console.log('Navigate to stage:', stage.id);
    };

    const handleMilestoneClick = (milestone) => {
        if (milestone.completed) return;
        
        if (milestone.actionUrl) {
            // Navigate to the action URL
            window.location.href = milestone.actionUrl;
        } else {
            // Mark as completed (for demo purposes)
            updateProgress(milestone.id);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-green-400 bg-green-500/10';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10';
            case 'hard': return 'text-red-400 bg-red-500/10';
            default: return 'text-slate-400 bg-slate-500/10';
        }
    };

    const getDifficultyText = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'Fácil';
            case 'medium': return 'Médio';
            case 'hard': return 'Difícil';
            default: return 'N/A';
        }
    };

    return (
        <div className="space-y-2 h-full overflow-y-auto custom-scrollbar pr-1">
            {stages.map((stage, index) => {
                const progress = calculateProgress(stage.id);
                const isCompleted = progress === 100;
                const isCurrent = stage.id === journeyState.currentStage;
                const isLocked = !stage.unlocked;

                return (
                    <div key={stage.id} className="space-y-2">
                        {/* Enhanced Stage Header - MAIS COMPACTO */}
                        <div
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${
                                isCompleted
                                    ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border-green-500/30 shadow-sm'
                                    : isCurrent
                                        ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/20 border-purple-500/30 hover:from-purple-800/30 hover:to-blue-800/20 shadow-sm'
                                        : isLocked
                                            ? 'bg-slate-800/30 border-slate-700/50 opacity-60 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-slate-800/50 to-slate-700/30 border-slate-700/50 hover:border-slate-600/70 hover:from-slate-700/50 hover:to-slate-600/30'
                            }`}
                            onClick={() => handleStageClick(stage)}
                        >
                            {/* Background Pattern */}
                            {(isCompleted || isCurrent) && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent"></div>
                            )}
                            
                            {/* Enhanced Stage Icon & Status - MENOR */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md relative z-10 ${
                                isCompleted
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                    : isCurrent
                                        ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                                        : isLocked
                                            ? 'bg-slate-700/50'
                                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                ) : isLocked ? (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <span className="text-sm text-white">{stage.icon}</span>
                                )}
                            </div>

                            {/* Enhanced Stage Info - COMPACTO */}
                            <div className="flex-1 min-w-0 relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-xs font-bold truncate ${
                                        isCompleted ? 'text-green-300' : isCurrent ? 'text-purple-300' : 'text-slate-200'
                                    }`}>
                                        {stage.name}
                                    </h4>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${getDifficultyColor(stage.difficulty)}`}>
                                            {getDifficultyText(stage.difficulty)}
                                        </span>
                                        <span className="text-[8px] text-slate-500 flex items-center gap-0.5 bg-slate-700/50 px-1.5 py-0.5 rounded-full">
                                            <Clock className="w-2 h-2" />
                                            {stage.estimatedTime}min
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Enhanced Progress Bar - MENOR */}
                                {!isLocked && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] text-slate-500 font-medium">
                                                {stage.milestones.filter(m => journeyState.completedMilestones.includes(m.id)).length}/{stage.milestones.length} marcos
                                            </span>
                                            <span className={`text-[8px] font-bold ${
                                                isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-400' : 'text-slate-500'
                                            }`}>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isCompleted 
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                                }`}
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Expand Arrow - MENOR */}
                            {!isLocked && (
                                <div className="relative z-10">
                                    <ChevronRight className={`w-4 h-4 transition-all group-hover:translate-x-0.5 ${
                                        isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-400' : 'text-slate-400'
                                    }`} />
                                </div>
                            )}
                        </div>

                        {/* Milestones (show for current stage) - MAIS COMPACTO */}
                        {isCurrent && !isLocked && (
                            <div className="ml-4 space-y-1">
                                {stage.milestones.slice(0, 2).map((milestone) => {
                                    const isCompleted = journeyState.completedMilestones.includes(milestone.id);
                                    
                                    return (
                                        <div
                                            key={milestone.id}
                                            className={`flex items-center gap-2 p-1.5 rounded border transition-all cursor-pointer group text-xs ${
                                                isCompleted
                                                    ? 'bg-success/5 border-success/20 opacity-60'
                                                    : 'bg-slate-800/30 border-slate-700/30 hover:border-purple/30 hover:bg-purple/5'
                                            }`}
                                            onClick={() => handleMilestoneClick(milestone)}
                                        >
                                            <div className={`w-2 h-2 rounded border flex items-center justify-center flex-shrink-0 ${
                                                isCompleted
                                                    ? 'bg-success border-success'
                                                    : 'border-slate-500 group-hover:border-purple'
                                            }`}>
                                                {isCompleted && <CheckCircle className="w-1 h-1 text-white" />}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] truncate ${
                                                    isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'
                                                }`}>
                                                    {milestone.title}
                                                </p>
                                            </div>

                                            {milestone.actionUrl && !isCompleted && (
                                                <ExternalLink className="w-2 h-2 text-slate-500 group-hover:text-purple flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {stage.milestones.length > 2 && (
                                    <div className="text-center py-0.5">
                                        <span className="text-[8px] text-slate-500">
                                            +{stage.milestones.length - 2} mais marcos
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Connection Line - MENOR */}
                        {index < stages.length - 1 && (
                            <div className="flex justify-center">
                                <div className={`w-0.5 h-2 ${
                                    isCompleted ? 'bg-success' : 'bg-slate-700'
                                }`} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}