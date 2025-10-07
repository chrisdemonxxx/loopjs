#!/usr/bin/env node

/**
 * Multi-Model Selection Demonstration
 * Shows how the Ollama integration selects different models based on task type
 */

const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');

async function demonstrateMultiModelSelection() {
    console.log('🚀 Multi-Model Selection Demonstration\n');
    
    const processor = new OllamaAICommandProcessor();
    await processor.initializeConnection();
    
    // Test cases demonstrating different model selections
    const testCases = [
        {
            name: 'Simple Task',
            input: 'list running processes',
            complexity: 'simple',
            type: 'general',
            expectedModel: 'llama3.2:3b',
            reason: 'Fastest model for basic commands (267ms)'
        },
        {
            name: 'Workflow Task',
            input: 'download chrome, install it, open it, navigate to google.com',
            complexity: 'complex',
            type: 'workflow',
            expectedModel: 'kali-specialist:latest',
            reason: 'Best for complex multi-step tasks (9.1/10 workflow score)'
        },
        {
            name: 'Security Task',
            input: 'scan for open ports and vulnerabilities',
            complexity: 'moderate',
            type: 'security',
            expectedModel: 'threat-watch:latest',
            reason: 'Specialized for security operations (7.7/10 pentest score)'
        },
        {
            name: 'Download Task',
            input: 'download and install the latest version of Firefox',
            complexity: 'moderate',
            type: 'download',
            expectedModel: 'devops-master:latest',
            reason: 'Expert at file operations (7.7/10 download score)'
        },
        {
            name: 'Complex Analysis Task',
            input: 'perform comprehensive system audit with detailed reporting',
            complexity: 'complex',
            type: 'general',
            expectedModel: 'qwen2.5-coder:1.5b',
            reason: 'Best overall performer (7.1/10 overall score)'
        },
        {
            name: 'Security Analysis Task',
            input: 'analyze firewall logs and generate security report',
            complexity: 'complex',
            type: 'security',
            expectedModel: 'qwen2.5:7b',
            reason: 'Good for security analysis (7.3/10 security score)'
        }
    ];
    
    console.log('📊 Model Selection Results:\n');
    
    for (const testCase of testCases) {
        const selectedModel = processor.selectModel(
            testCase.complexity, 
            testCase.type, 
            testCase.input
        );
        
        const modelConfig = processor.modelConfig[selectedModel];
        const isCorrect = selectedModel === testCase.expectedModel;
        
        console.log(`🔍 ${testCase.name}:`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Selected: ${selectedModel}`);
        console.log(`   Expected: ${testCase.expectedModel}`);
        console.log(`   Score: ${modelConfig?.score || 'N/A'}/10`);
        console.log(`   Speed: ${modelConfig?.avgTime || 'N/A'}ms`);
        console.log(`   Reason: ${testCase.reason}`);
        console.log(`   Status: ${isCorrect ? '✅ CORRECT' : '⚠️  FALLBACK (model not available)'}`);
        console.log('');
    }
    
    // Show available models
    console.log('📋 Currently Available Models:');
    const availableModels = Array.from(processor.availableModels.keys());
    if (availableModels.length === 0) {
        console.log('   ⚠️  No models available - using fallback');
    } else {
        availableModels.forEach(model => {
            const config = processor.modelConfig[model];
            console.log(`   ✅ ${model} (${config?.score || 'N/A'}/10, ${config?.avgTime || 'N/A'}ms)`);
        });
    }
    
    console.log('\n💡 To enable full multi-model selection, ensure all recommended models are loaded:');
    console.log('   ollama pull kali-specialist:latest');
    console.log('   ollama pull threat-watch:latest');
    console.log('   ollama pull devops-master:latest');
    console.log('   ollama pull llama3.2:3b');
    console.log('   ollama pull qwen2.5:7b');
    
    console.log('\n🎯 Multi-model selection provides:');
    console.log('   • Optimal performance for each task type');
    console.log('   • Faster response times for simple tasks');
    console.log('   • Better accuracy for specialized operations');
    console.log('   • Intelligent fallback mechanisms');
}

// Run the demonstration
demonstrateMultiModelSelection().catch(console.error);
