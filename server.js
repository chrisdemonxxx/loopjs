const http = require('http');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let db = null;

(async () => {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db('loopjs');
  console.log('Connected to MongoDB');
})();

wss.on('connection', (ws) => {
  console.log("Client connected.");

  ws.on('message', async (data) => {
    const message = data.toString();
    console.log("Received:", message);

    // Save to DB
    if (db) {
      await db.collection('messages').insertOne({
        text: message,
        at: new Date()
      });
    }

    ws.send("FROM_SERVERsep-x8jmjgfmr9messageboxsep-x8jmjgfmr9Hello,This is from Node,info");
  });

  ws.on('close', () => {
    console.log("Client disconnected.");
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
