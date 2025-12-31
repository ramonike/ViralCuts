import { API_URL } from '../config/api';

/**
 * Generic fetch wrapper for the Go Backend API
 * Handles credentials automatically
 */
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    const defaults = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
    };

    const config = {
        ...defaults,
        ...options,
        headers: {
            ...defaults.headers,
            ...options.headers,
        }
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        if (response.status === 401) {
            // value to indicate unauthorized
            throw new Error('Unauthorized');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth
    signUp: (data) => fetchAPI('/auth/sign-up', { method: 'POST', body: JSON.stringify(data) }),
    signIn: (data) => fetchAPI('/auth/sign-in', { method: 'POST', body: JSON.stringify(data) }),
    signOut: () => fetchAPI('/auth/sign-out', { method: 'POST' }),
    getSession: () => fetchAPI('/auth/session', { method: 'GET' }),

    // Data - The new secure way to get data
    getDashboardData: () => fetchAPI('/dashboard', { method: 'GET' }),
    updateSettings: (settings) => fetchAPI('/settings', { method: 'POST', body: JSON.stringify(settings) }),
    addToQueue: (item) => fetchAPI('/queue', { method: 'POST', body: JSON.stringify(item) }),
    deleteQueueItem: (id) => fetchAPI(`/queue/${id}`, { method: 'DELETE' }),
};
