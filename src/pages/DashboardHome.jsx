import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { CreatorJourney } from "../components/journey/CreatorJourney";
import { SharedUploadQueue } from "../components/shared/SharedUploadQueue";
import { PageLayout } from "../components/layout/PageLayout";

export default function DashboardHome() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();

    // Hybrid actions: Use Supabase when available, fallback to localStorage
    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.addToQueue(item);
                } catch (error) {
                    console.error('Supabase upload failed, falling back to localStorage:', error);
                    actions.addToUploadQueue(item);
                }
            } else {
                actions.addToUploadQueue(item);
            }
        },
        updateSettings: async (newSettings) => {
            if (supabase.user && !supabase.loading) {
                try {
                    await supabase.actions.saveSettings(newSettings);
                } catch (error) {
                    console.error('Supabase settings save failed, falling back to localStorage:', error);
                    actions.updateSettings(newSettings);
                }
            } else {
                actions.updateSettings(newSettings);
            }
        }
    };

    return (
        <PageLayout maxWidth="7xl" spacing="standard">
            {/* Centered Layout - Jornada do Criador e Fila de Uploads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Jornada do Criador - Lado esquerdo */}
                <div className="h-[480px]">
                    <CreatorJourney />
                </div>

                {/* Fila de Uploads - Lado direito */}
                <div className="h-[480px]">
                    <SharedUploadQueue />
                </div>

            </div>
        </PageLayout>
    );
}
