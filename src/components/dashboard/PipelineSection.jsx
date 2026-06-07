import React, { useState, useRef } from "react";
import { Link as LinkIcon, Upload, Sparkles, Search, RefreshCw, Zap, Video, ExternalLink } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useJourney } from "../../contexts/JourneyContext";
import { cn } from "../../lib/utils";

const aiTools = [
    {
        id: "vizard",
        name: "Vizard.ai",
        description: "Cortes com IA",
        url: "https://vizard.ai/workspace",
        color: "from-purple-500 to-pink-500",
        icon: "🎬"
    },
    {
        id: "opus",
        name: "OpusClip",
        description: "Shorts Virais",
        url: "https://www.opus.pro/",
        color: "from-blue-500 to-cyan-500",
        icon: "✂️"
    },
    {
        id: "klap",
        name: "Klap",
        description: "Edição Auto",
        url: "https://klap.app/",
        color: "from-green-500 to-emerald-500",
        icon: "⚡"
    },
    {
        id: "submagic",
        name: "Submagic",
        description: "Legendas",
        url: "https://www.submagic.co/",
        color: "from-orange-500 to-red-500",
        icon: "💫"
    }
];

const videoLibraries = [
    { name: "Mixkit", url: "https://mixkit.co/free-stock-video/", icon: "🎥" },
    { name: "Pexels", url: "https://www.pexels.com/videos/", icon: "📹" },
    { name: "Pixabay", url: "https://pixabay.com/videos/", icon: "🎞️" },
    { name: "Coverr", url: "https://coverr.co/", icon: "🌟" }
];

export function PipelineSection({ state, actions, onShowMessage }) {
    const { addToUploadQueue, refreshChannelStats } = actions;
    const { suggestions } = state;
    const { markToolUsed, updateProgress, incrementVideoCount } = useJourney();

    const [activeAITool, setActiveAITool] = useState("vizard");
    const [urlInput, setUrlInput] = useState("");
    const [privacyStatus, setPrivacyStatus] = useState("private");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const fileInputRef = useRef(null);

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) {
            processUpload(file);
            e.target.value = "";
        }
    }

    function processUpload(file) {
        addToUploadQueue({
            title: file.name.replace(/\.[^/.]+$/, ""),
            source: "upload",
            platform: "YouTube Shorts",
            file: file,
            privacyStatus: privacyStatus,
            // scheduledAt not set here (manual schedule later)
        });

        incrementVideoCount();
        updateProgress('first-upload');
        if (onShowMessage) onShowMessage("Vídeo adicionado à fila! 🚀");
    }

    const handleToolClick = (toolId) => {
        markToolUsed(toolId);
        updateProgress('first-ai-tool');
        const tool = aiTools.find(t => t.id === toolId);
        if (tool) window.open(tool.url, "_blank");
    };

    const handleUrlPaste = (e) => {
        const url = e.clipboardData.getData('text');
        setUrlInput(url);
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            handleToolClick(activeAITool);
        }
    };

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. AI Studio (Hero - Full Width on Mobile, Col-span-2 on Desktop if we want, but let's do 2-cols) */}
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-purple-600/20 transition-all duration-700"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Estúdio IA</h2>
                                <p className="text-sm text-slate-400">Gere clips virais a partir de links do YouTube</p>
                            </div>
                        </div>

                        {/* Tool Selector */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {aiTools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setActiveAITool(tool.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                                        activeAITool === tool.id
                                            ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20"
                                            : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                                    )}
                                >
                                    <span className="text-xl">{tool.icon}</span>
                                    <div>
                                        <div className={cn("text-xs font-bold", activeAITool === tool.id ? "text-purple-300" : "text-slate-300")}>{tool.name}</div>
                                        <div className="text-[10px] text-slate-500 hidden sm:block">{tool.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Input Action Area */}
                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onPaste={handleUrlPaste}
                                placeholder="Cole o link do YouTube aqui para gerar cortes..."
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-4 pl-10 pr-36 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                            />
                            <button
                                onClick={() => handleToolClick(activeAITool)}
                                className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-500/25"
                            >
                                <span>Criar em {aiTools.find(t => t.id === activeAITool)?.name}</span>
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Upload Card */}
                <div
                    className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-300 group border-dashed relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) processUpload(file);
                    }}
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileSelect} />

                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Upload Rápido</h3>
                    <p className="text-xs text-slate-400 max-w-[200px] mb-4">Arraste arquivos ou clique para enviar direto para a fila</p>

                    {/* Settings Mini */}
                    <div className="flex items-center gap-2 text-[10px] bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50" onClick={e => e.stopPropagation()}>
                        <select
                            value={privacyStatus}
                            onChange={(e) => setPrivacyStatus(e.target.value)}
                            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer hover:text-white"
                        >
                            <option value="private">Privado</option>
                            <option value="public">Público</option>
                            <option value="unlisted">Não Listado</option>
                        </select>
                    </div>
                </div>

                {/* 3. Resources & Libraries */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-bold text-white">Bibliotecas</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {videoLibraries.map((lib, i) => (
                            <a
                                key={i}
                                href={lib.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:bg-slate-800 hover:border-green-500/30 transition-all group"
                            >
                                <span className="text-lg">{lib.icon}</span>
                                <span className="text-xs font-medium text-slate-300 group-hover:text-white">{lib.name}</span>
                            </a>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 text-center">Vídeos sem direitos autorais para background</p>
                </div>

                {/* 4. Viral Suggestions (Full Width) */}
                <div className="md:col-span-2 bg-slate-800/20 rounded-2xl border border-slate-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <h3 className="text-sm font-bold text-white">Sugestões Virais do YouTube</h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && refreshChannelStats(true, searchTerm)}
                                    placeholder="Buscar tema..."
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                                />
                            </div>
                            <button
                                onClick={() => refreshChannelStats(true)}
                                className={cn("p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-yellow-400 transition-colors", isLoadingSuggestions && "animate-spin")}
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {isLoadingSuggestions ? (
                            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-slate-800" />)
                        ) : suggestions && suggestions.length > 0 ? (
                            suggestions.slice(0, 4).map((sug, idx) => {
                                const videoId = typeof sug.id === 'object' ? sug.id.videoId : (sug.videoId || sug.id);
                                return (
                                    <a
                                        key={idx}
                                        href={`https://youtube.com/watch?v=${videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group bg-slate-900/50 rounded-xl p-3 border border-slate-800 hover:border-yellow-500/30 transition-all flex gap-3 items-start"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500 group-hover:text-yellow-400 group-hover:bg-yellow-400/10 transition-colors">
                                            #{idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-medium text-slate-300 group-hover:text-white line-clamp-2 mb-1">{sug.title}</h4>
                                            <p className="text-[10px] text-slate-500">{sug.viewCount ? `${parseInt(sug.viewCount).toLocaleString()} views` : 'Trending'}</p>
                                        </div>
                                    </a>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-8 text-slate-500 text-xs">
                                Nenhuma sugestão encontrada. Tente buscar um tema.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
