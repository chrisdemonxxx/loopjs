const isProd = window.location.protocol === "https:";

export const API_URL = isProd
  ? "https://loopjs.onrender.com"
  : "http://localhost:10000";

export const WS_URL = isProd
  ? "wss://loopjs.onrender.com/ws"   // 👈 this is important
  : "ws://localhost:10000/ws";       // 👈 same port as API + "/ws" path
