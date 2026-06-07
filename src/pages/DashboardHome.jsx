import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { useTheme } from "../contexts/ThemeContext";
import { PageLayout } from "../components/layout/PageLayout";
import {
    Rocket, Calendar, TrendingUp, Eye, Users, Play,
    Plus, ArrowRight, Clock, CheckCircle, Link, Video,
    BarChart2, Sparkles, AlertCircle
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
function StatCard({ icon, label, value, delta, deltaUp, isDark }) {
    const deltaColor = deltaUp === true
        ? (isDark ? "#34d399" : "#059669")
        : deltaUp === false
            ? (isDark ? "#f87171" : "#dc2626")
            : (isDark ? "#6b7280" : "#9ca3af");

    return (
        <div style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
            borderRadius: 14,
            padding: "16px 18px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: isDark ? "rgba(124,58,237,0.2)" : "#f3f0ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isDark ? "#a78bfa" : "#7c3aed",
                }}>
                    {icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#6b7280" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: isDark ? "#f9fafb" : "#111827", lineHeight: 1, marginBottom: 4 }}>
                {value}
            </div>
            {delta && (
                <div style={{ fontSize: 11, fontWeight: 500, color: deltaColor }}>
                    {deltaUp === true && "↑ "}{deltaUp === false && "↓ "}{delta}
                </div>
            )}
        </div>
    );
}

function QueueItem({ item, isDark, onNavigate }) {
    const statusColors = {
        agendado: { bg: "rgba(124,58,237,0.15)", text: "#a78bfa" },
        publicando: { bg: "rgba(37,99,235,0.15)", text: "#60a5fa" },
        erro: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
        concluido: { bg: "rgba(52,211,153,0.15)", text: "#34d399" },
    };
    const colors = statusColors[item.status] || statusColors.agendado;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px",
            background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb",
            borderRadius: 10,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb"}`,
            marginBottom: 8,
            cursor: "pointer",
        }} onClick={onNavigate}>
            <div style={{
                width: 40, height: 40, borderRadius: 9,
                background: isDark ? "rgba(124,58,237,0.2)" : "#f3f0ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                <Video size={18} color={isDark ? "#a78bfa" : "#7c3aed"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDark ? "#f3f4f6" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>
                    {item.platform || "YouTube"} · {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Sem data"}
                </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: colors.bg, color: colors.text, flexShrink: 0 }}>
                {item.status || "agendado"}
            </span>
        </div>
    );
}

function RecentVideo({ video, isDark }) {
    const views = video.views || video.statistics?.viewCount || 0;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 11,
            padding: "11px 0",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: isDark ? "rgba(37,99,235,0.15)" : "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Play size={14} color={isDark ? "#60a5fa" : "#2563eb"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: isDark ? "#e5e7eb" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.title || video.snippet?.title || "Sem título"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>
                    YouTube · {video.date || video.snippet?.publishedAt?.split("T")[0] || "—"}
                </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? "#f9fafb" : "#111827" }}>
                    {formatNumber(views)}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>views</p>
            </div>
        </div>
    );
}

function InsightTip({ tip, isDark }) {
    return (
        <div style={{
            display: "flex", gap: 10,
            padding: "11px 13px",
            background: isDark ? "rgba(124,58,237,0.08)" : "#f5f3ff",
            border: `1px solid ${isDark ? "rgba(124,58,237,0.2)" : "#ddd6fe"}`,
            borderRadius: 10,
            marginBottom: 8,
        }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
            <p style={{ margin: 0, fontSize: 12, color: isDark ? "#d1d5db" : "#4b5563", lineHeight: 1.55 }}>{tip.text}</p>
        </div>
    );
}

function Card({ children, isDark, style = {} }) {
    return (
        <div style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
            borderRadius: 16,
            padding: "18px 20px",
            ...style,
        }}>
            {children}
        </div>
    );
}

function CardHeader({ title, action, onAction, isDark }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: isDark ? "#9ca3af" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {title}
            </h2>
            {action && (
                <button onClick={onAction} style={{ fontSize: 12, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit" }}>
                    {action}
                </button>
            )}
        </div>
    );
}

// ─── Onboarding (novo usuário, sem canal) ────────────────────────────────────
function OnboardingState({ user, isDark, onNavigateProfile }) {
    const steps = [
        {
            num: 1, done: true, icon: "✅",
            title: "Conta criada",
            desc: "Você está dentro. Bem-vindo ao ViralCuts!",
        },
        {
            num: 2, done: false, icon: "🔗",
            title: "Conectar YouTube",
            desc: "Autorize o acesso para ver analytics e fazer uploads automáticos 24h por dia.",
            cta: "Conectar agora →",
            onCta: onNavigateProfile,
        },
        {
            num: 3, done: false, icon: "📹",
            title: "Enviar primeiro vídeo",
            desc: "Agende um vídeo para ver a mágica acontecer. Disponível após conectar o YouTube.",
            disabled: true,
        },
    ];

    return (
        <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: isDark ? "#6b7280" : "#9ca3af" }}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "criador"} 👋
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, color: isDark ? "#f9fafb" : "#111827" }}>
                Vamos começar
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: isDark ? "#6b7280" : "#9ca3af" }}>
                3 passos para ativar o ViralCuts no seu canal.
            </p>

            <div style={{ maxWidth: 520 }}>
                {steps.map((s) => (
                    <div key={s.num} style={{
                        display: "flex", gap: 14,
                        padding: "18px 20px",
                        borderRadius: 14,
                        border: `1px solid ${s.done ? (isDark ? "rgba(52,211,153,0.2)" : "#bbf7d0") : (isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb")}`,
                        background: s.done
                            ? (isDark ? "rgba(52,211,153,0.07)" : "#f0fdf4")
                            : (isDark ? "rgba(255,255,255,0.03)" : "#fafafa"),
                        marginBottom: 12,
                        opacity: s.disabled ? 0.45 : 1,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                            background: s.done
                                ? (isDark ? "rgba(52,211,153,0.15)" : "#dcfce7")
                                : (isDark ? "rgba(124,58,237,0.15)" : "#f3f0ff"),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20,
                        }}>
                            {s.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: isDark ? "#6b7280" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Passo {s.num}
                            </p>
                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: isDark ? "#f3f4f6" : "#111827" }}>
                                {s.title}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: isDark ? "#6b7280" : "#6b7280", lineHeight: 1.55 }}>
                                {s.desc}
                            </p>
                            {s.cta && !s.disabled && (
                                <button onClick={s.onCta} style={{
                                    marginTop: 12, fontSize: 12, fontWeight: 700,
                                    color: isDark ? "#a78bfa" : "#7c3aed",
                                    background: isDark ? "rgba(124,58,237,0.15)" : "#f3f0ff",
                                    border: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "#ddd6fe"}`,
                                    borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                                    fontFamily: "inherit",
                                }}>
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

// ─── Dashboard (canal conectado) ─────────────────────────────────────────────
function ConnectedDashboard({ user, state, supabase, isDark, navigate }) {
    const token = state.auth?.youtubeToken;
    const channelStats = state.channelStats;
    const uploadQueue = supabase.uploadQueue || state.uploadQueue || [];
    const history = supabase.history || state.history || {};

    // Stats
    const totalPublished = Object.values(history).reduce(
        (acc, day) => acc + (day?.completedItems?.length || 0), 0
    );
    const scheduledCount = uploadQueue.filter((v) => v.scheduledAt)?.length || 0;
    const subscribers = channelStats?.statistics?.subscriberCount
        ? formatNumber(Number(channelStats.statistics.subscriberCount))
        : "—";
    const totalViews = channelStats?.statistics?.viewCount
        ? formatNumber(Number(channelStats.statistics.viewCount))
        : "—";

    // Recent videos from recentUploads or history
    const recentVideos = useMemo(() => {
        if (state.recentUploads?.length) return state.recentUploads.slice(0, 4);
        const all = Object.entries(history)
            .sort(([a], [b]) => b.localeCompare(a))
            .flatMap(([date, day]) =>
                (day?.completedItems || []).map((v) => ({ ...v, date }))
            );
        return all.slice(0, 4);
    }, [state.recentUploads, history]);

    // Smart insights
    const insights = useMemo(() => {
        const tips = [];
        if (totalPublished < 3)
            tips.push({ icon: "🎯", text: "Você está começando! Tente publicar ao menos 1 vídeo por semana para ganhar tração." });
        if (scheduledCount === 0)
            tips.push({ icon: "📅", text: "Nenhum vídeo agendado. Agendar com antecedência aumenta a consistência do canal." });
        if (uploadQueue.length > 0)
            tips.push({ icon: "🚀", text: `Você tem ${uploadQueue.length} vídeo(s) na fila. Revise os detalhes antes do upload.` });
        if (tips.length === 0)
            tips.push({ icon: "✨", text: "Canal com bom ritmo! Continue consistente para crescer." });
        return tips.slice(0, 3);
    }, [totalPublished, scheduledCount, uploadQueue.length]);

    // Next scheduled
    const nextScheduled = uploadQueue
        .filter((v) => v.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

    const stats = [
        { icon: <Eye size={15} />, label: "Visualizações", value: totalViews, delta: "total acumulado" },
        { icon: <Users size={15} />, label: "Inscritos", value: subscribers, delta: "total" },
        { icon: <Rocket size={15} />, label: "Na fila", value: uploadQueue.length, delta: scheduledCount > 0 ? `${scheduledCount} agendado(s)` : "nenhum agendado" },
        { icon: <TrendingUp size={15} />, label: "Publicados", value: totalPublished, delta: "pelo ViralCuts" },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <p style={{ margin: "0 0 3px", fontSize: 13, color: isDark ? "#6b7280" : "#9ca3af" }}>
                        {getGreeting()}, {user?.name?.split(" ")[0] || "criador"} 👋
                    </p>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: isDark ? "#f9fafb" : "#111827" }}>
                        Dashboard
                    </h1>
                    {channelStats?.title && (
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: isDark ? "#7c3aed" : "#6d28d9", fontWeight: 600 }}>
                            📺 {channelStats.title}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => navigate("/dashboard/videos")}
                    style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "10px 18px",
                        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                        border: "none", borderRadius: 12,
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                    }}
                >
                    <Plus size={15} /> Novo upload
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {stats.map((s, i) => (
                    <StatCard key={i} {...s} isDark={isDark} />
                ))}
            </div>

            {/* 2-col layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

                {/* Left */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Fila de uploads */}
                    <Card isDark={isDark}>
                        <CardHeader
                            title="Fila de uploads"
                            action="Ver todos →"
                            onAction={() => navigate("/dashboard/videos")}
                            isDark={isDark}
                        />
                        {uploadQueue.length > 0
                            ? uploadQueue.slice(0, 3).map((item, i) => (
                                <QueueItem
                                    key={item.id || i}
                                    item={item}
                                    isDark={isDark}
                                    onNavigate={() => navigate("/dashboard/videos")}
                                />
                            ))
                            : (
                                <div style={{ textAlign: "center", padding: "24px 0" }}>
                                    <Rocket size={32} color={isDark ? "#374151" : "#d1d5db"} style={{ marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontSize: 13, color: isDark ? "#4b5563" : "#9ca3af" }}>
                                        Nenhum vídeo na fila.{" "}
                                        <span
                                            onClick={() => navigate("/dashboard/videos")}
                                            style={{ color: "#7c3aed", cursor: "pointer", fontWeight: 600 }}
                                        >
                                            Agendar agora →
                                        </span>
                                    </p>
                                </div>
                            )
                        }
                    </Card>

                    {/* Vídeos recentes */}
                    <Card isDark={isDark}>
                        <CardHeader
                            title="Publicados recentemente"
                            action="Ver analytics →"
                            onAction={() => navigate("/dashboard/analytics")}
                            isDark={isDark}
                        />
                        {recentVideos.length > 0
                            ? recentVideos.map((v, i) => (
                                <RecentVideo key={v.id || i} video={v} isDark={isDark} />
                            ))
                            : (
                                <div style={{ textAlign: "center", padding: "24px 0" }}>
                                    <Video size={32} color={isDark ? "#374151" : "#d1d5db"} style={{ marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontSize: 13, color: isDark ? "#4b5563" : "#9ca3af" }}>
                                        Nenhum vídeo publicado ainda.
                                    </p>
                                </div>
                            )
                        }
                    </Card>
                </div>

                {/* Right */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Próximo agendado */}
                    {nextScheduled ? (
                        <div style={{
                            background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.15))",
                            border: `1px solid ${isDark ? "rgba(124,58,237,0.25)" : "#ddd6fe"}`,
                            borderRadius: 16, padding: "18px 20px",
                        }}>
                            <p style={{ margin: "0 0 3px", fontSize: 10, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Próximo upload
                            </p>
                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: isDark ? "#f3f4f6" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {nextScheduled.title}
                            </p>
                            <p style={{ margin: "0 0 14px", fontSize: 12, color: isDark ? "#6b7280" : "#9ca3af" }}>
                                {nextScheduled.platform || "YouTube"} · {new Date(nextScheduled.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <button
                                onClick={() => navigate("/dashboard/videos")}
                                style={{
                                    width: "100%", padding: "8px 0",
                                    background: "rgba(124,58,237,0.25)",
                                    border: "1px solid rgba(124,58,237,0.4)",
                                    borderRadius: 10, color: "#a78bfa",
                                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                }}
                            >
                                Gerenciar uploads
                            </button>
                        </div>
                    ) : (
                        <Card isDark={isDark}>
                            <div style={{ textAlign: "center", padding: "8px 0" }}>
                                <Calendar size={28} color={isDark ? "#374151" : "#d1d5db"} style={{ marginBottom: 8 }} />
                                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: isDark ? "#9ca3af" : "#6b7280" }}>
                                    Sem uploads agendados
                                </p>
                                <button
                                    onClick={() => navigate("/dashboard/calendar")}
                                    style={{
                                        fontSize: 12, fontWeight: 700,
                                        color: isDark ? "#a78bfa" : "#7c3aed",
                                        background: isDark ? "rgba(124,58,237,0.15)" : "#f3f0ff",
                                        border: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "#ddd6fe"}`,
                                        borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                >
                                    Agendar pelo calendário →
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Insights */}
                    <Card isDark={isDark}>
                        <CardHeader title="Insights do canal" isDark={isDark} />
                        {insights.map((tip, i) => (
                            <InsightTip key={i} tip={tip} isDark={isDark} />
                        ))}
                    </Card>

                    {/* Link rápido para analytics */}
                    <button
                        onClick={() => navigate("/dashboard/analytics")}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "14px 18px",
                            background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
                            borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <BarChart2 size={18} color={isDark ? "#a78bfa" : "#7c3aed"} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#d1d5db" : "#374151" }}>
                                Ver analytics completos
                            </span>
                        </div>
                        <ArrowRight size={15} color={isDark ? "#6b7280" : "#9ca3af"} />
                    </button>
                </div>
            </div>
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
