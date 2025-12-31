import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, 
    CheckCircle, 
    XCircle, 
    Video, 
    Trophy, 
    Flame, 
    AlertTriangle,
    Bell,
    Circle
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

// Icon and style configuration per notification type
const NOTIFICATION_CONFIG = {
    upload_complete: {
        icon: CheckCircle,
        iconClass: 'text-green-400',
        bgClass: 'bg-green-500/10'
    },
    upload_error: {
        icon: XCircle,
        iconClass: 'text-red-400',
        bgClass: 'bg-red-500/10'
    },
    video_published: {
        icon: Video,
        iconClass: 'text-blue-400',
        bgClass: 'bg-blue-500/10'
    },
    achievement_unlocked: {
        icon: Trophy,
        iconClass: 'text-yellow-400',
        bgClass: 'bg-yellow-500/10'
    },
    streak_reminder: {
        icon: Flame,
        iconClass: 'text-orange-400',
        bgClass: 'bg-orange-500/10'
    },
    quota_warning: {
        icon: AlertTriangle,
        iconClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10'
    },
    system: {
        icon: Bell,
        iconClass: 'text-slate-400',
        bgClass: 'bg-slate-500/10'
    }
};

// Format relative timestamp
function formatRelativeTime(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
        return 'Agora mesmo';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d atrás`;
    }

    // Format as date for older notifications
    return notificationDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
    });
}

export function NotificationItem({ notification }) {
    const navigate = useNavigate();
    const { markAsRead, clearNotification } = useNotification();
    
    const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
    const Icon = config.icon;

    const handleClick = () => {
        // Mark as read when clicked
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Navigate to action URL if provided
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const handleDismiss = (e) => {
        e.stopPropagation();
        clearNotification(notification.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onClick={handleClick}
            className={`relative px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                !notification.read ? 'bg-slate-800/30' : ''
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${config.bgClass} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.iconClass}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            {notification.title && (
                                <p className={`text-sm font-medium truncate ${
                                    notification.read ? 'text-slate-300' : 'text-white'
                                }`}>
                                    {notification.title}
                                </p>
                            )}
                            <p className={`text-sm mt-0.5 line-clamp-2 ${
                                notification.read ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                                {notification.message}
                            </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                            <Circle className="w-2 h-2 fill-blue-400 text-blue-400 flex-shrink-0 mt-1.5" />
                        )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-slate-500 mt-1.5">
                        {formatRelativeTime(notification.createdAt)}
                    </p>
                </div>
            </div>

            {/* Dismiss button (visible on hover) */}
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover notificação"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export default NotificationItem;
