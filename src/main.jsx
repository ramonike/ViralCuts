import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function clearLegacyServiceWorkerCache() {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('viralcuts-'))
          .map((cacheName) => caches.delete(cacheName))
      );
    }
  } catch (error) {
    console.warn('[main.jsx] Failed to clear legacy service worker cache:', error);
  }
}

clearLegacyServiceWorkerCache();

console.log('[main.jsx] Environment variables check:');
console.log('[main.jsx] VITE_GOOGLE_CLIENT_ID:', clientId ? 'CONFIGURED ✓' : 'MISSING ✗');
console.log('[main.jsx] Full Client ID:', clientId);

if (!clientId) {
  console.error('[main.jsx] ⚠️ CRITICAL: VITE_GOOGLE_CLIENT_ID is not defined!');
  console.error('[main.jsx] Make sure you have a .env file with VITE_GOOGLE_CLIENT_ID');
  console.error('[main.jsx] After adding the .env file, restart the dev server');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
