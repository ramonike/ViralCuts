import React from 'react';
import { Lightbulb, Sparkles, TrendingUp, Zap } from 'lucide-react';

export const InsightsPanel = () => {
    const insights = [
        {
            icon: <Lightbulb className="w-4 h-4" />,
            title: 'Melhor horário',
            description: 'Poste às 18h para +40% de engajamento',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/30',
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            title: 'Tendência',
            description: 'Vídeos curtos estão performando 2x melhor',
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
        },
        {
            icon: <Sparkles className="w-4 h-4" />,
            title: 'Sugestão',
            description: 'Adicione mais CTAs nos primeiros 10s',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30',
        },
    ];

    const quickStats = [
        { label: 'Taxa de Retenção', value: '68%', trend: '+5%' },
        { label: 'Avg. View Duration', value: '4:32', trend: '+12s' },
        { label: 'Engagement Rate', value: '12.4%', trend: '+2.1%' },
    ];

    return (
        <div className="space-y-4">
            {/* Insights Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary-400" />
                    <h3 className="font-semibold text-white text-sm">Insights</h3>
                </div>

                <div className="space-y-3">
                    {insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border ${insight.bgColor} ${insight.borderColor}`}
                        >
                            <div className="flex items-start gap-2">
                                <div className={insight.color}>{insight.icon}</div>
                                <div>
                                    <p className="text-xs font-medium text-white mb-1">{insight.title}</p>
                                    <p className="text-xs text-slate-400">{insight.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <h3 className="font-semibold text-white text-sm mb-4">Stats Rápidas</h3>

                <div className="space-y-3">
                    {quickStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{stat.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{stat.value}</span>
                                <span className="text-xs text-green-400">{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    <h3 className="font-semibold text-white text-sm">Dica do Dia</h3>
                </div>
                <p className="text-xs text-slate-300">
                    Use thumbnails com rostos em close-up para aumentar o CTR em até 30%
                </p>
            </div>
        </div>
    );
};

export default InsightsPanel;
