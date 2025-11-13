#!/usr/bin/env node
/**
 * Add MongoDB URI to Render
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
function loadEnv() {
  const envPath = path.join(__dirname, '.env.deploy');
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
const RENDER_API_KEY = env.RENDER_API_KEY;
const MONGODB_URI = env.MONGODB_URI;

console.log('\n🔧 Adding MongoDB to Render\n' + '='.repeat(50));

// Get service ID
https.get({
  hostname: 'api.render.com',
  path: '/v1/services?limit=20',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const services = JSON.parse(data);
      const service = services[0]?.service;

      if (!service) {
        console.error('❌ No service found');
        process.exit(1);
      }

      const serviceId = service.id;
      console.log(`✅ Found service: ${service.name} (${serviceId})\n`);
      console.log(`🔧 Adding MONGODB_URI environment variable...\n`);

      const body = JSON.stringify([{
        key: 'MONGODB_URI',
        value: MONGODB_URI
      }]);

      const req = https.request({
        hostname: 'api.render.com',
        path: `/v1/services/${serviceId}/env-vars`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (updateRes) => {
        let updateData = '';
        updateRes.on('data', chunk => updateData += chunk);
        updateRes.on('end', () => {
          if (updateRes.statusCode === 200 || updateRes.statusCode === 201) {
            console.log('✅ MongoDB URI added successfully!');
            console.log('🔄 Render will auto-redeploy (2-3 minutes)');
            console.log('\n📋 After redeploy:');
            console.log('   - Database will be connected');
            console.log('   - Registration will work');
            console.log('   - You can create proper users\n');
          } else {
            console.log(`⚠️  Response: ${updateRes.statusCode}`);
            console.log(updateData);
          }
        });
      });

      req.on('error', err => console.error('❌ Error:', err.message));
      req.write(body);
      req.end();

    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  });
}).on('error', err => console.error('❌ Error:', err.message));
