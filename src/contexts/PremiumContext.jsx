import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PremiumContext = createContext();

export const usePremium = () => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within PremiumProvider');
    }
    return context;
};

export const PremiumProvider = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [features, setFeatures] = useState({
        aiCopilot: false,
        revenueTracker: false,
        advancedAnalytics: false,
        unlimitedWorkspaces: false,
        customBranding: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPremiumStatus();
    }, []);

    const checkPremiumStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Check user's premium status from database
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking premium status:', error);
                setLoading(false);
                return;
            }

            if (data && data.status === 'active') {
                setIsPremium(true);
                setFeatures({
                    aiCopilot: data.plan === 'pro' || data.plan === 'enterprise',
                    revenueTracker: data.plan === 'pro' || data.plan === 'enterprise',
                    advancedAnalytics: data.plan === 'pro' || data.plan === 'enterprise',
                    unlimitedWorkspaces: data.plan === 'enterprise',
                    customBranding: data.plan === 'enterprise',
                });
            }
        } catch (error) {
            console.error('Error in checkPremiumStatus:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasFeature = (featureName) => {
        return features[featureName] || false;
    };

    const value = {
        isPremium,
        features,
        loading,
        hasFeature,
        refreshStatus: checkPremiumStatus,
    };

    return (
        <PremiumContext.Provider value={value}>
            {children}
        </PremiumContext.Provider>
    );
};

export default PremiumContext;
