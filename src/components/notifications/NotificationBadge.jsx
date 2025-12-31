import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBadge({ className = '' }) {
    const { unreadCount, notificationHistory } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const prevCountRef = useRef(notificationHistory.length);

    // Detect new notifications for animation
    useEffect(() => {
        if (notificationHistory.length > prevCountRef.current) {
            setHasNewNotification(true);
            const timer = setTimeout(() => setHasNewNotification(false), 1000);
            return () => clearTimeout(timer);
        }
        prevCountRef.current = notificationHistory.length;
    }, [notificationHistory.length]);

    const toggleOpen = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);

    return (
        <div className={`relative ${className}`}>
            {/* Bell button */}
            <motion.button
                onClick={toggleOpen}
                animate={hasNewNotification ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`relative p-2 rounded-lg transition-colors ${
                    isOpen 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            >
                <Bell className="w-5 h-5" />
                
                {/* Badge counter */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pulse animation for new notifications */}
                <AnimatePresence>
                    {hasNewNotification && (
                        <motion.span
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0, scale: 2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0 rounded-lg bg-blue-500/30"
                        />
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Notification Center dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <NotificationCenter onClose={handleClose} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationBadge;
