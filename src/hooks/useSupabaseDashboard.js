/**
 * useSupabaseDashboard — v2
 * + accountId salvo no metadata ao criar upload
 * + filtro por canal ativo no loadData
 * + reloadForAccount() exposto para o CalendarPage
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/backend';

export function useSupabaseDashboard() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [history, setHistory] = useState({});
    const [settings, setSettings] = useState(null);
    // Canal ativo gerenciado aqui para filtrar dados do backend
    const [activeAccountId, setActiveAccountId] = useState(null);

    // ── Normalizar history por data ────────────────────────────────────────
    const buildHistory = useCallback((videos, filterAccountId = null) => {
        const historyByDate = {};
        (videos || []).forEach(video => {
            // Filtro por canal: se filterAccountId definido, só inclui itens do canal
            if (filterAccountId && video.accountId && video.accountId !== filterAccountId) return;

            const dateStr = (video.date || video.publishedAt || '').split('T')[0];
            if (!dateStr) return;

            if (!historyByDate[dateStr]) {
                historyByDate[dateStr] = { completedItems: [], uploads: 0 };
            }
            historyByDate[dateStr].completedItems.push({
                id: video.id,
                title: video.title,
                type: 'youtube_video',
                url: video.url,
                views: video.views || 0,
                likes: video.likes || 0,
                accountId: video.accountId || null,
            });
            historyByDate[dateStr].uploads += 1;
        });
        return historyByDate;
    }, []);

    // ── Filtrar uploadQueue por canal ──────────────────────────────────────
    const filterQueue = useCallback((queue, filterAccountId) => {
        if (!filterAccountId) return queue;
        return queue.filter(item => {
            // Item sem accountId = criado antes da v2, mostrar em todos os canais
            if (!item.accountId && !item.metadata?.accountId) return true;
            const id = item.accountId || item.metadata?.accountId;
            return id === filterAccountId;
        });
    }, []);

    // ── Raw data refs para poder refiltrar sem nova requisição ─────────────
    const [rawHistory, setRawHistory] = useState([]);
    const [rawQueue, setRawQueue] = useState([]);

    // ── Carregar dados do backend ──────────────────────────────────────────
    const loadData = useCallback(async (accountId = null) => {
        try {
            setLoading(true);

            const sessionData = await api.getSession().catch(() => null);
            if (!sessionData?.user) {
                setLoading(false);
                return;
            }
            setUser(sessionData.user);

            const [queueData, historyData, settingsData] = await Promise.allSettled([
                api.getQueue().catch(() => []),
                api.getHistory().catch(() => []),
                api.getSettings().catch(() => null),
            ]);

            const rawQ = queueData.status === 'fulfilled' ? (queueData.value || []) : [];
            const rawH = historyData.status === 'fulfilled' ? (historyData.value || []) : [];

            setRawQueue(rawQ);
            setRawHistory(rawH);
            setSettings(settingsData.status === 'fulfilled' ? settingsData.value : null);

            // Aplicar filtro inicial
            const effectiveId = accountId || activeAccountId;
            setUploadQueue(filterQueue(rawQ, effectiveId));
            setHistory(buildHistory(rawH, effectiveId));

        } catch (error) {
            console.error('Error loading data from Backend:', error);
        } finally {
            setLoading(false);
        }
    }, [activeAccountId, buildHistory, filterQueue]);

    useEffect(() => { loadData(); }, []);

    // ── Trocar canal ativo e refiltrar sem nova requisição de rede ─────────
    const switchToAccount = useCallback((accountId) => {
        setActiveAccountId(accountId);
        setUploadQueue(filterQueue(rawQueue, accountId));
        setHistory(buildHistory(rawHistory, accountId));
    }, [rawQueue, rawHistory, buildHistory, filterQueue]);

    // ── Salvar configurações ───────────────────────────────────────────────
    const saveSettings = async (newSettings) => {
        try {
            await api.saveSettings(newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    // ── Adicionar à fila — agora inclui accountId no metadata ─────────────
    const addToQueue = async (item) => {
        try {
            const enrichedItem = {
                ...item,
                metadata: {
                    ...(item.metadata || {}),
                    accountId: activeAccountId || item.accountId || null,
                    title: item.title,
                    description: item.description || '',
                    tags: item.tags || [],
                    privacyStatus: item.privacyStatus || 'private',
                },
            };
            const res = await api.addToQueue(enrichedItem);
            const newItem = { ...enrichedItem, id: res.id, status: res.status };
            setRawQueue(prev => [...prev, newItem]);
            // Só adiciona no state visível se for do canal ativo
            if (!activeAccountId || !newItem.metadata?.accountId || newItem.metadata.accountId === activeAccountId) {
                setUploadQueue(prev => [...prev, newItem]);
            }
            return newItem;
        } catch (error) {
            console.error('Error adding to queue:', error);
            throw error;
        }
    };

    const updateQueueStatus = async (itemId, status, updates = {}) => {
        setUploadQueue(prev =>
            prev.map(item => item.id === itemId ? { ...item, status, ...updates } : item)
        );
        setRawQueue(prev =>
            prev.map(item => item.id === itemId ? { ...item, status, ...updates } : item)
        );
    };

    const removeFromQueue = async (itemId) => {
        try {
            await api.removeFromQueue(itemId);
            setUploadQueue(prev => prev.filter(item => item.id !== itemId));
            setRawQueue(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing from queue:', error);
            throw error;
        }
    };

    const addToHistory = async (date, video) => {
        console.warn('addToHistory backend endpoint not yet implemented');
        return { id: `temp_${Date.now()}`, ...video };
    };

    const markQueueStatus = updateQueueStatus;

    return {
        user,
        loading,
        uploadQueue,
        history,
        settings,
        activeAccountId,
        switchToAccount,        // ← novo: trocar canal e refiltrar
        reloadData: loadData,   // ← exposto para refresh manual
        actions: {
            saveSettings,
            addToQueue,
            addToQueue: addToQueue,
            updateQueueStatus,
            markQueueStatus,
            removeQueueItem: removeFromQueue,
            removeFromQueue,
            addToHistory,
        },
    };
}
