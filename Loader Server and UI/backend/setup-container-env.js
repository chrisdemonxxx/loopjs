/**
 * Backend Container Environment Setup Script
 * 
 * This script helps set up the environment variables for containerized backend deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Generate a random string for secrets
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

async function setupContainerEnv() {
  try {
    console.log('🚀 Setting up environment for containerized backend deployment...');
    
    // Default values
    const defaults = {
      NODE_ENV: 'production',
      PORT: '3000',
      MONGODB_URI: 'mongodb://loopjs_user:loopjspassword@mongodb:27017/loopjs?authSource=loopjs',
      SESSION_SECRET: generateSecret(),
      JWT_SECRET: generateSecret(),
      ALLOWED_ORIGINS: 'https://your-frontend-domain.vercel.app',
      LOG_LEVEL: 'info',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      WS_HEARTBEAT_INTERVAL: '30000',
      WS_CONNECTION_TIMEOUT: '60000'
    };
    
    // Get MongoDB URI
    const mongoDbUri = await askQuestion(`Enter MongoDB URI [${defaults.MONGODB_URI}]: `);
    defaults.MONGODB_URI = mongoDbUri || defaults.MONGODB_URI;
    
    // Get allowed origins
    const allowedOrigins = await askQuestion(`Enter allowed origins (comma-separated) [${defaults.ALLOWED_ORIGINS}]: `);
    defaults.ALLOWED_ORIGINS = allowedOrigins || defaults.ALLOWED_ORIGINS;
    
    // Create .env.container file
    let envContent = '';
    for (const [key, value] of Object.entries(defaults)) {
      envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(path.join(__dirname, '.env.container'), envContent);
    console.log('✅ Created .env.container with environment variables');
    
    // Create a sample .env file for local Docker Compose usage
    const sampleEnvContent = `# MongoDB credentials for Docker Compose\nMONGO_INITDB_ROOT_USERNAME=root\nMONGO_INITDB_ROOT_PASSWORD=rootpassword\nMONGO_APP_PASSWORD=loopjspassword\n`;
    fs.writeFileSync(path.join(__dirname, '.env.docker-sample'), sampleEnvContent);
    console.log('✅ Created .env.docker-sample for local Docker Compose usage');
    
    console.log('\n📋 Next steps:');
    console.log('1. Review and modify .env.container if needed');
    console.log('2. Build and run the Docker container using docker-compose');
    console.log('3. Update the frontend configuration to point to your containerized backend');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup function
setupContainerEnv();