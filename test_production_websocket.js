const WebSocket = require('ws');

console.log('Testing WebSocket connection to production server...');

const ws = new WebSocket('wss://code-assist-470813.uc.r.appspot.com');

ws.on('open', function open() {
    console.log('✅ WebSocket connection established successfully!');
    
    // Test sending a message
    const testMessage = {
        type: 'test',
        data: 'Hello from production test client!',
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending test message:', testMessage);
    ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
    console.log('📥 Received message:', data.toString());
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
    console.log('🔌 WebSocket connection closed:', code, reason.toString());
});

// Close connection after 5 seconds
setTimeout(() => {
    console.log('⏰ Closing connection...');
    ws.close();
}, 5000);