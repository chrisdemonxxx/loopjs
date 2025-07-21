const isLocal = window.location.hostname === "localhost";
const devPort = 3000; // or whatever you use locally

export const API_URL = isLocal ? `http://localhost:${devPort}/api` : "/api";
export const WS_URL  = isLocal ? `ws://localhost:${devPort}/ws`    : `wss://${window.location.host}/ws`;
