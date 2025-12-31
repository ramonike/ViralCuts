import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Circle, Play, Check, Clock } from 'lucide-react';

export const TimelineView = () => {
    const [currentWeek, setCurrentWeek] = useState(0);

    // Mock pipeline stages
    const stages = [
        { id: 'ideation', name: 'Ideação', color: 'bg-blue-500' },
        { id: 'production', name: 'Produção', color: 'bg-yellow-500' },
        { id: 'editing', name: 'Edição', color: 'bg-orange-500' },
        { id: 'review', name: 'Revisão', color: 'bg-purple-500' },
        { id: 'scheduled', name: 'Agendado', color: 'bg-green-500' },
        { id: 'published', name: 'Publicado', color: 'bg-teal-500' },
    ];

    // Mock videos in pipeline
    const videos = [
        { id: 1, title: 'Tutorial IA Generativa', stage: 'editing', progress: 65 },
        { id: 2, title: 'Review Produto X', stage: 'production', progress: 30 },
        { id: 3, title: 'Top 10 Dicas', stage: 'scheduled', progress: 100 },
        { id: 4, title: 'Vlog Diário #45', stage: 'ideation', progress: 10 },
        { id: 5, title: 'Como usar ChatGPT', stage: 'review', progress: 85 },
        { id: 6, title: 'Análise Mercado', stage: 'published', progress: 100 },
    ];

    const getStageIcon = (stage) => {
        switch (stage) {
            case 'ideation':
                return <Circle className="w-3 h-3" />;
            case 'production':
            case 'editing':
                return <Clock className="w-3 h-3" />;
            case 'review':
                return <Play className="w-3 h-3" />;
            case 'scheduled':
            case 'published':
                return <Check className="w-3 h-3" />;
            default:
                return <Circle className="w-3 h-3" />;
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Timeline de Produção</h2>
                    <p className="text-sm text-slate-400">Visualize todo o pipeline de conteúdo</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentWeek(currentWeek - 1)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="text-sm text-slate-300 px-3">Semana Atual</span>
                    <button
                        onClick={() => setCurrentWeek(currentWeek + 1)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {/* Stage Headers */}
                <div className="grid grid-cols-6 gap-2">
                    {stages.map((stage) => (
                        <div
                            key={stage.id}
                            className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-700"
                        >
                            <p className="text-xs font-semibold text-white">{stage.name}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {videos.filter(v => v.stage === stage.id).length}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Video Cards */}
                <div className="grid grid-cols-6 gap-2 min-h-[400px]">
                    {stages.map((stage) => (
                        <div key={stage.id} className="space-y-2">
                            {videos
                                .filter(v => v.stage === stage.id)
                                .map((video) => {
                                    const stageColor = stages.find(s => s.id === video.stage)?.color;
                                    return (
                                        <div
                                            key={video.id}
                                            className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className={`p-1 rounded ${stageColor} bg-opacity-20`}>
                                                    {getStageIcon(video.stage)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                                                        {video.title}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">Progresso</span>
                                                    <span className="text-xs font-bold text-white">{video.progress}%</span>
                                                </div>
                                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${stageColor} transition-all duration-300`}
                                                        style={{ width: `${video.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">{videos.length}</p>
                    <p className="text-xs text-slate-400">Total em Produção</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                        {videos.filter(v => v.stage === 'scheduled').length}
                    </p>
                    <p className="text-xs text-slate-400">Agendados</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400">
                        {videos.filter(v => v.stage === 'editing').length}
                    </p>
                    <p className="text-xs text-slate-400">Em Edição</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                        {videos.filter(v => v.stage === 'ideation').length}
                    </p>
                    <p className="text-xs text-slate-400">Em Ideação</p>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
