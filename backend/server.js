require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 8080;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'LoopJS API is running' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Echo back to client
    ws.send(JSON.stringify({
      type: 'echo',
      data: message.toString()
    }));
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'info',
    data: 'Connected to LoopJS WebSocket Server'
  }));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
