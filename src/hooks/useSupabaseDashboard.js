/**
 * useSupabaseDashboard — v2.1
 * Corrigido: ordem de declaração das funções para evitar
 * "Cannot access before initialization" após minificação do Vite
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/backend';

export function useSupabaseDashboard() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [history, setHistory] = useState({});
    const [settings, setSettings] = useState(null);
    const [activeAccountId, setActiveAccountId] = useState(null);

    // Refs para dados brutos — permite refiltrar sem nova requisição de rede
    const rawQueueRef = useRef([]);
    const rawHistoryRef = useRef([]);

    // ── Helpers puros — declarados antes de qualquer useCallback ──────────

    function buildHistory(videos, filterAccountId) {
        const byDate = {};
        (videos || []).forEach(video => {
            // Itens sem accountId (legados) aparecem em todos os canais
            if (filterAccountId && video.accountId && video.accountId !== filterAccountId) return;

            const dateStr = (video.date || video.publishedAt || '').split('T')[0];
            if (!dateStr) return;

            if (!byDate[dateStr]) byDate[dateStr] = { completedItems: [], uploads: 0 };

            byDate[dateStr].completedItems.push({
                id: video.id,
                title: video.title,
                type: 'youtube_video',
                url: video.url,
                views: video.views || 0,
                likes: video.likes || 0,
                accountId: video.accountId || null,
            });
            byDate[dateStr].uploads += 1;
        });
        return byDate;
    }

    function filterQueue(queue, filterAccountId) {
        if (!filterAccountId) return queue;
        return queue.filter(item => {
            const id = item.accountId || item.metadata?.accountId;
            if (!id) return true; // legado — mostrar em todos
            return id === filterAccountId;
        });
    }

    // ── Carregar dados do backend ──────────────────────────────────────────
    const loadData = useCallback(async (accountId) => {
        try {
            setLoading(true);

            const sessionData = await api.getSession().catch(() => null);
            if (!sessionData?.user) { setLoading(false); return; }
            setUser(sessionData.user);

            const [queueRes, historyRes, settingsRes] = await Promise.allSettled([
                api.getQueue().catch(() => []),
                api.getHistory().catch(() => []),
                api.getSettings().catch(() => null),
            ]);

            const rawQ = queueRes.status === 'fulfilled' ? (queueRes.value || []) : [];
            const rawH = historyRes.status === 'fulfilled' ? (historyRes.value || []) : [];

            rawQueueRef.current = rawQ;
            rawHistoryRef.current = rawH;

            setSettings(settingsRes.status === 'fulfilled' ? settingsRes.value : null);
            setUploadQueue(filterQueue(rawQ, accountId));
            setHistory(buildHistory(rawH, accountId));

        } catch (err) {
            console.error('useSupabaseDashboard loadData error:', err);
        } finally {
            setLoading(false);
        }
    }, []); // sem deps — usa refs e fns puras

    useEffect(() => { loadData(null); }, []);

    // ── Trocar canal — refiltro instantâneo sem rede ───────────────────────
    const switchToAccount = useCallback((accountId) => {
        setActiveAccountId(accountId);
        setUploadQueue(filterQueue(rawQueueRef.current, accountId));
        setHistory(buildHistory(rawHistoryRef.current, accountId));
    }, []);

    // ── Salvar settings ────────────────────────────────────────────────────
    const saveSettings = async (newSettings) => {
        try {
            await api.saveSettings(newSettings);
            setSettings(newSettings);
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    };

    // ── Adicionar à fila — 2 etapas: criar registro + upload do arquivo ────
    const addToQueue = async (item, onProgress = null) => {
        try {
            // Etapa 1: Cria registro no banco (sem o arquivo)
            const { file, ...itemWithoutFile } = item;
            const enriched = {
                ...itemWithoutFile,
                metadata: {
                    ...(itemWithoutFile.metadata || {}),
                    accountId: activeAccountId || item.accountId || null,
                    title: item.title,
                    description: item.description || '',
                    tags: item.tags || [],
                    privacyStatus: item.privacyStatus || 'private',
                },
            };

            const res = await api.addToQueue(enriched);
            const uploadId = res.id;
            const newItem = { ...enriched, id: uploadId, status: 'pending' };

            rawQueueRef.current = [...rawQueueRef.current, newItem];
            const itemAccountId = newItem.metadata?.accountId;
            if (!activeAccountId || !itemAccountId || itemAccountId === activeAccountId) {
                setUploadQueue(prev => [...prev, newItem]);
            }

            // Etapa 2: Se há arquivo e plataforma YouTube, faz upload DIRETO browser→YouTube
            if ((file || item.existingYoutubeVideoId) && (item.platform === 'youtube' || !item.platform)) {

                // Se já tem youtubeVideoId (segunda conta YouTube), só cria o registro no banco
                if (item.existingYoutubeVideoId) {
                    await fetch('/api/youtube/upload-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            uploadId,
                            youtubeVideoId: item.existingYoutubeVideoId,
                            scheduledAt: item.scheduledAt || null,
                            title: item.title,
                            description: item.description || '',
                            tags: item.tags || [],
                            privacyStatus: item.privacyStatus || 'private',
                        }),
                    });
                    const doneUpdater = prev => prev.map(q =>
                        q.id === uploadId
                            ? { ...q, status: 'scheduled', youtubeVideoId: item.existingYoutubeVideoId, uploadProgress: 100 }
                            : q
                    );
                    setUploadQueue(doneUpdater);
                    rawQueueRef.current = doneUpdater(rawQueueRef.current);
                    return { ...newItem, id: uploadId, status: 'scheduled', youtubeVideoId: item.existingYoutubeVideoId };
                }
                const updater = prev => prev.map(q =>
                    q.id === uploadId ? { ...q, status: 'uploading', uploadProgress: 0 } : q
                );
                setUploadQueue(updater);
                rawQueueRef.current = updater(rawQueueRef.current);

                try {
                    // Etapa 2a: Servidor inicia sessão resumable e retorna uploadUrl
                    const initRes = await fetch('/api/youtube/upload-init', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            uploadId,
                            title: item.title || '',
                            description: item.description || '',
                            tags: item.tags || [],
                            privacyStatus: item.privacyStatus || 'private',
                            accountId: item.accountId || '',
                            scheduledAt: item.scheduledAt || null,
                            fileSize: file.size,
                            mimeType: file.type || 'video/mp4',
                        }),
                    });

                    if (!initRes.ok) {
                        const err = await initRes.json().catch(() => ({}));
                        throw new Error(err.error || 'Falha ao iniciar sessão de upload');
                    }

                    const { uploadUrl } = await initRes.json();

                    // Etapa 2b: Browser envia arquivo DIRETAMENTE para o Google (sem passar pelo Render)
                    const uploadResult = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('PUT', uploadUrl);
                        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable && onProgress) {
                                const pct = Math.round((e.loaded / e.total) * 100);
                                onProgress(uploadId, pct);
                                // Atualiza progresso na fila
                                setUploadQueue(prev => prev.map(q =>
                                    q.id === uploadId ? { ...q, uploadProgress: pct } : q
                                ));
                            }
                        };

                        xhr.onload = () => {
                            if (xhr.status === 200 || xhr.status === 201) {
                                const data = JSON.parse(xhr.responseText);
                                resolve(data);
                            } else {
                                reject(new Error(`Upload falhou: HTTP ${xhr.status}`));
                            }
                        };
                        xhr.onerror = () => reject(new Error('Erro de rede no upload'));
                        xhr.send(file);
                    });

                    const youtubeVideoId = uploadResult.id;

                    // Etapa 2c: Notifica servidor que upload concluiu
                    await fetch('/api/youtube/upload-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            uploadId,
                            youtubeVideoId,
                            scheduledAt: item.scheduledAt || null,
                            title: item.title,
                            description: item.description || '',
                            tags: item.tags || [],
                            privacyStatus: item.privacyStatus || 'private',
                        }),
                    });

                    const doneUpdater = prev => prev.map(q =>
                        q.id === uploadId
                            ? { ...q, status: 'scheduled', youtubeVideoId, uploadProgress: 100 }
                            : q
                    );
                    setUploadQueue(doneUpdater);
                    rawQueueRef.current = doneUpdater(rawQueueRef.current);

                    console.log(`[addToQueue] Upload direto concluído: ${youtubeVideoId}`);
                    return { ...newItem, id: uploadId, status: 'scheduled', youtubeVideoId };

                } catch (uploadErr) {
                    console.error('[addToQueue] Falha no upload do arquivo:', uploadErr);
                    // Marcar como falho na UI mas não lançar — o registro já foi criado
                    const failUpdater = prev => prev.map(q =>
                        q.id === uploadId ? { ...q, status: 'failed', errorMsg: uploadErr.message } : q
                    );
                    setUploadQueue(failUpdater);
                    rawQueueRef.current = failUpdater(rawQueueRef.current);
                    throw uploadErr;
                }
            }

            return newItem;
        } catch (err) {
            console.error('Error adding to queue:', err);
            throw err;
        }
    };

    const updateQueueStatus = async (itemId, status, updates = {}) => {
        const updater = prev =>
            prev.map(item => item.id === itemId ? { ...item, status, ...updates } : item);
        setUploadQueue(updater);
        rawQueueRef.current = updater(rawQueueRef.current);
    };

    const removeFromQueue = async (itemId) => {
        try {
            await api.removeFromQueue(itemId);
            setUploadQueue(prev => prev.filter(i => i.id !== itemId));
            rawQueueRef.current = rawQueueRef.current.filter(i => i.id !== itemId);
        } catch (err) {
            console.error('Error removing from queue:', err);
            throw err;
        }
    };

    const addToHistory = async (date, video) => {
        console.warn('addToHistory not yet implemented');
        return { id: `temp_${Date.now()}`, ...video };
    };

    return {
        user,
        loading,
        uploadQueue,
        history,
        settings,
        activeAccountId,
        switchToAccount,
        reloadData: loadData,
        actions: {
            saveSettings,
            addToQueue,
            updateQueueStatus,
            markQueueStatus: updateQueueStatus,
            removeQueueItem: removeFromQueue,
            removeFromQueue,
            addToHistory,
        },
    };
}