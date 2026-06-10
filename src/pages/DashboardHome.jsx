import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { useTheme } from "../contexts/ThemeContext";
import { PageLayout } from "../components/layout/PageLayout";
import {
    Rocket, Calendar, TrendingUp, Eye, Users, Play,
    Plus, ArrowRight, Clock, Video, BarChart2, Sparkles,
    CheckCircle, Link, AlertCircle, Zap
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
};

const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatNumber = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * MetricCard — card de KPI com traço colorido no topo
 * accent: 'coral' | 'amber' | 'teal' | 'neutral'
 */
function MetricCard({ icon: Icon, label, value, delta, accent = "neutral" }) {
    const deltaColors = {
        up: "var(--accent-teal)",
        down: "var(--accent-coral)",
        flat: "var(--text-muted)",
    };

    const accentColor = {
        coral: "var(--accent-coral)",
        amber: "var(--accent-amber)",
        teal: "var(--accent-teal)",
        neutral: "var(--border-default)",
    }[accent];

    const iconBg = {
        coral: "var(--accent-coral-3)",
        amber: "var(--accent-amber-3)",
        teal: "var(--accent-teal-3)",
        neutral: "var(--bg-elevated)",
    }[accent];

    const iconColor = {
        coral: "var(--accent-coral-2)",
        amber: "var(--accent-amber-2)",
        teal: "var(--accent-teal)",
        neutral: "var(--text-secondary)",
    }[accent];

    return (
        <div className="vc-metric-card" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* traço de acento no topo */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 'var(--radius-md)',
                    background: iconBg, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                }}>
                    <Icon size={16} color={iconColor} />
                </div>
            </div>

            <div className="vc-metric-label">{label}</div>
            <div className="vc-metric-value">{value}</div>

            {delta && (
                <div style={{ fontSize: 11, fontWeight: 500, color: deltaColors.flat, marginTop: 4, fontFamily: 'var(--font-body)' }}>
                    {delta}
                </div>
            )}
        </div>
    );
}

/**
 * QueueItem — linha de vídeo na fila
 */
function QueueItem({ item, onNavigate }) {
    const statusMap = {
        agendado: { label: "Agendado", cls: "vc-badge-coral" },
        publicando: { label: "Publicando", cls: "vc-badge-amber" },
        erro: { label: "Erro", cls: "vc-badge-coral" },
        concluido: { label: "Publicado", cls: "vc-badge-teal" },
    };
    const status = statusMap[item.status] || statusMap.agendado;

    return (
        <div
            onClick={onNavigate}
            style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                marginBottom: 7,
                cursor: "pointer",
                transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-default)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
        >
            <div style={{
                width: 36, height: 36, borderRadius: "var(--radius-sm)",
                background: "var(--accent-coral-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                <Video size={16} color="var(--accent-coral-2)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display)" }}>
                    {item.title}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    {item.platform || "YouTube"} · {item.scheduledAt
                        ? new Date(item.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "Sem data"}
                </p>
            </div>
            <span className={`vc-badge ${status.cls}`}>{status.label}</span>
        </div>
    );
}

/**
 * RecentVideoRow — linha de vídeo publicado
 */
function RecentVideoRow({ video }) {
    const views = video.views || video.statistics?.viewCount || 0;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 11,
            padding: "10px 0",
            borderBottom: "1px solid var(--border-subtle)",
        }}>
            <div style={{
                width: 34, height: 34, borderRadius: "var(--radius-sm)", flexShrink: 0,
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Play size={14} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.title || video.snippet?.title || "Sem título"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    YouTube · {video.date || video.snippet?.publishedAt?.split("T")[0] || "—"}
                </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                    {formatNumber(views)}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>views</p>
            </div>
        </div>
    );
}

/**
 * InsightTip — dica inteligente de canal
 */
function InsightTip({ tip }) {
    return (
        <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "10px 12px",
            background: "var(--accent-coral-3)",
            border: "1px solid rgba(232,65,42,0.15)",
            borderRadius: "var(--radius-md)",
            marginBottom: 7,
        }}>
            <Zap size={14} color="var(--accent-coral-2)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, fontFamily: "var(--font-body)" }}>
                {tip.text}
            </p>
        </div>
    );
}

// ─── Card wrapper simples ─────────────────────────────────────────────────────
function Card({ children, style = {} }) {
    return (
        <div className="vc-card" style={{ padding: "18px 20px", ...style }}>
            {children}
        </div>
    );
}

function CardHeader({ title, action, onAction }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span className="vc-metric-label" style={{ marginBottom: 0 }}>{title}</span>
            {action && (
                <button
                    onClick={onAction}
                    style={{
                        fontSize: 12, fontWeight: 600, color: "var(--accent-coral-2)",
                        background: "none", border: "none", cursor: "pointer",
                        padding: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
                    }}
                >
                    {action}
                </button>
            )}
        </div>
    );
}

// ─── Onboarding (usuário sem canal) ──────────────────────────────────────────
function OnboardingState({ user, onNavigateProfile }) {
    const steps = [
        {
            num: 1, done: true,
            title: "Conta criada",
            desc: "Você está dentro. Bem-vindo ao ViralCuts!",
        },
        {
            num: 2, done: false,
            title: "Conectar YouTube",
            desc: "Autorize o acesso para ver analytics e fazer uploads automáticos.",
            cta: "Conectar agora →",
            onCta: onNavigateProfile,
        },
        {
            num: 3, done: false, disabled: true,
            title: "Enviar primeiro vídeo",
            desc: "Agende um vídeo para ver a mágica acontecer.",
        },
    ];

    return (
        <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
            </p>
            <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                Vamos começar
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                3 passos para ativar o ViralCuts no seu canal.
            </p>

            <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map((s) => (
                    <div
                        key={s.num}
                        style={{
                            display: "flex", gap: 14,
                            padding: "18px 20px",
                            borderRadius: "var(--radius-lg)",
                            border: `1px solid ${s.done ? "rgba(0,201,167,0.25)" : "var(--border-subtle)"}`,
                            background: s.done ? "var(--accent-teal-3)" : "var(--bg-card)",
                            opacity: s.disabled ? 0.4 : 1,
                        }}
                    >
                        <div style={{
                            width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0,
                            background: s.done ? "rgba(0,201,167,0.2)" : "var(--bg-elevated)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {s.done
                                ? <CheckCircle size={20} color="var(--accent-teal)" />
                                : <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>{s.num}</span>
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Passo {s.num}
                            </p>
                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                                {s.title}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                                {s.desc}
                            </p>
                            {s.cta && !s.disabled && (
                                <button
                                    onClick={s.onCta}
                                    className="vc-btn vc-btn-primary vc-btn-sm"
                                    style={{ marginTop: 12 }}
                                >
                                    {s.cta}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Dashboard principal (canal conectado) ────────────────────────────────────
function ConnectedDashboard({ user, state, supabase, navigate }) {
    const channelStats = state.channelStats;
    const uploadQueue = supabase.uploadQueue || state.uploadQueue || [];
    const history = supabase.history || state.history || {};

    // Stats calculados
    const totalPublished = Object.values(history).reduce(
        (acc, day) => acc + (day?.completedItems?.length || 0), 0
    );
    const scheduledCount = uploadQueue.filter((v) => v.scheduledAt)?.length || 0;
    const subscribers = channelStats?.statistics?.subscriberCount
        ? formatNumber(Number(channelStats.statistics.subscriberCount)) : "—";
    const totalViews = channelStats?.statistics?.viewCount
        ? formatNumber(Number(channelStats.statistics.viewCount)) : "—";

    // Vídeos recentes
    const recentVideos = useMemo(() => {
        if (state.recentUploads?.length) return state.recentUploads.slice(0, 5);
        const all = Object.entries(history)
            .sort(([a], [b]) => b.localeCompare(a))
            .flatMap(([date, day]) =>
                (day?.completedItems || []).map((v) => ({ ...v, date }))
            );
        return all.slice(0, 5);
    }, [state.recentUploads, history]);

    // Insights
    const insights = useMemo(() => {
        const tips = [];
        if (totalPublished < 3)
            tips.push({ text: "Publique ao menos 1 vídeo por semana para o algoritmo ganhar tração no seu canal." });
        if (scheduledCount === 0)
            tips.push({ text: "Nenhum vídeo agendado. Consistência é o fator nº 1 para crescimento." });
        if (uploadQueue.length > 0)
            tips.push({ text: `${uploadQueue.length} vídeo(s) na fila aguardando. Revise títulos e descrições antes do envio.` });
        if (tips.length === 0)
            tips.push({ text: "Canal em bom ritmo! Continue com consistência para acelerar o crescimento." });
        return tips.slice(0, 2);
    }, [totalPublished, scheduledCount, uploadQueue.length]);

    const nextScheduled = uploadQueue
        .filter((v) => v.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                        {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
                    </p>
                    <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        {channelStats?.title || "Dashboard"}
                    </h1>
                </div>

                <button
                    onClick={() => navigate("/dashboard/videos")}
                    className="vc-btn vc-btn-primary"
                >
                    <Plus size={15} />
                    Novo upload
                </button>
            </div>

            {/* ── Métricas ────────────────────────────────────────── */}
            <div className="vc-grid-metrics" style={{ marginBottom: 20 }}>
                <MetricCard
                    icon={Eye}
                    label="Visualizações"
                    value={totalViews}
                    delta="total acumulado"
                    accent="neutral"
                />
                <MetricCard
                    icon={Users}
                    label="Inscritos"
                    value={subscribers}
                    delta="total"
                    accent="amber"
                />
                <MetricCard
                    icon={Rocket}
                    label="Na fila"
                    value={uploadQueue.length}
                    delta={scheduledCount > 0 ? `${scheduledCount} agendado(s)` : "nenhum agendado"}
                    accent="coral"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Publicados"
                    value={totalPublished}
                    delta="pelo ViralCuts"
                    accent="teal"
                />
            </div>

            {/* ── Layout 2 colunas ────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

                {/* Coluna esquerda */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Fila de uploads */}
                    <Card>
                        <CardHeader
                            title="Fila de uploads"
                            action="Ver todos →"
                            onAction={() => navigate("/dashboard/videos")}
                        />
                        {uploadQueue.length > 0
                            ? uploadQueue.slice(0, 3).map((item, i) => (
                                <QueueItem
                                    key={item.id || i}
                                    item={item}
                                    onNavigate={() => navigate("/dashboard/videos")}
                                />
                            ))
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                                        <Rocket size={20} color="var(--text-muted)" />
                                    </div>
                                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                                        Nenhum vídeo na fila
                                    </p>
                                    <button
                                        onClick={() => navigate("/dashboard/videos")}
                                        className="vc-btn vc-btn-secondary vc-btn-sm"
                                    >
                                        Agendar agora →
                                    </button>
                                </div>
                            )
                        }
                    </Card>

                    {/* Publicados recentemente */}
                    <Card>
                        <CardHeader
                            title="Publicados recentemente"
                            action="Ver analytics →"
                            onAction={() => navigate("/dashboard/analytics")}
                        />
                        {recentVideos.length > 0
                            ? recentVideos.map((v, i) => (
                                <RecentVideoRow key={v.id || i} video={v} />
                            ))
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <Video size={32} color="var(--border-default)" style={{ marginBottom: 8, opacity: 0.6 }} />
                                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                                        Nenhum vídeo publicado ainda
                                    </p>
                                </div>
                            )
                        }
                    </Card>
                </div>

                {/* Coluna direita */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Próximo agendado */}
                    {nextScheduled ? (
                        <div style={{
                            background: "var(--accent-coral-3)",
                            border: "1px solid rgba(232,65,42,0.2)",
                            borderRadius: "var(--radius-lg)",
                            padding: "16px 18px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-coral)", animation: "vc-pulse 1.4s ease-in-out infinite" }} />
                                <span className="text-label" style={{ color: "var(--accent-coral-2)", fontSize: "0.625rem" }}>
                                    Próximo upload
                                </span>
                            </div>
                            <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display)" }}>
                                {nextScheduled.title}
                            </p>
                            <p style={{ margin: "0 0 14px", fontSize: 11, color: "var(--text-secondary)" }}>
                                <Clock size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                                {nextScheduled.platform || "YouTube"} · {new Date(nextScheduled.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <button
                                onClick={() => navigate("/dashboard/videos")}
                                className="vc-btn vc-btn-secondary vc-btn-sm"
                                style={{ width: "100%", justifyContent: "center" }}
                            >
                                Gerenciar uploads
                            </button>
                        </div>
                    ) : (
                        <Card>
                            <div style={{ textAlign: "center", padding: "8px 0" }}>
                                <Calendar size={28} color="var(--border-strong)" style={{ marginBottom: 8 }} />
                                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                                    Sem uploads agendados
                                </p>
                                <button
                                    onClick={() => navigate("/dashboard/calendar")}
                                    className="vc-btn vc-btn-secondary vc-btn-sm"
                                >
                                    Agendar pelo calendário →
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Insights */}
                    <Card>
                        <CardHeader title="Insights" />
                        {insights.map((tip, i) => (
                            <InsightTip key={i} tip={tip} />
                        ))}
                    </Card>

                    {/* Link rápido para analytics */}
                    <button
                        onClick={() => navigate("/dashboard/analytics")}
                        className="vc-card"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "13px 16px",
                            background: "none", border: "1px solid var(--border-subtle)",
                            cursor: "pointer", textAlign: "left",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <BarChart2 size={17} color="var(--accent-amber)" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                                Analytics completos
                            </span>
                        </div>
                        <ArrowRight size={15} color="var(--text-muted)" />
                    </button>

                    {/* Atalho para Criação IA */}
                    <button
                        onClick={() => navigate("/dashboard/creation")}
                        className="vc-card"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "13px 16px",
                            background: "var(--accent-coral-3)", border: "1px solid rgba(232,65,42,0.2)",
                            cursor: "pointer", textAlign: "left",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Sparkles size={17} color="var(--accent-coral-2)" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-coral-2)", fontFamily: "var(--font-display)" }}>
                                Otimizar com IA
                            </span>
                        </div>
                        <ArrowRight size={15} color="var(--accent-coral-2)" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes vc-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.5; transform: scale(0.8); }
                }
            `}</style>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DashboardHome() {
    const { state } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const isDark = theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const user = supabase.user;
    const hasYouTube = !!(state.auth?.youtubeToken && state.auth?.youtubeTokenExpiresAt > Date.now());

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {hasYouTube
                ? <ConnectedDashboard
                    user={user}
                    state={state}
                    supabase={supabase}
                    isDark={isDark}
                    navigate={navigate}
                />
                : <OnboardingState
                    user={user}
                    isDark={isDark}
                    onNavigateProfile={() => navigate("/dashboard/profile")}
                />
            }
        </PageLayout>
    );
}