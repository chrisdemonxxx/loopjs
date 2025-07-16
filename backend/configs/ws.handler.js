const WebSocket = require('ws');

let socketList = [];  
let wss;

function initWebSocketServer(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const ipAddress = req.connection.remoteAddress;
        ws.ipAddress = ipAddress;
        ws.lastActiveTime = new Date();

        socketList.push(ws);

        sendBroadcastToWebPanel();

        ws.on('message', (message) => {
            handleClientMessage(ws, message);
            sendBroadcastToWebPanel();
        });

        ws.on('close', () => {
            for (let i = 0; i < socketList.length; i++) {
                if (socketList[i] === ws) {
                    socketList.splice(i, 1);  // Remove the socket from the array
                    break;  // Exit loop once the socket is found and removed
                }
            }

            sendBroadcastToWebPanel();
        });
    });

    console.log('WebSocket server initialized');
}

function sendBroadcastToWebPanel() {
    for (let i = 0; i < socketList.length; i++) {
        if (!socketList[i].computerName) {
            socketList[i].send("reload");
        }
    }
}

function handleClientMessage(ws, messageBuffer) {
    const decoder = new TextDecoder('utf-8');
    const stringMessage = decoder.decode(messageBuffer);

    if(stringMessage == "reload") {
        return;
    }

    const result = stringMessage.split("sep-x8jmjgfmr9");

    if(result[0] == "FROM_WIN_CLIENT") {
        if(result[1] == "CS_SEND_COMPUTERNAME") {
            ws.computerName = result[2];
        }
    }
}

module.exports = {
    initWebSocketServer,
    socketList,
    wss
};
