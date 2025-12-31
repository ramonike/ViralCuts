import React from "react";
import { useDashboardState } from "../../hooks/useDashboardState";
import { useSupabaseDashboard } from "../../hooks/useSupabaseDashboard";
import { UploadQueuePanel } from "../dashboard/UploadQueuePanel";

export function SharedUploadQueue() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();

    // Hybrid actions: Use Supabase when available, fallback to localStorage
    const hybridActions = {
        ...actions,
        addToUploadQueue: supabase.user ? supabase.actions.addToUploadQueue : actions.addToUploadQueue,
        markQueueStatus: supabase.user ? supabase.actions.markQueueStatus : actions.markQueueStatus,
        removeQueueItem: supabase.user ? supabase.actions.removeQueueItem : actions.removeQueueItem,
    };

    return (
        <UploadQueuePanel
            uploadQueue={supabase.user ? supabase.uploadQueue : state.uploadQueue}
            markQueueStatus={hybridActions.markQueueStatus}
            removeQueueItem={hybridActions.removeQueueItem}
            isLoading={supabase.loading}
        />
    );
}