import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, Trophy, Star, Lock, CheckCircle, Play, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useJourney } from '../../contexts/JourneyContext';
import { OnboardingWizard } from './OnboardingWizard';
import { JourneyRoadmap } from './JourneyRoadmap';
import { ProgressTracker } from './ProgressTracker';

export function CreatorJourney() {
    const { journeyState, stages, userStats, updateProgress, resetJourney } = useJourney();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeView, setActiveView] = useState('roadmap'); // 'roadmap' | 'progress'

    // Check if user should see onboarding - DISABLED AUTO SHOW
    useEffect(() => {
        // Comentado para evitar modal automático
        // const skipped = localStorage.getItem('viralcuts-onboarding-skipped');
        // if (journeyState.isFirstLogin && !journeyState.onboardingCompleted && !skipped) {
        //     setShowOnboarding(true);
        // }
    }, [journeyState.isFirstLogin, journeyState.onboardingCompleted]);

    const handleResumeOnboarding = () => {
        setShowOnboarding(true);
    };

    const handleOnboardingComplete = () => {
        updateProgress('onboarding-completed');
        localStorage.removeItem('viralcuts-onboarding-skipped');
    };

    const currentStage = stages.find(s => s.id === journeyState.currentStage);
    const completedStages = stages.filter(s => 
        s.milestones.every(m => journeyState.completedMilestones.includes(m.id))
    ).length;

    const progressPercentage = Math.round((completedStages / stages.length) * 100);

    return (
        <div className="vc-card rounded-xl overflow-hidden animate-in slide-in-from-left-4 duration-700 h-full flex flex-col">
            {/* Enhanced Header */}
            <div className="p-4 border-b border-[var(--border-default)] bg-gradient-to-r from-purple-900/20 via-blue-900/10 to-purple-900/20 relative overflow-hidden flex-shrink-0">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-heading-sm text-white">Jornada do Criador</h3>
                                <p className="text-caption text-purple-300">
                                    Nível {journeyState.experienceLevel === 'beginner' ? 'Iniciante' : 
                                           journeyState.experienceLevel === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1 items-center">
                            {/* BOTAO TEMPORARIO DE RESET PARA TESTES */}
                            <button
                                onClick={() => {
                                    if(window.confirm('Resetar progresso para testar?')) resetJourney();
                                }}
                                className="text-[10px] px-2 py-1.5 mr-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-semibold"
                                title="Botão temporário para resetar seus testes"
                            >
                                Resetar Limpo
                            </button>

                            <button
                                onClick={() => setActiveView('roadmap')}
                                className={`text-[10px] px-3 py-1.5 rounded-full transition-all font-semibold ${
                                    activeView === 'roadmap'
                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white"
                                }`}
                            >
                                Roadmap
                            </button>
                            <button
                                onClick={() => setActiveView('progress')}
                                className={`text-[10px] px-3 py-1.5 rounded-full transition-all font-semibold ${
                                    activeView === 'progress'
                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white"
                                }`}
                            >
                                Progresso
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-caption text-slate-300 font-medium">Progresso Geral</span>
                            <span className="text-caption text-purple-300 font-bold">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                <span className="text-xs font-bold text-green-400">{completedStages}/5</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Etapas</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-3 h-3 text-amber-400" />
                                <span className="text-xs font-bold text-amber-400">{userStats.totalPoints}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Pontos</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Trophy className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-bold text-purple-400">{userStats.achievements.length}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Conquistas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - AGORA COM SCROLL FUNCIONAL E CTA COMPACTO */}
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {/* Enhanced Onboarding CTA - MAIS COMPACTO */}
                {!journeyState.onboardingCompleted && (
                    <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-purple-900/30 border border-purple-500/30 rounded-lg p-2 mb-3 relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-purple-300">
                                        🚀 Configure sua conta
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleResumeOnboarding}
                                className="cta-primary text-white h-6 px-2 text-[9px] font-semibold"
                            >
                                <Play className="w-2 h-2 mr-1" />
                                Continuar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main Content - GARANTINDO ESPAÇO ADEQUADO */}
                <div className="flex-1 min-h-0">
                    {activeView === 'roadmap' ? (
                        <JourneyRoadmap />
                    ) : (
                        <ProgressTracker />
                    )}
                </div>
            </div>

            {/* Onboarding Wizard */}
            <OnboardingWizard
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={handleOnboardingComplete}
            />
        </div>
    );
}