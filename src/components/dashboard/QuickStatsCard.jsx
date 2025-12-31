import React from "react";
import { Zap, Clock, CheckCircle, Upload, TrendingUp, Target } from "lucide-react";

export function QuickStatsCard({ state }) {
    const todayVideos = state.uploadQueue?.filter(v => {
        const today = new Date().toDateString();
        return new Date(v.scheduledAt || v.createdAt).toDateString() === today;
    }).length || 0;

    const queueCount = state.uploadQueue?.length || 0;
    const completedTasks = state.checklists?.[0]?.items?.filter(i => i.done).length || 0;
    const totalTasks = state.checklists?.[0]?.items?.length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = [
        {
            label: "Hoje",
            value: todayVideos,
            icon: Clock,
            color: "text-blue-400",
            bgColor: "bg-blue-500/20",
            borderColor: "border-blue-500/30",
            trend: todayVideos > 0 ? "up" : "neutral"
        },
        {
            label: "Na Fila",
            value: queueCount,
            icon: Upload,
            color: "text-purple-400",
            bgColor: "bg-purple-500/20",
            borderColor: "border-purple-500/30",
            trend: queueCount > 3 ? "up" : "neutral"
        },
        {
            label: "Progresso",
            value: `${completionRate}%`,
            icon: Target,
            color: completionRate >= 80 ? "text-green-400" : completionRate >= 50 ? "text-amber-400" : "text-slate-400",
            bgColor: completionRate >= 80 ? "bg-green-500/20" : completionRate >= 50 ? "bg-amber-500/20" : "bg-slate-500/20",
            borderColor: completionRate >= 80 ? "border-green-500/30" : completionRate >= 50 ? "border-amber-500/30" : "border-slate-500/30",
            trend: completionRate >= 80 ? "up" : "neutral"
        }
    ];

    return (
        <div className="glass-panel rounded-xl overflow-hidden animate-in slide-in-from-right-4 duration-700 h-full flex flex-col">
            {/* Enhanced Header */}
            <div className="p-4 border-b border-surface-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5 flex-shrink-0">
                <h3 className="text-heading-sm text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    Stats Rápidas
                </h3>
                <p className="text-caption text-slate-400 mt-1">
                    Resumo da sua atividade hoje
                </p>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 flex-1">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`relative group bg-gradient-to-r from-slate-800/50 to-slate-700/30 border ${stat.borderColor} rounded-xl p-3 hover:from-slate-700/50 hover:to-slate-600/30 transition-all duration-300 hover:scale-[1.02]`}>
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl"></div>
                            
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <span className="text-body text-slate-300 font-medium">{stat.label}</span>
                                        {stat.trend === "up" && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <TrendingUp className="w-3 h-3 text-green-400" />
                                                <span className="text-[10px] text-green-400 font-semibold">Ativo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xl font-bold ${stat.color} group-hover:scale-110 transition-transform duration-300 inline-block`}>
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Action Hint */}
                <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg flex-shrink-0">
                    <p className="text-caption text-purple-300 flex items-center gap-2">
                        <span className="text-purple-400">💡</span>
                        <span>Dica: Use a Central de Criação para adicionar mais vídeos à fila</span>
                    </p>
                </div>
            </div>
        </div>
    );
}