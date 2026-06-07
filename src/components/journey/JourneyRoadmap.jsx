import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, Lock, CheckCircle, AlertCircle, ExternalLink, ChevronDown, X, Play } from 'lucide-react';
import { useJourney } from '../../contexts/JourneyContext';

export function JourneyRoadmap() {
    const { journeyState, stages, calculateProgress, updateProgress } = useJourney();
    const [expandedStage, setExpandedStage] = useState(journeyState.currentStage);
    const [selectedTutorial, setSelectedTutorial] = useState(null);

    // Keep it synced initially if currentStage changes automatically
    useEffect(() => {
        setExpandedStage(journeyState.currentStage);
    }, [journeyState.currentStage]);

    const handleStageClick = (stage) => {
        if (!stage.unlocked) return;
        
        // Toggle expanded state
        setExpandedStage(prev => prev === stage.id ? null : stage.id);
    };

    const handleMilestoneClick = (milestone) => {
        setSelectedTutorial(milestone);
    };

    const handleActionClick = (e, actionUrl) => {
        e.stopPropagation();
        window.location.href = actionUrl;
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
                                    {expandedStage === stage.id ? (
                                        <ChevronDown className={`w-4 h-4 transition-all ${
                                            isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-400' : 'text-slate-400'
                                        }`} />
                                    ) : (
                                        <ChevronRight className={`w-4 h-4 transition-all group-hover:translate-x-0.5 ${
                                            isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-400' : 'text-slate-400'
                                        }`} />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Milestones (show for expanded stage) - MAIS COMPACTO */}
                        {expandedStage === stage.id && !isLocked && (
                            <div className="ml-4 space-y-1 pb-2">
                                {stage.milestones.map((milestone) => {
                                    const isCompleted = journeyState.completedMilestones.includes(milestone.id);
                                    
                                    return (
                                        <div
                                            key={milestone.id}
                                            className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer group text-xs ${
                                                isCompleted
                                                    ? 'bg-success/5 border-success/20 opacity-60'
                                                    : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 hover:bg-purple-900/20'
                                            }`}
                                            onClick={() => handleMilestoneClick(milestone)}
                                        >
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                                                isCompleted
                                                    ? 'bg-success border-success'
                                                    : 'border-slate-500 group-hover:border-purple-500'
                                            }`}>
                                                {isCompleted && <CheckCircle className="w-2 h-2 text-white" />}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                                                <p className={`text-[11px] font-semibold truncate ${
                                                    isCompleted ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-purple-300'
                                                }`}>
                                                    {milestone.title}
                                                </p>
                                                <p className={`text-[9px] break-words whitespace-normal text-slate-400 mt-0.5 leading-tight ${isCompleted && 'line-through'}`}>
                                                    {milestone.description}
                                                </p>
                                            </div>

                                            {milestone.actionUrl && !isCompleted && (
                                                <div 
                                                    className="bg-purple-500/10 p-1.5 rounded-full text-purple-400 hover:bg-purple-500 hover:text-white transition-colors"
                                                    onClick={(e) => handleActionClick(e, milestone.actionUrl)}
                                                    role="button"
                                                >
                                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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

            {/* Tutorial Modal (Glassmorphism) */}
            {selectedTutorial && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/20 overflow-hidden relative">
                        {/* Header bg */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/10" />
                        
                        <div className="relative p-6">
                            <button 
                                onClick={() => setSelectedTutorial(null)}
                                className="absolute top-2 right-2 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                                <Play className="w-6 h-6 text-white" />
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                                {selectedTutorial.title}
                            </h2>

                            <div className="space-y-3 mb-8 mt-4 text-sm text-slate-300">
                                {selectedTutorial.description.split('\n').map((paragraph, i) => {
                                    if (!paragraph.trim()) return null;
                                    const isStep = paragraph.toLowerCase().includes('passo') || /^\d+\./.test(paragraph);
                                    return (
                                        <p key={i} className={`${isStep ? 'font-semibold text-purple-300 mt-2' : ''}`}>
                                            {paragraph}
                                        </p>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-3">
                                {selectedTutorial.actionUrl && (
                                    <button 
                                        onClick={(e) => {
                                            handleActionClick(e, selectedTutorial.actionUrl);
                                            setSelectedTutorial(null);
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Acessar o Painel Agora
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => {
                                        updateProgress(selectedTutorial.id);
                                        setSelectedTutorial(null);
                                    }}
                                    className={`w-full font-semibold py-3 rounded-xl transition-colors border flex items-center justify-center gap-2 ${
                                        journeyState.completedMilestones.includes(selectedTutorial.id)
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {journeyState.completedMilestones.includes(selectedTutorial.id) ? 'Tutorial Lido e Concluído' : 'Marcar como Concluído'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}