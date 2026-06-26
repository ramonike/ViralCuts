import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Youtube, BarChart, Users, RefreshCw, Trash2,
    ExternalLink, Video, Calendar, ChevronRight, MoreVertical, CheckCircle,
    Link2, Loader2,
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useTikTokAuth } from "../hooks/useTikTokAuth";
import { GoogleAuthButton } from "../components/dashboard/GoogleAuthButton";
import { PlatformIcon } from "../components/shared/PlatformIcon";
import { useSubscription } from "../hooks/useSubscription";
import { UpgradeModal } from "../components/dashboard/UpgradeModal";
import { PageLayout } from "../components/layout/PageLayout";

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
    const getPlatformInfo = (account) => {
        const platform = account.platform || 'youtube';
        const config = {
            youtube: { name: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/10' },
            tiktok: { name: 'TikTok', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        };
        return config[platform] || config.youtube;
    };

    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Canais conectados</h3>
                <span className="text-xs text-slate-500 bg-surface-800 px-2 py-0.5 rounded-full">
                    {connectedAccounts.length}
                </span>
            </div>
            <div className="p-3 space-y-2">
                {connectedAccounts.map(account => {
                    const isActive = account.id === activeAccountId;
                    const platform = getPlatformInfo(account);
                    return (
                        <div key={account.id} className={`p-3 rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/20" : "bg-surface-800/50 border-transparent hover:border-surface-600"}`}>
                            <div className="flex items-center gap-3">
                                {account.avatar ? (
                                    <img
                                        src={account.avatar}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                                        alt={account.name}
                                        onError={(e) => { e.target.src = "https://github.com/shadcn.png"; }}
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded-lg ${platform.bg} flex items-center justify-center shrink-0`}>
                                        <span className={`text-xs font-bold ${platform.color}`}>
                                            {(account.name || platform.name)[0].toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{account.name}</p>
                                    <p className="text-xs text-slate-500">{platform.name}</p>
                                </div>
                                {account.platform === 'youtube' && isActive ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">ATIVO</span>
                                ) : account.platform === 'youtube' ? (
                                    <button
                                        onClick={() => onSwitch(account.id)}
                                        className="text-[10px] font-medium px-2 py-1 rounded text-slate-400 bg-surface-700 hover:bg-surface-600 hover:text-white transition-colors shrink-0"
                                    >
                                        Usar este
                                    </button>
                                ) : null}
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

                <GoogleAuthButton
                    onLoginSuccess={onAdd}
                    onLoginError={(err) => alert("Erro: " + JSON.stringify(err))}
                    text="+ Adicionar canal"
                    className="w-full justify-center h-10 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 transition-all"
                />
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
function Platforms({ connectedTikTokAccounts, onConnectTikTok, onDisconnectTikTok, tiktokLoading, tiktokError }) {
    const isTikTokConnected = connectedTikTokAccounts.length > 0;

    return (
        <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-700/30">
                <h3 className="text-sm font-semibold text-white">Plataformas</h3>
            </div>
            <div className="p-3 space-y-2">

                {/* YouTube — sempre ativo */}
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

                {/* TikTok */}
                <div className="rounded-lg border border-surface-700/30 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-surface-800/50">
                        <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center shrink-0">
                            <PlatformIcon platform="tiktok" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">TikTok</p>
                            <p className="text-xs text-slate-500">
                                {isTikTokConnected
                                    ? `${connectedTikTokAccounts.length} conta${connectedTikTokAccounts.length > 1 ? 's' : ''} conectada${connectedTikTokAccounts.length > 1 ? 's' : ''}`
                                    : 'Content Posting API v2'}
                            </p>
                        </div>
                        {isTikTokConnected ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">ATIVO</span>
                        ) : (
                            <button
                                onClick={onConnectTikTok}
                                disabled={tiktokLoading}
                                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-900 text-white transition-colors disabled:opacity-50 shrink-0"
                            >
                                {tiktokLoading
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Link2 className="w-3 h-3" />
                                }
                                Conectar
                            </button>
                        )}
                    </div>

                    {/* Contas TikTok conectadas */}
                    {connectedTikTokAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-3 px-3 py-2 border-t border-surface-700/30 bg-surface-900/30">
                            {account.avatar ? (
                                <img src={account.avatar} alt={account.name} className="w-7 h-7 rounded-full object-cover shrink-0"
                                    onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                                    {(account.name || 'T')[0].toUpperCase()}
                                </div>
                            )}
                            <p className="text-xs text-slate-400 flex-1 truncate">{account.name}</p>
                            <button
                                onClick={() => { if (confirm(`Desconectar "${account.name}" do TikTok?`)) onDisconnectTikTok(account.id); }}
                                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-red-400 transition-colors shrink-0"
                            >
                                <Trash2 className="w-3 h-3" /> Desconectar
                            </button>
                        </div>
                    ))}

                    {tiktokError && (
                        <p className="text-xs text-red-400 px-3 py-2 border-t border-surface-700/30">{tiktokError}</p>
                    )}
                </div>

                {/* Mais plataformas */}
                <div className="p-3 rounded-lg border border-dashed border-surface-700/50 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Mais plataformas em breve</p>
                    <p className="text-[11px] text-slate-600">Instagram · Facebook · Twitter/X</p>
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
            <GoogleAuthButton
                onLoginSuccess={onConnect}
                onLoginError={(err) => alert("Falha no login: " + JSON.stringify(err))}
            />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { state, setState, actions } = useDashboardState();
    const navigate = useNavigate();

    const { channelStats, auth } = state;
    const isConnected = !!(auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now());
    const connectedAccounts = auth?.connectedAccounts || [];
    const activeAccountId = auth?.activeAccountId;

    const { plan, maxChannels } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);

    // TikTok Auth
    const {
        connectTikTok,
        disconnectTikTokAccount,
        connectedTikTokAccounts,
        loading: tiktokLoading,
        error: tiktokError,
    } = useTikTokAuth(state, setState);

    // Canais com token ainda válido (qualquer plataforma)
    const validChannels = connectedAccounts.filter(a => a.expiresAt && a.expiresAt > Date.now());

    const handleConnectTikTok = () => {
        if (validChannels.length >= maxChannels) {
            setShowUpgrade(true);
        } else {
            connectTikTok();
        }
    };

    return (
        <>
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
                            onAdd={(tokenResponse) => {
                                if (validChannels.length >= maxChannels) {
                                    setShowUpgrade(true);
                                } else {
                                    actions.setYouTubeToken(tokenResponse);
                                }
                            }}
                        />
                        {isConnected && <QuickActions navigate={navigate} />}
                        <Platforms
                            connectedTikTokAccounts={connectedTikTokAccounts}
                            onConnectTikTok={handleConnectTikTok}
                            onDisconnectTikTok={disconnectTikTokAccount}
                            tiktokLoading={tiktokLoading}
                            tiktokError={tiktokError}
                        />
                    </div>

                </div>
            </PageLayout>

            <UpgradeModal
                isOpen={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                currentPlan={plan}
            />
        </>
    );
}
