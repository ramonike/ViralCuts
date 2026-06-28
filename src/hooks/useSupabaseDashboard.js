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
    async function clientUploadInit(accessToken, fileObj, itemData) {
        const initRes = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Length': String(fileObj.size),
                    'X-Upload-Content-Type': fileObj.type || 'video/mp4',
                },
                body: JSON.stringify({
                    snippet: {
                        title: itemData.title || '',
                        description: itemData.description || '',
                        tags: itemData.tags || [],
                        categoryId: '22',
                    },
                    status: {
                        privacyStatus: itemData.privacyStatus || 'private',
                        selfDeclaredMadeForKids: false,
                    },
                }),
            }
        );
        if (!initRes.ok) {
            const errData = await initRes.json().catch(() => ({}));
            throw new Error(`YouTube rejeitou: ${errData.error?.message || initRes.status}`);
        }
        const uploadUrl = initRes.headers.get('Location');
        if (!uploadUrl) throw new Error('YouTube não retornou URL de upload');
        return uploadUrl;
    }

    const addToQueue = async (item, onProgress = null) => {
        try {
            const { file, _accessToken, ...itemWithoutFile } = item;
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

            // Helper para fetch com timeout e abort
            const fetchWithTimeout = (url, opts, ms, stepLabel) => {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), ms);
                return fetch(url, { ...opts, signal: ctrl.signal })
                    .finally(() => clearTimeout(timer))
                    .catch(err => {
                        if (err.name === 'AbortError') {
                            throw new Error(`Timeout (${ms / 1000}s) em ${stepLabel} — servidor pode estar ocupado, tente novamente`);
                        }
                        throw err;
                    });
            };

            // Etapa 1: Cria registro no banco com timeout
            const queueTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao salvar agendamento — servidor não respondeu')), 30000)
            );
            const res = await Promise.race([api.addToQueue(enriched), queueTimeout]);
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
                    await fetchWithTimeout('/api/youtube/upload-complete', {
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
                    }, 30000, 'notificar servidor (upload-complete)');
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
                    // Etapa 2a: Inicia sessão resumable — tenta servidor primeiro, fallback client-side
                    let uploadUrl;

                    try {
                        const initRes = await fetchWithTimeout('/api/youtube/upload-init', {
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
                        }, 45000, 'iniciar sessão YouTube (servidor)');

                        if (!initRes.ok) {
                            const err = await initRes.json().catch(() => ({}));
                            throw new Error(err.error || `Servidor retornou ${initRes.status}`);
                        }

                        const data = await initRes.json();
                        uploadUrl = data.uploadUrl;
                        console.log('[addToQueue] Upload-init via servidor OK');
                    } catch (serverErr) {
                        if (_accessToken) {
                            console.log('[addToQueue] Servidor falhou, tentando client-side...', serverErr.message);
                            uploadUrl = await clientUploadInit(_accessToken, file, item);
                            console.log('[addToQueue] Upload-init via client OK');
                        } else {
                            throw new Error(serverErr.message.includes('Timeout')
                                ? 'Servidor demorou a responder e não há token para fallback — tente novamente'
                                : serverErr.message
                            );
                        }
                    }

                    // Etapa 2b: Browser envia arquivo DIRETAMENTE para o Google (sem passar pelo Render)
                    const uploadResult = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('PUT', uploadUrl);
                        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
                        xhr.timeout = 300000; // 5 min timeout — evita travamento eterno

                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable && onProgress) {
                                const pct = Math.round((e.loaded / e.total) * 100);
                                onProgress(uploadId, pct);
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
                        xhr.ontimeout = () => reject(new Error('Upload excedeu tempo limite (5 min)'));
                        xhr.send(file);
                    });

                    const youtubeVideoId = uploadResult.id;

                    // Etapa 2c: Notifica servidor que upload concluiu (timeout 60s)
                    await fetchWithTimeout('/api/youtube/upload-complete', {
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
                    }, 60000, 'finalizar agendamento (upload-complete)');

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