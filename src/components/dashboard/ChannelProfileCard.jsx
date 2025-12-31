import React from "react";
import { Youtube, Users, Eye, Video } from "lucide-react";

export function ChannelProfileCard({ channelStats, auth }) {
    const activeAccount = auth?.connectedAccounts?.find(acc => acc.id === auth?.activeAccountId);

    if (!channelStats && !activeAccount) return null;

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                    {channelStats?.thumbnails?.default?.url || activeAccount?.avatar ? (
                        <img
                            src={channelStats?.thumbnails?.default?.url || activeAccount?.avatar}
                            alt="Channel Avatar"
                            className="w-16 h-16 rounded-full ring-4 ring-primary/30 shadow-lg"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-4 ring-primary/30 shadow-lg">
                            <Youtube className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Channel Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">
                            {channelStats?.title || activeAccount?.name || "Seu Canal"}
                        </h2>
                        {channelStats?.customUrl && (
                            <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-full text-xs text-primary font-medium">
                                {channelStats.customUrl}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400">
                        {channelStats?.description?.substring(0, 100) || "Canal do YouTube conectado"}
                        {channelStats?.description?.length > 100 && "..."}
                    </p>
                </div>

                {/* Stats */}
                {channelStats?.statistics && (
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-medium">Inscritos</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                                {parseInt(channelStats.statistics.subscriberCount || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="w-px h-12 bg-slate-700" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">Visualizações</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                                {parseInt(channelStats.statistics.viewCount || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="w-px h-12 bg-slate-700" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                <Video className="w-4 h-4" />
                                <span className="text-xs font-medium">Vídeos</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                                {parseInt(channelStats.statistics.videoCount || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
