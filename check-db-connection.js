#!/usr/bin/env node
/**
 * Check MongoDB and Render Configuration
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

console.log('\n🔍 Checking Database Configuration\n' + '='.repeat(50));
console.log('\n📋 Local MongoDB URI:');
console.log(MONGODB_URI.replace(/:[^:@]+@/, ':***@'));

// Get Render env vars
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
        console.error('\n❌ No service found');
        process.exit(1);
      }

      const serviceId = service.id;
      console.log(`\n✅ Found service: ${service.name} (${serviceId})`);

      // Get env vars
      https.get({
        hostname: 'api.render.com',
        path: `/v1/services/${serviceId}/env-vars`,
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      }, (envRes) => {
        let envData = '';
        envRes.on('data', chunk => envData += chunk);
        envRes.on('end', () => {
          try {
            const envVars = JSON.parse(envData);

            console.log('\n📋 Render Environment Variables:');
            console.log('─'.repeat(50));

            envVars.forEach(env => {
              const value = env.envVar.value || '(not set)';
              const displayValue = env.envVar.key === 'MONGODB_URI'
                ? value.replace(/:[^:@]+@/, ':***@')
                : (value.length > 50 ? value.substring(0, 50) + '...' : value);
              console.log(`${env.envVar.key}: ${displayValue}`);
            });

            // Check if MONGODB_URI exists
            const mongodbEnv = envVars.find(e => e.envVar.key === 'MONGODB_URI');

            if (!mongodbEnv) {
              console.log('\n❌ MONGODB_URI not set in Render!');
              console.log('\n🔧 To fix: Run this command:');
              console.log('   node update-mongodb.js');
            } else {
              console.log('\n✅ MONGODB_URI is configured in Render');

              // Compare with local
              if (mongodbEnv.envVar.value !== MONGODB_URI) {
                console.log('\n⚠️  WARNING: Render MongoDB URI differs from local .env.deploy');
              } else {
                console.log('\n✅ MongoDB URI matches local configuration');
              }
            }

          } catch (e) {
            console.error('\n❌ Error parsing env vars:', e.message);
          }
        });
      }).on('error', err => console.error('\n❌ Error:', err.message));

    } catch (e) {
      console.error('\n❌ Error:', e.message);
    }
  });
}).on('error', err => console.error('\n❌ Error:', err.message));
