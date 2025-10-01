const WebSocket = require('ws');
const crypto = require('crypto');
const os = require('os');

class C2PanelTester {
  constructor() {
    this.adminToken = null;
    this.ws = null;
    this.clientUuid = crypto.randomUUID();
    this.isAuthenticated = false;
  }

  async testAuthentication() {
    console.log('🔐 Testing authentication...');
    
    // Test login endpoint
    try {
      const response = await fetch('https://loopjs-backend-kn2yg4ji5a-uc.a.run.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.adminToken = data.accessToken;
        console.log('✅ Authentication successful');
        return true;
      } else {
        console.log('❌ Authentication failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      return false;
    }
  }

  async testClientRegistration() {
    console.log('📝 Testing client registration...');
    
    try {
      const response = await fetch('https://loopjs-backend-kn2yg4ji5a-uc.a.run.app/api/info/register-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: this.clientUuid,
          computerName: os.hostname(),
          ipAddress: '127.0.0.1'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Client registration successful:', data);
        return true;
      } else {
        console.log('❌ Client registration failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Client registration error:', error.message);
      return false;
    }
  }

  async testClientList() {
    console.log('📋 Testing client list retrieval...');
    
    if (!this.adminToken) {
      console.log('❌ No admin token available');
      return false;
    }

    try {
      const response = await fetch('https://loopjs-backend-kn2yg4ji5a-uc.a.run.app/api/info/get-user-list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Client list retrieved:', data);
        return true;
      } else {
        console.log('❌ Client list retrieval failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Client list error:', error.message);
      return false;
    }
  }

  async testWebSocketConnection() {
    console.log('🔌 Testing WebSocket connection...');
    
    return new Promise((resolve) => {
      this.ws = new WebSocket('wss://loopjs-backend-kn2yg4ji5a-uc.a.run.app/ws');
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        
        // Test admin authentication
        const authMessage = {
          type: 'auth',
          token: this.adminToken
        };
        
        console.log('📤 Sending admin authentication...');
        this.ws.send(JSON.stringify(authMessage));
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received:', message.type, message.message || '');
          
          if (message.type === 'auth_success') {
            this.isAuthenticated = true;
            console.log('✅ Admin authentication successful');
            this.testCommandSending();
          } else if (message.type === 'command_result') {
            console.log('✅ Command result received:', message);
            this.ws.close();
            resolve(true);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        resolve(false);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket closed');
        resolve(true);
      });
    });
  }

  testCommandSending() {
    console.log('📤 Testing command sending...');
    
    const command = {
      type: 'command',
      targetUuid: this.clientUuid,
      command: 'echo "Hello from C2 Panel"',
      taskId: crypto.randomUUID()
    };
    
    console.log('📤 Sending command:', command);
    this.ws.send(JSON.stringify(command));
  }

  async runTests() {
    console.log('🚀 Starting C2 Panel Tests...\n');
    
    // Test 1: Authentication
    const authSuccess = await this.testAuthentication();
    if (!authSuccess) {
      console.log('❌ Authentication failed, stopping tests');
      return;
    }
    
    // Test 2: Client Registration
    const regSuccess = await this.testClientRegistration();
    if (!regSuccess) {
      console.log('❌ Client registration failed, stopping tests');
      return;
    }
    
    // Test 3: Client List
    const listSuccess = await this.testClientList();
    if (!listSuccess) {
      console.log('❌ Client list failed, stopping tests');
      return;
    }
    
    // Test 4: WebSocket Connection and Command
    const wsSuccess = await this.testWebSocketConnection();
    if (!wsSuccess) {
      console.log('❌ WebSocket test failed');
      return;
    }
    
    console.log('\n🎉 All C2 Panel tests completed successfully!');
  }
}

// Run the tests
const tester = new C2PanelTester();
tester.runTests().catch(console.error);