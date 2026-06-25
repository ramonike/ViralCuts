/**
 * TikTok Upload — Client API
 *
 * Chama o backend /api/tiktok/upload (Content Posting API v2).
 * O servidor cuida de autenticação, PKCE e comunicação com a TikTok API.
 *
 * Uso:
 *   const result = await uploadTikTok(item, token, file);
 *   // result: { status: 'success'|'error', url, publishId, error }
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Faz upload de um vídeo para o TikTok via backend.
 *
 * @param {Object} item       - Item da fila (title, description, tags, privacyStatus, accountId, platform)
 * @param {string} _token     - Token de acesso (não usado diretamente — o backend usa o token armazenado no DB)
 * @param {File}   file       - Arquivo de vídeo (File object)
 * @returns {Promise<{ status: string, url?: string, publishId?: string, error?: string }>}
 */
export async function uploadTikTok(item, _token, file) {
    if (!file) {
        return { status: 'error', error: 'Arquivo de vídeo não fornecido.' };
    }

    const metadata = {
        title: item.title || file.name.replace(/\.[^/.]+$/, ''),
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        privacyLevel: mapPrivacyStatus(item.privacyStatus),
        disableDuet: false,
        disableComment: false,
        disableStitch: false,
    };

    try {
        const arrayBuffer = await file.arrayBuffer();

        const response = await fetch(`${API_BASE}/api/tiktok/upload`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': file.type || 'video/mp4',
                'X-Account-Id': item.accountId || '',
                'X-Video-Metadata': JSON.stringify(metadata),
            },
            body: arrayBuffer,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                status: 'error',
                error: data.error || `TikTok upload falhou (${response.status})`,
            };
        }

        // Sucesso: o TikTok processa o vídeo de forma assíncrona.
        // publishId pode ser usado para checar o status depois.
        return {
            status: 'success',
            publishId: data.publishId,
            url: data.videoUrl || null,
        };
    } catch (err) {
        console.error('[tiktokUpload] Erro inesperado:', err);
        return { status: 'error', error: err.message || 'Erro inesperado no upload TikTok.' };
    }
}

/**
 * Converte privacyStatus do ViralCuts para o enum da TikTok Content Posting API.
 * https://developers.tiktok.com/doc/content-posting-api-reference-post-video
 */
function mapPrivacyStatus(status) {
    switch (status) {
        case 'public':    return 'PUBLIC_TO_EVERYONE';
        case 'unlisted':  return 'MUTUAL_FOLLOW_FRIENDS';
        case 'private':   return 'SELF_ONLY';
        default:          return 'SELF_ONLY';
    }
}

/**
 * Verifica o status de publicação de um vídeo no TikTok.
 * Útil para polling após upload (o TikTok processa de forma assíncrona).
 *
 * @param {string} publishId  - ID retornado pelo upload
 * @param {string} accountId  - ID da conta TikTok
 * @returns {Promise<{ status: string, videoId?: string, videoUrl?: string, failReason?: string }>}
 */
export async function checkTikTokStatus(publishId, accountId) {
    try {
        const params = new URLSearchParams();
        if (accountId) params.set('accountId', accountId);

        const response = await fetch(
            `${API_BASE}/api/tiktok/status/${encodeURIComponent(publishId)}?${params}`,
            { credentials: 'include' }
        );

        const data = await response.json();

        if (!response.ok) {
            return { status: 'error', error: data.error || 'Falha ao verificar status.' };
        }

        return {
            status: data.status,
            videoId: data.videoId,
            videoUrl: data.videoUrl,
            failReason: data.failReason,
        };
    } catch (err) {
        console.error('[checkTikTokStatus] Erro:', err);
        return { status: 'error', error: err.message };
    }
}
