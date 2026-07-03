import React, { useState, useEffect } from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useAnalytics, DATE_RANGE_OPTIONS } from "../hooks/useAnalytics";
import { analyzeBestPublishingTimes } from "../api/analytics";
import {
    TrendingUp, Eye, ThumbsUp, Clock, Users, RefreshCw,
    Calendar, AlertCircle, BarChart2, Info, Download,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { PerformanceChart } from "../components/analytics/PerformanceChart";
import { ViewingHeatmap } from "../components/analytics/ViewingHeatmap";
import { TopVideosTable } from "../components/analytics/TopVideosTable";
import { ExportButton } from "../components/analytics/ExportButton";
import { InsightsPanel } from "../components/analytics/InsightsPanel";

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
        { icon: <Eye size={20} style={{ color: "var(--coral)" }} />, label: "Total de views", value: fmt(totalViews) },
        { icon: <Users size={20} style={{ color: "var(--blue)" }} />, label: "Inscritos", value: fmt(totalSubs) },
        { icon: <TrendingUp size={20} style={{ color: "var(--teal)" }} />, label: "Vídeos publicados", value: fmt(totalVideos) },
        { icon: <BarChart2 size={20} style={{ color: "var(--purple)" }} />, label: "Média por vídeo", value: totalVideos > 0 ? fmt(Math.round(totalViews / totalVideos)) : "—" },
    ];

    const periodStats = hasAnalyticsData ? [
        { label: "Views", value: fmt(channelAnalytics.views), cardTop: "card-top-coral" },
        { label: "Tempo de exibição", value: fmtMin(channelAnalytics.watchTimeMinutes), cardTop: "card-top-amber" },
        { label: "Inscritos ganhos", value: `+${fmt(channelAnalytics.subscribersGained)}`, cardTop: "card-top-teal" },
        { label: "CTR médio", value: `${channelAnalytics.impressionsCTR?.toFixed(1) ?? 0}%`, cardTop: "card-top-purple" },
    ] : null;

    const iconColors = ["var(--coral)", "var(--blue)", "var(--teal)", "var(--purple)"];

    return (
        <PageLayout title="Analytics" subtitle="Acompanhe o crescimento do seu canal." maxWidth="7xl">
            <div className="section-header">
                <div />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select className="input" style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
                        value={period} onChange={e => changePeriod(e.target.value)} disabled={loading}>
                        {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ExportButton data={channelAnalytics} period={period} disabled={!channelAnalytics || loading} />
                    <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing || loading}>
                        <RefreshCw size={12} className={refreshing ? "spinning" : ""} /> Atualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="vc-toast vc-toast-coral mb-6">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {totalViews > 0 && (
                <>
                    <div className="section-intro">
                        <h2>Totais do canal</h2>
                    </div>
                    <div className="grid-4 mb-6">
                        {channelSummaryStats.map((s, i) => (
                            <div key={i} className="stat-card">
                                {s.icon}
                                <div className="value">{s.value}</div>
                                <div className="label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {!loading && !hasAnalyticsData && token && <AnalyticsScopeBanner />}

            {hasAnalyticsData && (
                <>
                    <div className="section-intro">
                        <h2>Período selecionado</h2>
                    </div>
                    <div className="grid-4 mb-6">
                        {periodStats.map((s, i) => (
                            <div key={i} className={`card ${s.cardTop}`}>
                                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {loading && !channelAnalytics && (
                <div className="grid-4 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card">
                            <div className="value">—</div>
                            <div className="label">Carregando...</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid-2 mb-6" style={{ gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                        Desempenho ({period === "7days" ? "7 dias" : period === "30days" ? "30 dias" : "período"})
                    </h3>
                    <PerformanceChart data={chartData} period={period} loading={loading} />
                </div>
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top Vídeos</h3>
                    <TopVideosTable loading={loading} limit={5} />
                </div>
            </div>

            <div className="card mb-6">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Mapa de Visualizações</h3>
                <ViewingHeatmap loading={loading} />
            </div>

            <InsightsPanel channelAnalytics={channelAnalytics} trafficSources={trafficSources} bestTimes={bestTimes} loading={loading} />
        </PageLayout>
    );
}
