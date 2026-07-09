import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Youtube, BarChart, RefreshCw, Trash2,
    Calendar, ChevronRight, CheckCircle,
    Music2, Instagram, Globe, Upload, Plus,
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

function AccountSwitcher({ accounts, activeId, onSwitch }) {
    if (accounts.length <= 1) return null;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
            {accounts.map(acc => (
                <button
                    key={acc.id}
                    onClick={() => onSwitch(acc.id)}
                    className={`vc-btn vc-btn-secondary btn-sm ${acc.id === activeId ? "" : ""}`}
                    style={acc.id === activeId ? { borderColor: "var(--accent-coral)", color: "var(--accent-coral)" } : {}}
                >
                    {acc.avatar ? (
                        <img src={acc.avatar} style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} alt="" />
                    ) : (
                        <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--bg-elevated)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
                            {(acc.name || '?')[0].toUpperCase()}
                        </span>
                    )}
                    {acc.name}
                </button>
            ))}
        </div>
    );
}

function ChannelHero({ channelStats, onRefresh, youtubeAccounts, activeId, onSwitch }) {
    const avatarUrl =
        channelStats?.thumbnails?.high?.url ||
        channelStats?.thumbnails?.medium?.url ||
        channelStats?.thumbnails?.default?.url;

    const channelUrl = channelStats?.customUrl
        ? `https://youtube.com/${channelStats.customUrl}`
        : `https://youtube.com/channel/${channelStats?.id}`;

    return (
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", minHeight: 180, marginBottom: 24 }}>
            <div style={{ height: 140, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", background: "linear-gradient(135deg, var(--accent-coral) 0%, var(--accent-amber) 100%)" }}>
                {channelStats?.brandingSettings?.image?.bannerExternalUrl && (
                    <img src={channelStats.brandingSettings.image.bannerExternalUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
                        onError={(e) => { e.target.style.display = "none"; }} alt="" />
                )}
            </div>
            {avatarUrl ? (
                <div style={{ position: "absolute", bottom: 0, left: 24, width: 80, height: 80, borderRadius: "50%", border: "4px solid var(--bg-primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, background: "var(--bg-elevated)", color: "var(--text-primary)" }}><img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /></div>
            ) : (
                <div style={{ position: "absolute", bottom: 0, left: 24, width: 80, height: 80, borderRadius: "50%", border: "4px solid var(--bg-primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,var(--accent-coral),var(--accent-amber))", color: "var(--text-primary)" }}>
                    {(channelStats?.title || "?")[0].toUpperCase()}
                </div>
            )}
            <div style={{ marginLeft: 120, padding: "16px 24px 16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>{channelStats?.title || "Seu Canal"}</h3>
                    <CheckCircle size={14} style={{ color: "var(--accent-teal)", flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{channelStats?.customUrl || ""}</div>
            </div>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <AccountSwitcher accounts={youtubeAccounts} activeId={activeId} onSwitch={onSwitch} />
                <button className="vc-btn vc-btn-secondary btn-sm" onClick={onRefresh}>
                    <RefreshCw size={12} /> Sincronizar
                </button>
                <a href={channelUrl} target="_blank" rel="noopener noreferrer"
                    className="vc-btn vc-btn-secondary btn-sm"
                    style={{ background: "var(--accent-coral)", borderColor: "var(--accent-coral)", color: "#fff" }}>
                    <Youtube size={12} /> Ver canal
                </a>
            </div>
        </div>
    );
}

function TikTokHero({ accounts, activeId, onSwitch, onRefresh, loading }) {
    const account = accounts.find(a => a.id === activeId) || accounts[0];
    if (!account) return null;

    const handle = account.username || account.name;

    return (
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", minHeight: 180, marginBottom: 24, marginTop: 24 }}>
            <div style={{ height: 140, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", background: "linear-gradient(135deg,#ff0050,#00f2ea)" }} />
            {account.avatar ? (
                <div style={{ position: "absolute", bottom: 0, left: 24, width: 80, height: 80, borderRadius: "50%", border: "4px solid var(--bg-primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, background: "var(--bg-elevated)", color: "var(--text-primary)" }}><img src={account.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /></div>
            ) : (
                <div style={{ position: "absolute", bottom: 0, left: 24, width: 80, height: 80, borderRadius: "50%", border: "4px solid var(--bg-primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#ff0050,#00f2ea)", color: "var(--text-primary)" }}>
                    {(account.name || "T")[0].toUpperCase()}
                </div>
            )}
            <div style={{ marginLeft: 120, padding: "16px 24px 16px 0" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>{account.name}</h3>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>@{handle}</div>
            </div>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <AccountSwitcher accounts={accounts} activeId={activeId} onSwitch={onSwitch} />
                {onRefresh && (
                    <button className="vc-btn vc-btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
                        {loading ? "..." : <RefreshCw size={12} />} Sincronizar
                    </button>
                )}
                <a href={`https://tiktok.com/@${encodeURIComponent(handle)}`} target="_blank" rel="noopener noreferrer"
                    className="vc-btn vc-btn-secondary btn-sm"
                    style={{ background: "#ff0050", borderColor: "#ff0050", color: "#fff" }}>
                    <Music2 size={12} /> Ver TikTok
                </a>
            </div>
        </div>
    );
}

const cardTopToMetric = {
    "card-top-coral": "metric-coral",
    "card-top-blue": "metric-neutral",
    "card-top-purple": "metric-neutral",
    "card-top-pink": "metric-amber",
    "card-top-teal": "metric-teal",
};

function ChannelStats({ stats }) {
    const items = [
        { value: formatNumber(stats?.statistics?.subscriberCount), label: "Inscritos", cardTop: "card-top-coral" },
        { value: formatNumber(stats?.statistics?.viewCount), label: "Views", cardTop: "card-top-blue" },
        { value: formatNumber(stats?.statistics?.videoCount), label: "Vídeos", cardTop: "card-top-purple" },
    ];
    return (
        <div className="vc-grid-3 mb-6" style={{ marginBottom: 24 }}>
            {items.map((s, i) => (
                <div key={i} className={`vc-metric-card ${cardTopToMetric[s.cardTop] || "metric-neutral"}`}>
                    <div className="vc-metric-value">{s.value}</div>
                    <div className="vc-metric-label">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

function TikTokStats({ account }) {
    const items = [
        { value: account.followerCount != null ? formatNumber(account.followerCount) : "—", label: "Seguidores", cardTop: "card-top-pink" },
        { value: account.followingCount != null ? formatNumber(account.followingCount) : "—", label: "Seguindo", cardTop: "card-top-blue" },
        { value: account.likesCount != null ? formatNumber(account.likesCount) : "—", label: "Curtidas", cardTop: "card-top-pink" },
        { value: account.videoCount != null ? formatNumber(account.videoCount) : "—", label: "Vídeos", cardTop: "card-top-purple" },
    ];
    return (
        <div className="vc-grid-metrics mb-6" style={{ marginBottom: 24 }}>
            {items.map((s, i) => (
                <div key={i} className={`vc-metric-card ${cardTopToMetric[s.cardTop] || "metric-neutral"}`}>
                    <div className="vc-metric-value">{s.value}</div>
                    <div className="vc-metric-label">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

function ConnectedChannels({ connectedAccounts, activeAccountId, activeTikTokId, onSwitch, onSwitchTikTok, onDisconnect, onAdd, onConnectTikTok }) {
    const getPlatformColor = (platform) => {
        if (platform === 'tiktok') return '#ff0050';
        return '#ff0000';
    };

    return (
        <div className="vc-card mb-4" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Canais Conectados</h3>

            {connectedAccounts.map(account => {
                const isActive = account.platform === 'tiktok'
                    ? account.id === activeTikTokId
                    : account.id === activeAccountId;
                const platform = account.platform || 'youtube';
                const color = getPlatformColor(platform);
                return (
                    <div key={account.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: platform === 'tiktok' ? "linear-gradient(135deg,#ff0050,#00f2ea)" : color,
                                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12
                            }}>
                                {platform === 'tiktok' ? <Music2 size={14} /> : <Youtube size={14} />}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{account.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isActive ? (
                                <span className="vc-badge vc-badge-teal">ATIVO</span>
                            ) : (
                                <button className="vc-btn vc-btn-secondary btn-sm"
                                    onClick={() => platform === 'tiktok' ? onSwitchTikTok(account.id) : onSwitch(account.id)}
                                    style={{ fontSize: 10, padding: "2px 8px" }}>
                                    Usar este
                                </button>
                            )}
                            <button
                                onClick={() => { if (confirm(`Desconectar "${account.name}"?`)) onDisconnect(account.id); }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: 4 }}
                                title="Desconectar">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                );
            })}

            <GoogleAuthButton
                onLoginSuccess={onAdd}
                onLoginError={(err) => alert("Erro: " + JSON.stringify(err))}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--accent-coral)", cursor: "pointer", transition: "all 0.15s", marginTop: 8, borderColor: "var(--accent-coral)" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Youtube size={16} /> Conectar YouTube</div>
                <Plus size={12} />
            </GoogleAuthButton>
            <button
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid #ff0050", color: "#ff0050", cursor: "pointer", transition: "all 0.15s", marginTop: 8 }}
                onClick={onConnectTikTok}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Music2 size={16} /> Conectar TikTok</div>
                <Plus size={12} />
            </button>
            <button
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", cursor: "not-allowed", transition: "all 0.15s", marginTop: 8, opacity: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Instagram size={16} style={{ color: "var(--accent-coral)" }} /> Conectar Instagram</div>
                <span className="vc-badge vc-badge-muted" style={{ fontFamily: "var(--font-body)" }}>Em breve</span>
            </button>
            <button
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", cursor: "not-allowed", transition: "all 0.15s", marginTop: 8, opacity: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Globe size={16} style={{ color: "var(--text-muted)" }} /> Conectar Facebook</div>
                <span className="vc-badge vc-badge-muted" style={{ fontFamily: "var(--font-body)" }}>Em breve</span>
            </button>
        </div>
    );
}

function QuickActions({ navigate }) {
    const actions = [
        { icon: <Upload size={16} style={{ color: "var(--accent-coral)" }} />, label: "Novo upload", onClick: () => navigate("/dashboard/videos") },
        { icon: <Calendar size={16} style={{ color: "var(--accent-amber)" }} />, label: "Agendar publicação", onClick: () => navigate("/dashboard/calendar") },
        { icon: <Youtube size={16} style={{ color: "var(--accent-coral)" }} />, label: "YouTube Studio", onClick: () => window.open("https://studio.youtube.com", "_blank") },
        { icon: <BarChart size={16} style={{ color: "var(--accent-teal)" }} />, label: "Ver analytics", onClick: () => navigate("/dashboard/analytics") },
    ];
    return (
        <div className="vc-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Ações rápidas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {actions.map((a, i) => (
                    <button key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s" }}
                        onClick={a.onClick}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{a.icon} {a.label}</div>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                    </button>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ onConnect }) {
    return (
        <div className="vc-card" style={{ textAlign: "center", padding: 40, borderStyle: "dashed" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Youtube size={32} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Nenhum canal conectado</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
                Conecte seu canal do YouTube para ver suas estatísticas e fazer uploads automáticos.
            </p>
            <GoogleAuthButton
                onLoginSuccess={onConnect}
                onLoginError={(err) => alert("Falha no login: " + JSON.stringify(err))}
            />
        </div>
    );
}

export default function ProfilePage() {
    const { state, setState, actions } = useDashboardState();
    const navigate = useNavigate();

    const { channelStats, auth } = state;
    const connectedAccounts = auth?.connectedAccounts || [];
    const isConnected = !!(
        (auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now()) ||
        connectedAccounts.some(account => (account.platform || 'youtube') === 'youtube')
    );
    const activeAccountId = auth?.activeAccountId;

    const { plan, maxChannels } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);

    const {
        connectTikTok,
        connectedTikTokAccounts,
        loading: tiktokLoading,
    } = useTikTokAuth(state, setState);

    const [activeTikTokId, setActiveTikTokId] = useState(null);
    const youtubeAccounts = connectedAccounts.filter(a => !a.platform || a.platform === 'youtube');

    useEffect(() => {
        if (connectedTikTokAccounts.length > 0 && !connectedTikTokAccounts.find(a => a.id === activeTikTokId)) {
            setActiveTikTokId(connectedTikTokAccounts[0].id);
        }
    }, [connectedTikTokAccounts, activeTikTokId]);

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
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>

                    <div>
                        {isConnected && channelStats ? (
                            <>
                                <ChannelHero
                                    channelStats={channelStats}
                                    onRefresh={() => actions.refreshChannelStats()}
                                    youtubeAccounts={youtubeAccounts}
                                    activeId={activeAccountId}
                                    onSwitch={(id) => actions.switchAccount(id)}
                                />
                                <ChannelStats stats={channelStats} />
                            </>
                        ) : (
                            <EmptyState onConnect={actions.setYouTubeToken} />
                        )}
                        {connectedTikTokAccounts.length > 0 && (
                            <>
                                <TikTokHero
                                    accounts={connectedTikTokAccounts}
                                    activeId={activeTikTokId}
                                    onSwitch={setActiveTikTokId}
                                />
                                <TikTokStats account={connectedTikTokAccounts.find(a => a.id === activeTikTokId) || connectedTikTokAccounts[0]} />
                            </>
                        )}
                    </div>

                    <div>
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
