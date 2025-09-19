/**
 * Backend Docker Hub Deployment Script
 * 
 * This script helps deploy the backend container to Docker Hub
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deployToDockerHub() {
  try {
    console.log('🚀 Starting backend Docker Hub deployment process...');
    
    // Check if Docker is installed
    try {
      execSync('docker --version', { stdio: 'ignore' });
      console.log('✅ Docker is installed');
    } catch (error) {
      console.error('❌ Docker is not installed. Please install Docker first.');
      process.exit(1);
    }
    
    // Get Docker Hub credentials
    const dockerHubUsername = await askQuestion('Enter Docker Hub username: ');
    const imageName = await askQuestion('Enter image name: ');
    const imageTag = await askQuestion('Enter image tag (default: latest): ') || 'latest';
    const fullImageName = `${dockerHubUsername}/${imageName}:${imageTag}`;
    
    // Login to Docker Hub
    console.log('\n🔑 Logging in to Docker Hub...');
    try {
      execSync('docker login', { stdio: 'inherit' });
      console.log('✅ Logged in to Docker Hub successfully');
    } catch (error) {
      console.error('❌ Failed to login to Docker Hub:', error.message);
      process.exit(1);
    }
    
    // Build Docker image
    console.log('\n🔨 Building Docker image...');
    execSync(`docker build -t ${fullImageName} .`, { stdio: 'inherit' });
    console.log('✅ Docker image built successfully');
    
    // Push Docker image to registry
    console.log('\n🚀 Pushing Docker image to Docker Hub...');
    execSync(`docker push ${fullImageName}`, { stdio: 'inherit' });
    console.log('✅ Docker image pushed successfully');
    
    // Get the Docker Hub URL
    const dockerHubUrl = `https://hub.docker.com/r/${dockerHubUsername}/${imageName}`;
    console.log(`\n🌐 Docker Hub URL: ${dockerHubUrl}`);
    console.log(`\n📋 Your container image is available at: ${fullImageName}`);
    
    // Provide instructions for running the container
    console.log('\n📋 To run this container:');
    console.log(`docker run -p 3000:3000 ${fullImageName}`);
    
    console.log('\n✅ Deployment process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the frontend environment variables with the backend URL');
    console.log('2. Deploy the frontend to Vercel using the deploy-to-vercel.js script');
    console.log('3. Test the complete deployment setup');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the deployment function
deployToDockerHub();