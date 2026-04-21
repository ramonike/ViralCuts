import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { CreatorJourney } from "../components/journey/CreatorJourney";
import { SharedUploadQueue } from "../components/shared/SharedUploadQueue";
import { PageLayout } from "../components/layout/PageLayout";
import { useTheme } from "../contexts/ThemeContext";
import { 
    DailyCommandCenter, 
    useSystemSwitcher,
} from "../components/command-center";
import { Sparkles, Rocket, Calendar, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

// Error Boundary for Dashboard
class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[DashboardHome] Error caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-slate-100 mb-2">
                                    Erro no Dashboard
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    {this.state.error?.message || 'Ocorreu um erro inesperado.'}
                                </p>
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false, error: null });
                                        window.location.reload();
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Recarregar Página
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function DashboardHome() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { isCommandCenter } = useSystemSwitcher();
    const { theme } = useTheme();
    
    // Debug logging
    console.log('[DashboardHome] Render - isCommandCenter:', isCommandCenter, 'supabase.loading:', supabase.loading);
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Get time-based greeting (Subtask 3.1)
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    // Format date in Portuguese (Subtask 3.1)
    const getFormattedDate = () => {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('pt-BR', options);
    };

    // Get user initials for avatar fallback (Subtask 3.3)
    const getUserInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Hybrid actions: Use Supabase when available, fallback to localStorage
    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.addToQueue(item);
                } catch (error) {
                    console.error('Supabase upload failed, falling back to localStorage:', error);
                    actions.addToUploadQueue(item);
                }
            } else {
                actions.addToUploadQueue(item);
            }
        },
        updateSettings: async (newSettings) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.saveSettings(newSettings);
                } catch (error) {
                    console.error('Supabase settings save failed, falling back to localStorage:', error);
                    actions.updateSettings(newSettings);
                }
            } else {
                actions.updateSettings(newSettings);
            }
        }
    };

    // Render Daily Command Center if active system is command-center
    // Requirements: 9.2, 9.4 - Feature flag system for gradual rollout
    if (isCommandCenter) {
        return (
            <DashboardErrorBoundary>
                <PageLayout maxWidth="7xl" spacing="standard">
                    <DailyCommandCenter
                        user={supabase.user}
                        userSettings={state.settings}
                        uploadQueueHook={{
                            uploadQueue: state.uploadQueue,
                            addToUploadQueue: hybridActions.addToUploadQueue,
                            removeQueueItem: actions.removeQueueItem,
                            markQueueStatus: actions.markQueueStatus,
                            startUploadQueue: actions.startUploadQueue,
                            rescheduleVideo: actions.rescheduleVideo,
                            updateVideoMetadata: actions.updateVideoMetadata,
                        }}
                        settingsHook={{
                            settings: state.settings,
                            updateSettings: hybridActions.updateSettings,
                        }}
                        token={supabase.user?.access_token}
                    />
                </PageLayout>
            </DashboardErrorBoundary>
        );
    }

    // Quick stats for the dashboard
    const quickStats = [
        { 
            icon: <Rocket className="w-5 h-5" />, 
            label: 'Vídeos na Fila', 
            value: state.uploadQueue?.length || 0,
            color: 'blue'
        },
        { 
            icon: <Calendar className="w-5 h-5" />, 
            label: 'Agendados', 
            value: state.uploadQueue?.filter(v => v.scheduledAt)?.length || 0,
            color: 'purple'
        },
        { 
            icon: <TrendingUp className="w-5 h-5" />, 
            label: 'Publicados', 
            value: Object.values(state.history || {}).reduce((acc, day) => acc + (day?.completedItems?.length || 0), 0),
            color: 'green'
        },
    ];

    // Default: Render original Creator Journey layout with improved design
    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {/* Welcome Header - Subtasks 3.1, 3.2, 3.3, 3.4, 8.5: Mobile-optimized */}
            <div className={`rounded-2xl p-4 md:p-6 mb-4 md:mb-6 ${
                isDark 
                    ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 shadow-lg shadow-slate-900/50' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm'
            }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                    {/* Left side: Avatar and Greeting */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Avatar with fallback to initials (Subtask 3.3) */}
                        <div className="relative">
                            {supabase.user?.image ? (
                                <img 
                                    src={supabase.user.image} 
                                    alt={supabase.user.name || 'User'}
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ${
                                        isDark ? 'ring-slate-700/50' : 'ring-gray-200'
                                    }`}
                                />
                            ) : (
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold ring-2 ${
                                    isDark 
                                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white ring-slate-700/50' 
                                        : 'bg-gradient-to-br from-purple-400 to-blue-400 text-white ring-gray-200'
                                }`}>
                                    {getUserInitials(supabase.user?.name)}
                                </div>
                            )}
                        </div>
                        
                        {/* Greeting and Date */}
                        <div>
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <Sparkles className={`w-4 h-4 md:w-5 md:h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {getGreeting()}!
                                </span>
                            </div>
                            <h1 className={`text-xl md:text-2xl font-bold mb-0.5 md:mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {supabase.user?.name ? `${supabase.user.name.split(' ')[0]}` : 'Seu Dashboard'}
                            </h1>
                            <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} capitalize`}>
                                {getFormattedDate()}
                            </p>
                        </div>
                    </div>
                    
                    {/* Quick Stats - Hidden on mobile (Subtask 3.4, 8.5) */}
                    <div className="hidden md:flex items-center gap-4">
                        {quickStats.map((stat, idx) => (
                            <div 
                                key={idx}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                                    isDark 
                                        ? 'bg-slate-800/50 border border-slate-700/50' 
                                        : 'bg-white border border-gray-200 shadow-sm'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${
                                    stat.color === 'blue' 
                                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                        : stat.color === 'purple'
                                        ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                                        : isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                                }`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                        {stat.label}
                                    </p>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Mobile Stats - Simplified for mobile (Subtask 3.4, 8.5) */}
                <div className="md:hidden grid grid-cols-3 gap-2 md:gap-3 mt-3 md:mt-4">
                    {quickStats.map((stat, idx) => (
                        <div 
                            key={idx}
                            className={`flex flex-col items-center p-2.5 md:p-3 rounded-xl ${
                                isDark 
                                    ? 'bg-slate-800/50 border border-slate-700/50' 
                                    : 'bg-white border border-gray-200'
                            }`}
                        >
                            <div className={`p-1.5 md:p-2 rounded-lg mb-1.5 md:mb-2 ${
                                stat.color === 'blue' 
                                    ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                    : stat.color === 'purple'
                                    ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                                    : isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            }`}>
                                {stat.icon}
                            </div>
                            <p className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stat.value}
                            </p>
                            <p className={`text-xs text-center leading-tight ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Grid - Subtask 8.1: Mobile-first responsive layout */}
            <div className="w-full">
                {/* Jornada do Criador */}
                <div className={`rounded-2xl overflow-hidden max-w-4xl mx-auto ${
                    isDark 
                        ? 'bg-slate-800/50 border border-slate-700/50' 
                        : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                    <CreatorJourney />
                </div>
            </div>
        </PageLayout>
    );
}
