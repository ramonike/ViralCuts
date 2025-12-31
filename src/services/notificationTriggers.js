/**
 * Notification Triggers Service
 * Centralized service for triggering notifications based on app events
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

/**
 * Notification types matching the design document
 */
export const NotificationTypes = {
  UPLOAD_COMPLETE: 'upload_complete',
  UPLOAD_ERROR: 'upload_error',
  VIDEO_PUBLISHED: 'video_published',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  STREAK_REMINDER: 'streak_reminder',
  QUOTA_WARNING: 'quota_warning',
  SYSTEM: 'system',
};

/**
 * Create notification trigger functions bound to a notification context
 * @param {Object} notificationContext - The notification context from useNotification hook
 * @returns {Object} Object containing all trigger functions
 */
export function createNotificationTriggers(notificationContext) {
  const { addNotification, addToHistory, isNotificationTypeEnabled } = notificationContext;

  /**
   * Trigger notification for upload complete (success)
   * Requirements: 2.1
   * @param {Object} params - Upload details
   * @param {string} params.title - Video title
   * @param {string} params.videoId - YouTube video ID
   * @param {string} params.url - Video URL
   * @param {string} params.platform - Platform name (youtube, tiktok, etc.)
   */
  const triggerUploadComplete = ({ title, videoId, url, platform = 'YouTube' }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.UPLOAD_COMPLETE)) return;

    addNotification({
      type: 'success',
      title: '✅ Upload Concluído',
      message: `"${title}" foi enviado com sucesso para ${platform}!`,
      duration: 8000,
      notificationType: NotificationTypes.UPLOAD_COMPLETE,
      actionUrl: url,
      persist: true,
      metadata: {
        videoId,
        platform,
        videoTitle: title,
      },
      action: url ? {
        label: 'Ver vídeo',
        onClick: () => window.open(url, '_blank'),
      } : null,
    });
  };

  /**
   * Trigger notification for upload error
   * Requirements: 2.1
   * @param {Object} params - Error details
   * @param {string} params.title - Video title
   * @param {string} params.error - Error message
   * @param {string} params.platform - Platform name
   * @param {Function} params.onRetry - Retry callback
   */
  const triggerUploadError = ({ title, error, platform = 'YouTube', onRetry }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.UPLOAD_ERROR)) return;

    addNotification({
      type: 'error',
      title: '❌ Erro no Upload',
      message: `Falha ao enviar "${title}" para ${platform}: ${error}`,
      duration: 10000,
      notificationType: NotificationTypes.UPLOAD_ERROR,
      persist: true,
      metadata: {
        platform,
        videoTitle: title,
        error,
      },
      action: onRetry ? {
        label: 'Tentar novamente',
        onClick: onRetry,
      } : null,
    });
  };

  /**
   * Trigger notification for scheduled video published
   * Requirements: 2.2
   * @param {Object} params - Video details
   * @param {string} params.title - Video title
   * @param {string} params.videoId - Video ID
   * @param {string} params.url - Video URL
   */
  const triggerVideoPublished = ({ title, videoId, url }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.VIDEO_PUBLISHED)) return;

    addNotification({
      type: 'success',
      title: '🎉 Vídeo Publicado!',
      message: `"${title}" foi publicado com sucesso no YouTube.`,
      duration: 10000,
      notificationType: NotificationTypes.VIDEO_PUBLISHED,
      actionUrl: url,
      persist: true,
      metadata: {
        videoId,
        videoTitle: title,
        publishedAt: new Date().toISOString(),
      },
      action: url ? {
        label: 'Ver no YouTube',
        onClick: () => window.open(url, '_blank'),
      } : null,
    });
  };

  /**
   * Trigger notification for achievement unlocked
   * Requirements: 2.3
   * @param {Object} params - Achievement details
   * @param {string} params.title - Achievement title
   * @param {string} params.description - Achievement description
   * @param {string} params.icon - Achievement icon
   * @param {number} params.points - Points earned
   */
  const triggerAchievementUnlocked = ({ title, description, icon = '🏆', points = 0 }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.ACHIEVEMENT_UNLOCKED)) return;

    const pointsText = points > 0 ? ` (+${points} pontos)` : '';
    
    addNotification({
      type: 'success',
      title: `${icon} Conquista Desbloqueada!`,
      message: `${title}${pointsText}`,
      duration: 8000,
      notificationType: NotificationTypes.ACHIEVEMENT_UNLOCKED,
      persist: true,
      metadata: {
        achievementTitle: title,
        description,
        icon,
        points,
        unlockedAt: new Date().toISOString(),
      },
    });
  };

  /**
   * Trigger streak reminder notification
   * Requirements: 2.4
   * @param {Object} params - Streak details
   * @param {number} params.currentStreak - Current streak count
   * @param {number} params.hoursRemaining - Hours remaining to maintain streak
   */
  const triggerStreakReminder = ({ currentStreak = 0, hoursRemaining = 0 }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.STREAK_REMINDER)) return;

    const streakText = currentStreak > 0 
      ? `Você está em uma sequência de ${currentStreak} dias!` 
      : 'Comece sua sequência hoje!';
    
    const urgencyText = hoursRemaining <= 2 
      ? '⚠️ Últimas horas!' 
      : hoursRemaining <= 6 
        ? '⏰ Ainda dá tempo!' 
        : '';

    addNotification({
      type: 'warning',
      title: `🔥 Lembrete de Streak ${urgencyText}`,
      message: `${streakText} Poste um vídeo para manter sua sequência.`,
      duration: 10000,
      notificationType: NotificationTypes.STREAK_REMINDER,
      persist: true,
      metadata: {
        currentStreak,
        hoursRemaining,
        reminderAt: new Date().toISOString(),
      },
    });
  };

  /**
   * Trigger quota warning notification
   * Requirements: 2.5
   * @param {Object} params - Quota details
   * @param {number} params.usedQuota - Used quota units
   * @param {number} params.totalQuota - Total quota units
   * @param {number} params.percentUsed - Percentage used
   */
  const triggerQuotaWarning = ({ usedQuota, totalQuota, percentUsed }) => {
    if (!isNotificationTypeEnabled(NotificationTypes.QUOTA_WARNING)) return;

    const severity = percentUsed >= 95 ? 'error' : percentUsed >= 90 ? 'warning' : 'info';
    const emoji = percentUsed >= 95 ? '🚨' : percentUsed >= 90 ? '⚠️' : '📊';
    
    addNotification({
      type: severity,
      title: `${emoji} Aviso de Quota YouTube`,
      message: `Você usou ${percentUsed}% da sua quota diária (${usedQuota.toLocaleString()}/${totalQuota.toLocaleString()} unidades).`,
      duration: severity === 'error' ? 15000 : 10000,
      notificationType: NotificationTypes.QUOTA_WARNING,
      persist: true,
      metadata: {
        usedQuota,
        totalQuota,
        percentUsed,
        warningAt: new Date().toISOString(),
      },
    });
  };

  return {
    triggerUploadComplete,
    triggerUploadError,
    triggerVideoPublished,
    triggerAchievementUnlocked,
    triggerStreakReminder,
    triggerQuotaWarning,
    NotificationTypes,
  };
}

/**
 * Hook-friendly version that can be used directly in components
 * @param {Object} notificationContext - The notification context
 * @returns {Object} Notification triggers
 */
export function useNotificationTriggers(notificationContext) {
  return createNotificationTriggers(notificationContext);
}

export default createNotificationTriggers;
