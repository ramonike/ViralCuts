import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Filter, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';

export function NotificationCenter({ maxHeight = 400, onClose }) {
    const { 
        notificationHistory, 
        unreadCount, 
        markAllAsRead, 
        clearAll 
    } = useNotification();
    
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const panelRef = useRef(null);

    // Filter notifications based on selected filter
    const filteredNotifications = filter === 'unread' 
        ? notificationHistory.filter(n => !n.read)
        : notificationHistory;

    // Sort by most recent first
    const sortedNotifications = [...filteredNotifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="vc-notification-center absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-white">Notificações</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            filter === 'all'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                            filter === 'unread'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        <Filter className="w-3 h-3" />
                        Não lidas
                    </button>
                </div>
            </div>

            {/* Notification list */}
            <div 
                className="overflow-y-auto"
                style={{ maxHeight: `${maxHeight}px` }}
            >
                {sortedNotifications.length === 0 ? (
                    <div className="py-12 text-center">
                        <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                            {filter === 'unread' 
                                ? 'Nenhuma notificação não lida'
                                : 'Nenhuma notificação ainda'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        <AnimatePresence mode="popLayout">
                            {sortedNotifications.map(notification => (
                                <NotificationItem 
                                    key={notification.id} 
                                    notification={notification}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            {notificationHistory.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
                    <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Marcar todas como lidas
                    </button>
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Limpar
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default NotificationCenter;
