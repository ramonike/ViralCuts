import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Youtube, BarChart, Users, RefreshCw, Trash2,
    ExternalLink, Video, Calendar, ChevronRight, MoreVertical, CheckCircle,
    Link2, Loader2, Heart, Music2, Instagram, Globe,
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

// ─── Account Switcher ─────────────────────────────────────────────────────────
function AccountSwitcher({ accounts, activeId, onSwitch }) {
    if (accounts.length <= 1) return null;
    return (
        <div className="flex flex-wrap gap-1.5 justify-end">
            {accounts.map(acc => (
                <button
                    key={acc.id}
                    onClick={() => onSwitch(acc.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 ${
                        acc.id === activeId
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'text-slate-400 border border-transparent hover:border-[var(--border-strong)] hover:text-white'
                    }`}
                >
                    {acc.avatar ? (
                        <img src={acc.avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[9px] font-bold shrink-0">
                            {(acc.name || '?')[0].toUpperCase()}
                        </div>
                    )}
                    {acc.name}
                </button>
            ))}
        </div>
    );
}

// ─── Channel Hero ─────────────────────────────────────────────────────────────
function ChannelHero({ channelStats, onRefresh, youtubeAccounts, activeId, onSwitch }) {
    const [showMenu, setShowMenu] = useState(false);

    const avatarUrl =
        channelStats?.thumbnails?.high?.url ||
        channelStats?.thumbnails?.medium?.url ||
        channelStats?.thumbnails?.default?.url;

    const channelUrl = channelStats?.customUrl
        ? `https://youtube.com/${channelStats.customUrl}`
        : `https://youtube.com/channel/${channelStats?.id}`;

    return (
        <div className="vc-card rounded-2xl border border-[var(--border-default)]">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-br from-violet-900/40 via-[var(--bg-card)] to-[var(--bg-secondary)] relative overflow-hidden">
                {channelStats?.brandingSettings?.image?.bannerExternalUrl && (
                    <img
                        src={channelStats.brandingSettings.image.bannerExternalUrl}
                        alt="Banner"
                        className="w-full h-full object-cover opacity-50"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />

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
                            <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-xl z-10 min-w-[160px]">
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
                    <div className="w-20 h-20 rounded-2xl border-4 border-[var(--bg-secondary)] overflow-hidden bg-[var(--bg-card)] shrink-0 shadow-xl">
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
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <AccountSwitcher accounts={youtubeAccounts} activeId={activeId} onSwitch={onSwitch} />
                        <a
                            href={channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 transition-colors"
                        >
                            <Youtube className="w-4 h-4" /> Ver canal
                        </a>
                    </div>
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
                        <div key={i} className={`bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-weak)] ${s.hover} transition-colors`}>
                            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</span></div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── TikTok Hero ──────────────────────────────────────────────────────────────
function TikTokHero({ accounts, activeId, onSwitch, onRefresh, loading }) {
    const account = accounts.find(a => a.id === activeId) || accounts[0];
    if (!account) return null;

    const handle = account.username || account.name;

    return (
        <div className="vc-card rounded-2xl border border-[var(--border-default)] overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-pink-900/40 via-[var(--bg-card)] to-[var(--bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />
            </div>

            <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-10 mb-5 relative z-10">
                    {account.avatar ? (
                        <img src={account.avatar} alt={account.name}
                            className="w-20 h-20 rounded-2xl border-4 border-[var(--bg-secondary)] object-cover shrink-0 shadow-xl" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl border-4 border-[var(--bg-secondary)] bg-zinc-800 flex items-center justify-center shrink-0 shadow-xl">
                            <span className="text-2xl font-bold text-white">
                                {(account.name || 'T')[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-white truncate">{account.name}</h2>
                        </div>
                        <p className="text-sm text-slate-400">@{handle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                            {onRefresh && (
                                <button onClick={onRefresh} disabled={loading}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors disabled:opacity-50"
                                    title="Atualizar dados do perfil">
                                    {loading ? "..." : <RefreshCw className="w-3 h-3" />}
                                </button>
                            )}
                            <AccountSwitcher accounts={accounts} activeId={activeId} onSwitch={onSwitch} />
                        </div>
                        <a href={`https://tiktok.com/@${encodeURIComponent(handle)}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-pink-600/80 hover:bg-pink-600 transition-colors">
                            Ver TikTok
                        </a>
                    </div>
                </div>

                {account.bioDescription && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-5">
                        {account.bioDescription}
                    </p>
                )}

                <div className="grid grid-cols-4 gap-3">
                    {[
                        { icon: <Users className="w-4 h-4 text-pink-400" />, label: "Seguidores", value: account.followerCount != null ? formatNumber(account.followerCount) : "—" },
                        { icon: <Users className="w-4 h-4 text-blue-400" />, label: "Seguindo", value: account.followingCount != null ? formatNumber(account.followingCount) : "—" },
                        { icon: <Heart className="w-4 h-4 text-red-400" />, label: "Curtidas", value: account.likesCount != null ? formatNumber(account.likesCount) : "—" },
                        { icon: <Video className="w-4 h-4 text-purple-400" />, label: "Vídeos", value: account.videoCount != null ? formatNumber(account.videoCount) : "—" },
                    ].map((s, i) => (
                        <div key={i} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-weak)] hover:border-[var(--border-strong)] transition-colors">
                            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</span></div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Canais e Contas Conectados ───────────────────────────────────────────────
function ConnectedChannels({ connectedAccounts, activeAccountId, activeTikTokId, onSwitch, onSwitchTikTok, onDisconnect, onAdd, onConnectTikTok }) {
    const getPlatformInfo = (account) => {
        const platform = account.platform || 'youtube';
        const config = {
            youtube: { name: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/10' },
            tiktok: { name: 'TikTok', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        };
        return config[platform] || config.youtube;
    };

    return (
        <div className="vc-card rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-weak)] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Canais e Contas conectados</h3>
                <span className="text-xs text-slate-500 bg-[var(--bg-card)] px-2 py-0.5 rounded-full">
                    {connectedAccounts.length}
                </span>
            </div>
            <div className="p-3 space-y-2">
                {connectedAccounts.map(account => {
                    const isActive = account.platform === 'tiktok'
                        ? account.id === activeTikTokId
                        : account.id === activeAccountId;
                    const platform = getPlatformInfo(account);
                    return (
                        <div key={account.id} className={`p-3 rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/20" : "bg-[var(--bg-card)] border-transparent hover:border-[var(--border-strong)]"}`}>
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
                                {isActive ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                        account.platform === 'tiktok'
                                            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                            : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}>ATIVO</span>
                                ) : (
                                    <button
                                        onClick={() => account.platform === 'tiktok' ? onSwitchTikTok(account.id) : onSwitch(account.id)}
                                        className="text-[10px] font-medium px-2 py-1 rounded text-slate-400 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] hover:text-white transition-colors shrink-0"
                                    >
                                        Usar este
                                    </button>
                                )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-[var(--border-weak)] flex justify-end">
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

                <div className="space-y-2 pt-1">
                    <GoogleAuthButton
                        onLoginSuccess={onAdd}
                        onLoginError={(err) => alert("Erro: " + JSON.stringify(err))}
                        text="+ Conectar YouTube"
                        className="w-full h-10 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all"
                    />
                    <button
                        onClick={onConnectTikTok}
                        className="w-full h-10 text-sm font-medium flex items-center justify-center gap-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:border-pink-500/50 transition-all"
                    >
                        <Music2 className="w-4 h-4" /> Conectar TikTok
                    </button>
                    <button
                        disabled
                        className="w-full h-10 text-sm font-medium flex items-center justify-center gap-2 rounded-lg bg-purple-500/10 text-purple-400/50 border border-purple-500/20 cursor-not-allowed"
                    >
                        <Instagram className="w-4 h-4" /> Conectar Instagram
                    </button>
                    <button
                        disabled
                        className="w-full h-10 text-sm font-medium flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 text-blue-400/50 border border-blue-500/20 cursor-not-allowed"
                    >
                        <Globe className="w-4 h-4" /> Conectar Facebook
                    </button>
                </div>
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
        <div className="vc-card rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-weak)]">
                <h3 className="text-sm font-semibold text-white">Ações rápidas</h3>
            </div>
            <div className="p-3 space-y-1">
                {actions.map((a, i) => (
                    <button key={i} onClick={a.onClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-card)] transition-colors text-left group">
                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">{a.icon}</div>
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
function Platforms({ connectedTikTokAccounts, connectedAccounts }) {
    const isTikTokConnected = connectedTikTokAccounts.length > 0;
    const isYouTubeConnected = connectedAccounts.some(a => (a.platform || 'youtube') === 'youtube');

    return (
        <div className="vc-card rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-weak)]">
                <h3 className="text-sm font-semibold text-white">Plataformas</h3>
            </div>
            <div className="p-3 space-y-2">

                {/* YouTube */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)]">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">YouTube</p>
                        <p className="text-xs text-slate-500">Upload e analytics</p>
                    </div>
                    {isYouTubeConnected ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">ATIVO</span>
                    ) : (
                        <span className="text-[10px] font-medium px-2 py-1 rounded text-slate-500 bg-[var(--bg-elevated)]">NÃO CONECTADO</span>
                    )}
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)]">
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
                        <span className="text-[10px] font-medium px-2 py-1 rounded text-slate-500 bg-[var(--bg-elevated)]">NÃO CONECTADO</span>
                    )}
                </div>

                {/* Mais plataformas */}
                <div className="p-3 rounded-lg border border-dashed border-[var(--border-default)] text-center">
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
        <div className="vc-card rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum canal conectado</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                Conecte seu canal do YouTube para ver suas estatísticas e fazer uploads automáticos.
            </p>
            <GoogleAuthButton
                onLoginSuccess={onConnect}
                onLoginError={(err) => alert("Falha no login: " + JSON.stringify(err))}
                className="w-full"
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

    // TikTok active account state
    const [activeTikTokId, setActiveTikTokId] = useState(null);
    const youtubeAccounts = connectedAccounts.filter(a => !a.platform || a.platform === 'youtube');

    useEffect(() => {
        if (connectedTikTokAccounts.length > 0 && !connectedTikTokAccounts.find(a => a.id === activeTikTokId)) {
            setActiveTikTokId(connectedTikTokAccounts[0].id);
        }
    }, [connectedTikTokAccounts, activeTikTokId]);

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
                                youtubeAccounts={youtubeAccounts}
                                activeId={activeAccountId}
                                onSwitch={(id) => actions.switchAccount(id)}
                            />
                        ) : (
                            <EmptyState onConnect={actions.setYouTubeToken} />
                        )}
                        {connectedTikTokAccounts.length > 0 && (
                            <TikTokHero
                                accounts={connectedTikTokAccounts}
                                activeId={activeTikTokId}
                                onSwitch={setActiveTikTokId}
                            />
                        )}
                    </div>

                    {/* Coluna direita — 1/3 */}
                    <div className="space-y-6">
                        <ConnectedChannels
                            connectedAccounts={connectedAccounts}
                            activeAccountId={activeAccountId}
                            activeTikTokId={activeTikTokId}
                            onSwitch={(id) => actions.switchAccount(id)}
                            onSwitchTikTok={setActiveTikTokId}
                            onDisconnect={(id) => actions.disconnectAccount(id)}
                            onAdd={(tokenResponse) => {
                                if (validChannels.length >= maxChannels) {
                                    setShowUpgrade(true);
                                } else {
                                    actions.setYouTubeToken(tokenResponse);
                                }
                            }}
                            onConnectTikTok={handleConnectTikTok}
                        />
                        {isConnected && <QuickActions navigate={navigate} />}
                        <Platforms
                            connectedTikTokAccounts={connectedTikTokAccounts}
                            connectedAccounts={connectedAccounts}
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
