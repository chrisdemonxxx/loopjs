const isProd = window.location.protocol === "https:";

export const API_URL = isProd
  ? "https://loopjs.onrender.com"
  : "http://localhost:10000";

export const WS_URL = isProd
  ? "wss://loopjs-websocket.onrender.com"
  : "ws://localhost:10001";
