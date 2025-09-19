/**
 * Wordful Deployment Helper Script
 * 
 * This script helps prepare the environment for Wordful deployment
 * by validating configuration and setting up necessary resources.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.production' });

async function main() {
  console.log('🚀 Starting Wordful deployment preparation...');
  
  // Check if required environment variables are set
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGO_URI',
    'SESSION_SECRET',
    'JWT_SECRET',
    'ALLOWED_ORIGINS'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these variables in .env.production or as environment variables');
    process.exit(1);
  }
  
  // Validate MongoDB connection string
  if (process.env.MONGO_URI.includes('${MONGODB_PASSWORD}')) {
    console.error('❌ MongoDB connection string contains placeholder ${MONGODB_PASSWORD}');
    console.error('Please replace with actual MongoDB Atlas connection string');
    process.exit(1);
  }
  
  // Check if Wordful domain is in allowed origins
  if (!process.env.ALLOWED_ORIGINS.includes('wordful.app')) {
    console.error('⚠️ Warning: ALLOWED_ORIGINS does not include wordful.app');
    console.error('CORS may block requests from the Wordful domain');
  }
  
  // Check if app.yaml exists
  try {
    await fs.access('app.yaml');
    console.log('✅ app.yaml found');
  } catch (error) {
    console.error('❌ app.yaml not found');
    console.error('Please create app.yaml for Google App Engine deployment');
    process.exit(1);
  }
  
  // Check if Google Cloud SDK is installed
  try {
    const gcloudVersion = execSync('gcloud --version').toString();
    console.log('✅ Google Cloud SDK installed');
  } catch (error) {
    console.error('❌ Google Cloud SDK not found or not in PATH');
    console.error('Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
    process.exit(1);
  }
  
  console.log('✅ All checks passed!');
  console.log('🚀 Ready for deployment to Wordful!');
  console.log('\nTo deploy, run: npm run deploy');
}

main().catch(error => {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
});