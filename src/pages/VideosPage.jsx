/**
 * ChannelPage (era VideosPage) — v2
 * Renomeada para "Canal" — biblioteca dos vídeos já publicados no YouTube
 */
import React, { useState, useMemo } from "react";
import {
    Eye, ThumbsUp, Clock, Search, RefreshCw,
    Play, Youtube, X, TrendingUp,
    Video, ArrowUpRight
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { PageLayout } from "../components/layout/PageLayout";
import { ChannelSwitcher } from "../components/shared/ChannelSwitcher";

const formatNum = (n) => {
    if (!n) return "0";
    const v = parseInt(n);
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
    if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
    return v.toLocaleString("pt-BR");
};

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

function VideoCard({ video }) {
    const videoId = typeof video.id === "object" ? video.id?.videoId : video.id;
    const thumb = video.thumbnail || video.thumbnails?.medium?.url || video.thumbnails?.default?.url;
    const title = video.title || "Sem título";
    const viewCount = video.viewCount ?? 0;
    const likeCount = video.likeCount ?? 0;
    const videoUrl = video.url || `https://youtube.com/watch?v=${videoId}`;
    const [imgError, setImgError] = useState(false);

    return (
        <div style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius)", background: "var(--bg-default)" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--bg-elevated)", overflow: "hidden" }}>
                {thumb && !imgError ? (
                    <img src={thumb} alt={title} onError={() => setImgError(true)}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Video size={28} style={{ color: "var(--text-muted)" }} />
                    </div>
                )}
                <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <div className="play-btn-overlay" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s", boxShadow: "0 2px 12px rgba(0,0,0,.3)" }}>
                        <Play size={16} style={{ color: "#111", marginLeft: 2, fill: "#111" }} />
                    </div>
                </a>
            </div>
            <div style={{ padding: "12px 14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                        <Eye size={12} /> {formatNum(viewCount)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                        <ThumbsUp size={12} /> {formatNum(likeCount)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                        <Clock size={12} /> {formatDate(video.publishedAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ChannelStrip({ channelStats }) {
    if (!channelStats) return null;
    const stats = channelStats.statistics || {};
    const items = [
        { label: "Inscritos", value: formatNum(stats.subscriberCount) },
        { label: "Visualizações", value: formatNum(stats.viewCount) },
        { label: "Vídeos", value: formatNum(stats.videoCount) },
    ];
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {items.map(item => (
                <div key={item.label} className="vc-metric-card">
                    <div className="vc-metric-label" style={{ fontSize: 11 }}>{item.label}</div>
                    <div className="vc-metric-value" style={{ fontSize: "1.5rem" }}>{item.value}</div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasChannel, onNavigateProfile }) {
    if (!hasChannel) return (
        <div style={{ textAlign: "center", padding: "56px 24px", borderStyle: "dashed", borderRadius: "var(--radius)", background: "var(--bg-default)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "var(--radius)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Youtube size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 16, color: "var(--text-secondary)" }}>Canal não conectado</p>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-muted)" }}>Conecte seu YouTube nas configurações para ver seus vídeos aqui</p>
            {onNavigateProfile && (
                <button onClick={onNavigateProfile} className="vc-btn vc-btn-primary btn-sm">
                    Conectar YouTube <ArrowUpRight size={13} />
                </button>
            )}
        </div>
    );
    return (
        <div style={{ textAlign: "center", padding: "56px 24px", borderStyle: "dashed", borderRadius: "var(--radius)", background: "var(--bg-default)" }}>
            <Video size={28} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>Nenhum vídeo encontrado</p>
        </div>
    );
}

export default function ChannelPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("date");

    const allVideos = state.recentUploads || [];
    const channelStats = state.channelStats;
    const connectedAccounts = state.auth?.connectedAccounts || [];
    const activeAccountId = state.auth?.activeAccountId;

    const hasChannel = !!(
        (state.auth?.youtubeToken && state.auth?.youtubeTokenExpiresAt > Date.now()) ||
        connectedAccounts.some(account => (account.platform || 'youtube') === 'youtube')
    );

    const filteredVideos = useMemo(() => {
        let list = [...allVideos];
        if (search) {
            list = list.filter(v =>
                (v.title || "").toLowerCase().includes(search.toLowerCase())
            );
        }
        list.sort((a, b) => {
            if (sortBy === "views") return (parseInt(b.viewCount) || 0) - (parseInt(a.viewCount) || 0);
            if (sortBy === "likes") return (parseInt(b.likeCount) || 0) - (parseInt(a.likeCount) || 0);
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });
        return list;
    }, [allVideos, search, sortBy]);

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            <div className="vc-page-header">
                <div className="vc-page-header-text">
                    <h2><Youtube size={18} style={{ color: "var(--accent-coral)", marginRight: 8 }} /> Canal</h2>
                    <p>
                        {channelStats?.title
                            ? `@${channelStats.title} · biblioteca de vídeos publicados`
                            : "Biblioteca de vídeos publicados no YouTube"
                        }
                    </p>
                </div>
                <div className="vc-page-actions">
                    <button onClick={() => actions.refreshChannelStats?.()} className="vc-btn vc-btn-secondary btn-sm">
                        <RefreshCw size={12} /> Sincronizar
                    </button>
                </div>
            </div>

            <ChannelStrip channelStats={channelStats} />

            {connectedAccounts.length > 1 && (
                <ChannelSwitcher
                    mode="bar"
                    accounts={connectedAccounts}
                    activeId={activeAccountId}
                    onSwitch={(id) => {
                        actions.switchAccount(id);
                        supabase.switchToAccount?.(id);
                    }}
                    onAddChannel={() => window.location.href = "/dashboard/profile"}
                />
            )}

            {allVideos.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar vídeo..." className="vc-input" style={{ paddingLeft: 32, paddingRight: search ? 32 : 12 }} />
                        {search && (
                            <button onClick={() => setSearch("")}
                                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            { key: "date", label: "Recentes", icon: <Clock size={12} /> },
                            { key: "views", label: "Mais vistos", icon: <Eye size={12} /> },
                            { key: "likes", label: "Mais curtidos", icon: <ThumbsUp size={12} /> },
                        ].map(opt => (
                            <button key={opt.key}
                                onClick={() => setSortBy(opt.key)}
                                className={`vc-btn ${sortBy === opt.key ? "vc-btn-primary" : "vc-btn-secondary"} btn-sm`}>
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                        {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? "s" : ""}
                    </span>
                </div>
            )}

            {filteredVideos.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {filteredVideos.map((video, i) => (
                        <VideoCard key={video.id?.videoId || video.id || i} video={video} />
                    ))}
                </div>
            ) : (
                <EmptyState hasChannel={hasChannel} onNavigateProfile={() => window.location.href = "/dashboard/profile"} />
            )}
        </PageLayout>
    );
}
