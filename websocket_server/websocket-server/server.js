// websocket-server/server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5173 });

wss.on('connection', (ws) => {
    console.log("Client connected.");

    ws.on('message', (data) => {
        console.log("Received:", data.toString());

        // Echo something back to your Qt app
        ws.send("FROM_SERVERsep-x8jmjgfmr9messageboxsep-x8jmjgfmr9Hello,This is from Node,info");
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});
