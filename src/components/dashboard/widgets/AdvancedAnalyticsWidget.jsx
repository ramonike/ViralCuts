import React, { useState } from 'react';
import { Widget } from '../../../design-system/components/Widget';
import { BarChart3, TrendingUp, Users, Eye, Clock, Lock } from 'lucide-react';
import { usePremium } from '../../contexts/PremiumContext';
import { Button } from '../ui/button';

export const AdvancedAnalyticsWidget = () => {
    const { hasFeature } = usePremium();
    const isPremium = hasFeature('advancedAnalytics');
    const [timeRange, setTimeRange] = useState('30d');

    // Mock analytics data
    const analytics = {
        avgViewDuration: '4:32',
        retentionRate: 68,
        clickThroughRate: 8.4,
        engagementRate: 12.3,
        audienceGrowth: 15.2,
        topPerformingTime: '18:00',
    };

    if (!isPremium) {
        return (
            <Widget
                title="Advanced Analytics"
                icon={<BarChart3 className="w-4 h-4" />}
                color="cyan"
                className="col-span-full lg:col-span-2"
            >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Feature Premium</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-xs">
                        Acesse analytics avançados com insights profundos sobre seu canal
                    </p>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                        Fazer Upgrade para Pro
                    </Button>
                </div>
            </Widget>
        );
    }

    return (
        <Widget
            title="Advanced Analytics"
            icon={<BarChart3 className="w-4 h-4" />}
            color="cyan"
            className="col-span-full lg:col-span-2"
            actions={
                <div className="flex items-center gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="7d">7 dias</option>
                        <option value="30d">30 dias</option>
                        <option value="90d">90 dias</option>
                    </select>
                    <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                        Premium
                    </span>
                </div>
            }
        >
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">Duração Média</span>
                    </div>
                    <p className="text-xl font-bold text-white">{analytics.avgViewDuration}</p>
                </div>

                <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs">Retenção</span>
                    </div>
                    <p className="text-xl font-bold text-white">{analytics.retentionRate}%</p>
                </div>

                <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs">CTR</span>
                    </div>
                    <p className="text-xl font-bold text-white">{analytics.clickThroughRate}%</p>
                </div>
            </div>

            {/* Engagement */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Taxa de Engajamento</span>
                    <span className="text-xs font-bold text-cyan-400">{analytics.engagementRate}%</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-400 transition-all duration-500"
                        style={{ width: `${analytics.engagementRate * 5}%` }}
                    />
                </div>
            </div>

            {/* Insights */}
            <div className="space-y-2">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-medium text-white">Crescimento de Audiência</span>
                    </div>
                    <p className="text-xs text-slate-300">
                        Seu canal cresceu <strong className="text-green-400">+{analytics.audienceGrowth}%</strong> nos últimos 30 dias
                    </p>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-white">Melhor Horário</span>
                    </div>
                    <p className="text-xs text-slate-300">
                        Poste às <strong className="text-purple-400">{analytics.topPerformingTime}</strong> para máximo engajamento
                    </p>
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="mt-4 h-32 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/50">
                <p className="text-xs text-slate-500">Gráfico de analytics detalhado (em breve)</p>
            </div>
        </Widget>
    );
};

export default AdvancedAnalyticsWidget;
