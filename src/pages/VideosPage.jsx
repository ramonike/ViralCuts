import React from "react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { PipelineSection } from "../components/dashboard/PipelineSection";
import { SharedUploadQueue } from "../components/shared/SharedUploadQueue";
import { PageLayout } from "../components/layout/PageLayout";

export default function VideosPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();

    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.addToQueue(item);
                } catch (error) {
                    actions.addToUploadQueue(item);
                }
            } else {
                actions.addToUploadQueue(item);
            }
        }
    };

    return (
        <PageLayout 
            title="Criação e Vídeos"
            subtitle="Ferramentas de criação, bibliotecas de vídeo e gerenciamento de uploads."
            maxWidth="7xl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content - Central de Criação */}
                <div className="lg:col-span-8">
                    <PipelineSection
                        state={{
                            ...state,
                            uploadQueue: supabase.user ? supabase.uploadQueue : state.uploadQueue
                        }}
                        actions={hybridActions}
                    />
                </div>

                {/* Upload Queue Sidebar */}
                <div className="lg:col-span-4">
                    <SharedUploadQueue />
                </div>
            </div>
        </PageLayout>
    );
}
