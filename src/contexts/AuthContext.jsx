/**
 * AuthContext — v2
 * + refreshYouTubeTokens(): refresh silencioso ao carregar sessão
 *   Resolve o problema de canal desconectando ao sair e voltar
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authClient } from '../lib/auth-client';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 min

const LEGACY_STORAGE_KEYS = [
    'viralcuts-journey-state',
    'viralcuts-journey-stages',
    'viralcuts-user-stats',
    'viralcuts-journey-last-sync',
    'viralcuts-upload-queue',
    'viralcuts-settings',
    'viralcuts-migration-completed',
    'viralcuts-migration-skipped',
    'viralcuts_workflow_v1',
];

function clearLegacyData() {
    LEGACY_STORAGE_KEYS.forEach(key => {
        try { localStorage.removeItem(key); } catch { }
    });
}

// ─── YouTube silent refresh ───────────────────────────────────────────────────
/**
 * Tenta renovar todos os tokens YouTube expirados (ou prestes a expirar)
 * do usuário logado. Chamado silenciosamente após cada login/checkSession.
 *
 * O backend já tem POST /api/youtube/auth/refresh (routes/youtube.js).
 * Se o refreshToken do Google ainda for válido, devolve um novo accessToken
 * e salva no banco — sem que o usuário precise fazer nada.
 *
 * Quando isso falha (refreshToken revogado pelo Google), retornamos
 * requiresReauth: true e guardamos no state para exibir um aviso discreto.
 */
async function refreshYouTubeTokens() {
    try {
        // 1. Buscar todos os canais conectados do usuário
        const accountsRes = await fetch(`${API_URL}/api/youtube/accounts`, {
            credentials: 'include',
        });
        if (!accountsRes.ok) return { refreshed: 0, requiresReauth: false };

        const { accounts = [] } = await accountsRes.json();

        // 2. Filtrar apenas os que estão expirados ou expiram em 10 min
        const threshold = Date.now() + 10 * 60 * 1000;
        const expiredAccounts = accounts.filter(acc =>
            !acc.accessTokenExpiresAt ||
            new Date(acc.accessTokenExpiresAt).getTime() < threshold
        );

        if (expiredAccounts.length === 0) {
            return { refreshed: 0, requiresReauth: false };
        }

        // 3. Refresh em paralelo (um por canal)
        let requiresReauth = false;
        const results = await Promise.allSettled(
            expiredAccounts.map(acc =>
                fetch(`${API_URL}/api/youtube/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: acc.accountId }),
                }).then(r => r.json())
            )
        );

        const refreshed = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;

        // Se qualquer canal precisar de re-auth, sinalizamos
        results.forEach(r => {
            if (r.status === 'fulfilled' && r.value?.requiresReauth) {
                requiresReauth = true;
            }
        });

        console.log(`[AuthContext] YouTube tokens: ${refreshed}/${expiredAccounts.length} renovados`);
        return { refreshed, requiresReauth };
    } catch (err) {
        console.warn('[AuthContext] YouTube refresh silencioso falhou:', err.message);
        return { refreshed: 0, requiresReauth: false };
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Novo: sinaliza se algum canal YouTube precisa de re-autenticação manual
    const [youtubeRequiresReauth, setYoutubeRequiresReauth] = useState(false);

    const sessionCheckRef = useRef(null);
    const lastCheckRef = useRef(0);

    // ── checkSession ──────────────────────────────────────────────────────────
    const checkSession = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastCheckRef.current < 10000) return session;
        lastCheckRef.current = now;

        try {
            const result = await authClient.getSession();

            if (result?.data?.session && result?.data?.user) {
                setSession(result.data.session);
                setUser(result.data.user);
                setError(null);
                return result.data.session;
            } else {
                setSession(null);
                setUser(null);
                return null;
            }
        } catch (err) {
            console.error('[AuthContext] Session check failed:', err);
            setError(err.message);
            setSession(null);
            setUser(null);
            return null;
        }
    }, [session]);

    // ── Inicialização + refresh silencioso do YouTube ─────────────────────────
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            setLoading(true);
            const activeSession = await checkSession(true);

            if (mounted && activeSession) {
                // Refresh silencioso em background — não bloqueia o carregamento
                refreshYouTubeTokens().then(({ requiresReauth }) => {
                    if (mounted && requiresReauth) {
                        setYoutubeRequiresReauth(true);
                    }
                });
            }

            if (mounted) setLoading(false);
        };

        initAuth();

        sessionCheckRef.current = setInterval(() => {
            if (user) checkSession();
        }, SESSION_CHECK_INTERVAL);

        const handleFocus = () => {
            if (user) {
                checkSession();
                // Ao voltar para a aba, tenta renovar tokens YouTube silenciosamente
                refreshYouTubeTokens().then(({ requiresReauth }) => {
                    if (requiresReauth) setYoutubeRequiresReauth(true);
                });
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            mounted = false;
            if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // ── signIn ────────────────────────────────────────────────────────────────
    const signIn = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const result = await authClient.signIn.email({ email, password });

            if (result?.error) throw new Error(result.error.message || 'Falha no login');

            const u = result?.data?.user || result?.user;
            const s = result?.data?.session || result?.session;

            if (u) {
                setUser(u);
                setSession(s);
                setLoading(false);
                setTimeout(() => clearLegacyData(), 100);
                // Refresh silencioso pós-login
                refreshYouTubeTokens().then(({ requiresReauth }) => {
                    if (requiresReauth) setYoutubeRequiresReauth(true);
                });
                return { success: true, user: u };
            }

            const sessionCheck = await checkSession(true);
            if (sessionCheck) {
                setLoading(false);
                setTimeout(() => clearLegacyData(), 100);
                refreshYouTubeTokens().then(({ requiresReauth }) => {
                    if (requiresReauth) setYoutubeRequiresReauth(true);
                });
                return { success: true, user };
            }

            throw new Error('Falha no login - resposta inesperada');
        } catch (err) {
            console.error('[AuthContext] signIn error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [checkSession, user]);

    // ── signUp ────────────────────────────────────────────────────────────────
    const signUp = useCallback(async (email, password, name) => {
        setLoading(true);
        setError(null);

        try {
            const result = await authClient.signUp.email({ email, password, name });

            if (result?.error) throw new Error(result.error.message || 'Falha no cadastro');

            const u = result?.data?.user || result?.user;
            const s = result?.data?.session || result?.session;

            if (u) {
                setUser(u);
                setSession(s);
                setLoading(false);
                return { success: true, user: u };
            }

            const sessionCheck = await checkSession(true);
            if (sessionCheck) {
                setLoading(false);
                return { success: true, user };
            }

            throw new Error('Falha no cadastro - resposta inesperada');
        } catch (err) {
            console.error('[AuthContext] signUp error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [checkSession, user]);

    // ── signOut ───────────────────────────────────────────────────────────────
    const signOut = useCallback(async () => {
        try { await authClient.signOut(); } catch { }
        finally {
            setUser(null);
            setSession(null);
            setError(null);
            setYoutubeRequiresReauth(false);
        }
    }, []);

    const isAuthenticated = !!user && !!session;

    const value = {
        user,
        session,
        loading,
        error,
        isAuthenticated,
        youtubeRequiresReauth,   // ← novo: use para exibir banner de reconexão
        signIn,
        signUp,
        signOut,
        checkSession,
        refreshYouTubeTokens,    // ← novo: exposto para chamada manual se necessário
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

export default AuthContext;
