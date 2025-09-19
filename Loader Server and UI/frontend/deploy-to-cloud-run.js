/**
 * Frontend Deployment Script for Google Cloud Run
 * 
 * This script helps deploy the frontend to Google Cloud Run with proper environment configuration
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

async function deployToCloudRun() {
  try {
    console.log('🚀 Starting Google Cloud Run deployment process...');
    
    // Get project ID
    let projectId;
    try {
      projectId = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      console.log(`✅ Using Google Cloud project: ${projectId}`);
    } catch (error) {
      console.error('❌ Failed to get Google Cloud project ID');
      projectId = await askQuestion('Enter your Google Cloud project ID: ');
    }
    
    // Get backend URL
    let backendUrl = process.env.VITE_BACKEND_URL;
    if (!backendUrl) {
      backendUrl = await askQuestion('Enter the backend URL (e.g., https://loopjs-backend-candidate-zzxzxzxzxzxz-uc.a.run.app): ');
    }
    
    // Create .env.production file
    const wsUrl = backendUrl.replace('https://', 'wss://') + '/ws';
    const envContent = `VITE_BACKEND_URL=${backendUrl}\nVITE_WS_URL=${wsUrl}\n`;
    fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
    console.log('✅ Created .env.production with backend and WebSocket URLs');
    
    // Build the Docker image
    console.log('🔨 Building Docker image...');
    const imageTag = `gcr.io/${projectId}/loopjs-frontend:latest`;
    execSync(`docker build -t ${imageTag} --build-arg VITE_BACKEND_URL="${backendUrl}" .`, { stdio: 'inherit' });
    console.log('✅ Docker image built successfully');
    
    // Push the Docker image
    console.log('📤 Pushing Docker image to Google Container Registry...');
    execSync(`docker push ${imageTag}`, { stdio: 'inherit' });
    console.log('✅ Docker image pushed successfully');
    
    // Deploy to Cloud Run
    console.log('🚀 Deploying to Google Cloud Run...');
    execSync(
      `gcloud run deploy loopjs-frontend ` +
      `--image=${imageTag} ` +
      `--platform=managed ` +
      `--region=us-central1 ` +
      `--allow-unauthenticated ` +
      `--port=80 ` +
      `--min-instances=1 ` +
      `--max-instances=10 ` +
      `--memory=512Mi ` +
      `--cpu=1`,
      { stdio: 'inherit' }
    );
    
    // Get the deployed URL
    const deployedUrl = execSync(
      `gcloud run services describe loopjs-frontend --platform=managed --region=us-central1 --format='value(status.url)'`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log('✅ Deployment to Google Cloud Run completed successfully!');
    console.log(`🔍 Your frontend is now available at: ${deployedUrl}`);
    console.log(`🔍 Backend URL: ${backendUrl}`);
    console.log(`🔍 WebSocket URL: ${wsUrl}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Export the deployment function
export default deployToCloudRun;

// Run the function if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deployToCloudRun();
}