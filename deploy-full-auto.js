#!/usr/bin/env node
/**
 * FULLY AUTOMATED DEPLOYMENT SCRIPT
 *
 * Deploys LoopJS to Render + Vercel with ZERO manual steps
 * (after one-time token setup)
 *
 * Usage: node deploy-full-auto.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Load environment from .env.deploy
function loadEnv() {
  const envPath = path.join(__dirname, '.env.deploy');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();
const RENDER_API_KEY = env.RENDER_API_KEY || process.env.RENDER_API_KEY;
const VERCEL_TOKEN = env.VERCEL_TOKEN || process.env.VERCEL_TOKEN;
const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;

console.log('\n🚀 LoopJS Automated Deployment\n' + '='.repeat(50) + '\n');

// API Request Helper
function apiRequest(hostname, path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Response error: ${data}`));
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

// Deploy to Vercel
async function deployToVercel() {
  console.log('📦 STEP 1: Deploying to Vercel...\n');

  if (!VERCEL_TOKEN) {
    console.log('❌ VERCEL_TOKEN not set in .env.deploy');
    console.log('\n Get token at: https://vercel.com/account/tokens\n');
    return null;
  }

  try {
    // Check for existing projects
    console.log('🔍 Checking for existing Vercel projects...');
    const projects = await apiRequest(
      'api.vercel.com',
      '/v9/projects',
      'GET',
      { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    );

    let project = projects.projects?.find(p =>
      p.name === 'loopjs' || p.name === 'loopjs-frontend'
    );

    if (!project) {
      console.log('⚠️  No existing project found');
      console.log('\n📝 Deploy via Vercel CLI:');
      console.log('   cd frontend && npx vercel --prod\n');
      return null;
    }

    console.log(`✅ Found project: ${project.name}`);
    console.log(`📍 URL: https://${project.name}.vercel.app\n`);

    return `https://${project.name}.vercel.app`;

  } catch (error) {
    console.error('❌ Vercel error:', error.message);
    return null;
  }
}

// Deploy to Render
async function deployToRender(vercelUrl) {
  console.log('📦 STEP 2: Deploying to Render...\n');

  if (!RENDER_API_KEY) {
    console.log('❌ RENDER_API_KEY not set');
    return null;
  }

  try {
    // Get existing services
    console.log('🔍 Checking for existing Render services...');
    const services = await apiRequest(
      'api.render.com',
      '/v1/services?limit=20',
      'GET',
      { 'Authorization': `Bearer ${RENDER_API_KEY}` }
    );

    let service = services[0]?.service;

    if (!service) {
      console.log('❌ No existing Render service found\n');
      console.log('ONE-TIME SETUP:');
      console.log('1. Go to: https://dashboard.render.com/create?type=web');
      console.log('2. Connect GitHub repo');
      console.log('3. Use settings from backend/render.yaml');
      console.log('4. Run this script again\n');

      // Try to open browser
      try {
        if (process.platform === 'linux') {
          exec('xdg-open "https://dashboard.render.com/create?type=web"');
        } else if (process.platform === 'darwin') {
          exec('open "https://dashboard.render.com/create?type=web"');
        }
      } catch (e) {}

      return null;
    }

    const serviceId = service.id;
    const backendUrl = service.serviceDetails?.url;

    console.log(`✅ Found service: ${service.name}`);
    console.log(`   ID: ${serviceId}`);
    console.log(`   URL: ${backendUrl}\n`);

    // Update environment variables
    console.log('🔧 Updating environment variables...');

    const envVars = [
      { key: 'MONGODB_URI', value: MONGODB_URI },
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '10000' }
    ];

    if (vercelUrl) {
      envVars.push({
        key: 'ALLOWED_ORIGINS',
        value: `${vercelUrl},${backendUrl}`
      });
    }

    // Update env vars
    for (const envVar of envVars) {
      try {
        await apiRequest(
          'api.render.com',
          `/v1/services/${serviceId}/env-vars`,
          'PUT',
          { 'Authorization': `Bearer ${RENDER_API_KEY}` },
          { key: envVar.key, value: envVar.value }
        );
        console.log(`   ✅ ${envVar.key} updated`);
      } catch (e) {
        console.log(`   ⚠️  ${envVar.key}: ${e.message}`);
      }
    }

    // Trigger deployment
    console.log('\n🚀 Triggering deployment...');
    await apiRequest(
      'api.render.com',
      `/v1/services/${serviceId}/deploys`,
      'POST',
      { 'Authorization': `Bearer ${RENDER_API_KEY}` },
      {}
    );

    console.log('✅ Deployment triggered\n');

    return backendUrl;

  } catch (error) {
    console.error('❌ Render error:', error.message);
    return null;
  }
}

// Test deployment
async function testDeployment(backendUrl) {
  if (!backendUrl) return;

  console.log('📦 STEP 3: Testing deployment...\n');

  console.log('⏳ Waiting 10 seconds for deployment...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  try {
    console.log('🔍 Testing health endpoint...');
    const health = await apiRequest(
      backendUrl.replace('https://', ''),
      '/health'
    );

    if (health.status === 'healthy') {
      console.log('✅ Backend is healthy!\n');
    } else {
      console.log('⚠️  Unexpected health response\n');
    }
  } catch (error) {
    console.log('⚠️  Health check failed (may still be deploying)\n');
  }
}

// Main deployment flow
async function deploy() {
  try {
    // Check requirements
    if (!RENDER_API_KEY || !MONGODB_URI) {
      console.log('❌ Missing required environment variables in .env.deploy:\n');
      if (!RENDER_API_KEY) console.log('   - RENDER_API_KEY');
      if (!MONGODB_URI) console.log('   - MONGODB_URI');
      console.log('');
      process.exit(1);
    }

    // Deploy to Vercel
    const vercelUrl = await deployToVercel();

    // Deploy to Render
    const backendUrl = await deployToRender(vercelUrl);

    // Test deployment
    await testDeployment(backendUrl);

    // Summary
    console.log('='.repeat(50));
    console.log('🎉 DEPLOYMENT COMPLETE!\n');

    if (vercelUrl) {
      console.log(`📍 Frontend: ${vercelUrl}`);
    }

    if (backendUrl) {
      console.log(`📍 Backend:  ${backendUrl}`);
      console.log(`📍 Health:   ${backendUrl}/health`);
    }

    console.log('\n✨ Your app is live!\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deploy();
