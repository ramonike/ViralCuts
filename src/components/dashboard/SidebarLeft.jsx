import { Home, Video, Calendar, Settings, TrendingUp, LogOut, HelpCircle, User, Sparkles, Upload, Sun, Moon } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const SidebarLeft = () => {
    const { signOut, user } = useAuth();
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

    const navItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: Video, label: 'Vídeos', path: '/dashboard/videos' },
        { icon: Sparkles, label: 'Criação IA', path: '/dashboard/creation' },
        { icon: Calendar, label: 'Calendário', path: '/dashboard/calendar' },
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
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={`vc-nav-item${active ? ' active' : ''}`}
                            >
                                <Icon className="nav-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>

                <div className="vc-nav-section">
                    <div className="vc-nav-label">Conta</div>
                    <NavLink
                        to="/dashboard/profile"
                        className={`vc-nav-item${isActive('/dashboard/profile') ? ' active' : ''}`}
                    >
                        <User className="nav-icon" />
                        <span>Perfil</span>
                    </NavLink>
                    <NavLink
                        to="/dashboard/settings"
                        className={`vc-nav-item${isActive('/dashboard/settings') ? ' active' : ''}`}
                    >
                        <Settings className="nav-icon" />
                        <span>Configurações</span>
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="vc-sidebar-footer">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="vc-nav-item"
                    style={{ width: '100%', marginBottom: 4 }}
                >
                    {isDark
                        ? <Sun className="nav-icon" />
                        : <Moon className="nav-icon" />
                    }
                    <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
                </button>

                {/* Logout */}
                <button
                    onClick={handleSignOut}
                    className="vc-nav-item"
                    style={{
                        width: '100%',
                        color: 'var(--accent-coral-2)',
                        marginBottom: 12,
                    }}
                >
                    <LogOut className="nav-icon" style={{ opacity: 1 }} />
                    <span>Sair</span>
                </button>

                {/* User chip */}
                <div className="vc-user-chip">
                    <div className="vc-avatar">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                        <div className="vc-user-name" style={{
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user?.name || 'Criador'}
                        </div>
                        <div className="vc-user-plan">Pro</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarLeft;
