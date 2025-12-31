import React from 'react';
import { Trophy, Star, Target, Zap, Calendar, TrendingUp } from 'lucide-react';
import { useJourney } from '../../contexts/JourneyContext';

export function ProgressTracker() {
    const { journeyState, stages, userStats } = useJourney();

    const totalMilestones = stages.reduce((acc, stage) => acc + stage.milestones.length, 0);
    const completedMilestones = journeyState.completedMilestones.length;
    const overallProgress = Math.round((completedMilestones / totalMilestones) * 100);

    const getExperienceLevelInfo = (level) => {
        switch (level) {
            case 'beginner':
                return { name: 'Iniciante', color: 'text-green-400', bg: 'bg-green-500/10', icon: '🌱' };
            case 'intermediate':
                return { name: 'Intermediário', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🚀' };
            case 'advanced':
                return { name: 'Avançado', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '⭐' };
            default:
                return { name: 'Iniciante', color: 'text-green-400', bg: 'bg-green-500/10', icon: '🌱' };
        }
    };

    const levelInfo = getExperienceLevelInfo(journeyState.experienceLevel);

    const stats = [
        {
            label: 'Progresso Geral',
            value: `${overallProgress}%`,
            icon: Target,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
        },
        {
            label: 'Vídeos Criados',
            value: userStats.videosCreated,
            icon: TrendingUp,
            color: 'text-success',
            bgColor: 'bg-success/10'
        },
        {
            label: 'Ferramentas Usadas',
            value: userStats.toolsUsed.length,
            icon: Zap,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10'
        },
        {
            label: 'Dias Ativos',
            value: userStats.daysActive,
            icon: Calendar,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        }
    ];

    const recentAchievements = userStats.achievements
        .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
        .slice(0, 3);

    return (
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {/* Experience Level */}
            <div className={`${levelInfo.bg} border border-opacity-20 rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{levelInfo.icon}</span>
                        <span className={`text-sm font-bold ${levelInfo.color}`}>
                            {levelInfo.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">
                            {userStats.totalPoints}
                        </span>
                    </div>
                </div>
                
                {/* Overall Progress Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Progresso Geral</span>
                        <span className={levelInfo.color}>{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                                journeyState.experienceLevel === 'beginner' ? 'bg-green-500' :
                                journeyState.experienceLevel === 'intermediate' ? 'bg-yellow-500' :
                                'bg-purple-500'
                            }`}
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat, index) => (
                    <div key={index} className={`${stat.bgColor} rounded-lg p-2.5`}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded ${stat.bgColor} flex items-center justify-center`}>
                                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">
                                {stat.label}
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${stat.color}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        Conquistas Recentes
                    </h4>
                    <div className="space-y-1.5">
                        {recentAchievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className="flex items-center gap-2 p-2 bg-slate-800/30 rounded border border-slate-700/30"
                            >
                                <div className="text-lg">{achievement.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-200 truncate">
                                        {achievement.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        +{achievement.points} pontos
                                    </p>
                                </div>
                                <div className={`text-[9px] px-1.5 py-0.5 rounded ${
                                    achievement.rarity === 'legendary' ? 'bg-purple-500/20 text-purple-400' :
                                    achievement.rarity === 'epic' ? 'bg-orange-500/20 text-orange-400' :
                                    achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                    {achievement.rarity === 'legendary' ? 'Lendário' :
                                     achievement.rarity === 'epic' ? 'Épico' :
                                     achievement.rarity === 'rare' ? 'Raro' : 'Comum'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stage Progress */}
            <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Progresso por Etapa</h4>
                <div className="space-y-1.5">
                    {stages.map((stage) => {
                        const completedCount = stage.milestones.filter(m => 
                            journeyState.completedMilestones.includes(m.id)
                        ).length;
                        const progress = Math.round((completedCount / stage.milestones.length) * 100);
                        const isCompleted = progress === 100;
                        const isLocked = !stage.unlocked;

                        return (
                            <div key={stage.id} className="flex items-center gap-2">
                                <div className="text-sm">{stage.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-xs ${
                                            isCompleted ? 'text-success' : 
                                            isLocked ? 'text-slate-500' : 'text-slate-300'
                                        }`}>
                                            {stage.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {isLocked ? 'Bloqueado' : `${progress}%`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1">
                                        <div
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                isCompleted ? 'bg-success' : 
                                                isLocked ? 'bg-slate-600' : 'bg-primary'
                                            }`}
                                            style={{ width: `${isLocked ? 0 : progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Next Milestone */}
            {(() => {
                const currentStage = stages.find(s => s.id === journeyState.currentStage);
                const nextMilestone = currentStage?.milestones.find(m => 
                    !journeyState.completedMilestones.includes(m.id)
                );

                if (nextMilestone) {
                    return (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-primary mb-1">
                                🎯 Próximo Marco
                            </h4>
                            <p className="text-xs text-slate-300 mb-1">{nextMilestone.title}</p>
                            <p className="text-[10px] text-slate-400">
                                +{nextMilestone.points} pontos ao completar
                            </p>
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
}