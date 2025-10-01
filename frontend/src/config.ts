// API URL configuration for different environments
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '4174';

// Use deployed backend URL for production
const BACKEND_URL = isLocal ? 'http://localhost:8080' : 'https://loopjs-backend-361659024403.us-central1.run.app';

if (!BACKEND_URL && !isLocal) {
  // Warn loudly in production if BACKEND_URL is missing to help diagnose misconfiguration
  // eslint-disable-next-line no-console
  console.error(
    '[Config] VITE_BACKEND_URL is not set at build time. Backend API requests will likely fail.'
  );
}

export const API_URL = `${BACKEND_URL}/api`;

// WebSocket configuration
export const WS_URL = isLocal ? 'ws://localhost:8080/ws' : 'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
