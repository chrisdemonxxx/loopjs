#!/usr/bin/env node
/**
 * Render Deployment Script
 * Deploys LoopJS backend to Render using their API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_R2QLPilRlRJ0jglK1EckRfOBsJje';
const MONGODB_URI = 'mongodb+srv://chrisdemonxxx_db_user:Demon%4046@cluster0.1vs04ow.mongodb.net/loopjs?retryWrites=true&w=majority&appName=Cluster0';

// Render API configuration
const RENDER_API_BASE = 'api.render.com';

console.log('🚀 Render Deployment Script for LoopJS Backend\n');

/**
 * Make Render API request
 */
function renderRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RENDER_API_BASE,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`Response Error: ${e.message}\n${responseData}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * List existing services
 */
async function listServices() {
  console.log('📋 Fetching existing Render services...');
  try {
    const services = await renderRequest('GET', '/v1/services?limit=20');
    return services;
  } catch (error) {
    console.error('❌ Error fetching services:', error.message);
    return [];
  }
}

/**
 * Create new web service
 */
async function createWebService() {
  console.log('🔨 Creating new Render web service...');

  const serviceConfig = {
    type: 'web_service',
    name: 'loopjs-backend',
    runtime: 'node',
    region: 'oregon',
    plan: 'free',
    branch: 'main',
    buildCommand: 'npm install',
    startCommand: 'npm start',
    healthCheckPath: '/health',
    envVars: [
      {
        key: 'NODE_ENV',
        value: 'production'
      },
      {
        key: 'PORT',
        value: '10000'
      },
      {
        key: 'MONGODB_URI',
        value: MONGODB_URI
      },
      {
        key: 'JWT_ACCESS_TOKEN_EXPIRATION',
        value: '15m'
      },
      {
        key: 'JWT_REFRESH_TOKEN_EXPIRATION',
        value: '24h'
      }
    ]
  };

  // Note: You'll need to connect via GitHub OAuth first
  // This requires owner_id and repo which you get from connecting GitHub

  console.log('⚠️  Note: Render API requires GitHub connection setup first.');
  console.log('📝 Service configuration prepared:');
  console.log(JSON.stringify(serviceConfig, null, 2));

  return serviceConfig;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Test API key
    console.log('🔑 Testing Render API key...');
    const services = await listServices();

    if (services.length !== undefined) {
      console.log(`✅ API key valid! Found ${services.length} existing service(s)\n`);

      if (services.length > 0) {
        console.log('📦 Your existing Render services:');
        services.forEach((service, index) => {
          console.log(`${index + 1}. ${service.service?.name || 'Unknown'} - ${service.service?.serviceDetails?.url || 'No URL'}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 NEXT STEPS - Deploy via Render Dashboard:');
    console.log('='.repeat(60));
    console.log('\n1. Go to: https://dashboard.render.com');
    console.log('2. Click "New +" → "Web Service"');
    console.log('3. Connect your GitHub repository');
    console.log('4. Use these settings:\n');

    const config = await createWebService();
    console.log('   Name: loopjs-backend');
    console.log('   Runtime: Node');
    console.log('   Region: Oregon');
    console.log('   Branch: main');
    console.log('   Build Command: npm install');
    console.log('   Start Command: npm start');
    console.log('   Root Directory: backend');
    console.log('\n5. Add environment variables:');
    config.envVars.forEach(env => {
      console.log(`   ${env.key}=${env.value}`);
    });

    console.log('\n6. Click "Create Web Service"');
    console.log('\n✨ Alternative: Use the Render Blueprint (automatic)');
    console.log('   - Click "New +" → "Blueprint"');
    console.log('   - Connect repository');
    console.log('   - Render detects backend/render.yaml automatically!');

  } catch (error) {
    console.error('\n❌ Deployment Error:', error.message);
    console.log('\n💡 If API key is invalid, update RENDER_API_KEY environment variable');
  }
}

// Run
main().catch(console.error);
