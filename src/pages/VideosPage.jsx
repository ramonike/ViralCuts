import React, { useState, useRef, useMemo } from "react";
import {
    Upload, Play, Eye, ThumbsUp, Clock, Search,
    RefreshCw, ExternalLink, MoreVertical, Filter,
    Youtube, Sparkles, ArrowUpRight, Video, X
} from "lucide-react";
import { useDashboardState } from "../hooks/useDashboardState";
import { useSupabaseDashboard } from "../hooks/useSupabaseDashboard";
import { SharedUploadQueue } from "../components/shared/SharedUploadQueue";
import { PageLayout } from "../components/layout/PageLayout";
import { useTheme } from "../contexts/ThemeContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatNum = (n) => {
    if (!n) return "0";
    const v = parseInt(n);
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
    if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
    return v.toLocaleString("pt-BR");
};

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

const AI_TOOLS = [
    { id: "vizard", name: "Vizard.ai", desc: "Cortes com IA", url: "https://vizard.ai/workspace", emoji: "🎬", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
    { id: "opus", name: "OpusClip", desc: "Shorts virais", url: "https://www.opus.pro/", emoji: "✂️", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
    { id: "klap", name: "Klap", desc: "Edição automática", url: "https://klap.app/", emoji: "⚡", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
    { id: "submagic", name: "Submagic", desc: "Legendas", url: "https://www.submagic.co/", emoji: "💬", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
];

// ─── Upload Zone ─────────────────────────────────────────────────────────────
function UploadZone({ onUpload, isDark }) {
    const [dragging, setDragging] = useState(false);
    const [privacy, setPrivacy] = useState("private");
    const fileRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith("video/")) onUpload(file, privacy);
    };

    return (
        <div
            className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer ${dragging
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : isDark ? "border-surface-600 hover:border-primary/50 bg-surface-800/30" : "border-gray-300 hover:border-primary/50 bg-gray-50"
                }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { onUpload(f, privacy); e.target.value = ""; }
            }} />
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform ${dragging ? "scale-110" : ""} ${isDark ? "bg-primary/10" : "bg-primary/10"}`}>
                    <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {dragging ? "Solte o vídeo aqui" : "Enviar vídeo agora para o YouTube"}
                </p>
                <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>MP4, MOV, AVI até 256GB · Publicação imediata</p>
                <p className={`text-[11px] mb-4 ${isDark ? "text-slate-600" : "text-gray-400"}`}>Para agendar com data e hora, use a aba <strong>Calendário</strong></p>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>Privacidade:</span>
                    <select
                        value={privacy}
                        onChange={e => setPrivacy(e.target.value)}
                        className={`text-xs rounded-lg px-2 py-1 border focus:outline-none ${isDark ? "bg-surface-900 border-surface-600 text-slate-300" : "bg-white border-gray-200 text-gray-700"}`}
                    >
                        <option value="private">🔒 Privado</option>
                        <option value="public">🌍 Público</option>
                        <option value="unlisted">🔗 Não listado</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, isDark }) {
    // Estrutura flat: { id, title, publishedAt, thumbnail, thumbnails, viewCount, likeCount, url }
    const videoId = typeof video.id === "object" ? video.id?.videoId : video.id;
    const thumb = video.thumbnail || video.thumbnails?.medium?.url || video.thumbnails?.default?.url;
    const title = video.title || "Sem título";
    const viewCount = video.viewCount ?? 0;
    const likeCount = video.likeCount ?? 0;
    const publishedAt = video.publishedAt;
    const videoUrl = video.url || `https://youtube.com/watch?v=${videoId}`;

    return (
        <div className={`rounded-xl border overflow-hidden group transition-all hover:scale-[1.01] ${isDark ? "bg-surface-800/50 border-surface-700/50 hover:border-primary/30" : "bg-white border-gray-200 hover:border-primary/30"} shadow-sm`}>
            {/* Thumbnail */}
            <div className="relative aspect-video bg-surface-900 overflow-hidden">
                {thumb ? (
                    <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={e => e.stopPropagation()}>
                        <Play className="w-4 h-4 text-slate-900 ml-0.5" />
                    </a>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className={`text-sm font-medium line-clamp-2 mb-2 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {title}
                </p>
                <div className={`flex items-center gap-3 text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(viewCount)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{formatNum(likeCount)}</span>
                    <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{formatDate(publishedAt)}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Ferramentas IA ───────────────────────────────────────────────────────────
function AIToolsBar({ isDark }) {
    return (
        <div className={`rounded-xl border p-4 ${isDark ? "bg-surface-800/30 border-surface-700/50" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}>Ferramentas de edição</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AI_TOOLS.map(tool => (
                    <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2.5 rounded-lg border bg-gradient-to-br ${tool.color} hover:scale-[1.02] transition-all`}>
                        <span className="text-base">{tool.emoji}</span>
                        <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{tool.name}</p>
                            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-gray-500"}`}>{tool.desc}</p>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-slate-400 ml-auto" />
                    </a>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideosPage() {
    const { state, actions } = useDashboardState();
    const supabase = useSupabaseDashboard();
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // all | public | private | unlisted

    // Vídeos reais do canal
    const allVideos = state.recentUploads || [];

    const filteredVideos = useMemo(() => {
        return allVideos.filter(v => {
            const title = v.title || "";
            const matchSearch = title.toLowerCase().includes(search.toLowerCase());
            const matchFilter = filter === "all";
            return matchSearch && matchFilter;
        });
    }, [allVideos, search, filter]);

    const handleUpload = (file, privacy) => {
        const item = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            source: "upload",
            platform: "YouTube",
            file,
            privacyStatus: privacy,
        };
        if (supabase.user) {
            supabase.actions.addToQueue(item).catch(() => actions.addToUploadQueue(item));
        } else {
            actions.addToUploadQueue(item);
        }
    };

    return (
        <PageLayout title="Vídeos" subtitle="Gerencie seu canal, faça uploads e acompanhe seus vídeos." maxWidth="7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── Coluna principal ── */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Upload */}
                    <UploadZone onUpload={handleUpload} isDark={isDark} />

                    {/* Biblioteca do canal */}
                    <div>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Meus vídeos
                                {allVideos.length > 0 && <span className={`ml-2 text-xs font-normal ${isDark ? "text-slate-500" : "text-gray-400"}`}>({allVideos.length})</span>}
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Filtro */}
                                <select
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className={`text-xs rounded-lg px-2 py-1.5 border focus:outline-none ${isDark ? "bg-surface-800 border-surface-600 text-slate-300" : "bg-white border-gray-200 text-gray-700"}`}
                                >
                                    <option value="all">Todos</option>
                                    <option value="public">Públicos</option>
                                    <option value="private">Privados</option>
                                    <option value="unlisted">Não listados</option>
                                </select>
                                {/* Busca */}
                                <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar vídeo..."
                                        className={`text-xs rounded-lg pl-7 pr-3 py-1.5 border focus:outline-none w-40 ${isDark ? "bg-surface-800 border-surface-600 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-gray-800"}`}
                                    />
                                    {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-slate-500" /></button>}
                                </div>
                                {/* Refresh */}
                                <button
                                    onClick={() => actions.refreshChannelStats()}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white border border-surface-600" : "bg-white hover:bg-gray-50 text-gray-400 border border-gray-200"}`}
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {filteredVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredVideos.map((video, i) => (
                                    <VideoCard key={video.id?.videoId || video.id || i} video={video} isDark={isDark} />
                                ))}
                            </div>
                        ) : allVideos.length === 0 ? (
                            <div className={`rounded-2xl border-2 border-dashed p-12 text-center ${isDark ? "border-surface-700" : "border-gray-200"}`}>
                                <Youtube className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                <p className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Nenhum vídeo encontrado</p>
                                <p className={`text-xs ${isDark ? "text-slate-600" : "text-gray-400"}`}>Conecte seu YouTube ou sincronize para ver seus vídeos aqui</p>
                            </div>
                        ) : (
                            <div className={`rounded-xl p-8 text-center ${isDark ? "bg-surface-800/30" : "bg-gray-50"}`}>
                                <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}>Nenhum vídeo corresponde à busca</p>
                            </div>
                        )}
                    </div>

                    {/* Ferramentas IA */}
                    <AIToolsBar isDark={isDark} />
                </div>

                {/* ── Sidebar: Fila ── */}
                <div className="lg:col-span-4">
                    <div className="sticky top-6">
                        <SharedUploadQueue />
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}
