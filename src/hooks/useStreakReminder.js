/**
 * useStreakReminder Hook
 * Monitors user posting activity and sends streak reminders
 * Requirements: 2.4
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { createNotificationTriggers } from '../services/notificationTriggers';

// Check interval: every hour
const CHECK_INTERVAL = 60 * 60 * 1000;

// Storage key for last reminder
const LAST_REMINDER_KEY = 'viralcuts-last-streak-reminder';

/**
 * Get hours remaining until end of day (midnight)
 * @returns {number} Hours remaining
 */
function getHoursUntilEndOfDay() {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const msRemaining = endOfDay.getTime() - now.getTime();
  return Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
}

/**
 * Check if user has posted today
 * @param {Object} history - Upload history from dashboard state
 * @returns {boolean} True if user posted today
 */
function hasPostedToday(history) {
  if (!history) return false;
  
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const todayData = history[today];
  
  if (!todayData) return false;
  
  // Check if there are any uploads or completed items today
  const hasUploads = (todayData.uploads || 0) > 0;
  const hasCompletedItems = (todayData.completedItems?.length || 0) > 0;
  const hasUploadedVideos = (todayData.uploadedVideos?.length || 0) > 0;
  
  return hasUploads || hasCompletedItems || hasUploadedVideos;
}

/**
 * Check if we should show a reminder
 * @returns {boolean} True if we should show reminder
 */
function shouldShowReminder() {
  const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
  if (!lastReminder) return true;
  
  const lastReminderDate = new Date(lastReminder);
  const today = new Date();
  
  // Only show one reminder per day
  return lastReminderDate.toDateString() !== today.toDateString();
}

/**
 * Mark that we showed a reminder today
 */
function markReminderShown() {
  localStorage.setItem(LAST_REMINDER_KEY, new Date().toISOString());
}

/**
 * Hook for managing streak reminders
 * @param {Object} options - Hook options
 * @param {Object} options.history - Upload history from dashboard state
 * @param {number} options.currentStreak - Current streak count
 * @param {boolean} options.enabled - Whether reminders are enabled
 * @returns {Object} Streak reminder controls
 */
export function useStreakReminder({ history, currentStreak = 0, enabled = true }) {
  const notificationContext = useNotification();
  const checkIntervalRef = useRef(null);
  const hasCheckedRef = useRef(false);

  // Create notification triggers
  const triggers = notificationContext ? createNotificationTriggers(notificationContext) : null;

  /**
   * Check and potentially send streak reminder
   */
  const checkStreak = useCallback(() => {
    if (!enabled || !triggers) return;
    
    // Don't check if user has already posted today
    if (hasPostedToday(history)) {
      return;
    }
    
    // Don't show multiple reminders per day
    if (!shouldShowReminder()) {
      return;
    }
    
    const hoursRemaining = getHoursUntilEndOfDay();
    
    // Only send reminder in the evening (after 6 PM) or if less than 6 hours remain
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 18 || hoursRemaining <= 6) {
      triggers.triggerStreakReminder({
        currentStreak,
        hoursRemaining,
      });
      markReminderShown();
    }
  }, [enabled, history, currentStreak, triggers]);

  /**
   * Manually trigger a streak check
   */
  const triggerCheck = useCallback(() => {
    if (!enabled || !triggers) return;
    
    if (hasPostedToday(history)) {
      return { posted: true, message: 'Você já postou hoje!' };
    }
    
    const hoursRemaining = getHoursUntilEndOfDay();
    triggers.triggerStreakReminder({
      currentStreak,
      hoursRemaining,
    });
    
    return { posted: false, hoursRemaining };
  }, [enabled, history, currentStreak, triggers]);

  // Set up periodic check
  useEffect(() => {
    if (!enabled) return;

    // Initial check (delayed to avoid immediate notification on page load)
    const initialCheckTimeout = setTimeout(() => {
      if (!hasCheckedRef.current) {
        hasCheckedRef.current = true;
        checkStreak();
      }
    }, 5000); // Wait 5 seconds after mount

    // Set up interval for periodic checks
    checkIntervalRef.current = setInterval(checkStreak, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialCheckTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkStreak]);

  return {
    checkStreak,
    triggerCheck,
    hasPostedToday: hasPostedToday(history),
    hoursRemaining: getHoursUntilEndOfDay(),
  };
}

export default useStreakReminder;
