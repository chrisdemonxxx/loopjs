// API URL configuration for different environments
// Support environment variables with fallback to hardcoded values
const isLocal = import.meta.env.VITE_USE_LOCAL === 'true' || import.meta.env.DEV;

// Use environment variables if available, otherwise fallback to hardcoded values
const BACKEND_URL = import.meta.env.VITE_API_URL || 
  (isLocal ? 'http://localhost:8080' : 'https://loopjs-backend-361659024403.us-central1.run.app');

if (!BACKEND_URL && !isLocal) {
  // Warn loudly in production if BACKEND_URL is missing to help diagnose misconfiguration
  // eslint-disable-next-line no-console
  console.error(
    '[Config] VITE_API_URL is not set at build time. Backend API requests will likely fail.'
  );
}

export const API_URL = `${BACKEND_URL}/api`;

// WebSocket configuration
export const WS_URL = import.meta.env.VITE_WS_URL || 
  (isLocal ? 'ws://localhost:8080/ws' : 'wss://loopjs-backend-361659024403.us-central1.run.app/ws');
