import { Home, Video, Calendar, Settings, TrendingUp, LogOut, HelpCircle, User } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const SidebarLeft = () => {
    const { user, loading, signOut } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login', { replace: true });
    };
    
    const menuItems = [
        { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Video className="w-5 h-5" />, label: 'Vídeos', path: '/dashboard/videos' },
        { icon: <Calendar className="w-5 h-5" />, label: 'Calendário', path: '/dashboard/calendar' },
        { icon: <TrendingUp className="w-5 h-5" />, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: <User className="w-5 h-5" />, label: 'Perfil', path: '/dashboard/profile' },
    ];

    // Check if a path is active
    const isPathActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex-1 flex flex-col">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Menu Principal
            </h3>
            <nav className="space-y-1">
                {menuItems.map((item, index) => {
                    const isActive = isPathActive(item.path);
                    return (
                        <NavLink
                            key={index}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                                transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? isDark 
                                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-blue-400 border-l-2 border-blue-400'
                                        : 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 border-l-2 border-purple-500'
                                    : isDark 
                                        ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
                                }
                            `}
                        >
                            <span className={isActive ? (isDark ? 'text-blue-400' : 'text-purple-600') : ''}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto pt-6 space-y-1">
                <div className={`h-px mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                
                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                                ? isDark 
                                    ? 'bg-slate-800 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                : isDark 
                                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                    }
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Configurações</span>
                </NavLink>
                
                <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Ajuda</span>
                </button>
                
                <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isDark 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-red-500 hover:bg-red-50'
                    }`}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Sair</span>
                </button>
            </div>
        </div>
    );
};

export default SidebarLeft;
