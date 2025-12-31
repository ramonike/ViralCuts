/**
 * Notifications API
 * Frontend API for managing user notifications
 * Requirements: 4.3
 */

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

  const response = await fetch(`/api/notifications?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean}>}
 */
export async function markNotificationAsRead(notificationId) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to mark notification as read');
  }

  return response.json();
}

/**
 * Mark all notifications as read
 * @returns {Promise<{success: boolean}>}
 */
export async function markAllNotificationsAsRead() {
  const response = await fetch('/api/notifications/read-all', {
    method: 'PUT',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to mark all notifications as read');
  }

  return response.json();
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteNotification(notificationId) {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to delete notification');
  }

  return response.json();
}

/**
 * Delete all notifications
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteAllNotifications() {
  const response = await fetch('/api/notifications', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to delete all notifications');
  }

  return response.json();
}
