require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Enable CORS for all origins (for client connections)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'LoopJS API is running' });
});

// Get list of connected clients
app.get('/api/clients', (req, res) => {
  const clientList = Array.from(clients.entries()).map(([id, client]) => ({
    id: id,
    info: client.info,
    connectedAt: client.connectedAt
  }));
  res.json({ clients: clientList });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server with no authentication (open for clients)
const wss = new WebSocket.Server({ 
  server, 
  path: '/ws',
  verifyClient: (info, callback) => {
    // Allow all connections (no authentication required)
    console.log('WebSocket connection attempt from:', info.origin);
    callback(true);
  }
});

// Store connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log('Client connected from:', clientIp);
  
  let clientId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle client registration
      if (data.type === 'register') {
        clientId = data.clientId || Date.now().toString();
        clients.set(clientId, {
          ws: ws,
          info: data.info || {},
          connectedAt: new Date()
        });
        
        console.log('Client registered:', clientId);
        
        // Send registration confirmation
        ws.send(JSON.stringify({
          type: 'registered',
          clientId: clientId
        }));
        
        // Broadcast updated client list
        broadcastClientList();
      }
      // Handle heartbeat
      else if (data.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat_ack'
        }));
      }
      // Echo other messages
      else {
        ws.send(JSON.stringify({
          type: 'echo',
          data: data
        }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected:', clientId);
    if (clientId) {
      clients.delete(clientId);
      broadcastClientList();
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to LoopJS WebSocket Server'
  }));
});

// Broadcast client list to all connected admin clients
function broadcastClientList() {
  const clientList = Array.from(clients.entries()).map(([id, client]) => ({
    id: id,
    info: client.info,
    connectedAt: client.connectedAt
  }));
  
  const message = JSON.stringify({
    type: 'clients',
    data: clientList
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// Testing deployment
