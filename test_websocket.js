// Test script to simulate stealth client WebSocket connection
const WebSocket = require('ws');

// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', function open() {
    console.log('Connected to WebSocket server');
    
    // Simulate stealth client registration
    const clientData = {
        uuid: 'test-client-' + Date.now(),
        ip: '192.168.1.100',
        ipAddress: '192.168.1.100',
        computerName: 'TEST-MACHINE',
        hostname: 'TEST-MACHINE',
        platform: 'Windows 10',
        type: 'stealth_client'
    };
    
    console.log('Sending client registration:', clientData);
    ws.send(JSON.stringify(clientData));
    
    // Simulate periodic heartbeat
    setInterval(() => {
        ws.send(JSON.stringify({
            uuid: clientData.uuid,
            ip: clientData.ip,
            hostname: clientData.hostname,
            platform: clientData.platform,
            heartbeat: true
        }));
        console.log('Sent heartbeat for', clientData.hostname);
    }, 10000);
    
    // Simulate task output after 5 seconds
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'output',
            taskId: 'test-task-123',
            output: 'Task completed successfully - test output from simulated client'
        }));
        console.log('Sent task output');
    }, 5000);
});

ws.on('message', function message(data) {
    try {
        const parsed = JSON.parse(data);
        console.log('Received from server:', parsed);
    } catch (e) {
        console.log('Received raw message:', data.toString());
    }
});

ws.on('close', function close() {
    console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

// Keep the script running
console.log('WebSocket test client starting...');
console.log('Press Ctrl+C to exit');