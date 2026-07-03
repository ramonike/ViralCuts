import React, { useState, useEffect } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useAnalytics, DATE_RANGE_OPTIONS } from "../hooks/useAnalytics";
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
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";

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

function StatCard({ icon, label, value, sub, loading }) {
    return (
        <div className="vc-metric-card metric-neutral">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-[var(--accent-coral-3)]" style={{ color: 'var(--accent-coral-2)' }}>
                    {icon}
                </div>
                <span className="vc-metric-label" style={{ marginBottom: 0 }}>{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-24 rounded-lg animate-pulse bg-[var(--bg-elevated)]" />
            ) : (
                <>
                    <p className="vc-metric-value">{value}</p>
                    {sub && <p className="text-xs mt-1 text-[var(--text-muted)]">{sub}</p>}
                </>
            )}
        </div>
    );
}

function AnalyticsScopeBanner() {
    return (
        <div className="vc-toast vc-toast-amber mb-6">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-medium">Dados de período indisponíveis</p>
                <p className="text-xs mt-0.5 opacity-70">
                    Os totais do canal estão corretos. Para ver métricas por período (últimos 7/30 dias), reconecte sua conta YouTube — o acesso ao YouTube Analytics precisa ser reautorizado.
                </p>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const { state } = useDashboardState();
    const token = state.auth?.youtubeToken;

    const { loading, error, period, channelAnalytics, trafficSources, changePeriod, refresh } = useAnalytics(token);
    const [refreshing, setRefreshing] = useState(false);
    const [bestTimes, setBestTimes] = useState(null);

    const channelStats = state.channelStats?.statistics || {};
    const totalViews = parseInt(channelStats.viewCount) || 0;
    const totalSubs = parseInt(channelStats.subscriberCount) || 0;
    const totalVideos = parseInt(channelStats.videoCount) || 0;

    const hasAnalyticsData = channelAnalytics && (
        channelAnalytics.views > 0 || channelAnalytics.watchTimeMinutes > 0 || channelAnalytics.subscribersGained > 0
    );

    useEffect(() => {
        if (token && !loading) analyzeBestPublishingTimes(token, period).then(setBestTimes).catch(() => {});
    }, [token, period, loading]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        if (token) analyzeBestPublishingTimes(token, period).then(setBestTimes).catch(() => {});
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

    const channelSummaryStats = [
        { icon: <Eye size={16} />, label: "Total de views", value: fmt(totalViews), sub: "acumulado do canal" },
        { icon: <Users size={16} />, label: "Inscritos", value: fmt(totalSubs), sub: "total atual" },
        { icon: <TrendingUp size={16} />, label: "Vídeos publicados", value: fmt(totalVideos), sub: "no canal" },
        { icon: <BarChart2 size={16} />, label: "Média por vídeo", value: totalVideos > 0 ? fmt(Math.round(totalViews / totalVideos)) : "—", sub: "views / vídeo" },
    ];

    const periodStats = hasAnalyticsData ? [
        { icon: <Eye size={16} />, label: "Views no período", value: fmt(channelAnalytics.views) },
        { icon: <Clock size={16} />, label: "Tempo de exibição", value: fmtMin(channelAnalytics.watchTimeMinutes) },
        { icon: <Users size={16} />, label: "Inscritos ganhos", value: `+${fmt(channelAnalytics.subscribersGained)}` },
        { icon: <ThumbsUp size={16} />, label: "CTR médio", value: `${channelAnalytics.impressionsCTR?.toFixed(1) ?? 0}%` },
    ] : null;

    return (
        <PageLayout title="Analytics" subtitle="Acompanhe o crescimento do seu canal." maxWidth="7xl">

            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--text-muted)]" />
                    <Select value={period} onChange={e => changePeriod(e.target.value)} disabled={loading}>
                        {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton data={channelAnalytics} period={period} disabled={!channelAnalytics || loading} />
                    <Button onClick={handleRefresh} disabled={refreshing || loading}>
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Atualizando..." : "Atualizar"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="vc-toast vc-toast-coral mb-6">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {totalViews > 0 && (
                <div className="mb-6">
                    <p className="vc-metric-label mb-3">Totais do canal</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {channelSummaryStats.map((s, i) => <StatCard key={i} {...s} loading={false} />)}
                    </div>
                </div>
            )}

            {!loading && !hasAnalyticsData && token && <AnalyticsScopeBanner />}

            {hasAnalyticsData && (
                <div className="mb-6">
                    <p className="vc-metric-label mb-3">Período selecionado</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {periodStats.map((s, i) => <StatCard key={i} {...s} loading={loading && !channelAnalytics} />)}
                    </div>
                </div>
            )}

            {loading && !channelAnalytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => <StatCard key={i} icon={<Eye size={16} />} label="..." value="—" loading={true} />)}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <PerformanceChart data={chartData} period={period} loading={loading} />
                </div>
                <div>
                    <TopVideosTable loading={loading} limit={5} />
                </div>
            </div>

            <div className="mb-6">
                <ViewingHeatmap loading={loading} />
            </div>

            <InsightsPanel channelAnalytics={channelAnalytics} trafficSources={trafficSources} bestTimes={bestTimes} loading={loading} />

        </PageLayout>
    );
}
