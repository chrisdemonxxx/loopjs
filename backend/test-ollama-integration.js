const fs = require('fs');
const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');

/**
 * Ollama Integration Test Script
 * Tests Ollama AI integration with real C2 commands
 */
class OllamaIntegrationTester {
    constructor() {
        this.ollamaProcessor = new OllamaAICommandProcessor();
        this.testResults = [];
    }

    /**
     * Test cases for real C2 commands
     */
    getTestCases() {
        return [
            {
                id: 'download_chrome',
                name: 'Download Chrome and Install',
                userInput: 'download chrome from internet, install it, open it',
                expectedKeywords: ['Invoke-WebRequest', 'chrome', 'install', 'Start-Process'],
                category: 'download',
                complexity: 'complex'
            },
            {
                id: 'list_processes',
                name: 'List Running Processes by CPU',
                userInput: 'list running processes sorted by CPU usage',
                expectedKeywords: ['Get-Process', 'CPU', 'Sort-Object', 'Format-Table'],
                category: 'system_info',
                complexity: 'simple'
            },
            {
                id: 'port_scan',
                name: 'Check Port 445',
                userInput: 'check if port 445 is open on 192.168.1.100',
                expectedKeywords: ['Test-NetConnection', '445', '192.168.1.100'],
                category: 'network',
                complexity: 'simple'
            },
            {
                id: 'file_operations',
                name: 'Create Folder and Copy Files',
                userInput: 'create folder C:\\temp\\test and copy all txt files from Desktop',
                expectedKeywords: ['New-Item', 'Copy-Item', 'Desktop', 'txt'],
                category: 'file_ops',
                complexity: 'moderate'
            },
            {
                id: 'system_info',
                name: 'Get System Information',
                userInput: 'show me detailed system information including CPU and memory',
                expectedKeywords: ['Get-ComputerInfo', 'CPU', 'memory', 'system'],
                category: 'system_info',
                complexity: 'simple'
            },
            {
                id: 'network_enumeration',
                name: 'Network Enumeration',
                userInput: 'enumerate network shares on 192.168.1.100 and check for open ports',
                expectedKeywords: ['Get-SmbShare', 'Test-NetConnection', '192.168.1.100'],
                category: 'pentest',
                complexity: 'complex'
            },
            {
                id: 'service_management',
                name: 'Service Management',
                userInput: 'restart the spooler service and check its status',
                expectedKeywords: ['Restart-Service', 'spooler', 'Get-Service'],
                category: 'system_mgmt',
                complexity: 'moderate'
            },
            {
                id: 'security_check',
                name: 'Security Check',
                userInput: 'check firewall status and antivirus protection',
                expectedKeywords: ['Get-NetFirewallProfile', 'Get-MpComputerStatus', 'firewall'],
                category: 'security',
                complexity: 'simple'
            }
        ];
    }

    /**
     * Run a single test case
     */
    async runTest(testCase) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`   Input: "${testCase.userInput}"`);
        console.log(`   Category: ${testCase.category}, Complexity: ${testCase.complexity}`);
        
        const startTime = Date.now();
        
        try {
            const clientInfo = {
                uuid: 'test-client-001',
                platform: 'Win32NT 10.0.26100.0',
                systemInfo: {
                    computerName: 'TEST-PC',
                    osVersion: 'Windows 10'
                }
            };

            const context = {
                category: testCase.category,
                action: 'process'
            };

            const result = await this.ollamaProcessor.processCommandWithAI(
                testCase.userInput,
                clientInfo,
                context
            );

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (result.success) {
                const command = result.data.optimizedCommand.command;
                const model = result.data.model;
                const explanation = result.data.explanation;

                // Score the response
                const score = this.scoreResponse(command, testCase, responseTime);

                console.log(`   ✅ Success (${responseTime}ms)`);
                console.log(`   🤖 Model: ${model}`);
                console.log(`   📝 Command: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
                console.log(`   📊 Score: ${score.total}/10`);

                return {
                    testCase: testCase.id,
                    success: true,
                    responseTime: responseTime,
                    model: model,
                    command: command,
                    explanation: explanation,
                    score: score,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
                return {
                    testCase: testCase.id,
                    success: false,
                    error: result.error || 'Unknown error',
                    responseTime: endTime - startTime,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            const endTime = Date.now();
            console.log(`   ❌ Error: ${error.message}`);
            return {
                testCase: testCase.id,
                success: false,
                error: error.message,
                responseTime: endTime - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Score the AI response
     */
    scoreResponse(command, testCase, responseTime) {
        const cmd = command.toLowerCase();
        
        // Accuracy: Check if expected keywords are present
        const keywordsFound = testCase.expectedKeywords.filter(kw => 
            cmd.includes(kw.toLowerCase())
        ).length;
        const accuracyScore = (keywordsFound / testCase.expectedKeywords.length) * 10;
        
        // Syntax: Check for proper PowerShell syntax
        const hasPowerShellSyntax = /get-|set-|new-|remove-|start-|stop-|invoke-|write-host/i.test(command);
        const syntaxScore = hasPowerShellSyntax ? 8 : 5;
        
        // Safety: Check for error handling
        const hasSafety = /try|catch|test-path|erroraction|force|confirm|if.*exist/i.test(command);
        const safetyScore = hasSafety ? 8 : 4;
        
        // Speed scoring
        let speedScore = 10;
        if (responseTime > 10000) speedScore = 0;
        else if (responseTime > 5000) speedScore = 3;
        else if (responseTime > 2000) speedScore = 5;
        else if (responseTime > 1000) speedScore = 7;
        
        // Completeness: Check if command addresses the full request
        const completenessScore = command.length > 50 ? 8 : 5;
        
        // Weighted total
        const totalScore = (
            accuracyScore * 0.3 +
            syntaxScore * 0.2 +
            safetyScore * 0.15 +
            speedScore * 0.15 +
            completenessScore * 0.2
        );
        
        return {
            accuracy: accuracyScore.toFixed(1),
            syntax: syntaxScore,
            safety: safetyScore,
            speed: speedScore,
            completeness: completenessScore,
            total: totalScore.toFixed(1)
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🚀 Starting Ollama Integration Tests...\n');
        
        // Test connection first
        console.log('🔌 Testing Ollama Connection...');
        const connectionTest = await this.ollamaProcessor.testConnection();
        if (!connectionTest) {
            console.log('❌ Ollama connection failed. Please ensure Ollama is running.');
            return;
        }
        console.log('✅ Ollama connection successful');

        // Check available models
        console.log('\n📋 Checking Available Models...');
        await this.ollamaProcessor.checkAvailableModels();
        const stats = this.ollamaProcessor.getAIStatistics();
        console.log(`✅ Found ${stats.modelsAvailable} available models`);
        console.log(`   Primary Model: ${stats.primaryModel}`);

        // Run test cases
        const testCases = this.getTestCases();
        console.log(`\n🧪 Running ${testCases.length} Integration Tests...\n`);

        for (const testCase of testCases) {
            const result = await this.runTest(testCase);
            this.testResults.push(result);
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Generate summary report
        this.generateSummaryReport();
    }

    /**
     * Generate summary report
     */
    generateSummaryReport() {
        console.log('\n\n' + '='.repeat(80));
        console.log('📈 OLLAMA INTEGRATION TEST RESULTS');
        console.log('='.repeat(80));

        const successfulTests = this.testResults.filter(r => r.success);
        const failedTests = this.testResults.filter(r => !r.success);
        
        console.log(`\n📊 OVERALL RESULTS:`);
        console.log(`   Total Tests: ${this.testResults.length}`);
        console.log(`   Successful: ${successfulTests.length}`);
        console.log(`   Failed: ${failedTests.length}`);
        console.log(`   Success Rate: ${((successfulTests.length / this.testResults.length) * 100).toFixed(1)}%`);

        if (successfulTests.length > 0) {
            const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
            const avgScore = successfulTests.reduce((sum, r) => sum + parseFloat(r.score.total), 0) / successfulTests.length;
            
            console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
            console.log(`   Average Score: ${avgScore.toFixed(1)}/10`);

            // Model usage breakdown
            const modelUsage = {};
            successfulTests.forEach(r => {
                modelUsage[r.model] = (modelUsage[r.model] || 0) + 1;
            });
            
            console.log(`\n🤖 MODEL USAGE:`);
            Object.entries(modelUsage).forEach(([model, count]) => {
                console.log(`   ${model}: ${count} tests`);
            });
        }

        // Failed tests
        if (failedTests.length > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            failedTests.forEach(test => {
                console.log(`   ${test.testCase}: ${test.error}`);
            });
        }

        // Performance analysis
        console.log(`\n⚡ PERFORMANCE ANALYSIS:`);
        const fastTests = successfulTests.filter(r => r.responseTime < 2000);
        const slowTests = successfulTests.filter(r => r.responseTime > 5000);
        
        console.log(`   Fast Tests (<2s): ${fastTests.length}/${successfulTests.length}`);
        console.log(`   Slow Tests (>5s): ${slowTests.length}/${successfulTests.length}`);

        // Save detailed results
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                successfulTests: successfulTests.length,
                failedTests: failedTests.length,
                successRate: ((successfulTests.length / this.testResults.length) * 100).toFixed(1),
                avgResponseTime: successfulTests.length > 0 ? 
                    Math.round(successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length) : 0,
                avgScore: successfulTests.length > 0 ? 
                    (successfulTests.reduce((sum, r) => sum + parseFloat(r.score.total), 0) / successfulTests.length).toFixed(1) : '0.0'
            },
            testResults: this.testResults,
            ollamaStats: this.ollamaProcessor.getAIStatistics()
        };

        fs.writeFileSync(
            'ollama-integration-test-results.json',
            JSON.stringify(reportData, null, 2)
        );
        console.log('\n✅ Detailed results saved to: ollama-integration-test-results.json');

        // Final recommendation
        console.log('\n🎯 INTEGRATION ASSESSMENT:');
        if (successfulTests.length === this.testResults.length) {
            console.log('✅ EXCELLENT: All tests passed! Ollama integration is working perfectly.');
        } else if (successfulTests.length >= this.testResults.length * 0.8) {
            console.log('✅ GOOD: Most tests passed. Ollama integration is working well.');
        } else if (successfulTests.length >= this.testResults.length * 0.5) {
            console.log('⚠️  FAIR: Some tests failed. Check Ollama configuration and models.');
        } else {
            console.log('❌ POOR: Many tests failed. Ollama integration needs attention.');
        }

        console.log('\n🎉 Integration testing complete!');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new OllamaIntegrationTester();
    tester.runAllTests().catch(console.error);
}

module.exports = OllamaIntegrationTester;
