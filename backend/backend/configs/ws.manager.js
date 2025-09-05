class WebSocketManager {
    constructor() {
        this.clients = new Map();
    }

    addClient(uuid, ws) {
        if (!this.clients.has(uuid)) {
            this.clients.set(uuid, new Set());
        }
        this.clients.get(uuid).add(ws);
    }

    removeClient(ws) {
        for (const [uuid, clientSet] of this.clients.entries()) {
            if (clientSet.has(ws)) {
                clientSet.delete(ws);
                if (clientSet.size === 0) {
                    this.clients.delete(uuid);
                }
                break;
            }
        }
    }

    broadcast(uuid, data) {
        if (this.clients.has(uuid)) {
            for (const client of this.clients.get(uuid)) {
                client.send(JSON.stringify(data));
            }
        }
    }
}

module.exports = new WebSocketManager();
