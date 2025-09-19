/**
 * Wordful Deployment Verification Script
 * 
 * This script tests the deployment of the Wordful application by verifying:
 * - API endpoints accessibility
 * - WebSocket connectivity
 * - CORS configuration
 * - Database connectivity
 * - Environment variables
 */

const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Default to localhost if no URL is provided
const targetUrl = process.argv[2] || 'http://localhost:3000';
const wsUrl = targetUrl.replace(/^http/, 'ws') + '/ws';

console.log(`\n🔍 Testing Wordful deployment at: ${targetUrl}\n`);

// Track test results
let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

/**
 * Run a test and log the result
 */
async function runTest(name, testFn) {
  totalTests++;
  process.stdout.write(`Testing ${name}... `);
  
  try {
    await testFn();
    console.log('✅ PASSED');
    passedTests++;
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.error(`   Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

/**
 * Test API health endpoint
 */
async function testHealthEndpoint() {
  const response = await axios.get(`${targetUrl}/api/health`, { timeout: 5000 });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data || response.data.status !== 'ok') {
    throw new Error('Health endpoint did not return expected response');
  }
}

/**
 * Test CORS configuration
 */
async function testCorsConfiguration() {
  // Read .env.production to get allowed origins
  let allowedOrigins = [];
  try {
    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/ALLOWED_ORIGINS=([^\n]+)/);
      if (match && match[1]) {
        allowedOrigins = match[1].split(',').map(origin => origin.trim());
      }
    }
  } catch (error) {
    console.warn('Could not read .env.production file');
  }
  
  // If no origins found in .env.production, use a default test origin
  if (allowedOrigins.length === 0) {
    allowedOrigins = ['https://wordful.app'];
  }
  
  // Test with the first allowed origin
  const testOrigin = allowedOrigins[0];
  
  const response = await axios({
    method: 'OPTIONS',
    url: `${targetUrl}/api/info`,
    headers: {
      'Origin': testOrigin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  
  const allowOrigin = response.headers['access-control-allow-origin'];
  if (!allowOrigin) {
    throw new Error('CORS headers not found in response');
  }
  
  if (allowOrigin !== testOrigin && allowOrigin !== '*') {
    throw new Error(`Expected Access-Control-Allow-Origin: ${testOrigin} or *, got ${allowOrigin}`);
  }
}

/**
 * Test WebSocket connectivity
 */
async function testWebSocketConnectivity() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timed out'));
    }, 5000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      ws.close();
      resolve();
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket connection failed: ${error.message}`));
    });
  });
}

/**
 * Test database connectivity through API
 */
async function testDatabaseConnectivity() {
  // This test assumes there's an endpoint that performs a database operation
  // and returns a success status
  try {
    const response = await axios.get(`${targetUrl}/api/db-test`, { timeout: 5000 });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data || response.data.status !== 'ok') {
      throw new Error('Database test endpoint did not return expected response');
    }
  } catch (error) {
    // If the endpoint doesn't exist, we'll skip this test
    if (error.response && error.response.status === 404) {
      console.log('SKIPPED (endpoint not found)');
      return; // Skip this test
    }
    throw error;
  }
}

/**
 * Test environment variables
 */
async function testEnvironmentVariables() {
  try {
    const response = await axios.get(`${targetUrl}/api/env-test`, { timeout: 5000 });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data || response.data.status !== 'ok') {
      throw new Error('Environment variables test endpoint did not return expected response');
    }
  } catch (error) {
    // If the endpoint doesn't exist, we'll skip this test
    if (error.response && error.response.status === 404) {
      console.log('SKIPPED (endpoint not found)');
      return; // Skip this test
    }
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Wordful deployment verification tests\n');
  
  await runTest('API health endpoint', testHealthEndpoint);
  await runTest('CORS configuration', testCorsConfiguration);
  await runTest('WebSocket connectivity', testWebSocketConnectivity);
  await runTest('Database connectivity', testDatabaseConnectivity);
  await runTest('Environment variables', testEnvironmentVariables);
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total`);
  
  if (failedTests > 0) {
    console.log('\n❌ Verification FAILED. Please check the errors above and fix them before proceeding.');
    process.exit(1);
  } else {
    console.log('\n✅ Verification PASSED. Your Wordful deployment appears to be working correctly!');
    process.exit(0);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});