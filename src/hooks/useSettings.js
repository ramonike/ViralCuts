import { useCallback, useEffect, useRef, useState } from "react";
import { settingsAPI, offlineFirst, syncManager } from "../api/backend";
import { useAuth } from "../contexts/AuthContext";

// Local storage key for offline settings
const STORAGE_KEY = 'viralcuts-settings';

/**
 * Load settings from localStorage
 */
function loadLocalSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load local settings:', error);
        return null;
    }
}

/**
 * Save settings to localStorage
 */
function saveLocalSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save local settings:', error);
    }
}

/**
 * Hook para gerenciar configurações do usuário com persistência no backend
 * Implements offline-first architecture with backend sync
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 */
export function useSettings(state, setState) {
    const { user, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle');
    const syncInProgress = useRef(false);
    const debounceTimer = useRef(null);
    
    const settings = state.settings;

    // Load settings from backend on mount when user is authenticated
    useEffect(() => {
        if (authLoading) return;

        const loadFromBackend = async () => {
            if (!user) {
                // Not authenticated - use localStorage only
                const localSettings = loadLocalSettings();
                if (localSettings && Object.keys(localSettings).length > 0) {
                    setState(prev => ({
                        ...prev,
                        settings: { ...prev.settings, ...localSettings }
                    }));
                }
                setIsLoading(false);
                return;
            }

            try {
                setSyncStatus('syncing');
                
                // Fetch settings from backend
                const backendSettings = await settingsAPI.get().catch(() => null);

                if (backendSettings) {
                    // Transform backend format to local format
                    const transformedSettings = {
                        theme: backendSettings.theme || 'dark',
                        notifications: backendSettings.notifications ?? true,
                        defaultPrivacy: backendSettings.defaultPrivacy || 'private',
                        // Preserve any additional local settings not in backend
                        ...settings,
                        // Override with backend values
                        theme: backendSettings.theme || settings.theme || 'dark',
                        notifications: backendSettings.notifications ?? settings.notifications ?? true,
                        defaultPrivacy: backendSettings.defaultPrivacy || settings.defaultPrivacy || 'private',
                    };

                    setState(prev => ({
                        ...prev,
                        settings: transformedSettings
                    }));
                }

                // Process any pending changes
                await syncManager.processPendingChanges();
                setSyncStatus('idle');
            } catch (error) {
                console.error('Failed to load settings from backend:', error);
                setSyncStatus('error');
                // Continue with localStorage data (offline-first)
            } finally {
                setIsLoading(false);
            }
        };

        loadFromBackend();
    }, [user, authLoading, setState]);

    // Save to localStorage whenever settings change (offline-first)
    useEffect(() => {
        if (settings) {
            saveLocalSettings(settings);
        }
    }, [settings]);

    // Enable auto-sync when coming back online
    useEffect(() => {
        syncManager.enableAutoSync();
    }, []);

    /**
     * Sync settings to backend with debounce
     */
    const syncToBackend = useCallback(async (newSettings) => {
        if (!user || syncInProgress.current) return;

        syncInProgress.current = true;
        try {
            // Only sync settings that exist in backend schema
            const backendSettings = {
                theme: newSettings.theme,
                notifications: newSettings.notifications,
                defaultPrivacy: newSettings.defaultPrivacy
            };

            await offlineFirst.updateSettings(backendSettings, null);
        } catch (error) {
            console.error('Failed to sync settings to backend:', error);
        } finally {
            syncInProgress.current = false;
        }
    }, [user]);

    /**
     * Update settings with automatic backend sync
     */
    const updateSettings = useCallback((newSettings) => {
        // Update local state immediately
        setState(prev => {
            const updatedSettings = { ...prev.settings, ...newSettings };
            
            // Debounce backend sync to avoid too many requests
            if (user) {
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                }
                debounceTimer.current = setTimeout(() => {
                    syncToBackend(updatedSettings);
                }, 500); // 500ms debounce
            }

            return {
                ...prev,
                settings: updatedSettings
            };
        });
    }, [setState, user, syncToBackend]);

    /**
     * Reset settings to defaults
     */
    const resetSettings = useCallback(async (defaultSettings) => {
        // Update local state immediately
        setState(prev => ({
            ...prev,
            settings: defaultSettings
        }));

        // Sync to backend if authenticated
        if (user) {
            try {
                await offlineFirst.updateSettings({
                    theme: defaultSettings.theme || 'dark',
                    notifications: defaultSettings.notifications ?? true,
                    defaultPrivacy: defaultSettings.defaultPrivacy || 'private'
                }, null);
            } catch (error) {
                console.error('Failed to sync settings reset to backend:', error);
            }
        }
    }, [setState, user]);

    /**
     * Force sync settings to backend
     */
    const forceSync = useCallback(async () => {
        if (!user || !settings) return;

        setSyncStatus('syncing');
        try {
            await settingsAPI.update({
                theme: settings.theme,
                notifications: settings.notifications,
                defaultPrivacy: settings.defaultPrivacy
            });
            setSyncStatus('idle');
        } catch (error) {
            console.error('Failed to force sync settings:', error);
            setSyncStatus('error');
        }
    }, [user, settings]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return {
        settings,
        updateSettings,
        resetSettings,
        forceSync,
        isLoading,
        syncStatus
    };
}

export default useSettings;
