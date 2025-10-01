const https = require('https');

class SystemMonitor {
  constructor() {
    this.backendUrl = 'https://loopjs-backend-kn2yg4ji5a-uc.a.run.app';
    this.frontendUrl = 'https://loopjs.vidai.sbs';
    this.interval = 30000; // 30 seconds
    this.isRunning = false;
  }

  async checkBackendHealth() {
    try {
      const response = await this.makeRequest(`${this.backendUrl}/health`);
      const data = JSON.parse(response);
      
      return {
        status: 'healthy',
        uptime: data.uptime,
        memory: data.memory,
        database: data.database,
        timestamp: data.timestamp
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkFrontendHealth() {
    try {
      const response = await this.makeRequest(this.frontendUrl);
      if (response.includes('Windows System Management')) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          status: 'unhealthy',
          error: 'Unexpected content',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkClientCount() {
    try {
      // This would require authentication, so we'll skip for now
      return {
        status: 'unknown',
        message: 'Client count check requires authentication',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  async runCheck() {
    console.log(`\n🔍 System Health Check - ${new Date().toLocaleString()}`);
    console.log('=' .repeat(60));

    // Check Backend
    console.log('📡 Backend Health:');
    const backendHealth = await this.checkBackendHealth();
    if (backendHealth.status === 'healthy') {
      console.log(`  ✅ Status: ${backendHealth.status}`);
      console.log(`  ⏱️  Uptime: ${this.formatUptime(backendHealth.uptime)}`);
      console.log(`  💾 Memory: ${backendHealth.memory.rss} (Heap: ${backendHealth.memory.heapUsed}/${backendHealth.memory.heapTotal})`);
      console.log(`  🗄️  Database: ${backendHealth.database}`);
    } else {
      console.log(`  ❌ Status: ${backendHealth.status}`);
      console.log(`  🚨 Error: ${backendHealth.error}`);
    }

    // Check Frontend
    console.log('\n🌐 Frontend Health:');
    const frontendHealth = await this.checkFrontendHealth();
    if (frontendHealth.status === 'healthy') {
      console.log(`  ✅ Status: ${frontendHealth.status}`);
    } else {
      console.log(`  ❌ Status: ${frontendHealth.status}`);
      console.log(`  🚨 Error: ${frontendHealth.error}`);
    }

    // Check Client Count
    console.log('\n👥 Client Status:');
    const clientStatus = await this.checkClientCount();
    console.log(`  ℹ️  ${clientStatus.message}`);

    console.log('\n' + '=' .repeat(60));
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting System Monitor...');
    console.log(`📊 Check interval: ${this.interval / 1000} seconds`);
    console.log('Press Ctrl+C to stop\n');

    // Run initial check
    this.runCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, this.interval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Monitor is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('\n🛑 System Monitor stopped');
  }
}

// Create and start the monitor
const monitor = new SystemMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

// Start monitoring
monitor.start();
