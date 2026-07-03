import {
    Home,
    Video,
    Settings,
    TrendingUp,
    LogOut,
    User,
    Sparkles,
    Sun,
    Moon,
    GitBranch,
    Youtube,
    ChevronRight,
} from 'lucide-react';
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
    const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    const initials = user?.name
        ? user.name
              .trim()
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'VC';

    const isActive = (path) =>
        path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(path);

    const navMain = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        {
            icon: GitBranch,
            label: 'Pipeline',
            path: '/dashboard/calendar',
            highlight: true,
        },
        { icon: Youtube, label: 'Canal', path: '/dashboard/videos' },
        { icon: Sparkles, label: 'Criação IA', path: '/dashboard/creation' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
    ];

    const navAccount = [
        { icon: User, label: 'Perfil', path: '/dashboard/profile' },
        { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
    ];

    return (
        <aside className="vc-sidebar">
            {/* ── Logo ── */}
            <div className="vc-logo">
                <div className="vc-logo-mark">
                    <span className="vc-logo-mark-text">VC</span>
                </div>
                <div className="vc-logo-info">
                    <span className="vc-logo-text">ViralCuts</span>
                    {plan && (
                        <span className="vc-logo-plan">
                            {plan.displayName?.toUpperCase() || 'FREE'}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Nav ── */}
            <nav className="vc-nav">
                {/* Seção principal */}
                <div className="vc-nav-section">
                    <span className="vc-nav-label">Menu</span>

                    {navMain.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        const isPipeline = item.highlight;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={[
                                    'vc-nav-item',
                                    active ? 'active' : '',
                                    !active && isPipeline ? 'pipeline-highlight' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                {/* Indicador lateral — dentro do item para não ser cortado */}
                                {active && <span className="vc-nav-indicator" />}

                                <span className="vc-nav-icon-wrap">
                                    <Icon size={16} />
                                </span>

                                <span className="vc-nav-item-label">{item.label}</span>

                                {isPipeline && !active && (
                                    <span className="vc-badge-core">CORE</span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Seção conta */}
                <div className="vc-nav-section">
                    <span className="vc-nav-label">Conta</span>

                    {navAccount.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`vc-nav-item${active ? ' active' : ''}`}
                            >
                                {active && <span className="vc-nav-indicator" />}
                                <span className="vc-nav-icon-wrap">
                                    <Icon size={16} />
                                </span>
                                <span className="vc-nav-item-label">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            {/* ── Footer ── */}
            <footer className="vc-sidebar-footer">
                {/* Tema */}
                <button
                    onClick={toggleTheme}
                    className="vc-footer-action"
                    title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                >
                    <span className="vc-nav-icon-wrap">
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </span>
                    <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
                </button>

                {/* Sair */}
                <button
                    onClick={handleSignOut}
                    className="vc-footer-action vc-footer-signout"
                    title="Sair da conta"
                >
                    <span className="vc-nav-icon-wrap">
                        <LogOut size={15} />
                    </span>
                    <span>Sair</span>
                </button>

                {/* Divisor */}
                <div className="vc-footer-divider" />

                {/* User chip */}
                <div className="vc-user-chip">
                    <div className="vc-avatar">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={initials}
                                style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    <div className="vc-user-info">
                        <span className="vc-user-name">
                            {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                        </span>

                        <div className="vc-user-meta">
                            {plan && (
                                <span
                                    className={`vc-plan-badge${isFree ? ' free' : ' pro'}`}
                                >
                                    {plan.displayName}
                                </span>
                            )}
                            <span className="vc-user-email">
                                {user?.email || ''}
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </aside>
    );
};

export default SidebarLeft;
