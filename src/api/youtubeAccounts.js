import { API_URL } from '../config/api';

const DEFAULT_YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

export async function syncYouTubeBrowserToken(tokenResponse) {
    const accessToken = tokenResponse?.access_token || tokenResponse?.accessToken || tokenResponse?.token;

    if (!accessToken || accessToken.startsWith('MOCK_TOKEN')) {
        return null;
    }

    const response = await fetch(`${API_URL}/api/youtube/accounts/sync-browser-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            accessToken,
            expiresIn: tokenResponse.expires_in || tokenResponse.expiresIn || 3600,
            scope: tokenResponse.scope || DEFAULT_YOUTUBE_SCOPE,
        }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = data.error?.message || data.error || data.code || `HTTP ${response.status}`;
        throw new Error(data.requestId ? `${errorMessage} (${data.requestId})` : errorMessage);
    }

    return data.account || null;
}

export async function ensureYouTubeAccountSynced(auth) {
    if (!auth?.youtubeToken || auth.youtubeToken.startsWith('MOCK_TOKEN')) {
        return null;
    }

    return syncYouTubeBrowserToken({
        accessToken: auth.youtubeToken,
        expiresIn: Math.max(1, Math.floor(((auth.youtubeTokenExpiresAt || Date.now()) - Date.now()) / 1000)),
    });
}
