/**
 * Frontend Deployment Script for Vercel
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
    
    // Get backend URL
    let backendUrl = process.env.VITE_BACKEND_URL;
    if (!backendUrl) {
      backendUrl = await askQuestion('Enter the backend URL (e.g., https://api.example.com): ');
    }
    
    // Get WebSocket URL
    let wsUrl = process.env.VITE_WS_URL;
    if (!wsUrl) {
      wsUrl = await askQuestion('Enter the WebSocket URL (e.g., wss://api.example.com/ws): ');
    }
    
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
    execSync(`vercel env add VITE_BACKEND_URL production ${backendUrl}`, { stdio: 'inherit' });
    execSync(`vercel env add VITE_WS_URL production ${wsUrl}`, { stdio: 'inherit' });
    
    // Deploy with production flag
    const deployCommand = 'vercel --prod';
    console.log(`Executing: ${deployCommand}`);
    execSync(deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Deployment to Vercel completed successfully!');
    console.log('🔍 Verify your deployment in the Vercel dashboard');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Export the deployment function
export default deployToVercel;

// Run the function if this is the main module
if (import.meta.url === import.meta.main) {
  deployToVercel();
}