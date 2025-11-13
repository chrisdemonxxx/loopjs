const axios = require('axios');
require('dotenv').config();

/**
 * Test multiple NVIDIA API endpoints to find the correct one
 */

async function testEndpoint(baseURL, apiKey, description) {
  console.log(`\n--- Testing: ${description} ---`);
  console.log(`Endpoint: ${baseURL}\n`);

  const endpoints = [
    { path: '/models', desc: 'List models' },
    { path: '/v1/models', desc: 'List models (v1)' },
    { path: '/chat/completions', desc: 'Chat completions' },
  ];

  for (const endpoint of endpoints) {
    try {
      const url = baseURL.includes('/v1') ?
        `${baseURL}${endpoint.path.replace('/v1', '')}` :
        `${baseURL}${endpoint.path}`;

      console.log(`Trying: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });

      console.log(`✓ Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log(`✓ SUCCESS! This endpoint works!`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
        return { success: true, url, data: response.data };
      } else {
        console.log(`Response:`, response.data);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data:`, error.response.data);
      }
    }
  }

  return { success: false };
}

async function testAllEndpoints() {
  console.log('\n=== NVIDIA API Endpoint Discovery ===\n');

  const apiKey = process.env.NVAPI_KEY;

  if (!apiKey) {
    console.error('❌ Error: NVAPI_KEY not found in environment variables');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${apiKey.substring(0, 20)}...`);

  // Test different base URLs
  const baseURLs = [
    {
      url: 'https://integrate.api.nvidia.com/v1',
      desc: 'NVIDIA Integrate API (OpenAI-compatible)'
    },
    {
      url: 'https://api.nvcf.nvidia.com/v2/nvcf',
      desc: 'NVIDIA Cloud Functions API'
    },
    {
      url: 'https://api.nvidia.com/v1',
      desc: 'NVIDIA Main API'
    },
    {
      url: 'https://build.nvidia.com/api/v1',
      desc: 'NVIDIA Build API'
    }
  ];

  for (const { url, desc } of baseURLs) {
    const result = await testEndpoint(url, apiKey, desc);
    if (result.success) {
      console.log('\n' + '='.repeat(80));
      console.log(`\n✓✓✓ FOUND WORKING ENDPOINT! ✓✓✓`);
      console.log(`URL: ${result.url}`);
      console.log(`\n${'='.repeat(80)}\n`);
      return result;
    }
  }

  // Try POST to chat completions as a final test
  console.log('\n--- Testing POST to chat/completions ---\n');

  for (const { url, desc } of baseURLs) {
    try {
      const chatURL = `${url}/chat/completions`.replace('/v1/v1', '/v1');
      console.log(`\nTrying POST: ${chatURL}`);

      const response = await axios.post(chatURL, {
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      console.log(`✓ Status: ${response.status}`);

      if (response.status === 200 || response.status === 201) {
        console.log(`✓ SUCCESS! Chat endpoint works!`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        return { success: true, url: chatURL, data: response.data };
      } else {
        console.log(`Response:`, response.data);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log('\n❌ Could not find working endpoint');
  console.log('\nPlease verify:');
  console.log('1. The API key is valid and active');
  console.log('2. The API key has the correct permissions');
  console.log('3. Check NVIDIA documentation for the correct endpoint');

  return { success: false };
}

// Run the test
if (require.main === module) {
  testAllEndpoints()
    .then((result) => {
      console.log('\n✓ Test complete\n');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAllEndpoints };
