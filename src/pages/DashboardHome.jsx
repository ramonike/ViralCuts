import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { useTheme } from "../contexts/ThemeContext";
import { PageLayout } from "../components/layout/PageLayout";
import {
    Rocket, Calendar, TrendingUp, Eye, Users, Play,
    Plus, ArrowRight, Video, BarChart2, Sparkles,
    CheckCircle, Zap, Upload, GitBranch
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
};

const formatNumber = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};

// ─── Pipeline CTA Banner ──────────────────────────────────────────────────────
// Aparece quando há vídeos na fila sem agendamento — guia o usuário pro coração do produto
function PipelineCTABanner({ unscheduledCount, navigate }) {
    if (unscheduledCount === 0) return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            background: 'var(--accent-amber-3)',
            border: '1px solid rgba(240,165,0,0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            cursor: 'pointer',
        }}
            onClick={() => navigate('/dashboard/calendar')}
        >
            <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'rgba(240,165,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <GitBranch size={18} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: '0 0 2px',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '0.9375rem', letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                }}>
                    {unscheduledCount} vídeo{unscheduledCount > 1 ? 's' : ''} pronto{unscheduledCount > 1 ? 's' : ''} para agendar
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Abra o Pipeline e defina os horários de publicação multicanal →
                </p>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
        </div>
    );
}

// ─── TodayTimeline — Signature Element ───────────────────────────────────────
function TodayTimeline({ uploadQueue }) {
    const scheduled = uploadQueue
        .filter((v) => v.scheduledAt)
        .map((v) => {
            const d = new Date(v.scheduledAt);
            return { ...v, hour: d.getHours(), minute: d.getMinutes() };
        });

    const hours = [6, 9, 12, 15, 18, 21];
    const now = new Date();
    const nowPct = Math.min(100, Math.max(0, ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100));

    return (
        <div className="vc-card" style={{ padding: "16px 20px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span className="vc-metric-label" style={{ marginBottom: 0 }}>Timeline de hoje</span>
                <span className="vc-badge vc-badge-coral" style={{ fontSize: "0.625rem" }}>
                    {scheduled.length} agendado{scheduled.length !== 1 ? "s" : ""}
                </span>
            </div>
            <div style={{ position: "relative", paddingBottom: 22 }}>
                <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, position: "relative" }}>
                    <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${nowPct}%`,
                        background: "linear-gradient(90deg, var(--accent-coral), var(--accent-amber))",
                        borderRadius: 2,
                    }} />
                    <div style={{
                        position: "absolute", left: `${nowPct}%`, top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 10, height: 10, borderRadius: "50%",
                        background: "var(--accent-coral)",
                        border: "2px solid var(--bg-card)",
                        zIndex: 3,
                        boxShadow: "0 0 0 3px var(--accent-coral-3)",
                    }} />
                    {scheduled.map((v, i) => {
                        const pct = Math.min(100, ((v.hour * 60 + v.minute) / (24 * 60)) * 100);
                        return (
                            <div key={i} title={`${v.title} — ${v.hour}h${String(v.minute).padStart(2, "0")}`}
                                style={{
                                    position: "absolute", left: `${pct}%`, top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: 8, height: 8, borderRadius: 2,
                                    background: "var(--accent-amber)",
                                    border: "2px solid var(--bg-card)", zIndex: 2,
                                }}
                            />
                        );
                    })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    {hours.map((h) => (
                        <span key={h} style={{
                            fontSize: 10, color: "var(--text-muted)",
                            fontFamily: "var(--font-display)", fontWeight: 500,
                        }}>{h}h</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, accent = "coral" }) {
    return (
        <div className={`vc-metric-card metric-${accent}`}>
            <div className="vc-metric-label">{label}</div>
            <div className="vc-metric-value">{value}</div>
            {delta && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    {delta}
                </div>
            )}
        </div>
    );
}

// ─── Queue Item ───────────────────────────────────────────────────────────────
function QueueItem({ item, onNavigate }) {
    const statusMap = {
        agendado: { badge: "vc-badge-coral", label: "Agendado" },
        publicando: { badge: "vc-badge-amber", label: "Publicando" },
        erro: { badge: "vc-badge-coral", label: "Erro" },
        concluido: { badge: "vc-badge-teal", label: "Publicado" },
    };
    const s = statusMap[item.status] || statusMap.agendado;
    const platformDot = item.platform?.toLowerCase() || "online";

    return (
        <div onClick={onNavigate}
            style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                marginBottom: 8, cursor: "pointer",
            }}
        >
            <div className="vc-thumb" style={{ width: 48, height: 27, flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={14} style={{ color: "var(--text-muted)" }} />
                </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: "0.8125rem", fontWeight: 600,
                    fontFamily: "var(--font-display)", color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                }}>{item.title}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <div className={`vc-platform-dot ${platformDot}`} />
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                        {item.platform || "YouTube"}
                        {item.scheduledAt && ` · ${new Date(item.scheduledAt).toLocaleString("pt-BR", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}`}
                    </span>
                </div>
            </div>
            <span className={`vc-badge ${s.badge}`}>{s.label}</span>
        </div>
    );
}

// ─── Recent Video Row ─────────────────────────────────────────────────────────
function RecentVideoRow({ video }) {
    const views = video.views || video.statistics?.viewCount || 0;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 11,
            padding: "10px 0",
            borderBottom: "1px solid var(--border-subtle)",
        }}>
            <div className="vc-thumb" style={{ width: 44, height: 25, flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={12} style={{ color: "var(--text-muted)" }} />
                </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: "0.8125rem", fontWeight: 500,
                    fontFamily: "var(--font-display)", color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                }}>{video.title || video.snippet?.title || "Sem título"}</p>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    {video.date || video.snippet?.publishedAt?.split("T")[0] || "—"}
                </span>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{
                    margin: 0, fontFamily: "var(--font-display)", fontSize: "0.9375rem",
                    fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em",
                }}>{formatNumber(views)}</p>
                <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>views</p>
            </div>
        </div>
    );
}

// ─── Insight Tip ──────────────────────────────────────────────────────────────
function InsightTip({ tip }) {
    const iconMap = { "🎯": <Zap size={14} />, "📅": <Calendar size={14} />, "🚀": <Rocket size={14} />, "✨": <Sparkles size={14} /> };
    return (
        <div style={{
            display: "flex", gap: 10, padding: "11px 13px",
            background: "var(--accent-coral-3)",
            border: "1px solid rgba(232,65,42,0.15)",
            borderRadius: "var(--radius-md)", marginBottom: 8,
        }}>
            <span style={{ color: "var(--accent-coral-2)", flexShrink: 0, marginTop: 1 }}>
                {iconMap[tip.icon] || <Sparkles size={14} />}
            </span>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55, fontFamily: "var(--font-body)" }}>
                {tip.text}
            </p>
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, action, onAction, children }) {
    return (
        <div className="vc-card">
            <div className="vc-card-header">
                <span className="vc-metric-label" style={{ marginBottom: 0 }}>{title}</span>
                {action && (
                    <button onClick={onAction} style={{
                        fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-display)",
                        color: "var(--accent-coral-2)", background: "none", border: "none",
                        cursor: "pointer", padding: 0, letterSpacing: "-0.01em",
                    }}>{action}</button>
                )}
            </div>
            <div className="vc-card-body" style={{ paddingTop: 14 }}>{children}</div>
        </div>
    );
}

// ─── Onboarding State ────────────────────────────────────────────────────────
function OnboardingState({ user, onNavigateProfile }) {
    const steps = [
        { num: "01", done: true, title: "Conta criada", desc: "Você está dentro. Bem-vindo ao ViralCuts." },
        { num: "02", done: false, title: "Conectar YouTube", desc: "Autorize o acesso para analytics e upload automático 24h.", cta: "Conectar agora", onCta: onNavigateProfile },
        { num: "03", done: false, disabled: true, title: "Primeiro upload", desc: "Agende um vídeo e deixe o ViralCuts trabalhar por você." },
    ];

    return (
        <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
            </p>
            <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Vamos começar
            </h1>
            <p style={{ margin: "0 0 32px", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                3 passos para ativar o ViralCuts no seu canal.
            </p>
            <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map((s) => (
                    <div key={s.num} style={{
                        display: "flex", gap: 16, padding: "18px 20px",
                        borderRadius: "var(--radius-lg)",
                        border: `1px solid ${s.done ? "rgba(0,201,167,0.25)" : "var(--border-default)"}`,
                        background: s.done ? "var(--accent-teal-3)" : "var(--bg-card)",
                        opacity: s.disabled ? 0.4 : 1,
                    }}>
                        <div style={{ minWidth: 30, paddingTop: 2 }}>
                            {s.done
                                ? <CheckCircle size={22} style={{ color: "var(--accent-teal)" }} />
                                : <span style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "var(--border-strong)", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.num}</span>
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.title}</p>
                            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.desc}</p>
                            {s.cta && !s.disabled && (
                                <button onClick={s.onCta} className="vc-btn vc-btn-primary vc-btn-sm" style={{ marginTop: 12 }}>
                                    {s.cta} <ArrowRight size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Connected Dashboard ──────────────────────────────────────────────────────
function ConnectedDashboard({ user, state, supabase, navigate }) {
    const channelStats = state.channelStats;
    const uploadQueue = supabase.uploadQueue || state.uploadQueue || [];
    const history = supabase.history || state.history || {};

    const totalPublished = Object.values(history).reduce((acc, day) => acc + (day?.completedItems?.length || 0), 0);
    const scheduledCount = uploadQueue.filter((v) => v.scheduledAt)?.length || 0;
    const subscribers = channelStats?.statistics?.subscriberCount ? formatNumber(Number(channelStats.statistics.subscriberCount)) : "—";
    const totalViews = channelStats?.statistics?.viewCount ? formatNumber(Number(channelStats.statistics.viewCount)) : "—";

    const recentVideos = useMemo(() => {
        if (state.recentUploads?.length) return state.recentUploads.slice(0, 4);
        const all = Object.entries(history)
            .sort(([a], [b]) => b.localeCompare(a))
            .flatMap(([date, day]) => (day?.completedItems || []).map((v) => ({ ...v, date })));
        return all.slice(0, 4);
    }, [state.recentUploads, history]);

    const insights = useMemo(() => {
        const tips = [];
        if (totalPublished < 3) tips.push({ icon: "🎯", text: "Publique ao menos 1 vídeo por semana para ganhar tração no algoritmo." });
        if (scheduledCount === 0) tips.push({ icon: "📅", text: "Nenhum vídeo agendado. Consistência é o motor de crescimento." });
        if (uploadQueue.length > 0) tips.push({ icon: "🚀", text: `${uploadQueue.length} vídeo(s) na fila aguardando otimização de metadados.` });
        if (tips.length === 0) tips.push({ icon: "✨", text: "Canal com bom ritmo! Continue consistente para crescer." });
        return tips.slice(0, 3);
    }, [totalPublished, scheduledCount, uploadQueue.length]);

    const nextScheduled = uploadQueue
        .filter((v) => v.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <p style={{ margin: "0 0 2px", fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                        {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
                    </p>
                    <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Dashboard
                    </h1>
                    {channelStats?.title && (
                        <p style={{ margin: "5px 0 0", fontSize: "0.8125rem", color: "var(--accent-amber)", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: 5, letterSpacing: "-0.01em" }}>
                            <div className="vc-platform-dot youtube" />
                            {channelStats.title}
                        </p>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate("/dashboard/creation")} className="vc-btn vc-btn-secondary vc-btn-sm">
                        <Sparkles size={14} /> Otimizar com IA
                    </button>
                    <button onClick={() => navigate("/dashboard/videos")} className="vc-btn vc-btn-primary vc-btn-sm">
                        <Upload size={14} /> Novo upload
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="vc-grid-metrics" style={{ marginBottom: 16 }}>
                <StatCard label="Visualizações" value={totalViews} delta="total acumulado" accent="amber" />
                <StatCard label="Inscritos" value={subscribers} delta="total" accent="teal" />
                <StatCard label="Na fila" value={uploadQueue.length} delta={`${scheduledCount} agendado(s)`} accent="coral" />
                <StatCard label="Publicados" value={totalPublished} delta="via ViralCuts" accent="neutral" />
            </div>

            {/* Pipeline CTA — guia usuários com vídeos sem agendamento */}
            <PipelineCTABanner
                unscheduledCount={uploadQueue.filter(v => !v.scheduledAt).length}
                navigate={navigate}
            />

            {/* Timeline */}
            <TodayTimeline uploadQueue={uploadQueue} />

            {/* 2-col */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 296px", gap: 16 }}>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SectionCard title="Fila de uploads" action="Ver todos →" onAction={() => navigate("/dashboard/videos")}>
                        {uploadQueue.length > 0
                            ? uploadQueue.slice(0, 3).map((item, i) => <QueueItem key={item.id || i} item={item} onNavigate={() => navigate("/dashboard/videos")} />)
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                        <Rocket size={20} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <p style={{ margin: "0 0 12px", fontSize: "0.875rem", color: "var(--text-muted)" }}>Fila vazia</p>
                                    <button onClick={() => navigate("/dashboard/videos")} className="vc-btn vc-btn-primary vc-btn-sm">
                                        <Plus size={13} /> Adicionar vídeo
                                    </button>
                                </div>
                            )}
                    </SectionCard>

                    <SectionCard title="Publicados recentemente" action="Ver analytics →" onAction={() => navigate("/dashboard/analytics")}>
                        {recentVideos.length > 0
                            ? recentVideos.map((v, i) => <RecentVideoRow key={v.id || i} video={v} />)
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                        <Video size={20} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>Nenhum vídeo publicado ainda</p>
                                </div>
                            )}
                    </SectionCard>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {nextScheduled ? (
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent-coral-4)", borderRadius: "var(--radius-lg)", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent-coral)" }} />
                            <span className="vc-metric-label">Próximo upload</span>
                            <p style={{ margin: "8px 0 4px", fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                                {nextScheduled.title}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                                <div className={`vc-platform-dot ${nextScheduled.platform?.toLowerCase() || "youtube"}`} />
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {nextScheduled.platform || "YouTube"} · {new Date(nextScheduled.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <button onClick={() => navigate("/dashboard/videos")} className="vc-btn vc-btn-secondary vc-btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                                Gerenciar uploads
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Calendar size={18} style={{ color: "var(--text-muted)" }} />
                            </div>
                            <p style={{ margin: "0 0 12px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Sem uploads agendados</p>
                            <button onClick={() => navigate("/dashboard/calendar")} className="vc-btn vc-btn-secondary vc-btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                                Abrir calendário →
                            </button>
                        </div>
                    )}

                    <SectionCard title="Insights do canal">
                        {insights.map((tip, i) => <InsightTip key={i} tip={tip} />)}
                    </SectionCard>

                    <button onClick={() => navigate("/dashboard/analytics")} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "13px 16px",
                        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "inherit",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <BarChart2 size={16} style={{ color: "var(--accent-amber)" }} />
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                                Analytics completos
                            </span>
                        </div>
                        <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
    const { state } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const hasYouTube = !!(state.auth?.youtubeToken && state.auth?.youtubeTokenExpiresAt > Date.now());
    const user = supabase.user;

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {hasYouTube
                ? <ConnectedDashboard user={user} state={state} supabase={supabase} navigate={navigate} />
                : <OnboardingState user={user} onNavigateProfile={() => navigate("/dashboard/profile")} />
            }
        </PageLayout>
    );
}
