import React, { useState, useEffect } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useAnalytics, DATE_RANGE_OPTIONS } from "../hooks/useAnalytics";
import { useTheme } from "../contexts/ThemeContext";
import { analyzeBestPublishingTimes } from "../api/analytics";
import {
    TrendingUp, Eye, ThumbsUp, Clock, Users, RefreshCw,
    Calendar, AlertCircle, BarChart2, Info
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { PerformanceChart } from "../components/analytics/PerformanceChart";
import { ViewingHeatmap } from "../components/analytics/ViewingHeatmap";
import { TopVideosTable } from "../components/analytics/TopVideosTable";
import { ExportButton } from "../components/analytics/ExportButton";
import { InsightsPanel } from "../components/analytics/InsightsPanel";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (num) => {
    if (!num && num !== 0) return "—";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString("pt-BR");
};

const fmtMin = (min) => {
    if (!min) return "—";
    if (min >= 60) return `${(min / 60).toFixed(1)}h`;
    return `${min}min`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, isDark, loading }) {
    return (
        <div className={`rounded-xl border p-5 transition-all ${isDark ? "glass-panel border-surface-700/50 hover:border-primary/30" : "bg-white border-gray-200 shadow-sm hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-500" : "text-gray-400"}`}>{label}</span>
            </div>
            {loading ? (
                <div className={`h-8 w-24 rounded-lg animate-pulse ${isDark ? "bg-surface-700" : "bg-gray-100"}`} />
            ) : (
                <>
                    <p className={`text-3xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
                    {sub && <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>{sub}</p>}
                </>
            )}
        </div>
    );
}

// ─── Banner de scope faltando ─────────────────────────────────────────────────
function AnalyticsScopeBanner({ isDark }) {
    return (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
                <p className={`text-sm font-medium ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                    Dados de período indisponíveis
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-amber-400/70" : "text-amber-700"}`}>
                    Os totais do canal estão corretos. Para ver métricas por período (últimos 7/30 dias), reconecte sua conta YouTube — o acesso ao YouTube Analytics precisa ser reautorizado.
                </p>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const { state } = useDashboardState();
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const token = state.auth?.youtubeToken;

    const { loading, error, period, channelAnalytics, trafficSources, changePeriod, refresh } = useAnalytics(token);
    const [refreshing, setRefreshing] = useState(false);
    const [bestTimes, setBestTimes] = useState(null);

    // Dados reais do canal (sempre disponíveis quando YouTube conectado)
    const channelStats = state.channelStats?.statistics || {};
    const totalViews = parseInt(channelStats.viewCount) || 0;
    const totalSubs = parseInt(channelStats.subscriberCount) || 0;
    const totalVideos = parseInt(channelStats.videoCount) || 0;

    // Detecta se a Analytics API retornou dados reais (não zeros)
    const hasAnalyticsData = channelAnalytics && (
        channelAnalytics.views > 0 ||
        channelAnalytics.watchTimeMinutes > 0 ||
        channelAnalytics.subscribersGained > 0
    );

    useEffect(() => {
        if (token && !loading) {
            analyzeBestPublishingTimes(token, period).then(setBestTimes).catch(() => { });
        }
    }, [token, period, loading]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        if (token) analyzeBestPublishingTimes(token, period).then(setBestTimes).catch(() => { });
        setRefreshing(false);
    };

    const chartData = (() => {
        const fetchedData = state.analytics?.views24h || [];
        const dataMap = {};
        fetchedData.forEach(item => { dataMap[item.name] = item.views; });
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
            return { name: key, views: dataMap[key] || 0 };
        });
    })();

    // Stats cards — prioriza dados reais do canal, complementa com analytics de período
    const channelSummaryStats = [
        {
            icon: <Eye className="w-4 h-4 text-primary" />,
            label: "Total de views",
            value: fmt(totalViews),
            sub: "acumulado do canal",
        },
        {
            icon: <Users className="w-4 h-4 text-blue-400" />,
            label: "Inscritos",
            value: fmt(totalSubs),
            sub: "total atual",
        },
        {
            icon: <TrendingUp className="w-4 h-4 text-green-400" />,
            label: "Vídeos publicados",
            value: fmt(totalVideos),
            sub: "no canal",
        },
        {
            icon: <BarChart2 className="w-4 h-4 text-purple-400" />,
            label: "Média por vídeo",
            value: totalVideos > 0 ? fmt(Math.round(totalViews / totalVideos)) : "—",
            sub: "views / vídeo",
        },
    ];

    const periodStats = hasAnalyticsData ? [
        {
            icon: <Eye className="w-4 h-4 text-primary" />,
            label: "Views no período",
            value: fmt(channelAnalytics.views),
        },
        {
            icon: <Clock className="w-4 h-4 text-blue-400" />,
            label: "Tempo de exibição",
            value: fmtMin(channelAnalytics.watchTimeMinutes),
        },
        {
            icon: <Users className="w-4 h-4 text-green-400" />,
            label: "Inscritos ganhos",
            value: `+${fmt(channelAnalytics.subscribersGained)}`,
        },
        {
            icon: <ThumbsUp className="w-4 h-4 text-purple-400" />,
            label: "CTR médio",
            value: `${channelAnalytics.impressionsCTR?.toFixed(1) ?? 0}%`,
        },
    ] : null;

    return (
        <PageLayout title="Analytics" subtitle="Acompanhe o crescimento do seu canal." maxWidth="7xl">

            {/* ── Controles ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-gray-500"}`} />
                    <select
                        value={period}
                        onChange={e => changePeriod(e.target.value)}
                        disabled={loading}
                        className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDark ? "bg-surface-800 border-surface-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                    >
                        {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton data={channelAnalytics} period={period} disabled={!channelAnalytics || loading} />
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Atualizando..." : "Atualizar"}
                    </button>
                </div>
            </div>

            {/* ── Erro ── */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* ── Stats totais do canal (sempre disponíveis) ── */}
            {totalViews > 0 && (
                <div className="mb-6">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                        Totais do canal
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {channelSummaryStats.map((s, i) => (
                            <StatCard key={i} {...s} isDark={isDark} loading={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Stats de período (quando disponíveis) ── */}
            {!loading && !hasAnalyticsData && token && <AnalyticsScopeBanner isDark={isDark} />}

            {hasAnalyticsData && (
                <div className="mb-6">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                        Período selecionado
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {periodStats.map((s, i) => (
                            <StatCard key={i} {...s} isDark={isDark} loading={loading && !channelAnalytics} />
                        ))}
                    </div>
                </div>
            )}

            {loading && !channelAnalytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => <StatCard key={i} icon={<Eye className="w-4 h-4" />} label="..." value="—" isDark={isDark} loading={true} />)}
                </div>
            )}

            {/* ── Gráfico + Top Vídeos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <PerformanceChart data={chartData} period={period} loading={loading} />
                </div>
                <div>
                    <TopVideosTable loading={loading} limit={5} />
                </div>
            </div>

            {/* ── Heatmap ── */}
            <div className="mb-6">
                <ViewingHeatmap loading={loading} />
            </div>

            {/* ── Insights ── */}
            <InsightsPanel
                channelAnalytics={channelAnalytics}
                trafficSources={trafficSources}
                bestTimes={bestTimes}
                loading={loading}
            />

        </PageLayout>
    );
}
