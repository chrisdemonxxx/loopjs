const axios = require('axios');
require('dotenv').config();

/**
 * Direct test of NVIDIA API using axios
 * This bypasses the OpenAI SDK to test the raw API
 */

async function testNVAPIDirect() {
  console.log('\n=== NVIDIA API Direct Test (using axios) ===\n');

  const apiKey = process.env.NVAPI_KEY;

  if (!apiKey) {
    console.error('❌ Error: NVAPI_KEY not found in environment variables');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${apiKey.substring(0, 20)}...`);

  const baseURL = 'https://integrate.api.nvidia.com/v1';

  try {
    console.log('\n--- Testing API Connection ---\n');
    console.log(`Endpoint: ${baseURL}/models\n`);

    // Test 1: Fetch models list
    const response = await axios.get(`${baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✓ Successfully connected to NVIDIA API!');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`\nTotal models available: ${response.data.data?.length || 0}\n`);

    if (response.data.data && response.data.data.length > 0) {
      console.log('Available Models:');
      console.log('='.repeat(80));

      response.data.data.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.id}`);
        if (model.owned_by) {
          console.log(`   Owner: ${model.owned_by}`);
        }
        if (model.created) {
          const date = new Date(model.created * 1000);
          console.log(`   Created: ${date.toISOString()}`);
        }
        if (model.object) {
          console.log(`   Type: ${model.object}`);
        }
      });

      console.log('\n' + '='.repeat(80));

      // Find chat models
      const chatModels = response.data.data.filter(m =>
        m.id.includes('llama') ||
        m.id.includes('mistral') ||
        m.id.includes('mixtral') ||
        m.id.includes('nemotron') ||
        m.id.includes('gpt') ||
        m.id.includes('chat')
      );

      console.log('\n=== Summary ===');
      console.log(`✓ NVIDIA API is accessible`);
      console.log(`✓ Total models: ${response.data.data.length}`);
      console.log(`✓ Potential chat models: ${chatModels.length}`);

      if (chatModels.length > 0) {
        console.log('\nChat-capable models:');
        chatModels.forEach(m => console.log(`  - ${m.id}`));
      }

      return {
        success: true,
        totalModels: response.data.data.length,
        models: response.data.data,
        chatModels: chatModels
      };
    } else {
      console.log('⚠ No models found in response');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error testing NVIDIA API:');
    console.error(`Message: ${error.message}`);

    if (error.response) {
      console.error(`\nHTTP Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`Response Headers:`, error.response.headers);
      console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
    }

    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }

    if (error.config) {
      console.error(`\nRequest Config:`);
      console.error(`  URL: ${error.config.url}`);
      console.error(`  Method: ${error.config.method}`);
      console.error(`  Headers: ${JSON.stringify(error.config.headers, null, 2)}`);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testNVAPIDirect()
    .then(() => {
      console.log('\n✓ Test complete\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testNVAPIDirect };
