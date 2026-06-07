import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Youtube, BarChart, Users, RefreshCw, Trash2,
    ExternalLink, Video, Calendar, ChevronRight,
    MoreVertical, CheckCircle, Settings
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { GoogleAuthButton } from "../components/dashboard/GoogleAuthButton";
import { PageLayout } from "../components/layout/PageLayout";

const formatNumber = (num) => {
    if (!num) return "0";
    const n = parseInt(num);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString("pt-BR");
};

// ─── Channel Hero ─────────────────────────────────────────────────────────────
function ChannelHero({ channelStats, onRefresh, isDark }) {
    const [showDisconnect, setShowDisconnect] = useState(false);
    const channelUrl = channelStats?.customUrl
        ? `https://youtube.com/${channelStats.customUrl}`
        : `https://youtube.com/channel/${channelStats?.id}`;

    const avatarUrl =
        channelStats?.thumbnails?.high?.url ||
        channelStats?.thumbnails?.medium?.url ||
        channelStats?.thumbnails?.default?.url;

    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-surface-700/50">
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

                {/* Menu no canto */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm"
                    >
                        <RefreshCw className="w-3 h-3" /> Sincronizar
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowDisconnect(!showDisconnect)}
                            className="p-1.5 rounded-lg text-white/50 hover:text-white bg-black/30 hover:bg-black/50 transition-all backdrop-blur-sm"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showDisconnect && (
                            <div className="absolute right-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-[160px]">
                                <button
                                    onClick={() => {
                                        setShowDisconnect(false);
                                        if (confirm("Tem certeza que deseja desconectar este canal?")) {
                                            // disconnect action
                                        }
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Desconectar canal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo do perfil */}
            <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-10 mb-5">
                    {/* Avatar */}
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

                    {/* Link para o canal */}
                    <a
                        href={channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 transition-colors"
                    >
                        <Youtube className="w-4 h-4" />
                        Ver canal
                    </a>
                </div>

                {channelStats?.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-5">
                        {channelStats.description}
                    </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <Users className="w-4 h-4 text-red-400" />, label: "Inscritos", value: formatNumber(channelStats?.statistics?.subscriberCount), color: "hover:border-red-500/30" },
                        { icon: <BarChart className="w-4 h-4 text-blue-400" />, label: "Views", value: formatNumber(channelStats?.statistics?.viewCount), color: "hover:border-blue-500/30" },
                        { icon: <Youtube className="w-4 h-4 text-purple-400" />, label: "Vídeos", value: formatNumber(channelStats?.statistics?.videoCount), color: "hover:border-purple-500/30" },
                    ].map((s, i) => (
                        <div key={i} className={`bg-surface-800/50 rounded-xl p-4 border border-surface-700/30 ${s.color} transition-colors`}>
                            <div className="flex items-center gap-2 mb-1">
                                {s.icon}
                                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
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
            <GoogleAuthButton
                onLoginSuccess={onConnect}
                onLoginError={(err) => alert("Falha no login: " + JSON.stringify(err))}
            />
        </div>
    );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ navigate }) {
    const actions = [
        {
            icon: <Video className="w-4 h-4 text-primary" />,
            label: "Novo upload",
            desc: "Enviar vídeo para o YouTube",
            onClick: () => navigate("/dashboard/videos"),
        },
        {
            icon: <Calendar className="w-4 h-4 text-purple-400" />,
            label: "Agendar publicação",
            desc: "Programar data e hora",
            onClick: () => navigate("/dashboard/calendar"),
        },
        {
            icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
            label: "YouTube Studio",
            desc: "Abrir no YouTube",
            onClick: () => window.open("https://studio.youtube.com", "_blank"),
        },
        {
            icon: <BarChart className="w-4 h-4 text-green-400" />,
            label: "Ver analytics",
            desc: "Métricas detalhadas",
            onClick: () => navigate("/dashboard/analytics"),
        },
    ];

    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30">
                <h3 className="text-sm font-semibold text-white">Ações rápidas</h3>
            </div>
            <div className="p-3 space-y-1">
                {actions.map((a, i) => (
                    <button
                        key={i}
                        onClick={a.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800/60 transition-colors text-left group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            {a.icon}
                        </div>
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
function Platforms({ isConnected, onConnect }) {
    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30">
                <h3 className="text-sm font-semibold text-white">Plataformas</h3>
            </div>
            <div className="p-3 space-y-2">
                {/* YouTube */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">YouTube</p>
                        <p className="text-xs text-slate-500">Upload e analytics</p>
                    </div>
                    {isConnected ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                            ATIVO
                        </span>
                    ) : (
                        <GoogleAuthButton
                            onLoginSuccess={onConnect}
                            onLoginError={() => { }}
                            text="Conectar"
                            className="text-xs px-3 py-1.5 h-auto"
                        />
                    )}
                </div>

                {/* TikTok — em desenvolvimento, sem "SOON" */}
                <div className="p-4 rounded-lg border border-dashed border-surface-700/50 text-center">
                    <p className="text-xs text-slate-500 mb-1">
                        Mais plataformas chegando em breve
                    </p>
                    <p className="text-[11px] text-slate-600">
                        TikTok · Instagram · Twitter
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { state, actions } = useDashboardState();
    const navigate = useNavigate();

    const { channelStats, auth } = state;
    const isConnected = !!(auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now());

    return (
        <PageLayout
            title="Perfil e Conexões"
            subtitle="Gerencie seu canal e conexões com plataformas."
        >
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
                    {isConnected && <QuickActions navigate={navigate} />}
                    <Platforms isConnected={isConnected} onConnect={actions.setYouTubeToken} />
                </div>

            </div>
        </PageLayout>
    );
}
