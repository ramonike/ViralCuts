import { API_URL } from '../config/api';

export class ApiError extends Error {
    constructor(message, status, code, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export const getApiBaseUrl = () => {
    if (API_URL) return API_URL; 
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
};

export function buildApiUrl(endpoint) {
    const base = getApiBaseUrl();
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return `${base}${normalizedEndpoint}`;
}

async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 204) return null;
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

/**
 * Generic fetch wrapper for the ViralCuts Backend API
 * Handles credentials automatically
 */
export async function fetchAPI(endpoint, options = {}) {
    const defaults = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
    };

    const headers = {
        ...defaults.headers,
        ...options.headers,
    };

    const hasExplicitContentType = Object.keys(options.headers || {})
        .some((key) => key.toLowerCase() === 'content-type');

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && options.body instanceof ArrayBuffer;
    const isBlob = typeof Blob !== 'undefined' && options.body instanceof Blob;

    if (!hasExplicitContentType && (isFormData || isArrayBuffer || isBlob)) {
        delete headers['Content-Type'];
    }

    const config = {
        ...defaults,
        ...options,
        headers,
    };

    const response = await fetch(buildApiUrl(endpoint), config);
    const data = await parseResponse(response);

    if (!response.ok) {
        throw new ApiError(
            data?.error || data?.message || `Request failed with status ${response.status}`,
            response.status,
            data?.code || (response.status === 401 ? 'AUTH_ERROR' : 'API_ERROR'),
            data
        );
    }

    return data;
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
