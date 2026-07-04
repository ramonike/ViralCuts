/**
 * Notifications API
 * Frontend API for managing user notifications
 * Requirements: 4.3
 */

import { fetchAPI } from '../lib/api-client';

/**
 * Fetch notifications for the current user
 * @param {Object} options - Fetch options
 * @param {number} options.limit - Maximum number of notifications to return
 * @param {boolean} options.unreadOnly - Only return unread notifications
 * @returns {Promise<{notifications: Array, unreadCount: number}>}
 */
export async function fetchNotifications({ limit = 50, unreadOnly = false } = {}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    unreadOnly: unreadOnly.toString(),
  });

  return fetchAPI(`/notifications?${params}`);
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean}>}
 */
export async function markNotificationAsRead(notificationId) {
  return fetchAPI(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

/**
 * Mark all notifications as read
 * @returns {Promise<{success: boolean}>}
 */
export async function markAllNotificationsAsRead() {
  return fetchAPI('/notifications/read-all', {
    method: 'PUT',
  });
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteNotification(notificationId) {
  return fetchAPI(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

/**
 * Delete all notifications
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteAllNotifications() {
  return fetchAPI('/notifications', {
    method: 'DELETE',
  });
}
