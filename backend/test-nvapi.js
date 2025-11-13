const OpenAI = require('openai');
require('dotenv').config();

/**
 * Test NVIDIA API (NVAPI) and fetch available models
 * NVIDIA's API is OpenAI-compatible
 */

async function testNVAPI() {
  console.log('\n=== NVIDIA API Test ===\n');

  const apiKey = process.env.NVAPI_KEY;

  if (!apiKey) {
    console.error('❌ Error: NVAPI_KEY not found in environment variables');
    console.log('Please add NVAPI_KEY to your .env file');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${apiKey.substring(0, 15)}...`);

  // Initialize OpenAI client with NVIDIA's endpoint
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1'
  });

  try {
    console.log('\n--- Fetching Available Models ---\n');

    // Fetch list of available models
    const models = await client.models.list();

    console.log(`✓ Successfully connected to NVIDIA API!`);
    console.log(`\nTotal models available: ${models.data.length}\n`);

    // Display all models
    console.log('Available Models:');
    console.log('='.repeat(80));

    models.data.forEach((model, index) => {
      console.log(`\n${index + 1}. ${model.id}`);
      if (model.owned_by) {
        console.log(`   Owner: ${model.owned_by}`);
      }
      if (model.created) {
        const date = new Date(model.created * 1000);
        console.log(`   Created: ${date.toISOString()}`);
      }
    });

    console.log('\n' + '='.repeat(80));

    // Test with a simple completion
    console.log('\n--- Testing Model Response ---\n');

    // Try to use the first available model that looks like a chat model
    const chatModels = models.data.filter(m =>
      m.id.includes('llama') ||
      m.id.includes('mistral') ||
      m.id.includes('mixtral') ||
      m.id.includes('nemotron') ||
      m.id.includes('gpt')
    );

    if (chatModels.length > 0) {
      const testModel = chatModels[0].id;
      console.log(`Testing with model: ${testModel}\n`);

      try {
        const completion = await client.chat.completions.create({
          model: testModel,
          messages: [
            { role: 'user', content: 'Say "Hello from NVIDIA!" in one sentence.' }
          ],
          max_tokens: 50
        });

        console.log('✓ Test completion successful!');
        console.log(`Response: ${completion.choices[0].message.content}\n`);
      } catch (testError) {
        console.log(`⚠ Could not test completion with ${testModel}`);
        console.log(`Error: ${testError.message}\n`);
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`✓ NVIDIA API is accessible`);
    console.log(`✓ Total models: ${models.data.length}`);
    console.log(`✓ Chat-capable models: ${chatModels.length}`);

    // Return the data for programmatic use
    return {
      success: true,
      totalModels: models.data.length,
      models: models.data.map(m => ({
        id: m.id,
        owner: m.owned_by,
        created: m.created
      })),
      chatModels: chatModels.map(m => m.id)
    };

  } catch (error) {
    console.error('\n❌ Error testing NVIDIA API:');
    console.error(`Message: ${error.message}`);
    console.error(`Type: ${error.constructor.name}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
    if (error.cause) {
      console.error('\nCause:', error.cause);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testNVAPI()
    .then(() => {
      console.log('\n✓ Test complete\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testNVAPI };
