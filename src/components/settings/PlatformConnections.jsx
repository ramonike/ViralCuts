/**
 * Platform Connections Component
 * Manages connections to YouTube, TikTok, and Instagram
 * Requirements: 1.4, 2.4
 */

import { useState, useEffect } from "react";
import { 
  Link2, 
  Unlink, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Youtube,
  Music2,
  Instagram
} from "lucide-react";
import { Button } from "../ui/button";
import { useDashboardState } from "../../hooks/useDashboardState";

// Platform configuration
const PLATFORMS = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "red",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
    description: "Upload vídeos e Shorts para o YouTube",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    color: "pink",
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-400",
    borderColor: "border-pink-500/30",
    description: "Publique vídeos curtos no TikTok",
  },
  instagram: {
    id: "instagram",
    name: "Instagram Reels",
    icon: Instagram,
    color: "purple",
    bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    description: "Compartilhe Reels no Instagram",
  },
};

/**
 * Individual Platform Card Component
 */
function PlatformCard({ platform, connection, onConnect, onDisconnect, onRefresh, isLoading }) {
  const config = PLATFORMS[platform];
  const Icon = config.icon;
  const isConnected = !!connection;
  const isExpired = connection?.isExpired;

  return (
    <div className={`glass-panel rounded-xl border ${isConnected ? config.borderColor : 'border-surface-700/50'} overflow-hidden transition-all hover:border-surface-600`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{config.name}</h4>
              <p className="text-xs text-slate-500">{config.description}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          {isConnected && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
              isExpired 
                ? 'bg-amber-500/10 text-amber-400' 
                : 'bg-green-500/10 text-green-400'
            }`}>
              {isExpired ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Expirado
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Conectado
                </>
              )}
            </div>
          )}
        </div>

        {/* Connected Account Info */}
        {isConnected && connection.accountName && (
          <div className="mb-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <div className="flex items-center gap-3">
              {connection.avatar ? (
                <img 
                  src={connection.avatar} 
                  alt={connection.accountName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.textColor}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {connection.accountName}
                </p>
                {connection.accountId && (
                  <p className="text-xs text-slate-500 truncate">
                    ID: {connection.accountId}
                  </p>
                )}
              </div>
              {connection.profileUrl && (
                <a 
                  href={connection.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              {isExpired && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefresh(platform)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Reconectar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisconnect(platform, connection.accountId)}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConnect(platform)}
              disabled={isLoading || platform === 'instagram'}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              {platform === 'instagram' ? 'Em breve' : 'Conectar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Platform Connections Component
 */
export default function PlatformConnections() {
  // Get YouTube accounts from dashboard state
  const { state, actions } = useDashboardState();
  const { auth, channelStats } = state;
  const connectedAccounts = auth?.connectedAccounts || [];
  
  const [tiktokAccounts, setTiktokAccounts] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  // Fetch TikTok accounts on mount
  useEffect(() => {
    fetchTikTokAccounts();
  }, []);

  // Check URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // TikTok callback handling
    if (params.get('tiktok_connected') === 'true') {
      const accountName = params.get('account');
      setError(null);
      fetchTikTokAccounts();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // If popup, notify parent and close
      if (window.opener) {
        window.opener.postMessage({ type: 'tiktok_connected', account: accountName }, '*');
        setTimeout(() => window.close(), 100);
      }
    }
    
    if (params.get('tiktok_error')) {
      const errorMsg = params.get('tiktok_error');
      setError(`TikTok: ${errorMsg}`);
      window.history.replaceState({}, '', window.location.pathname);
      
      // If popup, notify parent and close
      if (window.opener) {
        window.opener.postMessage({ type: 'tiktok_error', error: errorMsg }, '*');
        setTimeout(() => window.close(), 100);
      }
    }
  }, []);

  const fetchTikTokAccounts = async () => {
    try {
      const response = await fetch('/api/tiktok/accounts', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTiktokAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch TikTok accounts:', err);
    }
  };

  const handleConnect = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    setError(null);

    try {
      if (platform === 'youtube') {
        // Trigger Google OAuth - this would typically open a popup or redirect
        // For now, show a message that this should be done via the Google button
        setError('Use o botão "Conectar com Google" no painel lateral para conectar o YouTube.');
      } else if (platform === 'tiktok') {
        // Get TikTok auth URL and redirect
        const response = await fetch('/api/tiktok/auth/url', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Falha ao obter URL de autenticação');
        }
        
        const data = await response.json();
        window.location.href = data.url;
      } else if (platform === 'instagram' || platform === 'tiktok') {
        // Not yet implemented for test launch
        setError(`${PLATFORMS[platform].name} estará disponível em breve!`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = async (platform, accountId) => {
    if (!confirm(`Tem certeza que deseja desconectar sua conta ${PLATFORMS[platform].name}?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, [platform]: true }));
    setError(null);

    try {
      if (platform === 'youtube') {
        actions.disconnectAccount(accountId);
      } else if (platform === 'tiktok') {
        const response = await fetch(`/api/tiktok/accounts/${accountId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Falha ao desconectar conta');
        }
        
        await fetchTikTokAccounts();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleRefresh = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    setError(null);

    try {
      if (platform === 'tiktok') {
        const response = await fetch('/api/tiktok/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (data.requiresReauth) {
            // Need to re-authenticate
            handleConnect(platform);
            return;
          }
          throw new Error(data.error || 'Falha ao atualizar token');
        }
        
        await fetchTikTokAccounts();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Transform YouTube accounts to connection format
  const youtubeConnection = connectedAccounts.length > 0 ? {
    accountId: connectedAccounts[0].id,
    accountName: connectedAccounts[0].name,
    avatar: connectedAccounts[0].avatar,
    isExpired: connectedAccounts[0].expiresAt ? new Date(connectedAccounts[0].expiresAt) < new Date() : false,
    profileUrl: connectedAccounts[0].stats?.customUrl 
      ? `https://youtube.com/${connectedAccounts[0].stats.customUrl}`
      : null,
  } : null;

  // Transform TikTok accounts to connection format
  const tiktokConnection = tiktokAccounts.length > 0 ? {
    accountId: tiktokAccounts[0].accountId,
    accountName: `@${tiktokAccounts[0].accountId}`,
    avatar: null,
    isExpired: tiktokAccounts[0].isExpired,
    profileUrl: `https://tiktok.com/@${tiktokAccounts[0].accountId}`,
  } : null;

  // Instagram not yet implemented
  const instagramConnection = null;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlatformCard
          platform="youtube"
          connection={youtubeConnection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
          isLoading={loading.youtube}
        />
        
        <PlatformCard
          platform="tiktok"
          connection={tiktokConnection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
          isLoading={loading.tiktok}
        />
        
        <PlatformCard
          platform="instagram"
          connection={instagramConnection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
          isLoading={loading.instagram}
        />
      </div>

      {/* Info Text */}
      <p className="text-xs text-slate-500 text-center">
        Conecte suas contas para publicar vídeos em múltiplas plataformas simultaneamente.
      </p>
    </div>
  );
}
