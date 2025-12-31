import { useCallback } from "react";
import { defaultChecklists } from "./useStorage";

/**
 * Hook para gerenciar checklists
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 */
export function useChecklists(state, setState) {
    const checklists = state.checklists;

    const toggleItem = useCallback((checklistId, itemId) => {
        const today = new Date().toLocaleDateString('en-CA');
        
        setState((prev) => {
            const newChecklists = prev.checklists.map((cl) =>
                cl.id === checklistId
                    ? {
                        ...cl,
                        items: cl.items.map((item) =>
                            item.id === itemId ? { ...item, done: !item.done } : item
                        ),
                    }
                    : cl
            );

            const safeHistory = prev.history || {};
            const currentHistory = safeHistory[today] || { completedItems: [], uploads: 0 };

            const checklist = newChecklists.find(c => c.id === checklistId);
            if (!checklist) return prev;

            const item = checklist.items.find(i => i.id === itemId);
            if (!item) return prev;

            const isNowDone = item.done;
            let newCompletedItems = currentHistory.completedItems || [];

            if (isNowDone) {
                const exists = newCompletedItems.some(i => 
                    (typeof i === 'string' ? i === itemId : i.id === itemId)
                );

                if (!exists) {
                    newCompletedItems = [
                        ...newCompletedItems,
                        {
                            id: itemId,
                            title: item.text,
                            type: 'checklist_item',
                            timestamp: Date.now()
                        }
                    ];
                }
            } else {
                newCompletedItems = newCompletedItems.filter(i => 
                    (typeof i === 'string' ? i !== itemId : i.id !== itemId)
                );
            }

            return {
                ...prev,
                checklists: newChecklists,
                history: {
                    ...safeHistory,
                    [today]: { ...currentHistory, completedItems: newCompletedItems }
                }
            };
        });
    }, [setState]);

    const addChecklistItem = useCallback((selectedChecklist, text) => {
        if (!text.trim()) return;
        
        setState(prev => ({
            ...prev,
            checklists: prev.checklists.map((cl) => {
                if (cl.id !== selectedChecklist) return cl;
                return {
                    ...cl,
                    items: [
                        ...cl.items,
                        { 
                            id: `${selectedChecklist}_custom_${Date.now()}`, 
                            text: text.trim(), 
                            done: false 
                        },
                    ],
                };
            })
        }));
    }, [setState]);

    const resetChecklist = useCallback((checklistId) => {
        const defaultList = defaultChecklists.find(c => c.id === checklistId);

        setState((prev) => ({
            ...prev,
            checklists: prev.checklists.map((cl) =>
                cl.id === checklistId
                    ? {
                        ...cl,
                        items: defaultList
                            ? defaultList.items.map(item => ({ ...item, done: false }))
                            : cl.items.map(item => ({ ...item, done: false }))
                    }
                    : cl
            ),
        }));
    }, [setState]);

    const getChecklistProgress = useCallback((checklistId) => {
        const checklist = checklists.find(c => c.id === checklistId);
        if (!checklist) return 0;
        
        const completed = checklist.items.filter(item => item.done).length;
        return Math.round((completed / checklist.items.length) * 100);
    }, [checklists]);

    return {
        checklists,
        toggleItem,
        addChecklistItem,
        resetChecklist,
        getChecklistProgress
    };
}
