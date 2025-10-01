const WebSocket = require('ws');

// Define the WebSocket URL
const url = 'ws://localhost:8080/ws';
console.log(`Connecting to ${url}...`);

// Create WebSocket connection
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send authentication message
  const authMessage = {
    type: 'auth',
    token: 'test-token'
  };
  
  console.log('Sending authentication message:', authMessage);
  ws.send(JSON.stringify(authMessage));
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data);
    console.log('Received:', JSON.stringify(parsed, null, 2));
    
    // If authentication failed, try to get more information
    if (parsed.type === 'auth_failed') {
      console.log('Authentication failed. Sending a ping message to see if connection is still alive...');
      ws.send(JSON.stringify({type: 'ping'}));
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

// Set a timeout to close the connection after 5 seconds
setTimeout(() => {
  console.log('Test complete. Closing connection...');
  ws.close();
}, 5000);