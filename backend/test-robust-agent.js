/**
 * Robust AI Agent Integration Tests
 * Tests the complete intelligent agent system with real-world scenarios
 */

const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');

// Test scenarios
const testScenarios = [
    {
        name: 'Download and Run Opera Browser',
        input: 'download opera browser and run it',
        expectedBehavior: 'Should search for Opera download URL, download installer, and execute it',
        category: 'download'
    },
    {
        name: 'Install Chrome Silently',
        input: 'install chrome silently',
        expectedBehavior: 'Should handle installation even if already installed',
        category: 'install'
    },
    {
        name: 'Get Latest Python 3.11',
        input: 'get latest python 3.11',
        expectedBehavior: 'Should download specific version of Python',
        category: 'download'
    },
    {
        name: 'Simple Ping Command',
        input: 'ping google',
        expectedBehavior: 'Should execute simple network command without complex processing',
        category: 'network'
    },
    {
        name: 'System Information',
        input: 'get system information',
        expectedBehavior: 'Should execute systeminfo command',
        category: 'system'
    },
    {
        name: 'List Running Processes',
        input: 'list all running processes',
        expectedBehavior: 'Should execute tasklist command',
        category: 'process'
    }
];

// Mock client info
const mockClientInfo = {
    uuid: 'test-client-001',
    platform: 'Windows 10',
    systemInfo: {
        OSVersion: 'Windows 10 Pro',
        Is64BitOperatingSystem: 'True',
        ComputerName: 'TEST-PC',
        UserName: 'TestUser',
        ProcessorCount: '8'
    }
};

/**
 * Run a single test scenario
 */
async function runTest(scenario, processor) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Input: "${scenario.input}"`);
    console.log(`Expected: ${scenario.expectedBehavior}`);
    console.log(`Category: ${scenario.category}`);
    console.log(`${'-'.repeat(80)}`);
    
    const startTime = Date.now();
    
    try {
        // Use intelligent agent processing
        const result = await processor.executeWithIntelligentFallback(
            scenario.input,
            mockClientInfo
        );
        
        const duration = Date.now() - startTime;
        
        console.log(`\nRESULT: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
        console.log(`Duration: ${duration}ms`);
        
        if (result.analysis) {
            console.log(`\nIntent Analysis:`);
            console.log(`  - Intent: ${result.analysis.intent}`);
            console.log(`  - Complexity: ${result.analysis.complexity}`);
            console.log(`  - Target Type: ${result.analysis.targetType}`);
            console.log(`  - Target Value: ${result.analysis.targetValue}`);
        }
        
        if (result.strategies) {
            console.log(`\nStrategies Generated: ${result.strategies.length}`);
            result.strategies.forEach((strategy, index) => {
                console.log(`  ${index + 1}. ${strategy.name} (priority: ${strategy.priority})`);
            });
        }
        
        if (result.execution) {
            console.log(`\nExecution Details:`);
            console.log(`  - Strategy Used: ${result.execution.strategy || 'N/A'}`);
            console.log(`  - Attempts: ${result.execution.attempts || 0}`);
            console.log(`  - Duration: ${result.execution.duration || 0}ms`);
            
            if (result.execution.result && result.execution.result.command) {
                console.log(`  - Command: ${result.execution.result.command}`);
            }
            
            if (result.execution.error) {
                console.log(`  - Error: ${result.execution.error}`);
            }
        }
        
        if (result.multiStage) {
            console.log(`\nMulti-Stage Processing: YES`);
            if (result.stages) {
                console.log(`  - Context Analysis: ${result.stages.contextAnalysis ? '✓' : '✗'}`);
                console.log(`  - Resource Discovery: ${result.stages.resourceDiscovery ? '✓' : '✗'}`);
                console.log(`  - Execution: ${result.stages.execution ? '✓' : '✗'}`);
                
                if (result.stages.resourceDiscovery && result.stages.resourceDiscovery.searchResult) {
                    console.log(`  - URLs Found: ${result.stages.resourceDiscovery.searchResult.urls.length}`);
                }
            }
        }
        
        console.log(`\nMessage: ${result.message || 'No message'}`);
        
        return {
            scenario: scenario.name,
            success: result.success,
            duration: duration,
            result: result
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.log(`\nRESULT: ✗ ERROR`);
        console.log(`Duration: ${duration}ms`);
        console.log(`Error: ${error.message}`);
        console.log(`Stack: ${error.stack}`);
        
        return {
            scenario: scenario.name,
            success: false,
            duration: duration,
            error: error.message
        };
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`# ROBUST AI AGENT INTEGRATION TESTS`);
    console.log(`${'#'.repeat(80)}`);
    console.log(`\nInitializing Ollama AI Command Processor...`);
    
    const processor = new OllamaAICommandProcessor();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Processor initialized. Starting tests...\n`);
    
    const results = [];
    
    for (const scenario of testScenarios) {
        const result = await runTest(scenario, processor);
        results.push(result);
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print summary
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`# TEST SUMMARY`);
    console.log(`${'#'.repeat(80)}\n`);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${successCount} (${Math.round(successCount / results.length * 100)}%)`);
    console.log(`Failed: ${failureCount} (${Math.round(failureCount / results.length * 100)}%)`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Duration: ${Math.round(avgDuration)}ms`);
    
    console.log(`\nDetailed Results:`);
    results.forEach((result, index) => {
        const status = result.success ? '✓' : '✗';
        console.log(`  ${index + 1}. ${status} ${result.scenario} (${result.duration}ms)`);
        if (result.error) {
            console.log(`     Error: ${result.error}`);
        }
    });
    
    console.log(`\n${'#'.repeat(80)}\n`);
    
    // Exit
    process.exit(failureCount > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
