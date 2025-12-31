import React from "react";
import { User, Zap } from "lucide-react";
import { useDashboardState } from "../../hooks/useDashboardState";

export function ChannelMiniCard() {
    const { state } = useDashboardState();
    const { channelStats, auth } = state;
    const isConnected = auth?.youtubeToken && auth?.youtubeTokenExpiresAt > Date.now();

    if (!isConnected || !channelStats) {
        return (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-300">Canal não conectado</p>
                        <p className="text-[10px] text-slate-500">Conecte sua conta</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 mb-2 hover:bg-slate-800/50 hover:border-primary/30 transition-all duration-200">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center ring-2 ring-primary/20">
                        {channelStats?.thumbnails ? (
                            <img
                                src={channelStats.thumbnails.default?.url || channelStats.thumbnails.medium?.url}
                                alt="Canal"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const channelName = channelStats?.title || "User";
                                    const colors = ['a3e635', '22d3ee', 'f472b6', 'fb923c', 'a78bfa', 'fbbf24'];
                                    const colorIndex = channelName.charCodeAt(0) % colors.length;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=${colors[colorIndex]}&color=fff&size=40&bold=true&font-size=0.4`;
                                }}
                            />
                        ) : (
                            <User className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                </div>

                {/* Channel Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                        <p className="text-xs font-bold text-white truncate">
                            {channelStats?.title || "Seu Canal"}
                        </p>
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-current flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                        {channelStats?.statistics?.subscriberCount 
                            ? `${parseInt(channelStats.statistics.subscriberCount).toLocaleString()} inscritos`
                            : "Publicando como..."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}