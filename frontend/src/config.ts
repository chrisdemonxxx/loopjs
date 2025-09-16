// API URL configuration for different environments
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://loopjs-backend-361659024403.us-central1.run.app');

export const API_URL = `${BACKEND_URL}/api`;

// WebSocket configuration
export const WS_URL = isLocal ? 'ws://localhost:3000/ws' : `${BACKEND_URL.replace('https://', 'wss://')}/ws`;
