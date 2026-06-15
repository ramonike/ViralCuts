import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Youtube, BarChart, Users, RefreshCw, Trash2,
    ExternalLink, Video, Calendar, ChevronRight, MoreVertical, CheckCircle,
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { PageLayout } from "../components/layout/PageLayout";
import { YouTubeAccessRequest } from '../components/dashboard/YouTubeAccessRequest';

const formatNumber = (num) => {
    if (!num) return "0";
    const n = parseInt(num);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString("pt-BR");
};

// ─── Channel Hero ─────────────────────────────────────────────────────────────
function ChannelHero({ channelStats, onRefresh }) {
    const [showMenu, setShowMenu] = useState(false);

    const avatarUrl =
        channelStats?.thumbnails?.high?.url ||
        channelStats?.thumbnails?.medium?.url ||
        channelStats?.thumbnails?.default?.url;

    const channelUrl = channelStats?.customUrl
        ? `https://youtube.com/${channelStats.customUrl}`
        : `https://youtube.com/channel/${channelStats?.id}`;

    return (
        <div className="glass-panel rounded-2xl border border-surface-700/50">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-br from-violet-900/40 via-surface-800 to-surface-900 relative overflow-hidden">
                {channelStats?.brandingSettings?.image?.bannerExternalUrl && (
                    <img
                        src={channelStats.brandingSettings.image.bannerExternalUrl}
                        alt="Banner"
                        className="w-full h-full object-cover opacity-50"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 via-transparent to-transparent" />

                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm"
                    >
                        <RefreshCw className="w-3 h-3" /> Sincronizar
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-lg text-white/50 hover:text-white bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-10 min-w-[160px]">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (confirm("Tem certeza que deseja desconectar este canal?")) {
                                            // disconnect via actions
                                        }
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Desconectar canal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-10 mb-5 relative z-10">
                    <div className="w-20 h-20 rounded-2xl border-4 border-surface-900 overflow-hidden bg-surface-800 shrink-0 shadow-xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-white truncate">
                                {channelStats?.title || "Seu Canal"}
                            </h2>
                            <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                <CheckCircle className="w-3 h-3" /> Verificado
                            </span>
                        </div>
                        {channelStats?.customUrl && (
                            <p className="text-sm text-slate-400">{channelStats.customUrl}</p>
                        )}
                    </div>
                    <a
                        href={channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 transition-colors"
                    >
                        <Youtube className="w-4 h-4" /> Ver canal
                    </a>
                </div>

                {channelStats?.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-5">
                        {channelStats.description}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <Users className="w-4 h-4 text-red-400" />, label: "Inscritos", value: formatNumber(channelStats?.statistics?.subscriberCount), hover: "hover:border-red-500/30" },
                        { icon: <BarChart className="w-4 h-4 text-blue-400" />, label: "Views", value: formatNumber(channelStats?.statistics?.viewCount), hover: "hover:border-blue-500/30" },
                        { icon: <Youtube className="w-4 h-4 text-purple-400" />, label: "Vídeos", value: formatNumber(channelStats?.statistics?.videoCount), hover: "hover:border-purple-500/30" },
                    ].map((s, i) => (
                        <div key={i} className={`bg-surface-800/50 rounded-xl p-4 border border-surface-700/30 ${s.hover} transition-colors`}>
                            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</span></div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Canais Conectados ────────────────────────────────────────────────────────
function ConnectedChannels({ connectedAccounts, activeAccountId, onSwitch, onDisconnect, onAdd }) {
    const now = Date.now();
    const validAccounts = connectedAccounts.filter(a => a.expiresAt && a.expiresAt > now);
    const expiredAccounts = connectedAccounts.filter(a => !a.expiresAt || a.expiresAt <= now);

    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Canais conectados</h3>
                <span className="text-xs text-slate-500 bg-surface-800 px-2 py-0.5 rounded-full">
                    {validAccounts.length}
                </span>
            </div>
            <div className="p-3 space-y-2">
                {/* Canais com token válido */}
                {validAccounts.map(account => {
                    const isActive = account.id === activeAccountId;
                    return (
                        <div key={account.id} className={`p-3 rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/20" : "bg-surface-800/50 border-transparent hover:border-surface-600"}`}>
                            <div className="flex items-center gap-3">
                                <img
                                    src={account.avatar || "https://github.com/shadcn.png"}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    alt={account.name}
                                    onError={(e) => { e.target.src = "https://github.com/shadcn.png"; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{account.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {account.stats?.statistics?.subscriberCount
                                            ? formatNumber(account.stats.statistics.subscriberCount) + " inscritos"
                                            : "YouTube"}
                                    </p>
                                </div>
                                {isActive ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">ATIVO</span>
                                ) : (
                                    <button
                                        onClick={() => onSwitch(account.id)}
                                        className="text-[10px] font-medium px-2 py-1 rounded text-slate-400 bg-surface-700 hover:bg-surface-600 hover:text-white transition-colors shrink-0"
                                    >
                                        Usar este
                                    </button>
                                )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-surface-700/30 flex justify-end">
                                <button
                                    onClick={() => { if (confirm(`Desconectar "${account.name}"?`)) onDisconnect(account.id); }}
                                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Desconectar
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Canais expirados — seção separada */}
                {expiredAccounts.length > 0 && (
                    <>
                        {validAccounts.length > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />}
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 4px 6px" }}>
                            Desconectados
                        </p>
                        {expiredAccounts.map(account => (
                            <div key={account.id} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", opacity: 0.75 }}>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={account.avatar || "https://github.com/shadcn.png"}
                                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                                        style={{ filter: "grayscale(0.6)" }}
                                        alt={account.name}
                                        onError={(e) => { e.target.src = "https://github.com/shadcn.png"; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>{account.name}</p>
                                        <p style={{ fontSize: "0.6875rem", color: "var(--accent-coral)", marginTop: 2 }}>⚠ Token expirado</p>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                                        <button onClick={() => onAdd()} style={{ fontSize: "0.625rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "var(--accent-coral-3)", border: "1px solid rgba(232,65,42,0.25)", color: "var(--accent-coral-2)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
                                            Reconectar
                                        </button>
                                        <button onClick={() => { if (confirm(`Remover "${account.name}"?`)) onDisconnect(account.id); }} style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {validAccounts.length === 0 && expiredAccounts.length === 0 && (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Nenhum canal conectado</p>
                )}

                <YouTubeAccessRequest onApproved={() => actions.setYouTubeToken()} />
            </div>
        </div>
    );
}

// ─── Ações Rápidas ────────────────────────────────────────────────────────────
function QuickActions({ navigate }) {
    const actions = [
        { icon: <Video className="w-4 h-4 text-primary" />, label: "Novo upload", desc: "Enviar vídeo para o YouTube", onClick: () => navigate("/dashboard/videos") },
        { icon: <Calendar className="w-4 h-4 text-purple-400" />, label: "Agendar publicação", desc: "Programar data e hora", onClick: () => navigate("/dashboard/calendar") },
        { icon: <ExternalLink className="w-4 h-4 text-blue-400" />, label: "YouTube Studio", desc: "Abrir no YouTube", onClick: () => window.open("https://studio.youtube.com", "_blank") },
        { icon: <BarChart className="w-4 h-4 text-green-400" />, label: "Ver analytics", desc: "Métricas detalhadas", onClick: () => navigate("/dashboard/analytics") },
    ];
    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30">
                <h3 className="text-sm font-semibold text-white">Ações rápidas</h3>
            </div>
            <div className="p-3 space-y-1">
                {actions.map((a, i) => (
                    <button key={i} onClick={a.onClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800/60 transition-colors text-left group">
                        <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">{a.icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{a.label}</p>
                            <p className="text-xs text-slate-500">{a.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Plataformas ──────────────────────────────────────────────────────────────
function Platforms() {
    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30">
                <h3 className="text-sm font-semibold text-white">Plataformas</h3>
            </div>
            <div className="p-3 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">YouTube</p>
                        <p className="text-xs text-slate-500">Upload e analytics</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">ATIVO</span>
                </div>
                <div className="p-4 rounded-lg border border-dashed border-surface-700/50 text-center">
                    <p className="text-xs text-slate-500 mb-1">Mais plataformas chegando em breve</p>
                    <p className="text-[11px] text-slate-600">TikTok · Instagram · Twitter</p>
                </div>
            </div>
        </div>
    );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyState({ onConnect }) {
    return (
        <div className="glass-panel rounded-2xl border border-dashed border-surface-600 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum canal conectado</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                Conecte seu canal do YouTube para ver suas estatísticas e fazer uploads automáticos.
            </p>
            <YouTubeAccessRequest onApproved={() => actions.setYouTubeToken()} />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { state, actions } = useDashboardState();
    const navigate = useNavigate();

    const { channelStats, auth } = state;
    const isConnected = !!(auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now());
    const connectedAccounts = auth?.connectedAccounts || [];
    const activeAccountId = auth?.activeAccountId;

    return (
        <PageLayout title="Perfil e Conexões" subtitle="Gerencie seu canal e conexões com plataformas.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna esquerda — 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {isConnected && channelStats ? (
                        <ChannelHero
                            channelStats={channelStats}
                            onRefresh={() => actions.refreshChannelStats()}
                        />
                    ) : (
                        <EmptyState onConnect={actions.setYouTubeToken} />
                    )}
                </div>

                {/* Coluna direita — 1/3 */}
                <div className="space-y-6">
                    <ConnectedChannels
                        connectedAccounts={connectedAccounts}
                        activeAccountId={activeAccountId}
                        onSwitch={(id) => actions.switchAccount(id)}
                        onDisconnect={(id) => actions.disconnectAccount(id)}
                        onAdd={actions.setYouTubeToken}
                    />
                    {isConnected && <QuickActions navigate={navigate} />}
                    <Platforms />
                </div>

            </div>
        </PageLayout>
    );
}
