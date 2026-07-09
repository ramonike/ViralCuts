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

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
};

const formatNumber = (n) => {
    if (!n && n !== 0) return "\u2014";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
};

function PipelineCTABanner({ unscheduledCount, navigate }) {
    if (unscheduledCount === 0) return null;
    const text1 = unscheduledCount + " video" + (unscheduledCount > 1 ? "s" : "") + " pronto" + (unscheduledCount > 1 ? "s" : "") + " para agendar";
    return (
        <div style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}
            onClick={() => navigate("/dashboard/calendar")}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: "rgba(240,165,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GitBranch size={18} style={{ color: "var(--accent-amber)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{text1}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Abra o Pipeline e defina os horarios de publicacao multicanal</p>
            </div>
            <ArrowRight size={16} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
        </div>
    );
}

function TodayTimeline({ uploadQueue }) {
    const scheduled = uploadQueue
        .filter(function(v) { return v.scheduledAt; })
        .map(function(v) {
            var d = new Date(v.scheduledAt);
            return { ...v, hour: d.getHours(), minute: d.getMinutes() };
        });

    var hours = [6, 9, 12, 15, 18, 21];
    var now = new Date();
    var nowPct = Math.min(100, Math.max(0, ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100));

    return (
        <div style={{ padding: "16px 20px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 0 }}>Timeline de hoje</span>
                <span className="vc-badge vc-badge-coral" style={{ fontSize: 10 }}>
                    {scheduled.length} agendado{scheduled.length !== 1 ? "s" : ""}
                </span>
            </div>
            <div style={{ position: "relative", paddingBottom: 22 }}>
                <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: nowPct + "%", background: "linear-gradient(90deg, var(--accent-coral), var(--accent-amber))", borderRadius: 2 }} />
                    <div style={{ position: "absolute", left: nowPct + "%", top: "50%", transform: "translate(-50%, -50%)", width: 10, height: 10, borderRadius: "50%", background: "var(--accent-coral)", border: "2px solid var(--bg-card)", zIndex: 3 }} />
                    {scheduled.map(function(v, i) {
                        var pct = Math.min(100, ((v.hour * 60 + v.minute) / (24 * 60)) * 100);
                        return (
                            <div key={i} title={v.title + " - " + v.hour + "h" + String(v.minute).padStart(2, "0")}
                                style={{ position: "absolute", left: pct + "%", top: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: 2, background: "var(--accent-amber)", border: "2px solid var(--bg-card)", zIndex: 2 }} />
                        );
                    })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    {hours.map(function(h) {
                        return <span key={h} style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{h}h</span>;
                    })}
                </div>
            </div>
        </div>
    );
}

function QueueItem({ item, onNavigate }) {
    var badgeClass = "vc-badge-coral";
    var badgeLabel = "Agendado";
    if (item.status === "publicando") { badgeClass = "vc-badge-amber"; badgeLabel = "Publicando"; }
    else if (item.status === "erro") { badgeClass = "vc-badge-coral"; badgeLabel = "Erro"; }
    else if (item.status === "concluido") { badgeClass = "vc-badge-teal"; badgeLabel = "Publicado"; }

    return (
        <div onClick={onNavigate}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border-default)", marginBottom: 8, cursor: "pointer", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}>
            <div style={{ width: 48, height: 27, borderRadius: 4, background: "var(--bg-elevated)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-default)" }}>
                <Video size={14} style={{ color: "var(--text-secondary)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", opacity: .7 }}>
                    {item.platform || "YouTube"}
                    {item.scheduledAt ? " - " + new Date(item.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
            </div>
            <span className={"vc-badge " + badgeClass}>{badgeLabel}</span>
        </div>
    );
}

function RecentVideoRow({ video }) {
    var views = video.views || video.statistics?.viewCount || 0;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid var(--border-default)" }}>
            <div style={{ width: 44, height: 25, borderRadius: 4, background: "var(--bg-elevated)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={12} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.title || video.snippet?.title || "Sem titulo"}
                </p>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{video.date || video.snippet?.publishedAt?.split("T")[0] || "\u2014"}</span>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{formatNumber(views)}</p>
                <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>views</p>
            </div>
        </div>
    );
}

function InsightTip({ tip }) {
    var iconEl = <Sparkles size={14} />;
    if (tip.icon === "\uD83C\uDFAF") iconEl = <Zap size={14} />;
    else if (tip.icon === "\uD83D\uDCC5") iconEl = <Calendar size={14} />;
    else if (tip.icon === "\uD83D\uDE80") iconEl = <Rocket size={14} />;
    return (
        <div style={{ display: "flex", gap: 10, padding: "11px 13px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--accent-coral-3)", borderRadius: "var(--radius)", marginBottom: 8 }}>
            <span style={{ color: "var(--accent-coral-2)", flexShrink: 0, marginTop: 1 }}>{iconEl}</span>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{tip.text}</p>
        </div>
    );
}

function OnboardingState({ user, onNavigateProfile }) {
    var steps = [
        { num: "01", done: true, title: "Conta criada", desc: "Voce esta dentro. Bem-vindo ao ViralCuts." },
        { num: "02", done: false, title: "Conectar YouTube", desc: "Autorize o acesso para analytics e upload automatico 24h.", cta: "Conectar agora", onCta: onNavigateProfile },
        { num: "03", done: false, disabled: true, title: "Primeiro upload", desc: "Agende um video e deixe o ViralCuts trabalhar por voce." },
    ];

    return (
        <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-muted)" }}>
                {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-.03em", lineHeight: 1.1 }}>
                Vamos comecar
            </h1>
            <p style={{ margin: "0 0 32px", fontSize: 15, color: "var(--text-muted)" }}>
                3 passos para ativar o ViralCuts no seu canal.
            </p>
            <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map(function(s) {
                    var borderColor = s.done ? "rgba(0,201,167,0.25)" : "var(--border-default)";
                    var bgColor = s.done ? "var(--accent-teal-3)" : "var(--bg-card)";
                    var opacity = s.disabled ? 0.4 : 1;
                    return (
                        <div key={s.num} style={{ display: "flex", gap: 16, padding: "18px 20px", borderRadius: "var(--radius-lg)", border: "1px solid " + borderColor, background: bgColor, opacity: opacity }}>
                            <div style={{ minWidth: 30, paddingTop: 2 }}>
                                {s.done ? <CheckCircle size={22} style={{ color: "var(--accent-teal)" }} /> : <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-muted)", lineHeight: 1 }}>{s.num}</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</p>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.desc}</p>
                                {s.cta && !s.disabled && (
                                    <button onClick={s.onCta} className="vc-btn vc-btn-primary btn-sm" style={{ marginTop: 12 }}>
                                        {s.cta} <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ConnectedDashboard({ user, state, supabase, navigate }) {
    var channelStats = state.channelStats;
    var uploadQueue = supabase.uploadQueue || state.uploadQueue || [];
    var history = supabase.history || state.history || {};

    var totalPublished = Object.values(history).reduce(function(acc, day) { return acc + (day?.completedItems?.length || 0); }, 0);
    var scheduledCount = uploadQueue.filter(function(v) { return v.scheduledAt; })?.length || 0;
    var subscribers = channelStats?.statistics?.subscriberCount ? formatNumber(Number(channelStats.statistics.subscriberCount)) : "\u2014";
    var totalViews = channelStats?.statistics?.viewCount ? formatNumber(Number(channelStats.statistics.viewCount)) : "\u2014";

    var recentVideos = useMemo(function() {
        if (state.recentUploads?.length) return state.recentUploads.slice(0, 4);
        var all = Object.entries(history)
            .sort(function(a, b) { return b[0].localeCompare(a[0]); })
            .flatMap(function(entry) { var day = entry[1]; var date = entry[0]; return (day?.completedItems || []).map(function(v) { return { ...v, date: date }; }); });
        return all.slice(0, 4);
    }, [state.recentUploads, history]);

    var insights = useMemo(function() {
        var tips = [];
        if (totalPublished < 3) tips.push({ icon: "\uD83C\uDFAF", text: "Publique ao menos 1 video por semana para ganhar tracao no algoritmo." });
        if (scheduledCount === 0) tips.push({ icon: "\uD83D\uDCC5", text: "Nenhum video agendado. Consistencia e o motor de crescimento." });
        if (uploadQueue.length > 0) tips.push({ icon: "\uD83D\uDE80", text: uploadQueue.length + " video(s) na fila aguardando otimizacao de metadados." });
        if (tips.length === 0) tips.push({ icon: "\u2728", text: "Canal com bom ritmo! Continue consistente para crescer." });
        return tips.slice(0, 3);
    }, [totalPublished, scheduledCount, uploadQueue.length]);

    var nextScheduled = uploadQueue
        .filter(function(v) { return v.scheduledAt; })
        .sort(function(a, b) { return new Date(a.scheduledAt) - new Date(b.scheduledAt); })[0];

    return (
        <div>
            <div className="vc-page-header" style={{ marginBottom: 24 }}>
                <div className="vc-page-header-text">
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: "var(--text-muted)" }}>
                        {getGreeting()}, {user?.name?.split(" ")[0] || "criador"}
                    </p>
                    <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.1 }}>Dashboard</h1>
                    {channelStats?.title && (
                        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--accent-amber)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-coral)", display: "inline-block", padding: 0 }} />
                            {channelStats.title}
                        </p>
                    )}
                </div>
                <div className="vc-page-actions">
                    <button onClick={function() { navigate("/dashboard/creation"); }} className="vc-btn vc-btn-secondary btn-sm">
                        <Sparkles size={12} /> Otimizar com IA
                    </button>
                    <button onClick={function() { navigate("/dashboard/videos"); }} className="vc-btn vc-btn-primary btn-sm">
                        <Upload size={12} /> Novo upload
                    </button>
                </div>
            </div>

            <div className="vc-grid-metrics mb-4">
                <div className="vc-metric-card"><div className="vc-metric-label">Visualizacoes</div><div className="vc-metric-value">{totalViews}</div></div>
                <div className="vc-metric-card"><div className="vc-metric-label">Inscritos</div><div className="vc-metric-value">{subscribers}</div></div>
                <div className="vc-metric-card"><div className="vc-metric-label">Na fila</div><div className="vc-metric-value">{uploadQueue.length}</div></div>
                <div className="vc-metric-card"><div className="vc-metric-label">Publicados</div><div className="vc-metric-value">{totalPublished}</div></div>
            </div>

            <PipelineCTABanner
                unscheduledCount={uploadQueue.filter(function(v) { return !v.scheduledAt; }).length}
                navigate={navigate}
            />

            <TodayTimeline uploadQueue={uploadQueue} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 296px", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ padding: "16px 20px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 0 }}>Fila de uploads</span>
                            <button onClick={function() { navigate("/dashboard/videos"); }}
                                style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-coral-2)", background: "none", border: "none", cursor: "pointer" }}>
                                Ver todos
                            </button>
                        </div>
                        {uploadQueue.length > 0
                            ? uploadQueue.slice(0, 3).map(function(item, i) { return <QueueItem key={item.id || i} item={item} onNavigate={function() { navigate("/dashboard/videos"); }} />; })
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                        <Rocket size={20} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--text-muted)" }}>Fila vazia</p>
                                    <button onClick={function() { navigate("/dashboard/videos"); }} className="vc-btn vc-btn-primary btn-sm">
                                        <Plus size={13} /> Adicionar video
                                    </button>
                                </div>
                            )}
                    </div>

                    <div style={{ padding: "16px 20px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 0 }}>Publicados recentemente</span>
                            <button onClick={function() { navigate("/dashboard/analytics"); }}
                                style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-coral-2)", background: "none", border: "none", cursor: "pointer" }}>
                                Ver analytics
                            </button>
                        </div>
                        {recentVideos.length > 0
                            ? recentVideos.map(function(v, i) { return <RecentVideoRow key={v.id || i} video={v} />; })
                            : (
                                <div style={{ textAlign: "center", padding: "28px 0" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                        <Video size={20} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>Nenhum video publicado ainda</p>
                                </div>
                            )}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {nextScheduled ? (
                        <div style={{ padding: "18px 20px", borderTop: "2px solid var(--accent-coral)" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 0 }}>Proximo upload</span>
                            <p style={{ margin: "8px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {nextScheduled.title}
                            </p>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 14 }}>
                                {nextScheduled.platform || "YouTube"} - {new Date(nextScheduled.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button onClick={function() { navigate("/dashboard/videos"); }} className="vc-btn vc-btn-secondary btn-sm" style={{ width: "100%" }}>
                                Gerenciar uploads
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Calendar size={18} style={{ color: "var(--text-muted)" }} />
                            </div>
                            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Sem uploads agendados</p>
                            <button onClick={function() { navigate("/dashboard/calendar"); }} className="vc-btn vc-btn-secondary btn-sm" style={{ width: "100%" }}>
                                Abrir calendario
                            </button>
                        </div>
                    )}

                    <div style={{ padding: "16px 20px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 0 }}>Insights do canal</span>
                        </div>
                        {insights.map(function(tip, i) { return <InsightTip key={i} tip={tip} />; })}
                    </div>

                    <button onClick={function() { navigate("/dashboard/analytics"); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BarChart2 size={16} style={{ color: "var(--accent-amber)" }} /> Analytics completos</div>
                        <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardHome() {
    var state = useDashboardState().state;
    var supabase = useSupabaseDashboard();
    var theme = useTheme().theme;
    var navigate = useNavigate();

    var hasYouTube = !!(
        (state.auth?.youtubeToken && state.auth?.youtubeTokenExpiresAt > Date.now()) ||
        state.auth?.connectedAccounts?.some(function(account) {
            return (account.platform || 'youtube') === 'youtube';
        })
    );
    var user = supabase.user;

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {hasYouTube
                ? <ConnectedDashboard user={user} state={state} supabase={supabase} navigate={navigate} />
                : <OnboardingState user={user} onNavigateProfile={function() { navigate("/dashboard/profile"); }} />
            }
        </PageLayout>
    );
}
