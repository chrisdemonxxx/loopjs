/**
 * Simplified Frontend Deployment Script for Vercel
 * 
 * This script helps deploy the frontend to Vercel with proper environment configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deployToVercel() {
  try {
    console.log('🚀 Starting Vercel deployment process...');
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      console.log('✅ Vercel CLI is installed');
    } catch (error) {
      console.log('⚠️ Vercel CLI is not installed. Installing now...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }
    
    // Login to Vercel if needed
    console.log('🔑 Ensuring you\'re logged in to Vercel...');
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Already logged in to Vercel');
    } catch (error) {
      console.log('🔑 Please login to Vercel:');
      execSync('vercel login', { stdio: 'inherit' });
    }
    
    // Get backend URL
    const backendUrl = await askQuestion('Enter the backend URL (e.g., http://localhost:3000 or your Docker container URL): ');
    
    // Get WebSocket URL
    const wsUrl = await askQuestion(`Enter the WebSocket URL (default: ${backendUrl.replace('http', 'ws')}/ws): `) || `${backendUrl.replace('http', 'ws')}/ws`;
    
    // Create .env.production file
    const envContent = `VITE_BACKEND_URL=${backendUrl}\nVITE_WS_URL=${wsUrl}\n`;
    fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
    console.log('✅ Created .env.production with backend and WebSocket URLs');
    
    // Build the project
    console.log('🔨 Building the project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    
    // Set environment variables in Vercel
    console.log('⚙️ Setting environment variables in Vercel...');
    try {
      execSync(`vercel env add VITE_BACKEND_URL production ${backendUrl}`, { stdio: 'inherit' });
      execSync(`vercel env add VITE_WS_URL production ${wsUrl}`, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Could not set environment variables. You may need to set them manually in the Vercel dashboard.');
    }
    
    // Deploy with production flag
    const deployCommand = 'vercel --prod';
    console.log(`Executing: ${deployCommand}`);
    execSync(deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Deployment to Vercel completed successfully!');
    console.log('🔍 Verify your deployment in the Vercel dashboard');
    
    // Provide instructions for connecting backend and frontend
    console.log('\n📋 Next steps:');
    console.log('1. Ensure your backend container is running and accessible');
    console.log('2. Test the complete deployment by accessing your Vercel URL');
    console.log('3. If needed, update the backend CORS settings to allow requests from your Vercel domain');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the function if this is the main module
deployToVercel();