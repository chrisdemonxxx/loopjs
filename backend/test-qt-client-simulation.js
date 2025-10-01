const WebSocket = require('ws');
const crypto = require('crypto');
const os = require('os');

class QtClientSimulator {
  constructor() {
    this.clientUuid = crypto.randomUUID();
    this.computerName = os.hostname();
    this.platform = os.platform();
    this.architecture = os.arch();
    this.isRegistered = false;
    this.heartbeatInterval = null;
    this.ws = null;
  }

  connect() {
    console.log('🤖 Qt Client Simulator connecting...');
    console.log(`Client UUID: ${this.clientUuid}`);
    console.log(`Computer Name: ${this.computerName}`);
    console.log(`Platform: ${this.platform}`);
    console.log(`Architecture: ${this.architecture}`);
    
    this.ws = new WebSocket('wss://loopjs-backend-kn2yg4ji5a-uc.a.run.app/ws');
    
    this.ws.on('open', () => {
      console.log('✅ Connected to WebSocket server');
      this.register();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message.type, message.message || '');
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  register() {
    const registrationMessage = {
      type: 'register',
      uuid: this.clientUuid,
      computerName: this.computerName,
      platform: this.platform,
      architecture: this.architecture,
      systemInfo: {
        hostname: this.computerName,
        platform: this.platform,
        arch: this.architecture,
        release: os.release(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length
      },
      capabilities: ['command', 'file_transfer', 'screenshot', 'system_info']
    };

    console.log('📤 Sending registration:', registrationMessage);
    this.ws.send(JSON.stringify(registrationMessage));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'register_success':
        console.log('✅ Registration successful!');
        this.isRegistered = true;
        this.startHeartbeat();
        break;

      case 'command':
        console.log('📋 Received command:', message.command);
        this.executeCommand(message);
        break;

      case 'error':
        console.error('❌ Server error:', message.message);
        break;

      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  executeCommand(message) {
    const { command, taskId } = message;
    
    // Simulate command execution
    console.log(`🔧 Executing command: ${command}`);
    
    // Simulate command result
    const result = {
      type: 'command_result',
      taskId: taskId,
      output: `Command executed: ${command}\nResult: Success\nTimestamp: ${new Date().toISOString()}`,
      exitCode: 0
    };

    setTimeout(() => {
      console.log('📤 Sending command result:', result);
      this.ws.send(JSON.stringify(result));
    }, 1000);
  }

  startHeartbeat() {
    console.log('💓 Starting heartbeat...');
    this.heartbeatInterval = setInterval(() => {
      const heartbeat = {
        type: 'heartbeat',
        uuid: this.clientUuid,
        timestamp: Date.now(),
        status: 'online'
      };
      
      console.log('💓 Sending heartbeat');
      this.ws.send(JSON.stringify(heartbeat));
    }, 30000); // Every 30 seconds
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create and start the simulator
const client = new QtClientSimulator();
client.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Qt Client Simulator...');
  client.disconnect();
  process.exit(0);
});

console.log('🚀 Qt Client Simulator started. Press Ctrl+C to stop.');