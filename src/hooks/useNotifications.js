/**
 * useNotifications Hook
 * Manages notification state and polling for new notifications
 * Requirements: 2.2, 4.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/notifications';
import { useNotification } from '../contexts/NotificationContext';
import { createNotificationTriggers, NotificationTypes } from '../services/notificationTriggers';

const POLL_INTERVAL = 60 * 1000; // Poll every minute

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notificationContext = useNotification();
  const { success: showSuccess } = notificationContext;
  const pollIntervalRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const seenNotificationIds = useRef(new Set());

  // Create notification triggers
  const triggers = createNotificationTriggers(notificationContext);

  // Load notifications
  const loadNotifications = useCallback(async (showNewNotifications = false) => {
    try {
      const data = await fetchNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError(null);

      // Show toast for new notifications from backend
      if (showNewNotifications && data.unreadCount > previousUnreadCountRef.current) {
        const newNotifications = (data.notifications || []).filter(
          n => !n.read && !seenNotificationIds.current.has(n.id)
        );
        
        // Process each new notification based on type
        newNotifications.forEach(notification => {
          seenNotificationIds.current.add(notification.id);
          
          // Handle video_published notifications (Requirements: 2.2)
          if (notification.type === NotificationTypes.VIDEO_PUBLISHED || notification.type === 'video_published') {
            triggers.triggerVideoPublished({
              title: notification.data?.videoTitle || notification.title,
              videoId: notification.data?.videoId,
              url: notification.data?.videoUrl,
            });
          } 
          // Handle video publish failed notifications
          else if (notification.type === 'video_publish_failed') {
            triggers.triggerUploadError({
              title: notification.data?.videoTitle || 'Vídeo',
              error: notification.data?.error || notification.message,
              platform: 'YouTube',
            });
          }
          // Handle other notification types with generic toast
          else {
            notificationContext.info(notification.message, {
              title: notification.title,
              duration: 8000,
              action: notification.data?.videoUrl ? {
                label: 'Ver no YouTube',
                onClick: () => window.open(notification.data.videoUrl, '_blank'),
              } : null,
            });
          }
        });
      }

      previousUnreadCountRef.current = data.unreadCount || 0;
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [triggers, notificationContext]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showSuccess('Todas as notificações foram marcadas como lidas');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [showSuccess]);

  // Delete notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Update unread count if the deleted notification was unread
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // Initial load and polling
  useEffect(() => {
    if (!enabled) return;

    // Initial load
    loadNotifications(false);

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      loadNotifications(true);
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, loadNotifications]);

  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    return loadNotifications(false);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  };
}
