import { Home, Video, Calendar, Settings, TrendingUp, LogOut, HelpCircle, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const SidebarLeft = () => {
    const { user, loading, signOut } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const handleSignOut = async () => {
        await signOut();
        localStorage.clear();
        navigate('/login', { replace: true });
    };
    
    const menuItems = [
        { icon: <Home className="w-4 h-4" />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Video className="w-4 h-4" />, label: 'Criação e Vídeos', path: '/dashboard/videos' },
        { icon: <Calendar className="w-4 h-4" />, label: 'Calendário', path: '/dashboard/calendar' },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: <User className="w-4 h-4" />, label: 'Perfil e Conexões', path: '/dashboard/profile' },
    ];

    return (
        <div className={`rounded-xl p-4 ${
            isDark 
                ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
                : 'bg-white border border-gray-200 shadow-sm'
        }`}>
            {/* User Profile Section */}
            <div className={`mb-4 pb-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : user?.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <>
                                <div className={`h-4 rounded w-24 mb-1 animate-pulse ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                                <div className={`h-3 rounded w-32 animate-pulse ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                            </>
                        ) : user ? (
                            <>
                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name || 'Usuário'}</p>
                                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                            </>
                        ) : (
                            <>
                                <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Canal não conectado</p>
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Faça login para continuar</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <h3 className={`text-xs font-semibold uppercase mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Menu</h3>
            <nav className="space-y-1">
                {menuItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                    ? isDark 
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                                        : 'bg-purple-50 text-purple-600 border border-purple-200'
                                    : isDark 
                                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="text-sm font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto pt-6 space-y-1">
                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                                ? isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'
                                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                    }
                >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-semibold">Ajustes</span>
                </NavLink>
                <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Suporte</span>
                </button>
                <div className={`h-px my-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sair</span>
                </button>
            </div>
        </div>
    );
};

export default SidebarLeft;
