/**
 * deploy-wordful-complete.js
 * 
 * A comprehensive script for deploying the Wordful application to Google App Engine.
 * This script combines all necessary deployment steps into a single command.
 * 
 * Usage: node deploy-wordful-complete.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: '.env.production' });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main function to execute the deployment process
 */
async function main() {
  try {
    console.log('\n🚀 Starting Wordful Comprehensive Deployment Process\n');
    
    // Step 1: Verify environment variables
    await verifyEnvironmentVariables();
    
    // Step 2: Check Google Cloud SDK installation
    await checkGCloudInstallation();
    
    // Step 3: Verify Google Cloud login status
    await verifyGCloudLogin();
    
    // Step 4: Set up secrets if needed
    await setupSecrets();
    
    // Step 5: Verify app.yaml configuration
    await verifyAppYaml();
    
    // Step 6: Test configuration
    await testConfiguration();
    
    // Step 7: Deploy to Google App Engine
    await deployToAppEngine();
    
    // Step 8: Verify deployment
    await verifyDeployment();
    
    console.log('\n✅ Wordful deployment completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Verify your application is running at your App Engine URL');
    console.log('2. Set up monitoring and alerts in Google Cloud Console');
    console.log('3. Configure your frontend to connect to this backend');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Verify that all required environment variables are set
 */
async function verifyEnvironmentVariables() {
  console.log('📋 Verifying environment variables...');
  
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'SESSION_SECRET',
    'JWT_SECRET',
    'ALLOWED_ORIGINS'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please check your .env.production file.`);
  }
  
  // Verify MongoDB URI format
  if (!process.env.MONGODB_URI.startsWith('mongodb+srv://') && !process.env.MONGODB_URI.startsWith('mongodb://')) {
    throw new Error('Invalid MONGODB_URI format. It should start with mongodb:// or mongodb+srv://');
  }
  
  // Verify ALLOWED_ORIGINS includes Wordful domain
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  if (!allowedOrigins.includes('https://wordful.app')) {
    console.warn('⚠️  Warning: ALLOWED_ORIGINS does not include https://wordful.app');
    const answer = await askQuestion('Would you like to add https://wordful.app to ALLOWED_ORIGINS? (y/n): ');
    
    if (answer.toLowerCase() === 'y') {
      allowedOrigins.push('https://wordful.app');
      updateEnvFile('ALLOWED_ORIGINS', allowedOrigins.join(','));
      console.log('✅ Added https://wordful.app to ALLOWED_ORIGINS');
    }
  }
  
  console.log('✅ Environment variables verified');
}

/**
 * Check if Google Cloud SDK is installed
 */
async function checkGCloudInstallation() {
  console.log('🔍 Checking Google Cloud SDK installation...');
  
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    console.log('✅ Google Cloud SDK is installed');
  } catch (error) {
    throw new Error('Google Cloud SDK is not installed. Please install it from https://cloud.google.com/sdk/docs/install');
  }
}

/**
 * Verify Google Cloud login status
 */
async function verifyGCloudLogin() {
  console.log('🔑 Verifying Google Cloud login status...');
  
  try {
    const account = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"').toString().trim();
    
    if (!account) {
      console.log('❌ Not logged in to Google Cloud');
      console.log('Please run: gcloud auth login');
      
      const answer = await askQuestion('Would you like to login now? (y/n): ');
      
      if (answer.toLowerCase() === 'y') {
        console.log('Running: gcloud auth login');
        execSync('gcloud auth login', { stdio: 'inherit' });
      } else {
        throw new Error('Google Cloud login is required to continue');
      }
    } else {
      console.log(`✅ Logged in as: ${account}`);
      
      // Get current project
      const currentProject = execSync('gcloud config get-value project').toString().trim();
      console.log(`📁 Current project: ${currentProject}`);
      
      const answer = await askQuestion(`Continue with project ${currentProject}? (y/n): `);
      
      if (answer.toLowerCase() !== 'y') {
        const newProject = await askQuestion('Enter the project ID to use: ');
        execSync(`gcloud config set project ${newProject}`, { stdio: 'inherit' });
        console.log(`✅ Switched to project: ${newProject}`);
      }
    }
  } catch (error) {
    if (!error.message.includes('Not logged in')) {
      throw error;
    }
  }
}

/**
 * Set up secrets in Google Cloud Secret Manager if needed
 */
async function setupSecrets() {
  console.log('🔒 Checking Secret Manager setup...');
  
  const answer = await askQuestion('Would you like to set up or update secrets in Secret Manager? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    console.log('Running setup:secrets script...');
    execSync('npm run setup:secrets', { stdio: 'inherit' });
    console.log('✅ Secrets setup completed');
  } else {
    console.log('⏩ Skipping secrets setup');
  }
}

/**
 * Verify app.yaml configuration
 */
async function verifyAppYaml() {
  console.log('📄 Verifying app.yaml configuration...');
  
  const appYamlPath = path.join(process.cwd(), 'app.yaml');
  
  if (!fs.existsSync(appYamlPath)) {
    throw new Error('app.yaml file not found. Please create it in the backend directory.');
  }
  
  const appYamlContent = fs.readFileSync(appYamlPath, 'utf8');
  
  // Check for required configurations
  const checks = {
    runtime: appYamlContent.includes('runtime: nodejs'),
    secretManager: appYamlContent.includes('${sm://'),
    handlers: appYamlContent.includes('handlers:'),
    healthCheck: appYamlContent.includes('health_check:')
  };
  
  const missingConfigs = Object.entries(checks)
    .filter(([_, exists]) => !exists)
    .map(([name]) => name);
  
  if (missingConfigs.length > 0) {
    console.warn(`⚠️  Warning: app.yaml may be missing configurations for: ${missingConfigs.join(', ')}`);
    const answer = await askQuestion('Would you like to continue anyway? (y/n): ');
    
    if (answer.toLowerCase() !== 'y') {
      throw new Error('Please update app.yaml with the required configurations');
    }
  } else {
    console.log('✅ app.yaml configuration verified');
  }
}

/**
 * Test the application configuration
 */
async function testConfiguration() {
  console.log('🧪 Testing application configuration...');
  
  const answer = await askQuestion('Would you like to run configuration tests? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    try {
      console.log('Running test:wordful script...');
      execSync('npm run test:wordful', { stdio: 'inherit' });
      console.log('✅ Configuration tests passed');
    } catch (error) {
      console.error('❌ Configuration tests failed');
      const continueAnyway = await askQuestion('Would you like to continue with deployment anyway? (y/n): ');
      
      if (continueAnyway.toLowerCase() !== 'y') {
        throw new Error('Configuration tests failed. Please fix the issues before deploying.');
      }
    }
  } else {
    console.log('⏩ Skipping configuration tests');
  }
}

/**
 * Deploy the application to Google App Engine
 */
async function deployToAppEngine() {
  console.log('🚀 Deploying to Google App Engine...');
  
  try {
    console.log('Running: gcloud app deploy app.yaml --quiet');
    execSync('gcloud app deploy app.yaml --quiet', { stdio: 'inherit' });
    console.log('✅ Deployment successful');
  } catch (error) {
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

/**
 * Verify the deployment was successful
 */
async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  
  try {
    // Get the app URL
    const appUrl = execSync('gcloud app browse --no-launch-browser').toString().trim();
    console.log(`📱 Application URL: ${appUrl}`);
    
    const answer = await askQuestion('Would you like to test the deployed application? (y/n): ');
    
    if (answer.toLowerCase() === 'y') {
      try {
        console.log(`Running: npm run test:wordful ${appUrl}`);
        execSync(`npm run test:wordful ${appUrl}`, { stdio: 'inherit' });
        console.log('✅ Deployment verification successful');
      } catch (error) {
        console.error('❌ Deployment verification failed');
        console.error('Please check the logs for more information');
      }
    } else {
      console.log('⏩ Skipping deployment verification');
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not verify deployment: ${error.message}`);
  }
}

/**
 * Helper function to ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Helper function to update a value in the .env.production file
 */
function updateEnvFile(key, value) {
  const envFilePath = path.join(process.cwd(), '.env.production');
  let envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Replace existing line or add new one
  const regex = new RegExp(`^${key}=.*`, 'm');
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
  
  fs.writeFileSync(envFilePath, envContent);
}

// Run the main function
main();