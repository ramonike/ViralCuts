/**
 * useSubscription — src/hooks/useSubscription.js
 *
 * Hook central para acesso ao plano do usuário.
 * Usado no ProfilePage, SidebarLeft e qualquer lugar que precise
 * verificar limites ou redirecionar para upgrade.
 *
 * Uso:
 *   const { plan, maxChannels, canAddChannel, loading, openCheckout, openPortal } = useSubscription();
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '../lib/api-client';

async function fetchSubscription() {
    return fetchAPI('/subscription/me');
}

async function createCheckout(planName, billingCycle) {
    return fetchAPI('/subscription/checkout', {
        method:      'POST',
        body:        JSON.stringify({ planName, billingCycle }),
    });
}

async function createPortal() {
    return fetchAPI('/subscription/portal', {
        method:      'POST',
    });
}

export function useSubscription() {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const sub = await fetchSubscription();
            setData(sub);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Redireciona para o Stripe Checkout
    const openCheckout = useCallback(async (planName, billingCycle = 'monthly') => {
        try {
            const { url } = await createCheckout(planName, billingCycle);
            window.location.href = url;
        } catch (err) {
            console.error('[useSubscription] Checkout error:', err);
            throw err;
        }
    }, []);

    // Redireciona para o Stripe Customer Portal (cancelar, trocar cartão, etc.)
    const openPortal = useCallback(async () => {
        try {
            const { url } = await createPortal();
            window.location.href = url;
        } catch (err) {
            console.error('[useSubscription] Portal error:', err);
            throw err;
        }
    }, []);

    const plan        = data?.plan || null;
    const maxChannels = plan?.maxChannels ?? 1;
    const status      = data?.status || 'active';
    const isActive    = status === 'active' || status === 'trialing';
    const isFree      = plan?.name === 'free' || !plan;

    return {
        plan,
        status,
        isActive,
        isFree,
        maxChannels,
        billingCycle:      data?.billingCycle || 'monthly',
        periodEnd:         data?.periodEnd    || null,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd || false,
        loading,
        error,
        reload: load,
        openCheckout,
        openPortal,
        // Helper: verifica se pode adicionar mais um canal
        canAddChannel: (currentCount) => currentCount < maxChannels,
    };
}
