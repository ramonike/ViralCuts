import { User, Youtube, BarChart, Users, RefreshCw, Trash2, ChevronRight, Activity, Zap, ExternalLink } from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { Button } from "../components/ui/button";
import { GoogleAuthButton } from "../components/dashboard/GoogleAuthButton";
import { PageLayout } from "../components/layout/PageLayout";

export default function ProfilePage() {
    const { state, actions: dashboardActions } = useDashboardState();

    const { channelStats, auth } = state;
    const isConnected = auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now();
    const connectedAccounts = auth?.connectedAccounts || [];

    // Format large numbers
    const formatNumber = (num) => {
        if (!num) return "0";
        const n = parseInt(num);
        if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
        if (n >= 1000) return (n / 1000).toFixed(1) + "K";
        return n.toLocaleString();
    };

    return (
        <PageLayout
            title="Perfil e Conexões"
            subtitle="Gerencie seu perfil e conexões com plataformas."
        >
            {/* Main Grid Layout - 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column - Profile & Stats (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Profile Hero Card */}
                    {isConnected && channelStats ? (
                        <div className="relative glass-panel rounded-2xl overflow-hidden border border-surface-700/50 group">
                            {/* Banner */}
                            <div className="h-28 bg-gradient-to-br from-primary/20 via-surface-800 to-surface-900 relative overflow-hidden">
                                {channelStats?.brandingSettings?.image?.bannerExternalUrl && (
                                    <img
                                        src={channelStats.brandingSettings.image.bannerExternalUrl}
                                        alt="Banner"
                                        className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent" />
                            </div>

                            {/* Profile Content */}
                            <div className="relative px-6 pb-6">
                                {/* Avatar - positioned to overlap banner */}
                                <div className="flex items-end gap-4 -mt-10 mb-4">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-2xl border-4 border-surface-900 shadow-xl overflow-hidden bg-surface-800">
                                            {channelStats?.thumbnails ? (
                                                <img
                                                    src={channelStats.thumbnails.high?.url || channelStats.thumbnails.medium?.url || channelStats.thumbnails.default?.url}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const name = channelStats?.title || "User";
                                                        const colors = ['a3e635', '22d3ee', 'f472b6', 'fb923c', 'a78bfa'];
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[name.charCodeAt(0) % 5]}&color=fff&size=128&bold=true`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-3 border-surface-900 animate-pulse" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pb-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-xl font-bold text-white truncate">
                                                {channelStats?.title || "Seu Canal"}
                                            </h2>
                                            <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                <Zap className="w-3 h-3" /> PRO
                                            </span>
                                        </div>
                                        {channelStats?.customUrl && (
                                            <p className="text-sm text-slate-400 truncate">{channelStats.customUrl}</p>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 h-8 text-xs text-slate-400 hover:text-white"
                                        onClick={() => dashboardActions.refreshChannelStats()}
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar
                                    </Button>
                                </div>

                                {/* Description */}
                                {channelStats?.description && (
                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-5">
                                        {channelStats.description}
                                    </p>
                                )}

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30 hover:border-red-500/30 transition-colors group/stat">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className="w-4 h-4 text-red-400" />
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Inscritos</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatNumber(channelStats.statistics?.subscriberCount)}
                                        </p>
                                    </div>
                                    <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30 hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BarChart className="w-4 h-4 text-blue-400" />
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Views</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatNumber(channelStats.statistics?.viewCount)}
                                        </p>
                                    </div>
                                    <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30 hover:border-purple-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Youtube className="w-4 h-4 text-purple-400" />
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Vídeos</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatNumber(channelStats.statistics?.videoCount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State - No channel connected */
                        <div className="glass-panel rounded-2xl border border-dashed border-surface-600 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                                <Youtube className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Nenhum canal conectado</h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                                Conecte seu canal do YouTube para ver suas estatísticas e gerenciar uploads.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <GoogleAuthButton
                                    onLoginSuccess={dashboardActions.setYouTubeToken}
                                    onLoginError={(err) => alert("Falha no login: " + JSON.stringify(err))}
                                />
                                <button
                                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-xl transition-colors"
                                    onClick={() => dashboardActions.setYouTubeToken({ access_token: "MOCK_TOKEN_" + Date.now(), expires_in: 3600 })}
                                >
                                    Simular (Dev)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* API Usage Card */}
                    <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-surface-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Uso da API YouTube</h3>
                                    <p className="text-xs text-slate-500">Cota diária de requisições</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-white">
                                    {state.quota ? Math.round((state.quota.used / state.quota.limit) * 100) : 0}%
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    {state.quota?.used || 0} / {state.quota?.limit || 10000}
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <div className="w-full bg-surface-800 rounded-full h-2 mb-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        (state.quota?.used || 0) > 8000 ? 'bg-red-500' :
                                        (state.quota?.used || 0) > 5000 ? 'bg-yellow-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${Math.min(100, ((state.quota?.used || 0) / (state.quota?.limit || 10000)) * 100)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw className="w-3 h-3" />
                                    Renova à meia-noite (PT)
                                </span>
                                <span>
                                    {(() => {
                                        const now = new Date();
                                        const ptNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
                                        const ptMidnight = new Date(ptNow);
                                        ptMidnight.setHours(24, 0, 0, 0);
                                        const ms = ptMidnight - ptNow;
                                        return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Connections (1/3 width) */}
                <div className="space-y-6">
                    
                    {/* Connected Channels Card */}
                    <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-surface-700/30">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white">Canais Conectados</h3>
                                <span className="text-xs text-slate-500 bg-surface-800 px-2 py-0.5 rounded-full">
                                    {connectedAccounts.length}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-3 space-y-2">
                            {connectedAccounts.length > 0 ? (
                                <>
                                    {connectedAccounts.map(account => (
                                        <div 
                                            key={account.id} 
                                            className={`group p-3 rounded-lg transition-all ${
                                                auth.activeAccountId === account.id 
                                                    ? 'bg-primary/10 border border-primary/20' 
                                                    : 'bg-surface-800/50 border border-transparent hover:border-surface-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={account.avatar || "https://github.com/shadcn.png"} 
                                                    className="w-10 h-10 rounded-lg object-cover" 
                                                    alt={account.name}
                                                    onError={(e) => { e.target.src = "https://github.com/shadcn.png"; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{account.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {account.stats?.statistics?.subscriberCount 
                                                            ? formatNumber(account.stats.statistics.subscriberCount) + ' inscritos'
                                                            : 'YouTube'}
                                                    </p>
                                                </div>
                                                {auth.activeAccountId === account.id ? (
                                                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                        ATIVO
                                                    </span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-white"
                                                        onClick={() => dashboardActions.switchAccount(account.id)}
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {/* Disconnect button */}
                                            <div className="mt-2 pt-2 border-t border-surface-700/30">
                                                <button
                                                    className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (confirm("Desconectar este canal?")) {
                                                            dashboardActions.disconnectAccount(account.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Desconectar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-slate-500 mb-3">Nenhum canal conectado</p>
                                </div>
                            )}
                            
                            {/* Add Channel Button */}
                            <GoogleAuthButton
                                onLoginSuccess={dashboardActions.setYouTubeToken}
                                onLoginError={(err) => alert("Erro: " + JSON.stringify(err))}
                                text="+ Adicionar Canal"
                                className="w-full justify-center h-10 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Platform Status Card */}
                    <div className="glass-panel rounded-xl border border-surface-700/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-surface-700/30">
                            <h3 className="text-sm font-semibold text-white">Plataformas</h3>
                        </div>
                        
                        <div className="p-3 space-y-2">
                            {/* YouTube */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">YouTube</p>
                                    <p className="text-xs text-slate-500">Upload de vídeos</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                    isConnected 
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                        : 'bg-surface-700 text-slate-400'
                                }`}>
                                    {isConnected ? 'CONECTADO' : 'OFFLINE'}
                                </span>
                            </div>

                            {/* TikTok - Coming Soon */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/30 opacity-60">
                                <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-400">TikTok</p>
                                    <p className="text-xs text-slate-600">Em breve</p>
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 bg-surface-700 px-2 py-1 rounded">
                                    SOON
                                </span>
                            </div>

                            {/* Instagram - Coming Soon */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/30 opacity-60">
                                <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-400">Instagram</p>
                                    <p className="text-xs text-slate-600">Em breve</p>
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 bg-surface-700 px-2 py-1 rounded">
                                    SOON
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {isConnected && (
                        <div className="glass-panel rounded-xl border border-surface-700/50 p-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ações Rápidas</h3>
                            <div className="space-y-2">
                                <a 
                                    href="https://studio.youtube.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Abrir YouTube Studio
                                </a>
                                <button 
                                    onClick={() => dashboardActions.refreshChannelStats()}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Sincronizar dados
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
