/**
 * AuthContext - Gerenciamento de autenticação centralizado
 * Implementa verificação de sessão, refresh automático e proteção de rotas
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authClient } from '../lib/auth-client';

const AuthContext = createContext(null);

// Configurações de sessão
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Chaves legadas do localStorage que devem ser limpas
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

/**
 * Limpa dados legados do localStorage
 */
function clearLegacyData() {
    LEGACY_STORAGE_KEYS.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to remove legacy key ${key}:`, e);
        }
    });
    console.log('[AuthContext] Legacy localStorage data cleared');
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sessionCheckRef = useRef(null);
    const lastCheckRef = useRef(0);

    // Verificar sessão atual
    const checkSession = useCallback(async (force = false) => {
        // Rate limit: não verificar mais de uma vez a cada 10 segundos
        const now = Date.now();
        if (!force && now - lastCheckRef.current < 10000) {
            return session;
        }
        lastCheckRef.current = now;

        try {
            const result = await authClient.getSession();
            console.log('[AuthContext] checkSession result:', result);
            
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

    // Verificação inicial e periódica
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            setLoading(true);
            await checkSession(true);
            if (mounted) {
                setLoading(false);
            }
        };

        initAuth();

        // Verificação periódica da sessão
        sessionCheckRef.current = setInterval(() => {
            if (user) {
                checkSession();
            }
        }, SESSION_CHECK_INTERVAL);

        // Verificar quando a janela ganha foco
        const handleFocus = () => {
            if (user) {
                checkSession();
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            mounted = false;
            if (sessionCheckRef.current) {
                clearInterval(sessionCheckRef.current);
            }
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Sign In
    const signIn = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const result = await authClient.signIn.email({
                email,
                password,
            });

            console.log('[AuthContext] signIn result:', result);

            // Better Auth pode retornar erro no result.error
            if (result?.error) {
                throw new Error(result.error.message || 'Falha no login');
            }

            // Verificar se temos dados do usuário
            if (result?.data?.user) {
                setUser(result.data.user);
                setSession(result.data.session);
                setLoading(false);
                // Limpar dados legados em background (não bloqueia)
                setTimeout(() => clearLegacyData(), 100);
                return { success: true, user: result.data.user };
            }

            // Alguns casos o Better Auth retorna direto o user
            if (result?.user) {
                setUser(result.user);
                setSession(result.session);
                setLoading(false);
                setTimeout(() => clearLegacyData(), 100);
                return { success: true, user: result.user };
            }

            // Se chegou aqui, verificar sessão manualmente
            const sessionCheck = await checkSession(true);
            if (sessionCheck) {
                setLoading(false);
                setTimeout(() => clearLegacyData(), 100);
                return { success: true, user: user };
            }

            throw new Error('Falha no login - resposta inesperada');
        } catch (err) {
            console.error('[AuthContext] signIn error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [checkSession, user]);

    // Sign Up
    const signUp = useCallback(async (email, password, name) => {
        setLoading(true);
        setError(null);

        try {
            const result = await authClient.signUp.email({
                email,
                password,
                name,
            });

            console.log('[AuthContext] signUp result:', result);

            // Better Auth pode retornar erro no result.error
            if (result?.error) {
                throw new Error(result.error.message || 'Falha no cadastro');
            }

            if (result?.data?.user) {
                setUser(result.data.user);
                setSession(result.data.session);
                setLoading(false);
                return { success: true, user: result.data.user };
            }

            // Alguns casos o Better Auth retorna direto o user
            if (result?.user) {
                setUser(result.user);
                setSession(result.session);
                setLoading(false);
                return { success: true, user: result.user };
            }

            // Se chegou aqui, verificar sessão manualmente
            const sessionCheck = await checkSession(true);
            if (sessionCheck) {
                setLoading(false);
                return { success: true, user: user };
            }

            throw new Error('Falha no cadastro - resposta inesperada');
        } catch (err) {
            console.error('[AuthContext] signUp error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [checkSession, user]);

    // Sign Out
    const signOut = useCallback(async () => {
        try {
            await authClient.signOut();
        } catch (err) {
            console.error('[AuthContext] Sign out error:', err);
        } finally {
            setUser(null);
            setSession(null);
            setError(null);
        }
    }, []);

    // Verificar se está autenticado
    const isAuthenticated = !!user && !!session;

    const value = {
        user,
        session,
        loading,
        error,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        checkSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
