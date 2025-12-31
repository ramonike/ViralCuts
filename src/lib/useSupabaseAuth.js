import { useEffect, useState, useCallback } from 'react';
import { authClient } from './auth-client';

/**
 * Custom hook to get current user from Better Auth
 * Returns user ID for Supabase database operations
 */
export function useSupabaseAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await authClient.getSession();

                if (session?.data?.user) {
                    // Use Better Auth user directly
                    // The user.id will be used as user_id in Supabase tables
                    setUser({
                        id: session.data.user.id,
                        email: session.data.user.email,
                        name: session.data.user.name,
                        image: session.data.user.image
                    });
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signOut = useCallback(async () => {
        try {
            await authClient.signOut();
            setUser(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, []);

    return { user, loading, signOut };
}
