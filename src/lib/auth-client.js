import { createAuthClient } from "better-auth/react";
import { API_URL } from '../config/api';

const getBaseUrl = () => {
    if (API_URL) return API_URL; 
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
};

export const authClient = createAuthClient({
    baseURL: getBaseUrl()
});
