import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarLeft } from './SidebarLeft';
import { ChannelMiniCard } from '../shared/ChannelMiniCard';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export const DashboardLayout = () => {
    const { theme } = useTheme();
    const { user, loading } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.includes('/videos')) return 'Vídeos';
        if (path.includes('/calendar')) return 'Calendário';
        if (path.includes('/analytics')) return 'Analytics';
        if (path.includes('/profile')) return 'Perfil';
        if (path.includes('/settings')) return 'Configurações';
        return 'Dashboard';
    };
    
    return (
        <div className={`min-h-screen font-sans selection:bg-blue-500/30 ${
            isDark 
                ? 'bg-slate-950 text-slate-100' 
                : 'bg-gray-50 text-slate-900'
        }`}>
            {/* Mobile Header */}
            <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b ${
                isDark 
                    ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800' 
                    : 'bg-white/95 backdrop-blur-xl border-gray-200'
            }`}>
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <h1 className={`text-xl font-black tracking-tighter ${
                    isDark 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-blue-500' 
                        : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500'
                }`}>
                    ViralCuts
                </h1>
                
                <NotificationBadge />
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 z-50 
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isDark 
                    ? 'bg-slate-900 border-r border-slate-800' 
                    : 'bg-white border-r border-gray-200 shadow-lg lg:shadow-none'
                }
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className={`h-16 flex items-center justify-between px-4 border-b ${
                        isDark ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                        <h1 className={`text-2xl font-black tracking-tighter ${
                            isDark 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-blue-500' 
                                : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500'
                        }`}>
                            ViralCuts
                        </h1>
                        <div className="hidden lg:block">
                            <NotificationBadge />
                        </div>
                    </div>
                    
                    {/* User Profile Section */}
                    <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
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
                                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {user.name || 'Usuário'}
                                        </p>
                                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {user.email}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            Não conectado
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                            Faça login
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Channel Mini Card */}
                    <div className="p-4">
                        <ChannelMiniCard />
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex-1 px-4 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
                        <SidebarLeft />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64 min-h-screen">
                {/* Spacer for mobile header */}
                <div className="h-16 lg:hidden" />
                
                {/* Page Content */}
                <main className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
