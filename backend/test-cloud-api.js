#!/usr/bin/env node

/**
 * Cloud Ollama API Test
 * Tests connectivity and lists available models
 */

async function testCloudAPI() {
    console.log('🌐 Testing Cloud Ollama API...\n');
    
    try {
        // Test health check
        console.log('1. Testing Health Check...');
        const healthResponse = await fetch('http://192.168.0.116:5000/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health Status:', healthData.status || 'OK');
        
        // Test models list
        console.log('\n2. Fetching Available Models...');
        const modelsResponse = await fetch('http://192.168.0.116:5000/api/tags', {
            headers: {
                'X-API-Key': 'demo_key_123'
            }
        });
        
        if (!modelsResponse.ok) {
            throw new Error(`HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`);
        }
        
        const modelsData = await modelsResponse.json();
        console.log(`✅ Found ${modelsData.models.length} models`);
        
        console.log('\n📋 Available Models:');
        modelsData.models.forEach((model, index) => {
            const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(1);
            console.log(`${index + 1}. ${model.name} (${sizeGB} GB)`);
        });
        
        // Test text generation
        console.log('\n3. Testing Text Generation...');
        const generateResponse = await fetch('http://192.168.0.116:5000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'demo_key_123'
            },
            body: JSON.stringify({
                model: 'llama3.2:3b',
                prompt: 'Convert this to PowerShell: list running processes',
                stream: false
            })
        });
        
        if (!generateResponse.ok) {
            throw new Error(`Generate API Error: ${generateResponse.status}`);
        }
        
        const generateData = await generateResponse.json();
        console.log('✅ Text Generation Test:');
        console.log('   Model:', generateData.model);
        console.log('   Response:', generateData.response?.substring(0, 100) + '...');
        
        console.log('\n🎉 Cloud API Integration Successful!');
        
        // Recommend models for C2 panel
        console.log('\n🎯 Recommended Models for C2 Panel:');
        const recommendedModels = [
            'llama3.2:3b',      // Fast, lightweight
            'codellama:7b',     // Code generation
            'qwen2.5:7b',       // Advanced reasoning
            'deepseek-coder:33b-instruct' // Large coding model
        ];
        
        recommendedModels.forEach(model => {
            const found = modelsData.models.find(m => m.name === model);
            if (found) {
                console.log(`✅ ${model} - Available`);
            } else {
                console.log(`❌ ${model} - Not found`);
            }
        });
        
    } catch (error) {
        console.error('❌ Cloud API Error:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if the cloud API is running on 192.168.0.116:5000');
        console.log('2. Verify network connectivity');
        console.log('3. Confirm API key: demo_key_123');
    }
}

testCloudAPI();
