/**
 * AdminPage — v2
 * Design system ViralCuts + dados reais de sessão, YouTube e uploads
 */
import React, { useState, useEffect, useCallback } from "react";
import {
    User, Search, Mail, CheckCircle2, XCircle, Calendar,
    RefreshCw, ChevronLeft, ChevronRight, Youtube, Upload,
    Clock, Wifi, WifiOff, Shield, Activity, TrendingUp
} from "lucide-react";
import { AdminBetaRequests } from '../components/dashboard/AdminBetaRequests';

// ─── API ──────────────────────────────────────────────────────────────────────
import { API_URL } from "../config/api";

async function fetchAdminUsers(page = 1, pageSize = 20, search = "") {
    const params = new URLSearchParams({ page, pageSize, ...(search && { search }) });
    const res = await fetch(`${API_URL}/api/admin/users?${params}`, { credentials: "include" });
    if (!res.ok) throw new Error("Falha ao buscar usuários");
    return res.json();
}

async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/api/admin/stats`, { credentials: "include" });
    if (!res.ok) throw new Error("Falha ao buscar stats");
    return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }) : "—";

const formatRelative = (d) => {
    if (!d) return "—";
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (min < 2) return "Agora mesmo";
    if (min < 60) return `há ${min}min`;
    if (h < 24) return `há ${h}h`;
    if (days < 7) return `há ${days}d`;
    return formatDate(d);
};

// ─── Session Status Badge ─────────────────────────────────────────────────────
function SessionBadge({ status, lastSeenAt }) {
    const map = {
        online: { badge: "vc-badge-teal", icon: <Wifi size={10} />, label: "Online" },
        recent: { badge: "vc-badge-amber", icon: <Clock size={10} />, label: formatRelative(lastSeenAt) },
        offline: { badge: "vc-badge-muted", icon: <WifiOff size={10} />, label: "Offline" },
    };
    const s = map[status] || map.offline;
    return (
        <span className={`vc-badge ${s.badge}`} style={{ gap: 4 }}>
            {s.icon} {s.label}
        </span>
    );
}

// ─── YouTube Accounts Cell ────────────────────────────────────────────────────
function YouTubeCell({ accounts }) {
    if (!accounts?.length) return (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>
    );
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {accounts.map((acc) => (
                <div key={acc.channelId} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: "0.75rem",
                }}>
                    <div className={`vc-platform-dot ${acc.connected ? "youtube" : ""}`}
                        style={!acc.connected ? { background: "var(--text-muted)" } : {}}
                    />
                    <span style={{
                        color: acc.connected ? "var(--text-primary)" : "var(--text-muted)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        maxWidth: 140,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {acc.channelName}
                    </span>
                    {!acc.connected && (
                        <span className="vc-badge vc-badge-coral" style={{ fontSize: "0.5rem", padding: "1px 4px" }}>
                            Expirado
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function AdminStat({ icon: Icon, label, value, accent = "neutral", sub }) {
    return (
        <div className={`vc-metric-card metric-${accent}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: "var(--radius-md)",
                    background: "var(--bg-elevated)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={15} style={{
                        color: accent === "coral" ? "var(--accent-coral)"
                            : accent === "amber" ? "var(--accent-amber)"
                                : accent === "teal" ? "var(--accent-teal)"
                                    : "var(--text-muted)"
                    }} />
                </div>
                <span className="vc-metric-label" style={{ marginBottom: 0 }}>{label}</span>
            </div>
            <div className="vc-metric-value">{value ?? "—"}</div>
            {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoad, setStatsLoad] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [adminTab, setAdminTab] = useState('users');
    const [pendingCount, setPendingCount] = useState(0);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAdminUsers(page, pageSize, search);
            setUsers(data.users);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const loadStats = useCallback(async () => {
        try {
            setStatsLoad(true);
            const data = await fetchAdminStats();
            setStats(data);
        } catch { /* silencioso */ }
        finally { setStatsLoad(false); }
    }, []);

    const loadPendingCount = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/beta/requests?status=pending`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.requests?.length ?? 0);
            }
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadStats(); }, [loadStats]);
    useEffect(() => { loadPendingCount(); }, [loadPendingCount]);

    const initials = (name = "") =>
        name.trim().split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "?";

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="vc-card" style={{ padding: "20px 24px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent-coral)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: "var(--radius-md)",
                                    background: "var(--accent-coral-3)",
                                    border: "1px solid rgba(232,65,42,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Shield size={18} style={{ color: "var(--accent-coral)" }} />
                                </div>
                                <h1 style={{
                                    margin: 0, fontFamily: "var(--font-display)", fontWeight: 700,
                                    fontSize: "1.5rem", letterSpacing: "-0.03em", color: "var(--text-primary)",
                                }}>
                                    Painel de Administração
                                </h1>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                Gerencie todos os usuários cadastrados na plataforma
                            </p>
                        </div>
                        <button
                            onClick={() => { loadUsers(); loadStats(); loadPendingCount(); }}
                            className="vc-btn vc-btn-secondary vc-btn-sm"
                        >
                            <RefreshCw size={14} /> Atualizar
                        </button>
                    </div>

                    {/* ── Tabs ──────────────────────────────────────── */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={() => setAdminTab('users')}
                            className={`vc-btn vc-btn-sm ${adminTab === 'users' ? 'vc-btn-primary' : 'vc-btn-secondary'}`}
                        >
                            <User size={14} /> Usuários
                        </button>
                        <button
                            onClick={() => setAdminTab('beta')}
                            className={`vc-btn vc-btn-sm ${adminTab === 'beta' ? 'vc-btn-primary' : 'vc-btn-secondary'}`}
                        >
                            Beta Requests {pendingCount > 0 && `(${pendingCount})`}
                        </button>
                    </div>
                </div>

                {/* ── Tab: Beta Requests ─────────────────────────── */}
                {adminTab === 'beta' && <AdminBetaRequests />}

                {/* ── Tab: Usuários ──────────────────────────────── */}
                {adminTab === 'users' && (
                <>
                {/* ── Stats ──────────────────────────────────────────── */}
                <div className="vc-grid-metrics">
                    <AdminStat icon={User} label="Total usuários" value={statsLoad ? "…" : stats?.totalUsers} accent="coral" />
                    <AdminStat icon={Wifi} label="Online agora" value={statsLoad ? "…" : stats?.onlineNow} accent="teal" sub="sessões ativas" />
                    <AdminStat icon={Youtube} label="YouTube conectado" value={statsLoad ? "…" : stats?.youtubeConnected} accent="amber" sub="canais vinculados" />
                    <AdminStat icon={Upload} label="Total uploads" value={statsLoad ? "…" : stats?.totalUploads} accent="neutral" />
                    <AdminStat icon={CheckCircle2} label="Email verificado" value={statsLoad ? "…" : stats?.verifiedUsers} accent="teal" />
                    <AdminStat icon={XCircle} label="Pendente verificação" value={statsLoad ? "…" : stats?.pendingUsers} accent="neutral" />
                </div>

                {/* ── Search ─────────────────────────────────────────── */}
                <div className="vc-card" style={{ padding: "14px 16px" }}>
                    <div className="vc-input-wrap">
                        <Search size={15} className="vc-input-icon-left" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="vc-input has-icon-left"
                        />
                    </div>
                </div>

                {/* ── Table ──────────────────────────────────────────── */}
                <div className="vc-card" style={{ overflow: "hidden", padding: 0 }}>
                    {/* Traço coral */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent-coral)" }} />

                    {loading ? (
                        <div style={{ padding: "56px 0", textAlign: "center" }}>
                            <RefreshCw size={24} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite", marginBottom: 12 }} />
                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>Carregando usuários...</p>
                        </div>
                    ) : error ? (
                        <div style={{ padding: "56px 0", textAlign: "center" }}>
                            <XCircle size={24} style={{ color: "var(--accent-coral)", marginBottom: 12 }} />
                            <p style={{ margin: 0, color: "var(--accent-coral)", fontSize: "0.875rem" }}>{error}</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ padding: "56px 0", textAlign: "center" }}>
                            <User size={24} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>Nenhum usuário encontrado</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <table className="vc-table">
                                    <thead>
                                        <tr>
                                            {["Usuário", "Email", "Status email", "Sessão", "YouTube / Canais", "Uploads", "Cadastro"].map(h => (
                                                <th key={h}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                {/* Usuário */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div className="vc-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                                                            {initials(user.name)}
                                                        </div>
                                                        <div>
                                                            <p style={{
                                                                margin: 0, fontFamily: "var(--font-display)", fontWeight: 600,
                                                                fontSize: "0.875rem", color: "var(--text-primary)", letterSpacing: "-0.01em",
                                                            }}>{user.name}</p>
                                                            <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                                {user.id.substring(0, 10)}…
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Mail size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status email */}
                                                <td>
                                                    {user.emailVerified ? (
                                                        <span className="vc-badge vc-badge-teal">
                                                            <CheckCircle2 size={10} /> Verificado
                                                        </span>
                                                    ) : (
                                                        <span className="vc-badge vc-badge-amber">
                                                            <XCircle size={10} /> Pendente
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Sessão real */}
                                                <td>
                                                    <SessionBadge
                                                        status={user.sessionStatus}
                                                        lastSeenAt={user.lastSeenAt}
                                                    />
                                                </td>

                                                {/* YouTube */}
                                                <td>
                                                    <YouTubeCell accounts={user.youtubeAccounts} />
                                                </td>

                                                {/* Uploads */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Upload size={13} style={{ color: "var(--text-muted)" }} />
                                                        <span style={{
                                                            fontFamily: "var(--font-display)", fontWeight: 700,
                                                            fontSize: "0.9375rem", color: "var(--text-primary)",
                                                            letterSpacing: "-0.02em",
                                                        }}>
                                                            {user.totalUploads}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Cadastro */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                                                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                                                            {formatDate(user.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginação */}
                            {totalPages > 1 && (
                                <div style={{
                                    padding: "12px 16px",
                                    borderTop: "1px solid var(--border-subtle)",
                                    background: "var(--bg-tertiary)",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}>
                                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                                        Página {page} de {totalPages} · {total} usuários
                                    </p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="vc-btn vc-btn-secondary vc-btn-sm"
                                            style={{ opacity: page === 1 ? 0.4 : 1 }}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="vc-btn vc-btn-secondary vc-btn-sm"
                                            style={{ opacity: page === totalPages ? 0.4 : 1 }}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                </>
                )}

            </div>
        </div>
    );
}
