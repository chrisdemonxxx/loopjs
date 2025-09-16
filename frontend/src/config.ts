// API URL configuration for different environments
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, VITE_BACKEND_URL MUST be provided at build time by Cloud Build/Docker build args.
// Fallback to localhost only for local development.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : '');

if (!BACKEND_URL && !isLocal) {
  // Warn loudly in production if BACKEND_URL is missing to help diagnose misconfiguration
  // eslint-disable-next-line no-console
  console.error(
    '[Config] VITE_BACKEND_URL is not set at build time. Backend API requests will likely fail.'
  );
}

export const API_URL = `${BACKEND_URL}/api`;

// WebSocket configuration
export const WS_URL = isLocal ? 'ws://localhost:3000/ws' : `${BACKEND_URL.replace('https://', 'wss://')}/ws`;
