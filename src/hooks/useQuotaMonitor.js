/**
 * useQuotaMonitor Hook
 * Monitors YouTube API quota usage and triggers warnings
 * Requirements: 2.5
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { createNotificationTriggers } from '../services/notificationTriggers';

// Storage key for last warning
const LAST_WARNING_KEY = 'viralcuts-last-quota-warning';

// Warning thresholds
const WARNING_THRESHOLDS = {
  LOW: 80,      // 80% - first warning
  MEDIUM: 90,   // 90% - second warning
  HIGH: 95,     // 95% - critical warning
};

/**
 * Get the last warning level shown today
 * @returns {number|null} Last warning threshold or null
 */
function getLastWarningLevel() {
  try {
    const stored = localStorage.getItem(LAST_WARNING_KEY);
    if (!stored) return null;
    
    const { date, level } = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (date !== today) return null;
    
    return level;
  } catch {
    return null;
  }
}

/**
 * Save the warning level shown
 * @param {number} level - Warning threshold level
 */
function saveWarningLevel(level) {
  try {
    localStorage.setItem(LAST_WARNING_KEY, JSON.stringify({
      date: new Date().toDateString(),
      level,
    }));
  } catch (error) {
    console.error('Failed to save warning level:', error);
  }
}

/**
 * Hook for monitoring YouTube API quota usage
 * @param {Object} options - Hook options
 * @param {Object} options.quota - Quota state { used, limit, lastReset }
 * @param {boolean} options.enabled - Whether monitoring is enabled
 * @returns {Object} Quota monitor controls
 */
export function useQuotaMonitor({ quota, enabled = true }) {
  const notificationContext = useNotification();
  const lastCheckedUsedRef = useRef(0);
  const hasInitializedRef = useRef(false);

  // Create notification triggers
  const triggers = notificationContext ? createNotificationTriggers(notificationContext) : null;

  /**
   * Calculate quota percentage
   */
  const getQuotaPercentage = useCallback(() => {
    if (!quota || !quota.limit) return 0;
    return Math.round((quota.used / quota.limit) * 100);
  }, [quota]);

  /**
   * Check if we should show a warning for a given threshold
   * @param {number} threshold - Warning threshold percentage
   * @returns {boolean} True if we should show warning
   */
  const shouldShowWarning = useCallback((threshold) => {
    const lastLevel = getLastWarningLevel();
    
    // If no warning shown today, show if we're at or above threshold
    if (lastLevel === null) return true;
    
    // Only show if this is a higher threshold than last shown
    return threshold > lastLevel;
  }, []);

  /**
   * Check quota and trigger warning if needed
   */
  const checkQuota = useCallback(() => {
    if (!enabled || !triggers || !quota) return;
    
    const percentUsed = getQuotaPercentage();
    
    // Determine which threshold we've crossed
    let thresholdToWarn = null;
    
    if (percentUsed >= WARNING_THRESHOLDS.HIGH) {
      thresholdToWarn = WARNING_THRESHOLDS.HIGH;
    } else if (percentUsed >= WARNING_THRESHOLDS.MEDIUM) {
      thresholdToWarn = WARNING_THRESHOLDS.MEDIUM;
    } else if (percentUsed >= WARNING_THRESHOLDS.LOW) {
      thresholdToWarn = WARNING_THRESHOLDS.LOW;
    }
    
    // If we've crossed a threshold and should show warning
    if (thresholdToWarn && shouldShowWarning(thresholdToWarn)) {
      triggers.triggerQuotaWarning({
        usedQuota: quota.used,
        totalQuota: quota.limit,
        percentUsed,
      });
      saveWarningLevel(thresholdToWarn);
    }
  }, [enabled, triggers, quota, getQuotaPercentage, shouldShowWarning]);

  /**
   * Manually trigger a quota check and warning
   */
  const triggerWarning = useCallback(() => {
    if (!triggers || !quota) return;
    
    const percentUsed = getQuotaPercentage();
    
    triggers.triggerQuotaWarning({
      usedQuota: quota.used,
      totalQuota: quota.limit,
      percentUsed,
    });
    
    return { percentUsed, used: quota.used, limit: quota.limit };
  }, [triggers, quota, getQuotaPercentage]);

  // Monitor quota changes
  useEffect(() => {
    if (!enabled || !quota) return;
    
    // Skip initial check to avoid notification on page load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastCheckedUsedRef.current = quota.used;
      return;
    }
    
    // Only check if quota has increased
    if (quota.used > lastCheckedUsedRef.current) {
      checkQuota();
      lastCheckedUsedRef.current = quota.used;
    }
  }, [enabled, quota, checkQuota]);

  return {
    checkQuota,
    triggerWarning,
    percentUsed: getQuotaPercentage(),
    isWarningLevel: getQuotaPercentage() >= WARNING_THRESHOLDS.LOW,
    isCriticalLevel: getQuotaPercentage() >= WARNING_THRESHOLDS.HIGH,
    thresholds: WARNING_THRESHOLDS,
  };
}

export default useQuotaMonitor;
