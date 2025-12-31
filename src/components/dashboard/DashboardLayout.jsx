import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarLeft } from './SidebarLeft';
import { ChannelMiniCard } from '../shared/ChannelMiniCard';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export const DashboardLayout = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return (
        <div className={`min-h-screen flex font-sans selection:bg-blue-500/30 ${
            isDark 
                ? 'bg-slate-950 text-slate-100' 
                : 'bg-gray-50 text-slate-900'
        }`}>
            {/* Sidebar Fixa */}
            <aside className={`fixed inset-y-0 left-0 w-64 border-r z-50 hidden lg:block ${
                isDark 
                    ? 'border-slate-800 bg-slate-900/50 backdrop-blur-xl' 
                    : 'border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm'
            }`}>
                <div className="h-full flex flex-col p-4">
                    <div className="mb-4 px-2 flex items-center justify-between">
                        <h1 className={`text-2xl font-black tracking-tighter ${
                            isDark 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-blue-500' 
                                : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500'
                        }`}>
                            ViralCuts
                        </h1>
                        <NotificationBadge />
                    </div>
                    
                    {/* Channel Mini Card */}
                    <div className="mb-4">
                        <ChannelMiniCard />
                    </div>
                    
                    <SidebarLeft />
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex-1 lg:ml-64 flex flex-col">
                <main className="flex-1 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
