// websocket-server/server.js
const http = require('http');
const WebSocket = require('ws');
// const { MongoClient } = require('mongodb'); // Uncomment if using DB

const PORT = process.env.PORT || 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Uncomment below if using a database
// const MONGO_URI = process.env.MONGO_URI || 'your-mongodb-connection-string';

wss.on('connection', (ws) => {
    console.log("Client connected.");

    ws.on('message', (data) => {
        console.log("Received:", data.toString());

        // Echo something back to your Qt app
        ws.send("FROM_SERVERsep-x8jmjgfmr9messageboxsep-x8jmjgfmr9Hello,This is from Node,info");

        // Example DB save (if needed):
        // db.collection('messages').insertOne({ content: data.toString(), at: new Date() });
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});

/*
(async () => {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('mydb');
    console.log('Connected to MongoDB');
})();
*/
