import React, { useState } from 'react';
import { Widget } from '../../design-system/components/Widget';
import { Plus, LayoutGrid, X, Check } from 'lucide-react';
import { useWidgetLayout } from '../../contexts/WidgetLayoutContext';
import { Button } from '../ui/button';

// Widget Registry - Available widgets
const AVAILABLE_WIDGETS = [
    {
        id: 'performance',
        type: 'performance',
        name: 'Performance Dashboard',
        description: 'Métricas de performance do canal',
        icon: '📊',
        category: 'Analytics',
        isPremium: false,
    },
    {
        id: 'calendar',
        type: 'calendar',
        name: 'Smart Calendar',
        description: 'Calendário de agendamento',
        icon: '📅',
        category: 'Planning',
        isPremium: false,
    },
    {
        id: 'upload',
        type: 'upload',
        name: 'Quick Upload',
        description: 'Upload rápido de vídeos',
        icon: '⬆️',
        category: 'Tools',
        isPremium: false,
    },
    {
        id: 'trending',
        type: 'trending',
        name: 'Trending Topics',
        description: 'Tópicos em alta',
        icon: '🔥',
        category: 'Content',
        isPremium: false,
    },
    {
        id: 'goals',
        type: 'goals',
        name: 'Goal Progress',
        description: 'Acompanhamento de metas',
        icon: '🎯',
        category: 'Analytics',
        isPremium: false,
    },
    {
        id: 'revenue',
        type: 'revenue',
        name: 'Revenue Tracker',
        description: 'Acompanhamento de receita',
        icon: '💰',
        category: 'Analytics',
        isPremium: true,
    },
    {
        id: 'ai-copilot',
        type: 'ai-copilot',
        name: 'AI Copilot',
        description: 'Assistente de IA',
        icon: '🤖',
        category: 'AI',
        isPremium: true,
    },
    {
        id: 'analytics',
        type: 'analytics',
        name: 'Advanced Analytics',
        description: 'Analytics avançado',
        icon: '📈',
        category: 'Analytics',
        isPremium: true,
    },
    {
        id: 'checklist',
        type: 'checklist',
        name: 'Checklist Manager',
        description: 'Gerenciador de checklists',
        icon: '✅',
        category: 'Planning',
        isPremium: false,
    },
    {
        id: 'notes',
        type: 'notes',
        name: 'Quick Notes',
        description: 'Notas rápidas',
        icon: '📝',
        category: 'Tools',
        isPremium: false,
    },
];

export const WidgetMarketplace = ({ isOpen, onClose }) => {
    const { widgets, addWidget } = useWidgetLayout();
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', 'Analytics', 'Planning', 'Tools', 'Content', 'AI'];

    const filteredWidgets = AVAILABLE_WIDGETS.filter(widget =>
        selectedCategory === 'all' || widget.category === selectedCategory
    );

    const isWidgetActive = (widgetType) => {
        return widgets.some(w => w.type === widgetType);
    };

    const handleAddWidget = (widget) => {
        if (isWidgetActive(widget.type)) return;

        const newWidget = {
            type: widget.type,
            position: { x: 0, y: widgets.length * 4 },
            size: { w: 4, h: 3 },
            config: {},
            isPremium: widget.isPremium,
        };

        addWidget(newWidget);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <LayoutGrid className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Widget Marketplace</h2>
                            <p className="text-sm text-slate-400">Adicione widgets ao seu dashboard</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-slate-700 flex gap-2 overflow-x-auto">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === category
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {category === 'all' ? 'Todos' : category}
                        </button>
                    ))}
                </div>

                {/* Widget Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWidgets.map((widget) => {
                            const isActive = isWidgetActive(widget.type);

                            return (
                                <div
                                    key={widget.id}
                                    className={`p-4 rounded-xl border transition-all ${isActive
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : widget.isPremium
                                            ? 'bg-slate-900/50 border-primary-500/30'
                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="text-3xl">{widget.icon}</div>
                                        {widget.isPremium && (
                                            <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                                                Premium
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-white mb-1">{widget.name}</h3>
                                    <p className="text-xs text-slate-400 mb-4">{widget.description}</p>

                                    <Button
                                        onClick={() => handleAddWidget(widget)}
                                        disabled={isActive}
                                        className={`w-full ${isActive
                                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                                            : widget.isPremium
                                                ? 'bg-primary-600 hover:bg-primary-700'
                                                : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                    >
                                        {isActive ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Adicionado
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Adicionar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WidgetMarketplace;
