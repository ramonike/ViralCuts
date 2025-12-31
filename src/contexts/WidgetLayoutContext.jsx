import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWorkspace } from './WorkspaceContext';

const WidgetLayoutContext = createContext();

export const useWidgetLayout = () => {
    const context = useContext(WidgetLayoutContext);
    if (!context) {
        throw new Error('useWidgetLayout must be used within WidgetLayoutProvider');
    }
    return context;
};

// Default widget configurations
const DEFAULT_WIDGETS = [
    { id: 'performance', type: 'performance', position: { x: 0, y: 0 }, size: { w: 6, h: 4 }, isPremium: false },
    { id: 'calendar', type: 'calendar', position: { x: 6, y: 0 }, size: { w: 6, h: 4 }, isPremium: false },
    { id: 'upload', type: 'upload', position: { x: 0, y: 4 }, size: { w: 4, h: 3 }, isPremium: false },
    { id: 'trending', type: 'trending', position: { x: 4, y: 4 }, size: { w: 4, h: 3 }, isPremium: false },
    { id: 'goals', type: 'goals', position: { x: 8, y: 4 }, size: { w: 4, h: 3 }, isPremium: false },
];

export const WidgetLayoutProvider = ({ children }) => {
    const { activeWorkspace, updateWorkspace } = useWorkspace();
    const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
    const [isEditing, setIsEditing] = useState(false);

    // Load widgets from active workspace
    useEffect(() => {
        if (activeWorkspace?.layout?.widgets) {
            setWidgets(activeWorkspace.layout.widgets);
        } else {
            setWidgets(DEFAULT_WIDGETS);
        }
    }, [activeWorkspace]);

    const saveLayout = async (newWidgets) => {
        if (!activeWorkspace) return;

        try {
            await updateWorkspace(activeWorkspace.id, {
                layout: {
                    ...activeWorkspace.layout,
                    widgets: newWidgets,
                },
            });
        } catch (error) {
            console.error('Error saving layout:', error);
        }
    };

    const updateWidgetPosition = (widgetId, position) => {
        const newWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, position } : w
        );
        setWidgets(newWidgets);
        saveLayout(newWidgets);
    };

    const updateWidgetSize = (widgetId, size) => {
        const newWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, size } : w
        );
        setWidgets(newWidgets);
        saveLayout(newWidgets);
    };

    const addWidget = (widgetConfig) => {
        const newWidget = {
            id: `${widgetConfig.type}-${Date.now()}`,
            ...widgetConfig,
        };
        const newWidgets = [...widgets, newWidget];
        setWidgets(newWidgets);
        saveLayout(newWidgets);
    };

    const removeWidget = (widgetId) => {
        const newWidgets = widgets.filter(w => w.id !== widgetId);
        setWidgets(newWidgets);
        saveLayout(newWidgets);
    };

    const resetLayout = () => {
        setWidgets(DEFAULT_WIDGETS);
        saveLayout(DEFAULT_WIDGETS);
    };

    const value = {
        widgets,
        isEditing,
        setIsEditing,
        updateWidgetPosition,
        updateWidgetSize,
        addWidget,
        removeWidget,
        resetLayout,
    };

    return (
        <WidgetLayoutContext.Provider value={value}>
            {children}
        </WidgetLayoutContext.Provider>
    );
};

export default WidgetLayoutContext;
