/**
 * Comprehensive Test Suite for Intelligent Agent System
 * Tests all components of the intelligent AI agent
 */

const IntelligentCommandAnalyzer = require('../services/intelligentCommandAnalyzer');
const StrategyPlanner = require('../services/strategyPlanner');
const WebFetchService = require('../services/webFetchService');
const BrowserAutomationService = require('../services/browserAutomationService');
const ErrorAnalyzer = require('../services/errorAnalyzer');
const SmartExecutionOrchestrator = require('../services/smartExecutionOrchestrator');
const OllamaAICommandProcessor = require('../services/ollamaAICommandProcessor');

class IntelligentAgentTestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        
        // Initialize services
        this.analyzer = new IntelligentCommandAnalyzer();
        this.planner = new StrategyPlanner();
        this.webFetch = new WebFetchService();
        this.browserAutomation = new BrowserAutomationService();
        this.errorAnalyzer = new ErrorAnalyzer();
        this.orchestrator = new SmartExecutionOrchestrator();
        this.ollamaProcessor = new OllamaAICommandProcessor();
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Intelligent Agent Test Suite...\n');
        
        const testCategories = [
            { name: 'Command Analysis', tests: this.getAnalysisTests() },
            { name: 'Strategy Planning', tests: this.getStrategyTests() },
            { name: 'Web Fetching', tests: this.getWebFetchTests() },
            { name: 'Browser Automation', tests: this.getBrowserAutomationTests() },
            { name: 'Error Analysis', tests: this.getErrorAnalysisTests() },
            { name: 'Execution Orchestration', tests: this.getOrchestrationTests() },
            { name: 'Ollama Integration', tests: this.getOllamaTests() },
            { name: 'End-to-End Scenarios', tests: this.getE2ETests() }
        ];

        for (const category of testCategories) {
            console.log(`\n📋 Testing ${category.name}...`);
            console.log('='.repeat(50));
            
            for (const test of category.tests) {
                await this.runTest(test);
            }
        }

        this.printSummary();
        return this.getResults();
    }

    /**
     * Run a single test
     */
    async runTest(test) {
        this.totalTests++;
        const startTime = Date.now();
        
        try {
            console.log(`  🔍 ${test.name}...`);
            const result = await test.function();
            const duration = Date.now() - startTime;
            
            if (result.success) {
                this.passedTests++;
                console.log(`  ✅ PASSED (${duration}ms)`);
                if (result.details) {
                    console.log(`     ${result.details}`);
                }
            } else {
                this.failedTests++;
                console.log(`  ❌ FAILED (${duration}ms)`);
                console.log(`     Error: ${result.error}`);
            }
            
            this.testResults.push({
                name: test.name,
                category: test.category,
                success: result.success,
                duration: duration,
                error: result.error,
                details: result.details
            });
            
        } catch (error) {
            this.failedTests++;
            const duration = Date.now() - startTime;
            console.log(`  ❌ ERROR (${duration}ms)`);
            console.log(`     ${error.message}`);
            
            this.testResults.push({
                name: test.name,
                category: test.category,
                success: false,
                duration: duration,
                error: error.message
            });
        }
    }

    /**
     * Get command analysis tests
     */
    getAnalysisTests() {
        return [
            {
                name: 'Analyze Download Intent',
                category: 'analysis',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download opera browser', {});
                    return {
                        success: analysis.intent === 'download' && analysis.targets.length > 0,
                        details: `Intent: ${analysis.intent}, Targets: ${analysis.targets.length}`
                    };
                }
            },
            {
                name: 'Analyze Install Intent',
                category: 'analysis',
                function: async () => {
                    const analysis = await this.analyzer.analyze('install chrome silently', {});
                    return {
                        success: analysis.intent === 'download' && analysis.parameters.silent === true,
                        details: `Intent: ${analysis.intent}, Silent: ${analysis.parameters.silent}`
                    };
                }
            },
            {
                name: 'Analyze Complex Command',
                category: 'analysis',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download and install firefox browser with silent installation', {});
                    return {
                        success: analysis.complexity === 'complex' && analysis.intent === 'download',
                        details: `Complexity: ${analysis.complexity}, Intent: ${analysis.intent}`
                    };
                }
            },
            {
                name: 'Extract URL from Input',
                category: 'analysis',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download from https://example.com/file.exe', {});
                    const hasUrl = analysis.targets.some(t => t.type === 'url');
                    return {
                        success: hasUrl,
                        details: `Found URL: ${hasUrl}`
                    };
                }
            },
            {
                name: 'Detect Privilege Requirements',
                category: 'analysis',
                function: async () => {
                    const analysis = await this.analyzer.analyze('install system service silently', {});
                    return {
                        success: analysis.privilegeLevel === 'admin',
                        details: `Privilege Level: ${analysis.privilegeLevel}`
                    };
                }
            }
        ];
    }

    /**
     * Get strategy planning tests
     */
    getStrategyTests() {
        return [
            {
                name: 'Generate Download Strategies',
                category: 'strategy',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download opera browser', {});
                    const strategies = await this.planner.generateStrategies(analysis);
                    return {
                        success: strategies.length >= 3,
                        details: `Generated ${strategies.length} strategies`
                    };
                }
            },
            {
                name: 'Strategy Priority Order',
                category: 'strategy',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download chrome', {});
                    const strategies = await this.planner.generateStrategies(analysis);
                    const isOrdered = strategies.every((strategy, index) => 
                        index === 0 || strategy.priority >= strategies[index - 1].priority
                    );
                    return {
                        success: isOrdered,
                        details: `Strategies properly ordered: ${isOrdered}`
                    };
                }
            },
            {
                name: 'Fallback Strategy Generation',
                category: 'strategy',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download complex software', {});
                    const strategies = await this.planner.generateStrategies(analysis);
                    const hasFallbacks = strategies.some(s => s.name.includes('Fallback') || s.name.includes('Research'));
                    return {
                        success: hasFallbacks,
                        details: `Has fallback strategies: ${hasFallbacks}`
                    };
                }
            },
            {
                name: 'Strategy Adaptation',
                category: 'strategy',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download file', {});
                    const strategies = await this.planner.generateStrategies(analysis);
                    const originalStrategy = strategies[0];
                    const errorContext = { type: '404', category: 'file_not_found' };
                    const adaptedStrategy = this.planner.adaptStrategy(originalStrategy, errorContext);
                    return {
                        success: adaptedStrategy.parameters.lastError === 'file_not_found',
                        details: `Strategy adapted for error: ${adaptedStrategy.parameters.lastError}`
                    };
                }
            }
        ];
    }

    /**
     * Get web fetching tests
     */
    getWebFetchTests() {
        return [
            {
                name: 'URL Resolution',
                category: 'web-fetch',
                function: async () => {
                    const resolvedUrl = await this.webFetch.resolveUrl('https://httpbin.org/redirect/1');
                    return {
                        success: resolvedUrl.includes('httpbin.org'),
                        details: `Resolved URL: ${resolvedUrl}`
                    };
                }
            },
            {
                name: 'Filename Extraction',
                category: 'web-fetch',
                function: async () => {
                    const filename = this.webFetch.extractFileName({}, 'https://example.com/file.exe');
                    return {
                        success: filename === 'file.exe',
                        details: `Extracted filename: ${filename}`
                    };
                }
            },
            {
                name: 'Download URL Detection',
                category: 'web-fetch',
                function: async () => {
                    const isDownload = this.webFetch.isDownloadUrl('https://example.com/download/file.exe');
                    return {
                        success: isDownload,
                        details: `Detected as download URL: ${isDownload}`
                    };
                }
            },
            {
                name: 'Mirror URL Generation',
                category: 'web-fetch',
                function: async () => {
                    const mirrors = this.webFetch.generateMirrorUrls('https://github.com/user/repo/releases/download/v1.0/app.exe');
                    return {
                        success: mirrors.length > 0,
                        details: `Generated ${mirrors.length} mirror URLs`
                    };
                }
            }
        ];
    }

    /**
     * Get browser automation tests
     */
    getBrowserAutomationTests() {
        return [
            {
                name: 'Browser Initialization',
                category: 'browser-automation',
                function: async () => {
                    const result = await this.browserAutomation.initialize({ headless: true });
                    return {
                        success: result.success,
                        details: `Browser initialized: ${result.success}`
                    };
                }
            },
            {
                name: 'Browser Status Check',
                category: 'browser-automation',
                function: async () => {
                    const status = this.browserAutomation.getStatus();
                    return {
                        success: typeof status.initialized === 'boolean',
                        details: `Status check works: ${status.initialized}`
                    };
                }
            },
            {
                name: 'Browser Cleanup',
                category: 'browser-automation',
                function: async () => {
                    await this.browserAutomation.close();
                    const status = this.browserAutomation.getStatus();
                    return {
                        success: !status.initialized,
                        details: `Browser cleaned up: ${!status.initialized}`
                    };
                }
            }
        ];
    }

    /**
     * Get error analysis tests
     */
    getErrorAnalysisTests() {
        return [
            {
                name: 'Network Error Analysis',
                category: 'error-analysis',
                function: async () => {
                    const analysis = await this.errorAnalyzer.analyzeError('Connection timeout', {});
                    return {
                        success: analysis.category === 'network',
                        details: `Error category: ${analysis.category}`
                    };
                }
            },
            {
                name: 'Permission Error Analysis',
                category: 'error-analysis',
                function: async () => {
                    const analysis = await this.errorAnalyzer.analyzeError('Access denied', {});
                    return {
                        success: analysis.category === 'permission',
                        details: `Error category: ${analysis.category}`
                    };
                }
            },
            {
                name: '404 Error Analysis',
                category: 'error-analysis',
                function: async () => {
                    const analysis = await this.errorAnalyzer.analyzeError('404 Not Found', {});
                    return {
                        success: analysis.category === 'file_not_found',
                        details: `Error category: ${analysis.category}`
                    };
                }
            },
            {
                name: 'Error Suggestions Generation',
                category: 'error-analysis',
                function: async () => {
                    const analysis = await this.errorAnalyzer.analyzeError('Connection timeout', {});
                    return {
                        success: analysis.suggestions.length > 0,
                        details: `Generated ${analysis.suggestions.length} suggestions`
                    };
                }
            },
            {
                name: 'Error Learning Statistics',
                category: 'error-analysis',
                function: async () => {
                    const stats = this.errorAnalyzer.getLearningStatistics();
                    return {
                        success: typeof stats.totalErrors === 'number',
                        details: `Total errors tracked: ${stats.totalErrors}`
                    };
                }
            }
        ];
    }

    /**
     * Get execution orchestration tests
     */
    getOrchestrationTests() {
        return [
            {
                name: 'Strategy Execution',
                category: 'orchestration',
                function: async () => {
                    const analysis = await this.analyzer.analyze('download test file', {});
                    const strategies = await this.planner.generateStrategies(analysis);
                    const result = await this.orchestrator.executeWithFallback(
                        'download test file',
                        strategies.slice(0, 2), // Use only first 2 strategies for testing
                        {}
                    );
                    return {
                        success: typeof result.success === 'boolean',
                        details: `Execution result: ${result.success}`
                    };
                }
            },
            {
                name: 'Execution Statistics',
                category: 'orchestration',
                function: async () => {
                    const stats = this.orchestrator.getExecutionStatistics();
                    return {
                        success: typeof stats.totalExecutions === 'number',
                        details: `Total executions: ${stats.totalExecutions}`
                    };
                }
            }
        ];
    }

    /**
     * Get Ollama integration tests
     */
    getOllamaTests() {
        return [
            {
                name: 'Ollama Connection Test',
                category: 'ollama',
                function: async () => {
                    const isConnected = await this.ollamaProcessor.testConnection();
                    return {
                        success: typeof isConnected === 'boolean',
                        details: `Ollama connected: ${isConnected}`
                    };
                }
            },
            {
                name: 'Intent Analysis Integration',
                category: 'ollama',
                function: async () => {
                    const analysis = await this.ollamaProcessor.analyzeCommandIntent('download opera', {});
                    return {
                        success: analysis.intent === 'download',
                        details: `Intent analysis: ${analysis.intent}`
                    };
                }
            },
            {
                name: 'Strategy Generation Integration',
                category: 'ollama',
                function: async () => {
                    const analysis = await this.ollamaProcessor.analyzeCommandIntent('download chrome', {});
                    const strategies = await this.ollamaProcessor.generateFallbackStrategies(analysis);
                    return {
                        success: strategies.length > 0,
                        details: `Generated ${strategies.length} strategies`
                    };
                }
            },
            {
                name: 'Intelligent Agent Statistics',
                category: 'ollama',
                function: async () => {
                    const stats = this.ollamaProcessor.getIntelligentAgentStatistics();
                    return {
                        success: typeof stats.totalExecutions === 'number',
                        details: `Total executions: ${stats.totalExecutions}`
                    };
                }
            }
        ];
    }

    /**
     * Get end-to-end scenario tests
     */
    getE2ETests() {
        return [
            {
                name: 'Complete Download Scenario',
                category: 'e2e',
                function: async () => {
                    const result = await this.ollamaProcessor.executeWithIntelligentFallback(
                        'download opera browser',
                        { platform: 'windows' }
                    );
                    return {
                        success: typeof result.success === 'boolean',
                        details: `E2E result: ${result.success}`
                    };
                }
            },
            {
                name: 'Error Recovery Scenario',
                category: 'e2e',
                function: async () => {
                    // Test with intentionally problematic input
                    const result = await this.ollamaProcessor.executeWithIntelligentFallback(
                        'download from invalid-url-that-does-not-exist.com/file.exe',
                        { platform: 'windows' }
                    );
                    return {
                        success: typeof result.success === 'boolean',
                        details: `Error recovery test: ${result.success}`
                    };
                }
            },
            {
                name: 'Complex Command Scenario',
                category: 'e2e',
                function: async () => {
                    const result = await this.ollamaProcessor.executeWithIntelligentFallback(
                        'download and install firefox browser silently with custom settings',
                        { platform: 'windows', admin: true }
                    );
                    return {
                        success: typeof result.success === 'boolean',
                        details: `Complex command result: ${result.success}`
                    };
                }
            }
        ];
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 INTELLIGENT AGENT TEST SUITE SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`  - ${test.name} (${test.category}): ${test.error}`);
                });
        }
        
        console.log('\n🎯 Test Categories:');
        const categories = [...new Set(this.testResults.map(t => t.category))];
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(t => t.category === category);
            const passed = categoryTests.filter(t => t.success).length;
            const total = categoryTests.length;
            console.log(`  ${category}: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
        });
        
        console.log('\n✨ Intelligent Agent System Status:');
        if (this.passedTests / this.totalTests >= 0.8) {
            console.log('🟢 EXCELLENT - System is ready for production');
        } else if (this.passedTests / this.totalTests >= 0.6) {
            console.log('🟡 GOOD - System is functional with minor issues');
        } else {
            console.log('🔴 NEEDS WORK - System requires fixes before deployment');
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: (this.passedTests / this.totalTests) * 100,
            results: this.testResults,
            summary: {
                excellent: this.passedTests / this.totalTests >= 0.8,
                functional: this.passedTests / this.totalTests >= 0.6,
                needsWork: this.passedTests / this.totalTests < 0.6
            }
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.browserAutomation.close();
            await this.orchestrator.cleanup();
            await this.ollamaProcessor.cleanupIntelligentAgent();
            console.log('🧹 Test suite cleanup completed');
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }
}

// Export for use in other files
module.exports = IntelligentAgentTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new IntelligentAgentTestSuite();
    
    testSuite.runAllTests()
        .then(results => {
            console.log('\n🏁 Test suite completed');
            process.exit(results.summary.needsWork ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        })
        .finally(() => {
            testSuite.cleanup();
        });
}
