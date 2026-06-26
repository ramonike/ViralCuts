import { useCallback, useState } from 'react';

/**
 * useTikTokAuth — Gerencia conexão OAuth com TikTok via backend
 *
 * Padrão idêntico ao useYouTubeAuth.js, mas para TikTok.
 * O fluxo OAuth (PKCE) é feito pelo backend em /api/tiktok/auth/url
 * e /api/tiktok/auth/callback.
 *
 * Uso:
 *   const { connectTikTok, connectedTikTokAccounts, disconnectTikTokAccount, loading, error } = useTikTokAuth(state, setState);
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useTikTokAuth(state, setState) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Inicia o fluxo OAuth TikTok.
     * Redireciona o usuário para a página de autorização da TikTok.
     */
    const connectTikTok = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/tiktok/auth/url`, {
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Falha ao obter URL de autorização TikTok.');
            }

            const { url } = await response.json();

            // Abre em popup para não perder o contexto da aplicação
            const popup = window.open(url, 'tiktok_oauth', 'width=600,height=700,scrollbars=yes');

            // Escuta mensagem de conclusão do OAuth (se o callback postar mensagem)
            const handleMessage = (event) => {
                if (event.data?.type === 'tiktok_connected') {
                    window.removeEventListener('message', handleMessage);
                    clearInterval(timer);
                    popup?.close();
                    fetchConnectedAccounts();
                }
                if (event.data?.type === 'tiktok_error') {
                    window.removeEventListener('message', handleMessage);
                    clearInterval(timer);
                    popup?.close();
                    setError(event.data.error || 'Erro ao conectar TikTok');
                    setLoading(false);
                }
            };
            window.addEventListener('message', handleMessage);

            // Polling para detectar quando o popup fecha (fallback)
            const timer = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(timer);
                    window.removeEventListener('message', handleMessage);
                    fetchConnectedAccounts();
                    setLoading(false);
                }
            }, 500);
        } catch (err) {
            console.error('[useTikTokAuth] connectTikTok:', err);
            setError(err.message);
            setLoading(false);
        }
    }, []);

    /**
     * Busca as contas TikTok conectadas no backend e sincroniza com o estado global.
     */
    const fetchConnectedAccounts = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/tiktok/accounts`, {
                credentials: 'include',
            });
            if (!response.ok) return;

            const { accounts } = await response.json();

            // Formata para o padrão de connectedAccounts do ViralCuts
            const tiktokAccounts = accounts
                .filter(a => !a.isExpired)
                .map(a => ({
                    id: `tiktok_${a.accountId}`,
                    accountId: a.accountId,
                    name: a.displayName || 'TikTok',
                    avatar: a.avatarUrl || null,
                    platform: 'tiktok',
                    token: null,         // token fica no backend — não exposto ao frontend
                    expiresAt: a.accessTokenExpiresAt ? new Date(a.accessTokenExpiresAt).getTime() : null,
                    stats: null,
                }));

            setState(prev => {
                // Remove contas tiktok antigas e adiciona as novas
                const otherAccounts = (prev.auth?.connectedAccounts || []).filter(
                    a => (a.platform || 'youtube') !== 'tiktok'
                );
                return {
                    ...prev,
                    auth: {
                        ...prev.auth,
                        connectedAccounts: [...otherAccounts, ...tiktokAccounts],
                    },
                };
            });
        } catch (err) {
            console.error('[useTikTokAuth] fetchConnectedAccounts:', err);
        } finally {
            setLoading(false);
        }
    }, [setState]);

    /**
     * Desconecta uma conta TikTok (revoga token no backend e remove do estado).
     */
    const disconnectTikTokAccount = useCallback(async (accountId) => {
        setLoading(true);
        setError(null);
        try {
            // accountId no formato `tiktok_<openId>` — extrai só o openId
            const openId = accountId.startsWith('tiktok_') ? accountId.slice(7) : accountId;

            const response = await fetch(`${API_BASE}/api/tiktok/accounts/${encodeURIComponent(openId)}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Falha ao desconectar conta TikTok.');
            }

            // Remove do estado global
            setState(prev => ({
                ...prev,
                auth: {
                    ...prev.auth,
                    connectedAccounts: (prev.auth?.connectedAccounts || []).filter(
                        a => a.id !== accountId
                    ),
                },
            }));
        } catch (err) {
            console.error('[useTikTokAuth] disconnectTikTokAccount:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setState]);

    /**
     * Retorna as contas TikTok dentro de connectedAccounts.
     */
    const connectedTikTokAccounts = (state.auth?.connectedAccounts || []).filter(
        a => a.platform === 'tiktok'
    );

    return {
        connectTikTok,
        fetchConnectedAccounts,
        disconnectTikTokAccount,
        connectedTikTokAccounts,
        loading,
        error,
    };
}
