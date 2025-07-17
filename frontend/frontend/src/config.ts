const isProd = window.location.protocol === "https:";

export const API_URL = isProd
  ? "https://loopjs-2.onrender.com/api"
  : "http://localhost:10000/api";


export const WS_URL = isProd
  ? "wss://loopjs-2.onrender.com/ws"   // ✅ matches API domain
  : "ws://localhost:10000/ws";

