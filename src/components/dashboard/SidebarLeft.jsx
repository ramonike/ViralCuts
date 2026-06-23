import { Home, Video, Settings, TrendingUp, LogOut, User, Sparkles, Sun, Moon, GitBranch, Youtube } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const SidebarLeft = () => {
    const { signOut, user } = useAuth();
    const { plan, isFree } = useSubscription();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    const initials = user?.name
        ? user.name.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'VC';

    const isActive = (path) =>
        path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(path);

    // Pipeline está em destaque — é o coração do produto
    const navMain = [
        { icon: Home,       label: 'Dashboard',  path: '/dashboard' },
        {
            icon: GitBranch,
            label: 'Pipeline',       // era "Calendário"
            path: '/dashboard/calendar',
            highlight: true,         // acento visual especial
        },
        { icon: Youtube,     label: 'Canal',      path: '/dashboard/videos' },
        { icon: Sparkles,   label: 'Criação IA', path: '/dashboard/creation' },
        { icon: TrendingUp, label: 'Analytics',  path: '/dashboard/analytics' },
    ];

    const navAccount = [
        { icon: User,     label: 'Perfil',          path: '/dashboard/profile' },
        { icon: Settings, label: 'Configurações',    path: '/dashboard/settings' },
    ];

    return (
        <div className="vc-sidebar">
            {/* Logo */}
            <div className="vc-logo">
                <div className="vc-logo-mark">VC</div>
                <span className="vc-logo-text">ViralCuts</span>
            </div>

            {/* Nav */}
            <nav className="vc-nav">
                <div className="vc-nav-section">
                    <div className="vc-nav-label">Menu</div>

                    {navMain.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;

                        // Pipeline tem tratamento especial quando inativo —
                        // um leve destaque âmbar para chamar atenção
                        const isPipeline = item.highlight;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={`vc-nav-item${active ? ' active' : ''}`}
                                style={!active && isPipeline ? {
                                    color: 'var(--accent-amber)',
                                    background: 'var(--accent-amber-3)',
                                    borderColor: 'rgba(240,165,0,0.15)',
                                } : {}}
                            >
                                <Icon
                                    className="nav-icon"
                                    style={!active && isPipeline ? { color: 'var(--accent-amber)', opacity: 1 } : {}}
                                />
                                <span>{item.label}</span>

                                {/* Badge "core" no Pipeline quando não está ativo */}
                                {isPipeline && !active && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.5625rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-display)',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        color: 'var(--accent-amber)',
                                        background: 'rgba(240,165,0,0.15)',
                                        border: '1px solid rgba(240,165,0,0.25)',
                                        padding: '1px 5px',
                                        borderRadius: 3,
                                    }}>
                                        Core
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                <div className="vc-nav-section">
                    <div className="vc-nav-label">Conta</div>
                    {navAccount.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`vc-nav-item${isActive(item.path) ? ' active' : ''}`}
                            >
                                <Icon className="nav-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="vc-sidebar-footer">
                <button onClick={toggleTheme} className="vc-nav-item" style={{ width: '100%', marginBottom: 4 }}>
                    {isDark ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
                    <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
                </button>

                <button onClick={handleSignOut} className="vc-nav-item"
                    style={{ width: '100%', color: 'var(--accent-coral-2)', marginBottom: 12 }}>
                    <LogOut className="nav-icon" style={{ opacity: 1 }} />
                    <span>Sair</span>
                </button>

                <div className="vc-user-chip">
                    <div className="vc-avatar">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                        <div className="vc-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            {plan && (
                                <span style={{
                                    fontSize: '0.5625rem', fontWeight: 700,
                                    fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: isFree ? 'var(--text-muted)' : 'var(--accent-amber)',
                                    background: isFree ? 'var(--bg-elevated)' : 'var(--accent-amber-3)',
                                    border: `1px solid ${isFree ? 'var(--border-subtle)' : 'rgba(240,165,0,0.25)'}`,
                                    padding: '1px 5px', borderRadius: 3,
                                }}>
                                    {plan.displayName}
                                </span>
                            )}
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email || ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarLeft;
