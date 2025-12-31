import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationContext = createContext();

// Storage keys
const STORAGE_KEY = 'notification_history';
const PREFERENCES_KEY = 'notification_preferences';
const MAX_NOTIFICATIONS = 100;

// Default preferences
const DEFAULT_PREFERENCES = {
    inApp: {
        enabled: true,
        types: {
            upload_complete: true,
            upload_error: true,
            video_published: true,
            achievement_unlocked: true,
            streak_reminder: true,
            quota_warning: true,
        },
    },
    push: {
        enabled: false,
        types: {
            upload_complete: true,
            video_published: true,
            achievement_unlocked: true,
            streak_reminder: true,
        },
    },
};

// Load notifications from localStorage
const loadNotificationHistory = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert createdAt strings back to Date objects
            return parsed.map(n => ({
                ...n,
                createdAt: new Date(n.createdAt)
            }));
        }
    } catch (error) {
        console.error('Failed to load notification history:', error);
    }
    return [];
};

// Save notifications to localStorage
const saveNotificationHistory = (notifications) => {
    try {
        // Limit to MAX_NOTIFICATIONS
        const toSave = notifications.slice(-MAX_NOTIFICATIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
        console.error('Failed to save notification history:', error);
    }
};

// Load preferences from localStorage
const loadPreferences = () => {
    try {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (stored) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
};

// Save preferences to localStorage
const savePreferences = (preferences) => {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('Failed to save notification preferences:', error);
    }
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const NOTIFICATION_TYPES = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-green-500/10 border-green-500/30',
        iconClass: 'text-green-500',
        titleClass: 'text-green-400'
    },
    error: {
        icon: AlertCircle,
        bgClass: 'bg-red-500/10 border-red-500/30',
        iconClass: 'text-red-500',
        titleClass: 'text-red-400'
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-yellow-500/10 border-yellow-500/30',
        iconClass: 'text-yellow-500',
        titleClass: 'text-yellow-400'
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-500/10 border-blue-500/30',
        iconClass: 'text-blue-500',
        titleClass: 'text-blue-400'
    }
};

function NotificationItem({ notification, onDismiss }) {
    const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm ${config.bgClass}`}
        >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
                {notification.title && (
                    <p className={`font-medium text-sm ${config.titleClass}`}>
                        {notification.title}
                    </p>
                )}
                <p className="text-sm text-gray-300 mt-0.5">
                    {notification.message}
                </p>
                {notification.action && (
                    <button
                        onClick={notification.action.onClick}
                        className="mt-2 text-sm font-medium text-white/80 hover:text-white underline"
                    >
                        {notification.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={() => onDismiss(notification.id)}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export function NotificationProvider({ children }) {
    // Toast notifications (temporary, auto-dismiss)
    const [toastNotifications, setToastNotifications] = useState([]);
    
    // Notification history (persistent)
    const [notificationHistory, setNotificationHistory] = useState(() => loadNotificationHistory());
    
    // User preferences
    const [preferences, setPreferences] = useState(() => loadPreferences());

    // Persist notification history when it changes
    useEffect(() => {
        saveNotificationHistory(notificationHistory);
    }, [notificationHistory]);

    // Persist preferences when they change
    useEffect(() => {
        savePreferences(preferences);
    }, [preferences]);

    // Calculate unread count
    const unreadCount = useMemo(() => {
        return notificationHistory.filter(n => !n.read).length;
    }, [notificationHistory]);

    // Add notification to history
    const addToHistory = useCallback(({ 
        type, 
        title, 
        message, 
        actionUrl = null,
        metadata = null 
    }) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = {
            id,
            type,
            title,
            message,
            read: false,
            createdAt: new Date(),
            actionUrl,
            metadata
        };
        
        setNotificationHistory(prev => {
            const updated = [...prev, notification];
            // Limit to MAX_NOTIFICATIONS
            return updated.slice(-MAX_NOTIFICATIONS);
        });

        return id;
    }, []);

    // Check if notification type is enabled
    const isNotificationTypeEnabled = useCallback((notificationType) => {
        if (!preferences.inApp.enabled) return false;
        return preferences.inApp.types[notificationType] !== false;
    }, [preferences]);

    // Add toast notification (temporary display)
    const addNotification = useCallback(({ 
        type = 'info', 
        title, 
        message, 
        duration = 5000,
        action = null,
        // New fields for history
        notificationType = null,
        actionUrl = null,
        metadata = null,
        persist = false
    }) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = { id, type, title, message, action };
        
        setToastNotifications(prev => [...prev, notification]);

        // Add to history if it's a persistent notification type
        if (persist && notificationType) {
            if (isNotificationTypeEnabled(notificationType)) {
                addToHistory({
                    type: notificationType,
                    title,
                    message,
                    actionUrl,
                    metadata
                });
            }
        }

        if (duration > 0) {
            setTimeout(() => {
                dismissNotification(id);
            }, duration);
        }

        return id;
    }, [addToHistory, isNotificationTypeEnabled]);

    // Dismiss toast notification
    const dismissNotification = useCallback((id) => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all toast notifications
    const clearAllToasts = useCallback(() => {
        setToastNotifications([]);
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotificationHistory(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setNotificationHistory(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    }, []);

    // Clear single notification from history
    const clearNotification = useCallback((id) => {
        setNotificationHistory(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications from history
    const clearAll = useCallback(() => {
        setNotificationHistory([]);
    }, []);

    // Update preferences
    const updatePreferences = useCallback((newPrefs) => {
        setPreferences(prev => ({
            ...prev,
            ...newPrefs,
            inApp: {
                ...prev.inApp,
                ...(newPrefs.inApp || {}),
                types: {
                    ...prev.inApp.types,
                    ...(newPrefs.inApp?.types || {})
                }
            },
            push: {
                ...prev.push,
                ...(newPrefs.push || {}),
                types: {
                    ...prev.push.types,
                    ...(newPrefs.push?.types || {})
                }
            }
        }));
    }, []);

    // Helpers para tipos específicos
    const success = useCallback((message, options = {}) => {
        return addNotification({ type: 'success', message, ...options });
    }, [addNotification]);

    const error = useCallback((message, options = {}) => {
        return addNotification({ type: 'error', message, duration: 8000, ...options });
    }, [addNotification]);

    const warning = useCallback((message, options = {}) => {
        return addNotification({ type: 'warning', message, ...options });
    }, [addNotification]);

    const info = useCallback((message, options = {}) => {
        return addNotification({ type: 'info', message, ...options });
    }, [addNotification]);

    const value = {
        // Toast notifications (temporary)
        notifications: toastNotifications,
        addNotification,
        dismissNotification,
        clearAllToasts,
        
        // Notification history (persistent)
        notificationHistory,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        addToHistory,
        
        // Preferences
        preferences,
        updatePreferences,
        isNotificationTypeEnabled,
        
        // Helpers
        success,
        error,
        warning,
        info
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            {/* Container de Notificações Toast */}
            <div className="fixed top-4 right-4 z-[9999] w-full max-w-sm space-y-2">
                <AnimatePresence mode="popLayout">
                    {toastNotifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onDismiss={dismissNotification}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}
