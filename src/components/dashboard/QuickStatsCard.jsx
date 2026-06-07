import React from "react";
import { Zap, Clock, CheckCircle, Upload, TrendingUp, Target } from "lucide-react";
import WidgetWrapper from "../shared/WidgetWrapper";

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
            color: "text-blue-100",
            iconColor: "text-blue-400",
            bgGradient: "bg-gradient-to-br from-blue-950/80 to-blue-900/50",
            iconBg: "bg-blue-500/20",
            borderColor: "border-blue-500/30",
            trend: todayVideos > 0 ? { direction: "up", value: "+12%" } : null
        },
        {
            label: "Na Fila",
            value: queueCount,
            icon: Upload,
            color: "text-purple-100",
            iconColor: "text-purple-400",
            bgGradient: "bg-gradient-to-br from-purple-950/80 to-purple-900/50",
            iconBg: "bg-purple-500/20",
            borderColor: "border-purple-500/30",
            trend: queueCount > 3 ? { direction: "up", value: "+8%" } : null
        },
        {
            label: "Progresso",
            value: `${completionRate}%`,
            icon: Target,
            color: completionRate >= 80 ? "text-emerald-100" : completionRate >= 50 ? "text-amber-100" : "text-slate-100",
            iconColor: completionRate >= 80 ? "text-emerald-400" : completionRate >= 50 ? "text-amber-400" : "text-slate-400",
            bgGradient: completionRate >= 80 ? "bg-gradient-to-br from-emerald-950/80 to-emerald-900/50" : completionRate >= 50 ? "bg-gradient-to-br from-amber-950/80 to-amber-900/50" : "bg-gradient-to-br from-slate-950/80 to-slate-900/50",
            iconBg: completionRate >= 80 ? "bg-emerald-500/20" : completionRate >= 50 ? "bg-amber-500/20" : "bg-slate-500/20",
            borderColor: completionRate >= 80 ? "border-emerald-500/30" : completionRate >= 50 ? "border-amber-500/30" : "border-slate-500/30",
            trend: completionRate >= 80 ? { direction: "up", value: `+${completionRate - 50}%` } : completionRate < 50 ? { direction: "down", value: `-${50 - completionRate}%` } : { direction: "stable", value: "0%" }
        }
    ];

    return (
        <WidgetWrapper
            title="Stats Rápidas"
            icon={
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                </div>
            }
            className="h-full flex flex-col"
        >
            {/* Enhanced Stats Grid - Subtask 8.2: Mobile-optimized with 3-column compact grid */}
            <div className="flex-1 flex flex-col justify-between">
                {/* Desktop: Vertical stack */}
                <div className="hidden md:block space-y-3 flex-1">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`relative group ${stat.bgGradient} border ${stat.borderColor} rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl"></div>
                            
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl ${stat.iconBg} border ${stat.borderColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-300 font-medium">{stat.label}</span>
                                        {stat.trend && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {stat.trend.direction === "up" && (
                                                    <>
                                                        <span className="text-sm">📈</span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                                                            {stat.trend.value}
                                                        </span>
                                                    </>
                                                )}
                                                {stat.trend.direction === "down" && (
                                                    <>
                                                        <span className="text-sm">📉</span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                                                            {stat.trend.value}
                                                        </span>
                                                    </>
                                                )}
                                                {stat.trend.direction === "stable" && (
                                                    <>
                                                        <span className="text-sm">➡️</span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-semibold border border-slate-500/30">
                                                            Estável
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-3xl font-black ${stat.color} group-hover:scale-110 transition-transform duration-300 inline-block`}>
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile: 3-column compact grid */}
                <div className="md:hidden grid grid-cols-3 gap-2 flex-1">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`relative ${stat.bgGradient} border ${stat.borderColor} rounded-lg p-2 transition-all duration-300 active:scale-95`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-lg"></div>
                            
                            <div className="relative flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-lg ${stat.iconBg} border ${stat.borderColor} flex items-center justify-center mb-1.5`}>
                                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                </div>
                                <span className={`text-xl font-black ${stat.color} mb-0.5`}>
                                    {stat.value}
                                </span>
                                <span className="text-xs text-slate-400 font-medium leading-tight">{stat.label}</span>
                                {stat.trend && (
                                    <div className="mt-1">
                                        {stat.trend.direction === "up" && (
                                            <span className="text-xs">📈</span>
                                        )}
                                        {stat.trend.direction === "down" && (
                                            <span className="text-xs">📉</span>
                                        )}
                                        {stat.trend.direction === "stable" && (
                                            <span className="text-xs">➡️</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Action Hint - Subtask 8.2: Adjust padding for mobile */}
                <div className="p-2 md:p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg flex-shrink-0">
                    <p className="text-xs md:text-sm text-purple-300 flex items-center gap-2">
                        <span className="text-purple-400">💡</span>
                        <span className="hidden md:inline">Dica: Use a Central de Criação para adicionar mais vídeos à fila</span>
                        <span className="md:hidden">Use a Central de Criação</span>
                    </p>
                </div>
            </div>
        </WidgetWrapper>
    );
}