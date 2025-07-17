const isProd = window.location.protocol === "https:";

export const API_URL = isProd
  ? "https://loopjs-2.onrender.com/api"
  : "http://localhost:10000/api";


export const WS_URL = isProd
  ? "wss://loopjs.onrender.com/ws"   // 👈 this is important
  : "ws://localhost:10000/ws";       // 👈 same port as API + "/ws" path
