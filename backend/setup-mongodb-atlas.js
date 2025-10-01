/**
 * MongoDB Atlas Setup Script
 * 
 * This script helps configure MongoDB Atlas for production deployment
 * It provides guidance on creating a cluster, setting up users, and configuring network access
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupMongoDBAtlas() {
  try {
    console.log('🚀 MongoDB Atlas Setup Guide');
    console.log('============================\n');
    
    console.log('This script will guide you through setting up MongoDB Atlas for your production deployment.\n');
    
    // Step 1: Create MongoDB Atlas Account
    console.log('Step 1: Create MongoDB Atlas Account');
    console.log('--------------------------------');
    console.log('1. Go to https://www.mongodb.com/cloud/atlas/register');
    console.log('2. Sign up for a new account or log in to an existing one');
    console.log('3. Once logged in, you\'ll be taken to the Atlas dashboard\n');
    
    await askQuestion('Press Enter when you\'ve completed this step...');
    
    // Step 2: Create a New Project
    console.log('\nStep 2: Create a New Project');
    console.log('-------------------------');
    console.log('1. In the Atlas dashboard, click on "Projects" in the top navigation');
    console.log('2. Click "New Project"');
    console.log('3. Enter a name for your project (e.g., "LoopJS Production")');
    console.log('4. Click "Create Project"\n');
    
    await askQuestion('Press Enter when you\'ve completed this step...');
    
    // Step 3: Create a Cluster
    console.log('\nStep 3: Create a Cluster');
    console.log('----------------------');
    console.log('1. Click "Build a Database"');
    console.log('2. Choose the free tier option (M0) for testing or select a paid tier for production');
    console.log('3. Select your preferred cloud provider and region');
    console.log('4. Enter a name for your cluster');
    console.log('5. Click "Create Cluster"\n');
    
    await askQuestion('Press Enter when you\'ve completed this step...');
    
    // Step 4: Create a Database User
    console.log('\nStep 4: Create a Database User');
    console.log('---------------------------');
    console.log('1. In the left sidebar, click "Database Access"');
    console.log('2. Click "Add New Database User"');
    console.log('3. Choose "Password" as the authentication method');
    console.log('4. Enter a username and password');
    console.log('5. Under "Database User Privileges", select "Read and write to any database"');
    console.log('6. Click "Add User"\n');
    
    const dbUsername = await askQuestion('Enter the database username you created: ');
    const dbPassword = await askQuestion('Enter the database password you created: ');
    
    // Step 5: Configure Network Access
    console.log('\nStep 5: Configure Network Access');
    console.log('-----------------------------');
    console.log('1. In the left sidebar, click "Network Access"');
    console.log('2. Click "Add IP Address"');
    console.log('3. To allow access from anywhere, click "Allow Access from Anywhere"');
    console.log('   (Note: For production, it\'s better to whitelist specific IP addresses)');
    console.log('4. Click "Confirm"\n');
    
    await askQuestion('Press Enter when you\'ve completed this step...');
    
    // Step 6: Get Connection String
    console.log('\nStep 6: Get Connection String');
    console.log('---------------------------');
    console.log('1. In the left sidebar, click "Database"');
    console.log('2. Click "Connect" on your cluster');
    console.log('3. Select "Connect your application"');
    console.log('4. Copy the connection string\n');
    
    let connectionString = await askQuestion('Paste your connection string here: ');
    
    // Replace placeholders in connection string
    connectionString = connectionString.replace('<username>', dbUsername);
    connectionString = connectionString.replace('<password>', dbPassword);
    connectionString = connectionString.replace('myFirstDatabase', 'loopjs');
    
    // Step 7: Save Connection String
    console.log('\nStep 7: Save Connection String');
    console.log('-----------------------------');
    
    // Create or update .env.mongodb file
    const envContent = `MONGODB_URI=${connectionString}\n`;
    fs.writeFileSync(path.join(__dirname, '.env.mongodb'), envContent);
    console.log('✅ Connection string saved to .env.mongodb');
    
    // Step 8: Test Connection
    console.log('\nStep 8: Test Connection');
    console.log('---------------------');
    console.log('Testing connection to MongoDB Atlas...');
    
    // Create a temporary script to test the connection
    const testScript = `
    const { MongoClient } = require('mongodb');
    
    async function testConnection() {
      const uri = "${connectionString}";
      const client = new MongoClient(uri);
      
      try {
        await client.connect();
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Create loopjs database if it doesn't exist
        const db = client.db('loopjs');
        
        // Create a test collection
        await db.createCollection('connection_test');
        console.log('✅ Successfully created test collection!');
        
        // Insert a test document
        await db.collection('connection_test').insertOne({ test: 'Connection successful', timestamp: new Date() });
        console.log('✅ Successfully inserted test document!');
        
        // Clean up
        await db.collection('connection_test').drop();
        console.log('✅ Successfully cleaned up test collection!');
        
      } catch (err) {
        console.error('❌ Failed to connect to MongoDB Atlas:', err);
      } finally {
        await client.close();
      }
    }
    
    testConnection();
    `;
    
    const testScriptPath = path.join(__dirname, 'test-mongodb-connection.js');
    fs.writeFileSync(testScriptPath, testScript);
    
    try {
      execSync('node test-mongodb-connection.js', { stdio: 'inherit' });
      console.log('\n✅ MongoDB Atlas setup completed successfully!');
    } catch (error) {
      console.error('\n❌ Failed to connect to MongoDB Atlas. Please check your connection string and network settings.');
    } finally {
      // Clean up test script
      fs.unlinkSync(testScriptPath);
    }
    
    // Step 9: Next Steps
    console.log('\nStep 9: Next Steps');
    console.log('-----------------');
    console.log('1. Update your backend environment variables with the MongoDB Atlas connection string');
    console.log('2. Deploy your backend container using the deploy-container.js script');
    console.log('3. Deploy your frontend to Vercel using the deploy-to-vercel.js script');
    console.log('4. Test the complete deployment setup');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup function
setupMongoDBAtlas();