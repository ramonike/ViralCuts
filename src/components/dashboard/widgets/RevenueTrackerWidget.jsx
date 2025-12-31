import React, { useState } from 'react';
import { Widget } from '../../../design-system/components/Widget';
import { DollarSign, TrendingUp, Calendar, Target, Lock } from 'lucide-react';
import { usePremium } from '../../contexts/PremiumContext';
import { Button } from '../ui/button';

export const RevenueTrackerWidget = () => {
    const { hasFeature } = usePremium();
    const isPremium = hasFeature('revenueTracker');

    // Mock revenue data
    const revenueData = {
        thisMonth: 2450.32,
        lastMonth: 2180.50,
        ytd: 18920.75,
        projected: 29500,
    };

    const growth = ((revenueData.thisMonth - revenueData.lastMonth) / revenueData.lastMonth * 100).toFixed(1);

    if (!isPremium) {
        return (
            <Widget
                title="Revenue Tracker"
                icon={<DollarSign className="w-4 h-4" />}
                color="lime"
                className="col-span-full lg:col-span-2"
            >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-primary-500/10 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Feature Premium</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-xs">
                        Acompanhe sua receita, projeções e metas financeiras com o Revenue Tracker
                    </p>
                    <Button className="bg-primary-600 hover:bg-primary-700">
                        Fazer Upgrade para Pro
                    </Button>
                </div>
            </Widget>
        );
    }

    return (
        <Widget
            title="Revenue Tracker"
            icon={<DollarSign className="w-4 h-4" />}
            color="lime"
            className="col-span-full lg:col-span-2"
            actions={
                <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                    Premium
                </span>
            }
        >
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-lime-500/10 border border-lime-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">Este Mês</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                            ${revenueData.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${growth >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            <TrendingUp className="w-3 h-3" />
                            {growth}%
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Target className="w-3 h-3" />
                        <span className="text-xs">Projeção Anual</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                        ${revenueData.projected.toLocaleString('en-US')}
                    </span>
                </div>
            </div>

            {/* YTD Progress */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Progresso Anual</span>
                    <span className="text-xs font-bold text-lime-400">
                        ${revenueData.ytd.toLocaleString('en-US')} / ${revenueData.projected.toLocaleString('en-US')}
                    </span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-lime-400 transition-all duration-500"
                        style={{ width: `${(revenueData.ytd / revenueData.projected) * 100}%` }}
                    />
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-32 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/50">
                <p className="text-xs text-slate-500">Gráfico de receita mensal (em breve)</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-400">RPM</p>
                    <p className="text-sm font-bold text-white">$4.20</p>
                </div>
                <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-400">CPM</p>
                    <p className="text-sm font-bold text-white">$8.50</p>
                </div>
                <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-400">Média/Vídeo</p>
                    <p className="text-sm font-bold text-white">$125</p>
                </div>
            </div>
        </Widget>
    );
};

export default RevenueTrackerWidget;
