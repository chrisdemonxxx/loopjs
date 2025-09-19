const WebSocket = require('ws');
const crypto = require('crypto');

class MockAgent {
  constructor(agentId, platform, version) {
    this.agentId = agentId;
    this.platform = platform;
    this.version = version;
    this.ws = null;
    this.isConnected = false;
    this.hvncSession = null;
    this.frameInterval = null;
  }

  connect() {
    console.log(`🤖 Mock Agent ${this.agentId} connecting...`);
    
    // Connect to the WebSocket server with the correct path
    this.ws = new WebSocket('ws://localhost:3000/ws');
    
    this.ws.on('open', () => {
      console.log(`✅ Mock Agent ${this.agentId} connected`);
      this.isConnected = true;
      
      // Send initial registration message
      this.sendMessage({
        type: 'agent_register',
        agentId: this.agentId,
        platform: this.platform,
        version: this.version,
        capabilities: ['hvnc', 'command', 'file_transfer']
      });
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Mock Agent ${this.agentId} received:`, message.type, message.message || '');
        
        if (message.type === 'register_success') {
          console.log(`✅ Mock Agent ${this.agentId} registered successfully`);
          this.isRegistered = true;
          
          // Send heartbeat to keep connection alive
          this.sendHeartbeat();
          this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
          }, 30000);
          
        } else if (message.type === 'error') {
          console.log(`❌ Mock Agent ${this.agentId} received error:`, message.message);
        }
        
        this.handleMessage(message);
      } catch (error) {
        console.error(`❌ Mock Agent ${this.agentId} message parse error:`, error);
      }
    });

    this.ws.on('close', () => {
      console.log(`❌ Mock Agent ${this.agentId} disconnected`);
      this.isConnected = false;
      this.stopHvncSession();
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, 5000);
    });

    this.ws.on('error', (error) => {
      console.error(`🚨 Mock Agent ${this.agentId} error:`, error.message);
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'heartbeat',
        agentId: this.agentId,
        timestamp: Date.now()
      }));
    }
  }

  handleMessage(message) {
    console.log(`📨 Mock Agent ${this.agentId} received:`, message.type);
    
    switch (message.type) {
      case 'hvnc_start':
        this.startHvncSession(message);
        break;
      case 'hvnc_stop':
        this.stopHvncSession();
        break;
      case 'command':
        this.handleCommand(message);
        break;
    }
  }

  startHvncSession(message) {
    console.log(`🖥️ Mock Agent ${this.agentId} starting HVNC session`);
    
    this.hvncSession = {
      sessionId: message.sessionId || crypto.randomUUID(),
      quality: message.quality || 'medium',
      fps: message.fps || 15
    };

    // Send success response
    this.sendMessage({
      type: 'hvnc_response',
      sessionId: this.hvncSession.sessionId,
      status: 'started',
      agentId: this.agentId,
      message: 'HVNC session started successfully'
    });

    // Start sending mock frames
    this.startFrameGeneration();
  }

  stopHvncSession() {
    if (this.hvncSession) {
      console.log(`🛑 Mock Agent ${this.agentId} stopping HVNC session`);
      
      if (this.frameInterval) {
        clearInterval(this.frameInterval);
        this.frameInterval = null;
      }

      this.sendMessage({
        type: 'hvnc_response',
        sessionId: this.hvncSession.sessionId,
        status: 'stopped',
        agentId: this.agentId,
        message: 'HVNC session stopped'
      });

      this.hvncSession = null;
    }
  }

  startFrameGeneration() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    const fps = this.hvncSession.fps || 15;
    const interval = 1000 / fps;

    this.frameInterval = setInterval(() => {
      this.sendMockFrame();
    }, interval);
  }

  sendMockFrame() {
    if (!this.hvncSession) return;

    // Generate a simple SVG frame with current time
    const timestamp = new Date().toLocaleTimeString();
    const frameNumber = Math.floor(Date.now() / 1000) % 100;
    
    const svgFrame = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      <rect x="50" y="50" width="700" height="500" fill="#16213e" stroke="#0f3460" stroke-width="2"/>
      <text x="400" y="150" text-anchor="middle" fill="#e94560" font-family="Arial" font-size="24">
        Mock ${this.platform.toUpperCase()} Desktop
      </text>
      <text x="400" y="200" text-anchor="middle" fill="#f5f5f5" font-family="Arial" font-size="16">
        Agent: ${this.agentId}
      </text>
      <text x="400" y="250" text-anchor="middle" fill="#f5f5f5" font-family="Arial" font-size="14">
        Time: ${timestamp}
      </text>
      <text x="400" y="300" text-anchor="middle" fill="#0f3460" font-family="Arial" font-size="12">
        Frame: ${frameNumber}
      </text>
      <circle cx="400" cy="400" r="${20 + Math.sin(frameNumber * 0.1) * 10}" fill="#e94560" opacity="0.7"/>
      <rect x="${350 + Math.cos(frameNumber * 0.05) * 30}" y="450" width="100" height="20" fill="#0f3460"/>
    </svg>`;

    // Convert SVG to base64
    const frameData = Buffer.from(svgFrame).toString('base64');

    this.sendMessage({
      type: 'hvnc_frame',
      sessionId: this.hvncSession.sessionId,
      agentId: this.agentId,
      frameData: frameData,
      frameInfo: {
        width: 800,
        height: 600,
        format: 'svg'
      }
    });
  }

  handleCommand(message) {
    // Simulate command execution
    setTimeout(() => {
      this.sendMessage({
        type: 'command_response',
        commandId: message.commandId,
        agentId: this.agentId,
        output: `Mock output from ${this.platform} agent: ${message.command}`,
        exitCode: 0
      });
    }, 500);
  }
}

// Create and start mock agents
const agents = [
  new MockAgent('mock-windows-001', 'windows', '1.0.0'),
  new MockAgent('mock-linux-002', 'linux', '1.0.0'),
  new MockAgent('mock-macos-003', 'macos', '1.0.0')
];

console.log('🚀 Starting Mock Agent Simulator...');
console.log('📡 Connecting to WebSocket server at ws://localhost:3000/ws');

// Start all agents with a small delay between each
agents.forEach((agent, index) => {
  setTimeout(() => {
    agent.connect();
  }, index * 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock agents...');
  agents.forEach(agent => {
    if (agent.ws) {
      agent.ws.close();
    }
  });
  process.exit(0);
});