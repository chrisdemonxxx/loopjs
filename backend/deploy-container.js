/**
 * Backend Container Deployment Script
 * 
 * This script helps deploy the backend container to a cloud service
 * Supports: Docker Hub, Google Cloud Run, AWS ECR
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deployContainer() {
  try {
    console.log('🚀 Starting backend container deployment process...');
    
    // Check if Docker is installed
    try {
      execSync('docker --version', { stdio: 'ignore' });
      console.log('✅ Docker is installed');
    } catch (error) {
      console.error('❌ Docker is not installed. Please install Docker first.');
      process.exit(1);
    }
    
    // Select deployment target
    console.log('\nSelect deployment target:');
    console.log('1. Docker Hub');
    console.log('2. Google Cloud Run');
    console.log('3. AWS ECR');
    
    const target = await askQuestion('Enter your choice (1-3): ');
    
    // Get container registry details
    let registryUrl, imageName, imageTag, fullImageName;
    
    switch (target) {
      case '1': // Docker Hub
        const dockerHubUsername = await askQuestion('Enter Docker Hub username: ');
        imageName = await askQuestion('Enter image name: ');
        imageTag = await askQuestion('Enter image tag (default: latest): ') || 'latest';
        registryUrl = dockerHubUsername;
        fullImageName = `${dockerHubUsername}/${imageName}:${imageTag}`;
        break;
        
      case '2': // Google Cloud Run
        const gcpProjectId = await askQuestion('Enter Google Cloud project ID: ');
        const gcpRegion = await askQuestion('Enter Google Cloud region (default: us-central1): ') || 'us-central1';
        imageName = await askQuestion('Enter image name: ');
        imageTag = await askQuestion('Enter image tag (default: latest): ') || 'latest';
        registryUrl = `${gcpRegion}-docker.pkg.dev/${gcpProjectId}`;
        fullImageName = `${registryUrl}/${imageName}:${imageTag}`;
        
        // Check if gcloud is installed
        try {
          execSync('gcloud --version', { stdio: 'ignore' });
          console.log('✅ Google Cloud SDK is installed');
          
          // Authenticate with Google Cloud
          console.log('\n🔑 Authenticating with Google Cloud...');
          execSync('gcloud auth login', { stdio: 'inherit' });
          execSync(`gcloud config set project ${gcpProjectId}`, { stdio: 'inherit' });
          execSync('gcloud auth configure-docker', { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Google Cloud SDK is not installed. Please install it first.');
          process.exit(1);
        }
        break;
        
      case '3': // AWS ECR
        const awsRegion = await askQuestion('Enter AWS region (default: us-east-1): ') || 'us-east-1';
        const awsAccountId = await askQuestion('Enter AWS account ID: ');
        imageName = await askQuestion('Enter repository name: ');
        imageTag = await askQuestion('Enter image tag (default: latest): ') || 'latest';
        registryUrl = `${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com`;
        fullImageName = `${registryUrl}/${imageName}:${imageTag}`;
        
        // Check if AWS CLI is installed
        try {
          execSync('aws --version', { stdio: 'ignore' });
          console.log('✅ AWS CLI is installed');
          
          // Create ECR repository if it doesn't exist
          console.log('\n🔑 Creating ECR repository if it doesn\'t exist...');
          try {
            execSync(`aws ecr create-repository --repository-name ${imageName} --region ${awsRegion}`, { stdio: 'ignore' });
          } catch (error) {
            // Repository might already exist, which is fine
          }
          
          // Login to ECR
          console.log('\n🔑 Logging in to AWS ECR...');
          const loginCommand = execSync(`aws ecr get-login-password --region ${awsRegion} | docker login --username AWS --password-stdin ${registryUrl}`, { encoding: 'utf8' });
          console.log(loginCommand);
        } catch (error) {
          console.error('❌ AWS CLI is not installed. Please install it first.');
          process.exit(1);
        }
        break;
        
      default:
        console.error('❌ Invalid choice. Exiting.');
        process.exit(1);
    }
    
    // Build Docker image
    console.log('\n🔨 Building Docker image...');
    execSync(`docker build -t ${fullImageName} .`, { stdio: 'inherit' });
    console.log('✅ Docker image built successfully');
    
    // Push Docker image to registry
    console.log('\n🚀 Pushing Docker image to registry...');
    execSync(`docker push ${fullImageName}`, { stdio: 'inherit' });
    console.log('✅ Docker image pushed successfully');
    
    // Deploy to cloud service
    if (target === '2') { // Google Cloud Run
      console.log('\n🚀 Deploying to Google Cloud Run...');
      const serviceName = await askQuestion('Enter Cloud Run service name: ');
      const memory = await askQuestion('Enter memory limit (default: 512Mi): ') || '512Mi';
      const cpu = await askQuestion('Enter CPU limit (default: 1): ') || '1';
      const port = await askQuestion('Enter port (default: 3000): ') || '3000';
      
      // Load environment variables from .env.container
      const envPath = path.join(__dirname, '.env.container');
      let envVars = '';
      
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envLines = envFile.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
        
        envVars = envLines.map(line => {
          const [key, value] = line.split('=');
          return `--set-env-vars "${key}=${value}"`;
        }).join(' ');
      }
      
      const deployCommand = `gcloud run deploy ${serviceName} \
        --image ${fullImageName} \
        --platform managed \
        --region ${gcpRegion} \
        --memory ${memory} \
        --cpu ${cpu} \
        --port ${port} \
        --allow-unauthenticated \
        ${envVars}`;
      
      execSync(deployCommand, { stdio: 'inherit' });
      console.log('✅ Deployed to Google Cloud Run successfully');
      
      // Get the service URL
      const serviceUrl = execSync(`gcloud run services describe ${serviceName} --platform managed --region ${gcpRegion} --format="value(status.url)"`, { encoding: 'utf8' }).trim();
      console.log(`\n🌐 Service URL: ${serviceUrl}`);
      
    } else if (target === '3') { // AWS ECS
      console.log('\n🚀 For AWS ECS deployment, please follow these steps:');
      console.log('1. Create a task definition using the AWS console or CLI');
      console.log('2. Create or update an ECS service using the task definition');
      console.log('3. Configure environment variables from your .env.container file');
      console.log(`\n📋 Your container image is available at: ${fullImageName}`);
    }
    
    console.log('\n✅ Deployment process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update the frontend environment variables with the new backend URL');
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
deployContainer();