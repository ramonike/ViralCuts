import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Link as LinkIcon, Upload, Sparkles, Search, RefreshCw, ThumbsUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useJourney } from "../../contexts/JourneyContext";

const aiTools = [
    {
        id: "vizard",
        name: "Vizard.ai",
        description: "Cortes automáticos com IA de vídeos longos",
        url: "https://vizard.ai/workspace",
        color: "from-purple-500 to-pink-500",
        icon: "🎬"
    },
    {
        id: "opus",
        name: "OpusClip",
        description: "Crie shorts virais automaticamente",
        url: "https://www.opus.pro/",
        color: "from-blue-500 to-cyan-500",
        icon: "✂️"
    },
    {
        id: "klap",
        name: "Klap",
        description: "Transforme vídeos em shorts com legendas",
        url: "https://klap.app/",
        color: "from-green-500 to-emerald-500",
        icon: "⚡"
    },
    {
        id: "submagic",
        name: "Submagic",
        description: "Legendas animadas e edição automática",
        url: "https://www.submagic.co/",
        color: "from-orange-500 to-red-500",
        icon: "💫"
    }
];

const videoLibraries = [
    {
        name: "Mixkit",
        description: "Vídeos gratuitos de alta qualidade",
        url: "https://mixkit.co/free-stock-video/",
        icon: "🎥"
    },
    {
        name: "Pexels Videos",
        description: "Milhares de vídeos gratuitos",
        url: "https://www.pexels.com/videos/",
        icon: "📹"
    },
    {
        name: "Pixabay Videos",
        description: "Vídeos livres de direitos autorais",
        url: "https://pixabay.com/videos/",
        icon: "🎞️"
    },
    {
        name: "Coverr",
        description: "Vídeos para backgrounds e B-roll",
        url: "https://coverr.co/",
        icon: "🌟"
    }
];

export function PipelineSection({ state, actions, onShowMessage }) {
    const { addToUploadQueue, refreshChannelStats } = actions;
    const { settings, pipeline, suggestions } = state;
    const { markToolUsed, updateProgress, incrementVideoCount } = useJourney();
    const [activeCreationTab, setActiveCreationTab] = useState("ai-tools"); // 'ai-tools' | 'libraries' | 'suggestions' | 'upload'
    const [activeAITool, setActiveAITool] = useState("vizard"); // 'vizard' | 'opus' | 'klap' | 'submagic'
    const [privacyStatus, setPrivacyStatus] = useState("private");
    const [publishAt, setPublishAt] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const fileInputRef = useRef(null);

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) {
            addToUploadQueue({
                title: file.name.replace(/\.[^/.]+$/, ""),
                source: "upload",
                platform: "YouTube Shorts",
                file: file,
                privacyStatus: privacyStatus,
                publishAt: publishAt ? new Date(publishAt).toISOString() : undefined
            });
            e.target.value = "";
            
            // Track journey progress
            incrementVideoCount();
            updateProgress('first-upload');
            
            if (onShowMessage) onShowMessage("Vídeo adicionado à fila de upload! 🚀");
        }
    }

    const handleToolClick = (toolId) => {
        // Track tool usage in journey
        markToolUsed(toolId);
        updateProgress('first-ai-tool');
    };

    return (
        <section id="pipeline-section" className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Unified Creation Area com Header Interno */}
            <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col">
                {/* Header da Central de Criação - MOVIDO PARA DENTRO */}
                <div className="p-4 border-b border-surface-700/50 bg-gradient-to-r from-green-900/20 via-blue-900/10 to-green-900/20 relative overflow-hidden flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-blue-600/5"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-heading-sm text-white">Central de Criação</h2>
                                <p className="text-caption text-green-300">
                                    Ferramentas IA, bibliotecas de vídeo, sugestões virais e upload de conteúdo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation - Compact */}
                <div className="flex border-b border-surface-700/50 bg-surface-900/30 flex-shrink-0">
                    <button
                        onClick={() => setActiveCreationTab("ai-tools")}
                        className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeCreationTab === "ai-tools"
                                ? "bg-surface-800 text-white border-b-2 border-primary"
                                : "text-slate-400 hover:text-white hover:bg-surface-800/50"
                            }`}
                    >
                        <Sparkles className="w-3 h-3" />
                        IA Tools
                    </button>
                    <button
                        onClick={() => setActiveCreationTab("libraries")}
                        className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeCreationTab === "libraries"
                                ? "bg-surface-800 text-white border-b-2 border-primary"
                                : "text-slate-400 hover:text-white hover:bg-surface-800/50"
                            }`}
                    >
                        <Search className="w-3 h-3" />
                        Bibliotecas
                    </button>
                    <button
                        onClick={() => setActiveCreationTab("suggestions")}
                        className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeCreationTab === "suggestions"
                                ? "bg-surface-800 text-white border-b-2 border-primary"
                                : "text-slate-400 hover:text-white hover:bg-surface-800/50"
                            }`}
                    >
                        <Sparkles className="w-3 h-3" />
                        Vídeos Virais
                    </button>
                    <button
                        onClick={() => setActiveCreationTab("upload")}
                        className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeCreationTab === "upload"
                                ? "bg-surface-800 text-white border-b-2 border-primary"
                                : "text-slate-400 hover:text-white hover:bg-surface-800/50"
                            }`}
                    >
                        <Upload className="w-3 h-3" />
                        Upload
                    </button>
                </div>

                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">{activeCreationTab === "ai-tools" ? (
                        <div className="space-y-3">
                            {/* Compact Tool Selector */}
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-slate-200">Escolha sua ferramenta IA:</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {aiTools.map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveAITool(tool.id)}
                                            className={`p-2 rounded-lg border transition-all text-center ${activeAITool === tool.id
                                                ? "border-purple-500 bg-purple-500/20 text-white shadow-lg shadow-purple-500/20"
                                                : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-purple-400/50 hover:text-white hover:bg-slate-600/50"
                                            }`}
                                        >
                                            <div className="text-lg mb-1">{tool.icon}</div>
                                            <div className="text-[10px] font-bold leading-tight">{tool.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Enhanced CTA Area */}
                            {aiTools.filter(t => t.id === activeAITool).map(tool => (
                                <div key={tool.id} className="relative">
                                    {/* Main CTA Card */}
                                    <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-purple-900/30 rounded-xl p-6 border border-purple-500/30 relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
                                                    {tool.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-heading-md text-white mb-1">
                                                        {tool.name}
                                                    </h3>
                                                    <p className="text-body text-slate-300">
                                                        {tool.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* URL Input Area */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                                    <span className="text-sm font-semibold text-purple-300">
                                                        Cole o link do YouTube aqui:
                                                    </span>
                                                </div>
                                                
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="https://youtube.com/watch?v=..."
                                                        className="w-full bg-slate-800/80 border-2 border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                                                        onPaste={(e) => {
                                                            const url = e.clipboardData.getData('text');
                                                            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                                                handleToolClick(tool.id);
                                                                setTimeout(() => window.open(tool.url, "_blank"), 500);
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <span className="text-purple-400 text-xs">▶</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        handleToolClick(tool.id);
                                                        window.open(tool.url, "_blank");
                                                    }}
                                                    className="w-full cta-primary text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 group"
                                                >
                                                    <span>Abrir {tool.name}</span>
                                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                        <span className="text-xs">→</span>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                <p className="text-caption text-slate-400 flex items-center gap-2">
                                                    <span className="text-amber-400">💡</span>
                                                    <span>Dica: Cole um link do YouTube e ele será copiado automaticamente para a ferramenta</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeCreationTab === "libraries" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {videoLibraries.map((library, idx) => (
                                <div
                                    key={idx}
                                    className="bg-surface-900/50 rounded-lg p-3 border border-surface-700/50 hover:border-primary/50 hover:bg-surface-800/50 transition-all duration-300 group cursor-pointer"
                                    onClick={() => window.open(library.url, "_blank")}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{library.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors mb-0.5">
                                                {library.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 truncate">
                                                {library.description}
                                            </p>
                                        </div>
                                        <LinkIcon className="w-3 h-3 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeCreationTab === "suggestions" ? (
                        <div className="space-y-3">
                            {/* Drag Hint Banner - Compact */}
                            <div className="bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-transparent border border-purple-500/20 rounded-lg p-2">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-300 mb-0.5">💡 Arraste para Criar</h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Arraste qualquer vídeo e passe sobre <span className="text-purple-400 font-semibold">IA Tools</span> para copiar automaticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Search Bar - Compact */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setIsLoadingSuggestions(true);
                                                refreshChannelStats(true, searchTerm);
                                                setTimeout(() => setIsLoadingSuggestions(false), 2000);
                                            }
                                        }}
                                        placeholder="Buscar tema viral..."
                                        className="w-full bg-surface-800 text-xs text-slate-200 rounded-lg pl-7 pr-3 py-2 border border-surface-700 focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setIsLoadingSuggestions(true);
                                        refreshChannelStats(true);
                                        setTimeout(() => setIsLoadingSuggestions(false), 2000);
                                    }}
                                    className="text-xs text-slate-400 hover:text-purple-400 transition-colors p-2 rounded border border-surface-700 hover:border-purple-500/50"
                                    title="Atualizar sugestões"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Suggestions Grid - Compact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {isLoadingSuggestions ? (
                                    <>
                                        {[1, 2, 3, 4].map(i => (
                                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                        ))}
                                    </>
                                ) : suggestions && suggestions.length > 0 ? (
                                    suggestions.slice(0, 8).map((sug, idx) => {
                                        const videoId = typeof sug.id === 'object' ? sug.id.videoId : (sug.videoId || sug.id);
                                        const videoUrl = `https://youtube.com/watch?v=${videoId}`;
                                        const formatNumber = (num) => {
                                            if (!num) return '0';
                                            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                                            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                                            return num.toString();
                                        };

                                        return (
                                            <div
                                                key={idx}
                                                className="group bg-surface-800/50 hover:bg-surface-800 border border-surface-700/50 hover:border-purple-500/30 rounded-lg p-2.5 transition-all cursor-grab active:cursor-grabbing"
                                                draggable="true"
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("text/plain", videoUrl);
                                                    e.dataTransfer.setData("text/uri-list", videoUrl);
                                                    e.currentTarget.classList.add('opacity-50');
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.classList.remove('opacity-50');
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-200 mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors leading-tight">
                                                            {sug.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {sug.viewCount && (
                                                                <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-surface-900/50 px-1.5 py-0.5 rounded">
                                                                    👁️ {formatNumber(sug.viewCount)}
                                                                </span>
                                                            )}
                                                            {sug.likeCount && (
                                                                <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-surface-900/50 px-1.5 py-0.5 rounded">
                                                                    👍 {formatNumber(sug.likeCount)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-slate-500 hover:text-purple-400 transition-colors p-1 hover:bg-surface-700 rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Abrir no YouTube"
                                                    >
                                                        <LinkIcon className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-8">
                                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                        <p className="text-xs text-slate-400 font-medium">Nenhuma sugestão disponível</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Conecte sua conta do YouTube</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Upload Settings - Compact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Visibilidade</label>
                                    <select
                                        className="w-full bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
                                        value={privacyStatus}
                                        onChange={(e) => setPrivacyStatus(e.target.value)}
                                    >
                                        <option value="private">Privado (Padrão)</option>
                                        <option value="public">Público</option>
                                        <option value="unlisted">Não Listado</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Agendar (Opcional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
                                        value={publishAt}
                                        onChange={(e) => setPublishAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-surface-900/50 rounded-lg p-4 border border-dashed border-surface-700/50 hover:border-primary/50 hover:bg-surface-800/50 transition-all duration-300 group cursor-pointer relative overflow-hidden text-center"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        addToUploadQueue({
                                            title: file.name.replace(/\.[^/.]+$/, ""),
                                            source: "upload",
                                            platform: "YouTube Shorts",
                                            file: file,
                                            privacyStatus: privacyStatus,
                                            publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
                                            scheduledAt: publishAt ? new Date(publishAt).toISOString() : undefined
                                        });
                                        if (onShowMessage) onShowMessage("Vídeo adicionado à fila de upload! 🚀");
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="video/*"
                                    onChange={handleFileSelect}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-surface-800 shadow-lg shadow-black/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-surface-700">
                                        <Upload className="w-5 h-5 text-primary group-hover:text-primary-light transition-colors" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                            Upload de Arquivo
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Arraste um arquivo ou clique para selecionar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
