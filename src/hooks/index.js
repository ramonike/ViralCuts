/**
 * Barrel export para hooks customizados
 */

// Hook principal do dashboard
export { useDashboardState, exportCSV } from './useDashboardState';

// Hooks individuais (para uso granular)
export { useSettings } from './useSettings';
export { useUploadQueue } from './useUploadQueue';
export { useYouTubeAuth } from './useYouTubeAuth';
export { useChecklists } from './useChecklists';
export { useCalendarHistory } from './useCalendarHistory';
export { usePipeline } from './usePipeline';

// Utilitários de storage
export { 
    loadState, 
    saveState, 
    defaultState, 
    defaultSettings,
    defaultChecklists,
    defaultAuth 
} from './useStorage';

// Hooks de UI/UX
export { useErrorHandler } from './useErrorHandler';
export { 
    useKeyboardNavigation, 
    useAnnounce, 
    useFocusTrap 
} from './useKeyboardNavigation';

// Hook de Supabase
export { useSupabaseDashboard } from './useSupabaseDashboard';

// Notification-related hooks
export { useNotifications } from './useNotifications';
export { useStreakReminder } from './useStreakReminder';
export { useQuotaMonitor } from './useQuotaMonitor';

// Analytics hooks
export { useAnalytics, DATE_RANGE_OPTIONS } from './useAnalytics';
