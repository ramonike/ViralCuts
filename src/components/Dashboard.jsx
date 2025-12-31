import React, { useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, API_URL } from '../config/api';
import { PlusCircle, LayoutDashboard, Share2, Check, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FloatingCTA } from "./ui/FloatingCTA";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { SidebarLeft } from "./dashboard/SidebarLeft";
import { SidebarRight } from "./dashboard/SidebarRight";
import { ChecklistSection } from "./dashboard/ChecklistSection";
import { PipelineSection } from "./dashboard/PipelineSection";
import EmailVerificationBanner from "./EmailVerificationBanner";

export default function Dashboard() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard(); // Supabase integration for upload queue
    const [shareLink, setShareLink] = useState("");
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [user, setUser] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") setShareLink(window.location.href);

        // Check session and get user data
        fetch(API_ENDPOINTS.AUTH.SESSION, {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch((err) => console.error('Failed to get session:', err));
    }, []);

    async function copyLink() {
        if (!shareLink) return;
        try {
            await navigator.clipboard.writeText(shareLink);
            setIsCopied(true);
            setMessage("Link copiado para a área de transferência!");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.warn("Clipboard API failed, trying fallback:", err);
            // Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = shareLink;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                setIsCopied(true);
                setMessage("Link copiado!");
                setTimeout(() => setIsCopied(false), 2000);
            } catch (fallbackErr) {
                console.error("Fallback copy failed:", fallbackErr);
                setMessage("Não foi possível copiar o link.");
            }
        }
    }

    function seedExample() {
        actions.addToUploadQueue({ title: "Cachorro salva dono em 10s — impossível não rir", source: "clipper", platform: "YouTube Shorts", scheduledAt: new Date().toISOString() });
    }

    // Hybrid actions: Use Supabase when available, fallback to localStorage
    const hybridActions = {
        ...actions,
        addToUploadQueue: async (item) => {
            if (supabase.user && !supabase.loading) {
                // Use Supabase for authenticated users
                try {
                    await supabase.actions.addToQueue(item);
                } catch (error) {
                    console.error('Supabase upload failed, falling back to localStorage:', error);
                    actions.addToUploadQueue(item);
                }
            } else {
                // Fallback to localStorage
                actions.addToUploadQueue(item);
            }
        },
        moveVideoInHistory: async (fromDate, toDate, videoId) => {
            if (supabase.user && !supabase.loading) {
                try {
                    // In Supabase, just update the date field
                    // The video is identified by its ID, not by date
                    // This would require a new helper function in supabase.js
                    // For now, fallback to localStorage
                    actions.moveVideoInHistory(fromDate, toDate, videoId);
                } catch (error) {
                    console.error('Supabase move failed, falling back to localStorage:', error);
                    actions.moveVideoInHistory(fromDate, toDate, videoId);
                }
            } else {
                actions.moveVideoInHistory(fromDate, toDate, videoId);
            }
        },
        removeHistoryItem: async (date, videoId) => {
            if (supabase.user && !supabase.loading) {
                try {
                    // Would need deleteVideoHistory helper
                    // For now, fallback
                    actions.removeHistoryItem(date, videoId);
                } catch (error) {
                    console.error('Supabase delete failed, falling back to localStorage:', error);
                    actions.removeHistoryItem(date, videoId);
                }
            } else {
                actions.removeHistoryItem(date, videoId);
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
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
            {/* Header fixo */}
            <header className="sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-xl shadow-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main header row */}
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab("dashboard")}>
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-blue-500 drop-shadow-sm group-hover:scale-105 transition-transform">
                                    ViralCuts
                                </h1>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-wide uppercase">Creator Dashboard v1.0</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab("dashboard")}
                                className={`transition-all ${activeTab === "dashboard" ? "bg-slate-700 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                            </Button>

                            {/* O botão 'Sair' foi removido daqui conforme pedido, pois agora estará na Sidebar */}
                        </nav>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center gap-1 pb-3 pt-2 border-t border-slate-700/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("dashboard")}
                            className={`flex-1 transition-all ${activeTab === "dashboard" ? "bg-slate-700 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            {/* Conteúdo principal */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                {/* Email Verification Banner */}
                {user && !user.emailVerified && (
                    <EmailVerificationBanner userEmail={user.email} />
                )}

                {activeTab === "dashboard" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Left Sidebar - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:block lg:col-span-3">
                            <SidebarLeft state={state} actions={actions} />
                        </div>

                        {/* Main Content */}
                        <section className="lg:col-span-6 flex flex-col gap-4 md:gap-6">
                            <ChecklistSection state={state} actions={actions} />
                            <PipelineSection
                                state={{
                                    ...state,
                                    uploadQueue: supabase.user ? supabase.uploadQueue : state.uploadQueue
                                }}
                                actions={hybridActions}
                            />
                        </section>

                        {/* Right Sidebar */}
                        <div className="lg:col-span-3">
                            <SidebarRight
                                state={{
                                    ...state,
                                    uploadQueue: supabase.user ? supabase.uploadQueue : state.uploadQueue,
                                    history: supabase.user ? supabase.history : state.history
                                }}
                                actions={hybridActions}
                            />
                        </div>
                    </div>
                )}

                {/* Rodapé */}
                <footer className="mt-12 md:mt-16 text-center text-xs text-slate-500 pb-8">
                    Feito para seguir o planejamento de 30 dias — pronto para integrar scripts FFmpeg e YouTube/TikTok APIs.
                </footer>
            </main>

            {/* Toast simples para mensagens */}
            {message && (
                <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded shadow-lg text-sm z-50 animate-in fade-in slide-in-from-bottom-2">
                    {message}
                    <button onClick={() => setMessage("")} className="ml-2 font-bold text-slate-400 hover:text-white">x</button>
                </div>
            )}

            {/* Floating CTA */}
            <FloatingCTA
                text={state.settings.ctaText}
                href={state.settings.ctaLink}
                delay={5000}
            />
        </div>
    );
}
