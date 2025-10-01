/**
 * Wordful Configuration Test Script
 * 
 * This script tests the backend configuration for Wordful deployment
 * by making requests to key endpoints and verifying responses.
 */

const axios = require('axios');
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.production' });

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:8080';
  console.log(`🔍 Testing backend configuration for Wordful deployment at ${baseUrl}...`);
  
  try {
    // Test 1: Check if server is running
    console.log('\n🔄 Testing server availability...');
    try {
      const response = await axios.get(`${baseUrl}/api/health`);
      console.log('✅ Server is running:', response.data);
    } catch (error) {
      console.error('❌ Server is not running or health endpoint not available');
      if (error.response) {
        console.error('Response:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Test 2: Check CORS configuration
    console.log('\n🔄 Testing CORS configuration...');
    try {
      const response = await axios.options(`${baseUrl}/api/health`, {
        headers: {
          'Origin': 'https://wordful.app',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader && (corsHeader === '*' || corsHeader.includes('wordful.app'))) {
        console.log('✅ CORS is properly configured for Wordful');
      } else {
        console.error('❌ CORS is not properly configured for Wordful');
        console.error('Headers:', response.headers);
      }
    } catch (error) {
      console.error('❌ CORS test failed');
      if (error.response) {
        console.error('Response:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Test 3: Check WebSocket configuration
    console.log('\n🔄 Testing WebSocket configuration...');
    try {
      const wsUrl = baseUrl.replace('http', 'ws') + '/ws';
      const ws = new WebSocket(wsUrl);
      
      const wsPromise = new Promise((resolve, reject) => {
        ws.on('open', () => {
          console.log('✅ WebSocket connection established');
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          console.error('❌ WebSocket connection failed');
          console.error('Error:', error.message);
          reject(error);
        });
        
        // Set timeout
        setTimeout(() => {
          reject(new Error('WebSocket connection timed out'));
        }, 5000);
      });
      
      await wsPromise;
    } catch (error) {
      console.error('❌ WebSocket test failed');
      console.error('Error:', error.message);
    }
    
    console.log('\n🎉 Configuration tests completed!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  }
}

main();