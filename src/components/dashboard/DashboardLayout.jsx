import React, { useState } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { ChannelMiniCard } from '../shared/ChannelMiniCard';
import {
    Home, TrendingUp, Video, Sparkles, Calendar,
    User, Settings, HelpCircle, LogOut, Menu, X, Sun, Moon,
    Bell
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getUserInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_MAIN = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', exact: true },
    { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Video, label: 'Vídeos', path: '/dashboard/videos' },
    { icon: Sparkles, label: 'Criação IA', path: '/dashboard/creation' },
    { icon: Calendar, label: 'Calendário', path: '/dashboard/calendar' },
];

const NAV_ACCOUNT = [
    { icon: User, label: 'Perfil', path: '/dashboard/profile' },
    { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
];

// ─── SidebarContent ───────────────────────────────────────────────────────────
function SidebarContent({ user, loading, onSignOut, onClose, toggleTheme, isDark }) {
    const location = useLocation();
    const isActive = (path, exact) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    const NavItem = ({ item }) => {
        const Icon = item.icon;
        const active = isActive(item.path, item.exact);
        return (
            <NavLink
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={[
                    'vc-nav-item',
                    active ? 'active' : ''
                ].join(' ')}
            >
                <Icon className="nav-icon" size={17} />
                <span>{item.label}</span>
            </NavLink>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div className="vc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '18px 18px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="vc-logo-mark">VC</div>
                <span className="vc-logo-text">ViralCuts</span>
            </div>

            {/* User chip */}
            <div style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="vc-user-chip">
                    <div className="vc-avatar">
                        {loading ? (
                            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        ) : user?.image ? (
                            <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        ) : (
                            getUserInitials(user?.name)
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vc-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || 'Usuário'}
                        </div>
                        <div className="vc-user-plan">Pro</div>
                    </div>
                </div>
            </div>

            {/* Channel mini card */}
            <div style={{ padding: '10px 10px 0' }}>
                <ChannelMiniCard />
            </div>

            {/* Navigation */}
            <nav className="vc-nav" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                <div className="vc-nav-section">
                    <div className="vc-nav-label">Principal</div>
                    {NAV_MAIN.map(item => <NavItem key={item.path} item={item} />)}
                </div>
                <div className="vc-nav-section">
                    <div className="vc-nav-label">Conta</div>
                    {NAV_ACCOUNT.map(item => <NavItem key={item.path} item={item} />)}
                </div>
            </nav>

            {/* Footer */}
            <div className="vc-sidebar-footer">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="vc-nav-item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2 }}
                >
                    {isDark
                        ? <Sun className="nav-icon" size={17} />
                        : <Moon className="nav-icon" size={17} />
                    }
                    <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
                </button>

                <button
                    className="vc-nav-item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2 }}
                >
                    <HelpCircle className="nav-icon" size={17} />
                    <span>Ajuda</span>
                </button>

                <button
                    onClick={onSignOut}
                    className="vc-nav-item"
                    style={{
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--accent-coral)',
                    }}
                >
                    <LogOut size={17} style={{ opacity: 0.8 }} />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export const DashboardLayout = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isDark = theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    return (
        <div
            data-theme={isDark ? 'dark' : 'light'}
            style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
            }}
        >
            {/* ── Desktop sidebar ─────────────────────────────────── */}
            <aside
                className="vc-sidebar"
                style={{ display: 'none' }}
            // NOTE: mostrado via CSS acima de lg
            >
                {/* Renderizado apenas desktop — ver CSS .vc-sidebar */}
            </aside>

            {/* ── Sidebar — desktop (hidden mobile via CSS) ──────── */}
            <aside
                style={{
                    width: 220,
                    flexShrink: 0,
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0, left: 0, bottom: 0,
                    zIndex: 40,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    // oculto em mobile via media query inline abaixo
                }}
                className="vc-sidebar-desktop"
            >
                <SidebarContent
                    user={user}
                    loading={loading}
                    onSignOut={handleSignOut}
                    onClose={() => { }}
                    toggleTheme={toggleTheme}
                    isDark={isDark}
                />
            </aside>

            {/* ── Mobile header ──────────────────────────────────── */}
            <header
                className="vc-topbar-mobile"
                style={{
                    display: 'none', // mostrado via CSS em mobile
                    height: 52,
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    zIndex: 50,
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 12,
                }}
            >
                <button
                    onClick={() => setMobileOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                >
                    <Menu size={22} />
                </button>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="vc-logo-mark" style={{ width: 26, height: 26, fontSize: 11 }}>VC</div>
                        <span className="vc-logo-text" style={{ fontSize: '0.9375rem' }}>ViralCuts</span>
                    </div>
                </div>
                <NotificationBadge />
            </header>

            {/* ── Mobile drawer overlay ─────────────────────────── */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 48,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* ── Mobile drawer ─────────────────────────────────── */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0, left: 0, bottom: 0,
                    width: 260,
                    zIndex: 49,
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                    overflowY: 'auto',
                }}
            >
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <SidebarContent
                    user={user}
                    loading={loading}
                    onSignOut={handleSignOut}
                    onClose={() => setMobileOpen(false)}
                    toggleTheme={toggleTheme}
                    isDark={isDark}
                />
            </aside>

            {/* ── Main content ──────────────────────────────────── */}
            <div
                style={{
                    marginLeft: 220,
                    minHeight: '100vh',
                }}
                className="vc-main-content"
            >
                {/* Timeline bar — elemento-assinatura no topo */}
                <div style={{
                    height: 2,
                    background: 'linear-gradient(90deg, var(--accent-coral) 0%, var(--accent-amber) 55%, transparent 100%)',
                    animation: 'vc-timeline-pulse 3s ease-in-out infinite',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                }} />

                <main style={{ padding: '28px 28px', maxWidth: 1320 }}>
                    <Outlet />
                </main>
            </div>

            {/* ── Responsive CSS injetado ──────────────────────── */}
            <style>{`
                @keyframes vc-timeline-pulse {
                    0%, 100% { opacity: 0.65; }
                    50%       { opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }

                /* Desktop: sidebar visível, mobile header oculto */
                @media (min-width: 768px) {
                    .vc-sidebar-desktop { display: flex !important; }
                    .vc-topbar-mobile   { display: none !important; }
                    .vc-main-content    { margin-left: 220px !important; }
                }

                /* Mobile: sidebar oculta, topbar visível */
                @media (max-width: 767px) {
                    .vc-sidebar-desktop { display: none !important; }
                    .vc-topbar-mobile   { display: flex !important; }
                    .vc-main-content    { margin-left: 0 !important; padding-top: 52px; }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;