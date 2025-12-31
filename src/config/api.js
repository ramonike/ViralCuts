// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build full API URLs
const buildUrl = (path) => `${API_URL}${path}`;

export const API_ENDPOINTS = {
    AUTH: {
        SIGN_UP: buildUrl('/api/auth/sign-up/email'),
        SIGN_IN: buildUrl('/api/auth/sign-in/email'),
        SIGN_OUT: buildUrl('/api/auth/sign-out'),
        SESSION: buildUrl('/api/auth/get-session'),
        FORGOT_PASSWORD: buildUrl('/api/auth/forgot-password'),
        RESET_PASSWORD: buildUrl('/api/auth/reset-password'),
        VERIFY_EMAIL: buildUrl('/api/auth/verify-email'),
        RESEND_VERIFICATION: buildUrl('/api/auth/send-verification-email'),
    },
    ADMIN: {
        USERS: buildUrl('/api/admin/users'),
    }
};
