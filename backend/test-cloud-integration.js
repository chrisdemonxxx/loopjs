#!/usr/bin/env node

/**
 * Cloud Ollama Integration Test
 * Tests the C2 panel with cloud API integration
 */

const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');

async function testCloudIntegration() {
    console.log('🌐 Testing Cloud Ollama Integration with C2 Panel...\n');
    
    // Enable cloud API
    process.env.OLLAMA_USE_CLOUD = 'true';
    
    const processor = new OllamaAICommandProcessor();
    
    console.log('📊 Configuration:');
    console.log('   Cloud API:', processor.useCloudAPI ? '✅ ENABLED' : '❌ DISABLED');
    console.log('   API URL:', processor.ollamaAPI);
    console.log('   Primary Model:', processor.primaryModel);
    console.log('   Fallback Models:', processor.fallbackModels.join(', '));
    
    try {
        await processor.initializeConnection();
        
        console.log('\n🧪 Testing Model Selection:');
        
        const testCases = [
            {
                name: 'Simple Task',
                input: 'list running processes',
                complexity: 'simple',
                type: 'general'
            },
            {
                name: 'Coding Task',
                input: 'create a PowerShell script to backup files',
                complexity: 'moderate',
                type: 'coding'
            },
            {
                name: 'Workflow Task',
                input: 'download chrome, install it, open it, navigate to google.com',
                complexity: 'complex',
                type: 'workflow'
            },
            {
                name: 'Security Task',
                input: 'scan for open ports and vulnerabilities',
                complexity: 'moderate',
                type: 'security'
            },
            {
                name: 'Complex Task',
                input: 'perform comprehensive system audit with detailed reporting',
                complexity: 'complex',
                type: 'general'
            }
        ];
        
        for (const testCase of testCases) {
            const selectedModel = processor.selectModel(
                testCase.complexity, 
                testCase.type, 
                testCase.input
            );
            
            const modelConfig = processor.modelConfig[selectedModel];
            const apiType = modelConfig?.api || 'unknown';
            
            console.log(`\n🔍 ${testCase.name}:`);
            console.log(`   Input: "${testCase.input}"`);
            console.log(`   Selected: ${selectedModel}`);
            console.log(`   API: ${apiType.toUpperCase()}`);
            console.log(`   Score: ${modelConfig?.score || 'N/A'}/10`);
            console.log(`   Speed: ${modelConfig?.avgTime || 'N/A'}ms`);
        }
        
        console.log('\n🚀 Testing Command Processing:');
        
        // Test simple command
        console.log('\n1. Simple Command Test:');
        const simpleResult = await processor.processCommandWithAI(
            'list running processes', 
            { uuid: 'test-client' }, 
            {}
        );
        
        if (simpleResult.success) {
            console.log('   ✅ Success');
            console.log('   Command:', simpleResult.data.optimizedCommand.command);
            console.log('   Model:', simpleResult.data.model);
            console.log('   Response Time:', simpleResult.data.responseTime + 'ms');
        } else {
            console.log('   ❌ Failed:', simpleResult.error);
        }
        
        // Test complex command
        console.log('\n2. Complex Command Test:');
        const complexResult = await processor.processCommandWithAI(
            'create a PowerShell script to backup all txt files from Desktop to Documents folder', 
            { uuid: 'test-client' }, 
            {}
        );
        
        if (complexResult.success) {
            console.log('   ✅ Success');
            console.log('   Command:', complexResult.data.optimizedCommand.command);
            console.log('   Model:', complexResult.data.model);
            console.log('   Response Time:', complexResult.data.responseTime + 'ms');
        } else {
            console.log('   ❌ Failed:', complexResult.error);
        }
        
        console.log('\n🎉 Cloud Integration Test Complete!');
        
    } catch (error) {
        console.error('❌ Cloud Integration Error:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check cloud API connectivity: http://192.168.0.116:5000/health');
        console.log('2. Verify API key: demo_key_123');
        console.log('3. Ensure network access to 192.168.0.116:5000');
    }
}

testCloudIntegration();
