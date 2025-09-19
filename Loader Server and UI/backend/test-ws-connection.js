const WebSocket = require('ws');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for the WebSocket URL
rl.question('Enter WebSocket URL (default: ws://localhost:8080/ws): ', (wsUrl) => {
  const url = wsUrl || 'ws://localhost:8080/ws';
  console.log(`Connecting to ${url}...`);
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('Connected to WebSocket server');
    
    // Ask for authentication token
    rl.question('Enter JWT token for authentication (or press enter to use test-token): ', (token) => {
      const authToken = token || 'test-token';
      
      // Send authentication message
      const authMessage = {
        type: 'auth',
        token: authToken
      };
      
      console.log('Sending authentication message:', authMessage);
      ws.send(JSON.stringify(authMessage));
      
      // Setup command input loop
      const askForCommand = () => {
        rl.question('Enter message to send (or "exit" to quit): ', (input) => {
          if (input.toLowerCase() === 'exit') {
            ws.close();
            rl.close();
            return;
          }
          
          try {
            // Try to parse as JSON
            const jsonMsg = JSON.parse(input);
            ws.send(JSON.stringify(jsonMsg));
          } catch (e) {
            // Send as plain message
            ws.send(input);
          }
          
          askForCommand();
        });
      };
      
      // Start command loop after authentication
      setTimeout(askForCommand, 1000);
    });
  });
  
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      console.log('Received:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Received:', data.toString());
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`Disconnected: Code ${code}, Reason: ${reason.toString()}`);
    rl.close();
    process.exit(0);
  });
});