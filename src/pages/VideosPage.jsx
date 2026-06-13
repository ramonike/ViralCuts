/**
 * ChannelPage (era VideosPage) — v2
 * Renomeada para "Canal" — biblioteca dos vídeos já publicados no YouTube
 * Upload imediato movido para o modal do Pipeline
 * Ferramentas externas removidas
 */
import React, { useState, useMemo } from "react";
import {
    Eye, ThumbsUp, Clock, Search, RefreshCw,
    Play, Youtube, X, ExternalLink, TrendingUp,
    BarChart2, Video, ArrowUpRight
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { PageLayout } from "../components/layout/PageLayout";
import { ChannelSwitcher } from "../components/shared/ChannelSwitcher";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video }) {
    const videoId = typeof video.id === "object" ? video.id?.videoId : video.id;
    const thumb = video.thumbnail || video.thumbnails?.medium?.url || video.thumbnails?.default?.url;
    const title = video.title || "Sem título";
    const viewCount = video.viewCount ?? 0;
    const likeCount = video.likeCount ?? 0;
    const videoUrl = video.url || `https://youtube.com/watch?v=${videoId}`;
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className="vc-card"
            style={{ padding: 0, overflow: "hidden", cursor: "default" }}
        >
            {/* Thumbnail */}
            <div style={{
                position: "relative",
                aspectRatio: "16/9",
                background: "var(--bg-elevated)",
                overflow: "hidden",
            }}>
                {thumb && !imgError ? (
                    <img
                        src={thumb}
                        alt={title}
                        onError={() => setImgError(true)}
                        style={{
                            width: "100%", height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                        }}
                        onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    />
                ) : (
                    <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Video size={28} style={{ color: "var(--text-muted)" }} />
                    </div>
                )}

                {/* Play overlay */}
                <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0)",
                        transition: "background 0.2s",
                        textDecoration: "none",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.4)";
                        e.currentTarget.querySelector(".play-btn").style.opacity = "1";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(0,0,0,0)";
                        e.currentTarget.querySelector(".play-btn").style.opacity = "0";
                    }}
                >
                    <div className="play-btn" style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "rgba(255,255,255,0.92)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.2s",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                    }}>
                        <Play size={16} style={{ color: "#111", marginLeft: 2, fill: "#111" }} />
                    </div>
                </a>
            </div>

            {/* Info */}
            <div style={{ padding: "12px 14px" }}>
                <p style={{
                    margin: "0 0 8px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}>
                    {title}
                </p>

                <div style={{
                    display: "flex", alignItems: "center",
                    gap: 12, flexWrap: "wrap",
                }}>
                    <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "0.75rem", color: "var(--text-muted)",
                    }}>
                        <Eye size={12} /> {formatNum(viewCount)}
                    </span>
                    <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "0.75rem", color: "var(--text-muted)",
                    }}>
                        <ThumbsUp size={12} /> {formatNum(likeCount)}
                    </span>
                    <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "0.75rem", color: "var(--text-muted)",
                        marginLeft: "auto",
                    }}>
                        <Clock size={12} /> {formatDate(video.publishedAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Channel Stats Strip ──────────────────────────────────────────────────────
function ChannelStrip({ channelStats }) {
    if (!channelStats) return null;

    const stats = channelStats.statistics || {};
    const items = [
        { label: "Inscritos", value: formatNum(stats.subscriberCount), accent: "teal" },
        { label: "Visualizações", value: formatNum(stats.viewCount), accent: "amber" },
        { label: "Vídeos", value: formatNum(stats.videoCount), accent: "coral" },
    ];

    return (
        <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20,
        }}>
            {items.map(item => (
                <div
                    key={item.label}
                    className={`vc-metric-card metric-${item.accent}`}
                    style={{ flex: "1 1 140px", padding: "14px 16px" }}
                >
                    <div className="vc-metric-label">{item.label}</div>
                    <div className="vc-metric-value" style={{ fontSize: "1.5rem" }}>
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasChannel, onNavigateProfile }) {
    if (!hasChannel) return (
        <div style={{
            border: "2px dashed var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: "56px 24px", textAlign: "center",
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
            }}>
                <Youtube size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <p style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem", color: "var(--text-secondary)" }}>
                Canal não conectado
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Conecte seu YouTube nas configurações para ver seus vídeos aqui
            </p>
            {onNavigateProfile && (
                <button onClick={onNavigateProfile} className="vc-btn vc-btn-primary vc-btn-sm">
                    Conectar YouTube <ArrowUpRight size={13} />
                </button>
            )}
        </div>
    );

    return (
        <div style={{
            border: "2px dashed var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "56px 24px", textAlign: "center",
        }}>
            <Video size={28} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Nenhum vídeo encontrado
            </p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChannelPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("date"); // date | views | likes

    const allVideos = state.recentUploads || [];
    const channelStats = state.channelStats;
    const connectedAccounts = state.auth?.connectedAccounts || [];
    const activeAccountId = state.auth?.activeAccountId;

    const hasChannel = !!(
        state.auth?.youtubeToken &&
        state.auth?.youtubeTokenExpiresAt > Date.now()
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

            {/* ── Header ──────────────────────────────────────── */}
            <div style={{
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", flexWrap: "wrap",
                gap: 12, marginBottom: 20,
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Youtube size={18} style={{ color: "var(--accent-coral)" }} />
                        <h1 style={{
                            margin: 0,
                            fontFamily: "var(--font-display)", fontWeight: 700,
                            fontSize: "1.875rem", letterSpacing: "-0.035em",
                            color: "var(--text-primary)", lineHeight: 1,
                        }}>
                            Canal
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                        {channelStats?.title
                            ? `@${channelStats.title} · biblioteca de vídeos publicados`
                            : "Biblioteca de vídeos publicados no YouTube"
                        }
                    </p>
                </div>

                <button
                    onClick={() => actions.refreshChannelStats?.()}
                    className="vc-btn vc-btn-secondary vc-btn-sm"
                >
                    <RefreshCw size={13} /> Sincronizar
                </button>
            </div>

            {/* ── Channel stats ─────────────────────────────── */}
            <ChannelStrip channelStats={channelStats} />

            {/* ── Switcher de canais ────────────────────────── */}
            {connectedAccounts.length > 1 && (
                <ChannelSwitcher
                    mode="bar"
                    accounts={connectedAccounts}
                    activeId={activeAccountId}
                    onSwitch={(id) => actions.switchAccount(id)}
                    onAddChannel={() => window.location.href = "/dashboard/profile"}
                />
            )}

            {/* ── Filtros ───────────────────────────────────── */}
            {allVideos.length > 0 && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 16, flexWrap: "wrap",
                }}>
                    {/* Search */}
                    <div className="vc-input-wrap" style={{ flex: "1 1 200px", maxWidth: 320 }}>
                        <Search size={14} className="vc-input-icon-left" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar vídeo..."
                            className="vc-input has-icon-left"
                            style={{ paddingRight: search ? 32 : 12 }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{
                                    position: "absolute", right: 10, top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none", border: "none",
                                    color: "var(--text-muted)", cursor: "pointer", padding: 0,
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            { key: "date", label: "Recentes", icon: <Clock size={12} /> },
                            { key: "views", label: "Mais vistos", icon: <Eye size={12} /> },
                            { key: "likes", label: "Mais curtidos", icon: <ThumbsUp size={12} /> },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setSortBy(opt.key)}
                                className={`vc-btn vc-btn-sm ${sortBy === opt.key ? "vc-btn-primary" : "vc-btn-secondary"}`}
                            >
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>

                    <span style={{
                        marginLeft: "auto", fontSize: "0.75rem",
                        color: "var(--text-muted)", fontFamily: "var(--font-display)",
                        fontWeight: 500,
                    }}>
                        {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? "s" : ""}
                    </span>
                </div>
            )}

            {/* ── Grid de vídeos ────────────────────────────── */}
            {filteredVideos.length > 0 ? (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 14,
                }}>
                    {filteredVideos.map((video, i) => (
                        <VideoCard
                            key={video.id?.videoId || video.id || i}
                            video={video}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    hasChannel={hasChannel}
                    onNavigateProfile={() => window.location.href = "/dashboard/profile"}
                />
            )}

        </PageLayout>
    );
}
