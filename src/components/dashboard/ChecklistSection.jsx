import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CheckSquare, Plus, RefreshCw, ExternalLink, Youtube, Video, Image, MessageSquare, Zap, DollarSign, ShoppingBag } from "lucide-react";

// Brand Button Component
const BrandButton = ({ type, url }) => {
    const brands = {
        google: {
            label: "Google",
            icon: <span className="font-bold text-lg">G</span>,
            className: "text-white bg-white/10 hover:bg-white/20 border border-white/10"
        },
        youtube: {
            label: "YouTube",
            icon: <Youtube className="w-4 h-4" />,
            className: "text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10"
        },
        youtube_studio: {
            label: "Studio",
            icon: <Video className="w-4 h-4" />,
            className: "text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10"
        },
        youtube_monetization: {
            label: "Monetização",
            icon: <DollarSign className="w-4 h-4" />,
            className: "text-green-500 bg-green-500/10 hover:bg-green-500/20 border border-green-500/10"
        },
        tiktok: {
            label: "TikTok",
            icon: <span className="font-bold">♪</span>,
            className: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/10"
        },
        tiktok_marketplace: {
            label: "Marketplace",
            icon: <ShoppingBag className="w-4 h-4" />,
            className: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/10"
        },
        canva: {
            label: "Canva",
            icon: <Image className="w-4 h-4" />,
            className: "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/10"
        },
        chatgpt: {
            label: "ChatGPT",
            icon: <MessageSquare className="w-4 h-4" />,
            className: "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/10"
        },
        opus: {
            label: "OpusClip",
            icon: <Video className="w-4 h-4" />,
            className: "text-violet-400 bg-violet-400/10 hover:bg-violet-400/20 border border-violet-400/10"
        },
        zapier: {
            label: "Zapier",
            icon: <Zap className="w-4 h-4" />,
            className: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/10"
        },
        make: {
            label: "Make",
            icon: <Zap className="w-4 h-4" />,
            className: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/10"
        },
        default: {
            label: "Link",
            icon: <ExternalLink className="w-4 h-4" />,
            className: "text-slate-400 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700/50"
        }
    };

    const style = brands[type] || brands.default;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center w-6 h-6 rounded transition-all shadow-sm ${style.className}`}
            onClick={(e) => e.stopPropagation()}
            title={style.label}
        >
            {typeof style.icon === 'string' ? (
                <span className="text-xs">{style.icon}</span>
            ) : (
                React.cloneElement(style.icon, { className: "w-3 h-3" })
            )}
        </a>
    );
};

export function ChecklistSection({ state, actions }) {
    const { checklists } = state;
    const { toggleItem, addChecklistItem, resetChecklist } = actions;
    const [newItemText, setNewItemText] = useState("");
    const [activeListId, setActiveListId] = useState(checklists[0]?.id);

    const activeList = checklists.find((c) => c.id === activeListId);

    function handleAdd() {
        if (!newItemText.trim()) return;
        addChecklistItem(activeListId, newItemText);
        setNewItemText("");
    }

    return (
        <div id="checklist-section" className="glass-panel rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700 h-fit">
            <div className="p-3 border-b border-surface-700/50 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-viral-neon" /> Checklists
                </h3>
                <div className="flex gap-1">
                    {checklists.map((cl) => (
                        <button
                            key={cl.id}
                            onClick={() => setActiveListId(cl.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${activeListId === cl.id
                                ? "bg-viral-500 text-white font-bold shadow-lg shadow-viral-500/20"
                                : "bg-viral-900/50 text-slate-400 hover:bg-viral-700"
                                }`}
                        >
                            {cl.title}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-3 flex flex-col max-h-[280px]">
                {activeList && (
                    <>
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs text-slate-400">
                                {activeList.items.filter(i => i.done).length}/{activeList.items.length} concluídos
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetChecklist(activeList.id)}
                                className="text-[10px] text-viral-400 hover:text-white hover:bg-viral-700 h-6 px-2"
                                title="Resetar itens para amanhã"
                            >
                                <RefreshCw className="w-2.5 h-2.5 mr-1" /> Reset
                            </Button>
                        </div>

                        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {activeList.items.slice(0, 6).map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all group ${item.done
                                        ? "bg-viral-900/30 border-viral-700 opacity-60"
                                        : "bg-viral-900 border-viral-600 hover:border-viral-500"
                                        }`}
                                >
                                    <div
                                        onClick={() => toggleItem(activeList.id, item.id)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${item.done
                                            ? "bg-viral-neon border-viral-neon"
                                            : "border-slate-500 group-hover:border-viral-400"
                                            }`}
                                    >
                                        {item.done && <span className="text-viral-900 text-[10px] font-bold">✓</span>}
                                    </div>
                                    <span
                                        onClick={() => toggleItem(activeList.id, item.id)}
                                        className={`text-xs flex-1 cursor-pointer truncate ${item.done ? "text-slate-500 line-through" : "text-slate-200"
                                            }`}
                                        title={item.text}
                                    >
                                        {item.text}
                                    </span>

                                    {/* Action Buttons - Compact */}
                                    {item.actions && item.actions.length > 0 && (
                                        <div className="flex gap-1">
                                            {item.actions.slice(0, 2).map((action, idx) => (
                                                <BrandButton key={idx} type={action.type} url={action.url} />
                                            ))}
                                            {item.actions.length > 2 && (
                                                <span className="text-[9px] text-slate-500 px-1">+{item.actions.length - 2}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Legacy Link Fallback */}
                                    {item.link && !item.actions && (
                                        <BrandButton type="default" url={item.link} />
                                    )}
                                </div>
                            ))}
                            {activeList.items.length > 6 && (
                                <div className="text-center py-1">
                                    <span className="text-[10px] text-slate-500">+{activeList.items.length - 6} mais itens</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex gap-1.5 pt-2 border-t border-viral-700/50">
                            <Input
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder="Novo item..."
                                className="bg-viral-900 border-viral-700 text-slate-200 focus-visible:ring-viral-500 placeholder:text-slate-600 text-xs h-8"
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            />
                            <Button onClick={handleAdd} className="bg-viral-700 hover:bg-viral-600 text-white h-8 w-8 p-0">
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
