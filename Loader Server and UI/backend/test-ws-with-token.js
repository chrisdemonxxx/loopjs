const WebSocket = require('ws');

// Define the WebSocket URL
const url = 'ws://localhost:8080/ws';
console.log(`Connecting to ${url}...`);

// Use the JWT token generated from generate-test-token.js
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNCIsInVzZXJuYW1lIjoidGVzdC11c2VyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4Mjc4MDYyLCJleHAiOjE3NTgyODE2NjJ9.AgoAirN-mHc0duMbC-bgSBmcmRRiedKvc4EgPYUD9cw';

// Create WebSocket connection
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send authentication message with the valid token
  const authMessage = {
    type: 'auth',
    token: token
  };
  
  console.log('Sending authentication message with valid JWT token');
  ws.send(JSON.stringify(authMessage));
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data);
    console.log('Received:', JSON.stringify(parsed, null, 2));
    
    // If authentication succeeded, send a web_client message
    if (parsed.type === 'auth_success') {
      console.log('Authentication successful! Sending web_client message...');
      ws.send(JSON.stringify({
        type: 'web_client',
        action: 'get_clients'
      }));
    }
  } catch (e) {
    console.log('Received:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`Disconnected: Code ${code}, Reason: ${reason.toString()}`);
  process.exit(0);
});

// Set a timeout to close the connection after 10 seconds
setTimeout(() => {
  console.log('Test complete. Closing connection...');
  ws.close();
}, 10000);