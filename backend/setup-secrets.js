/**
 * Google Cloud Secret Manager Setup Script for Wordful Deployment
 * 
 * This script helps set up secrets in Google Cloud Secret Manager
 * for secure deployment to Wordful.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Setting up secrets for Wordful deployment in Google Cloud Secret Manager...');
  
  try {
    // Check if gcloud is installed
    execSync('gcloud --version', { stdio: 'ignore' });
    
    // Check if user is logged in to gcloud
    try {
      execSync('gcloud auth list', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ You are not logged in to Google Cloud. Please run: gcloud auth login');
      process.exit(1);
    }
    
    // Get project ID
    let projectId;
    try {
      projectId = execSync('gcloud config get-value project').toString().trim();
      if (!projectId) throw new Error('No project set');
    } catch (error) {
      console.error('❌ No Google Cloud project is set. Please run: gcloud config set project YOUR_PROJECT_ID');
      process.exit(1);
    }
    
    console.log(`✅ Using Google Cloud project: ${projectId}`);
    
    // Enable Secret Manager API if not already enabled
    try {
      console.log('🔄 Enabling Secret Manager API...');
      execSync('gcloud services enable secretmanager.googleapis.com', { stdio: 'inherit' });
      console.log('✅ Secret Manager API enabled');
    } catch (error) {
      console.error('❌ Failed to enable Secret Manager API:', error.message);
      process.exit(1);
    }
    
    // Create secrets
    const secrets = [
      { name: 'mongodb-password', description: 'MongoDB Atlas password for Wordful' },
      { name: 'session-secret', description: 'Session secret for Wordful' },
      { name: 'jwt-secret', description: 'JWT secret for Wordful' }
    ];
    
    for (const secret of secrets) {
      try {
        // Check if secret already exists
        try {
          execSync(`gcloud secrets describe ${secret.name}`, { stdio: 'ignore' });
          console.log(`⚠️ Secret ${secret.name} already exists. Skipping creation.`);
          continue;
        } catch (error) {
          // Secret doesn't exist, proceed with creation
        }
        
        // Create the secret
        console.log(`🔄 Creating secret: ${secret.name}...`);
        execSync(`gcloud secrets create ${secret.name} --description="${secret.description}"`, { stdio: 'inherit' });
        
        // Prompt for secret value
        const secretValue = await promptQuestion(`Enter value for ${secret.name}: `);
        
        // Add secret version
        execSync(`echo -n "${secretValue}" | gcloud secrets versions add ${secret.name} --data-file=-`, { stdio: 'inherit' });
        
        console.log(`✅ Secret ${secret.name} created and value set`);
      } catch (error) {
        console.error(`❌ Failed to create secret ${secret.name}:`, error.message);
      }
    }
    
    // Grant access to App Engine service account
    try {
      const serviceAccount = `${projectId}@appspot.gserviceaccount.com`;
      console.log(`🔄 Granting Secret Manager access to ${serviceAccount}...`);
      
      for (const secret of secrets) {
        execSync(`gcloud secrets add-iam-policy-binding ${secret.name} \
          --member="serviceAccount:${serviceAccount}" \
          --role="roles/secretmanager.secretAccessor"`, { stdio: 'inherit' });
      }
      
      console.log('✅ IAM permissions set for App Engine service account');
    } catch (error) {
      console.error('❌ Failed to set IAM permissions:', error.message);
    }
    
    console.log('\n🎉 Secret Manager setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update app.yaml to reference these secrets');
    console.log('2. Deploy your application with: npm run deploy:wordful');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();