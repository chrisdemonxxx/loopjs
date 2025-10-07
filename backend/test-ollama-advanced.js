const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');
const OllamaCommandOrchestrator = require('./services/ollamaCommandOrchestrator');
const OllamaPowerShellGenerator = require('./services/ollamaPowerShellGenerator');
const OllamaCommandParser = require('./services/ollamaCommandParser');
const OllamaCommandValidator = require('./services/ollamaCommandValidator');
const CommandQueueManager = require('./services/commandQueueManager');
const ResultAggregator = require('./services/resultAggregator');
const OllamaPrompts = require('./prompts/ollamaPrompts');

/**
 * Comprehensive Test Suite for Advanced Ollama Features
 * Tests all advanced capabilities including multi-command handling, script generation, and orchestration
 */
class OllamaAdvancedTestSuite {
    constructor() {
        this.processor = new OllamaAICommandProcessor();
        this.orchestrator = new OllamaCommandOrchestrator();
        this.scriptGenerator = new OllamaPowerShellGenerator();
        this.commandParser = new OllamaCommandParser();
        this.commandValidator = new OllamaCommandValidator();
        this.queueManager = new CommandQueueManager();
        this.resultAggregator = new ResultAggregator();
        this.prompts = new OllamaPrompts();
        
        this.testResults = [];
        this.testStartTime = null;
        this.testEndTime = null;
    }

    /**
     * Run all advanced tests
     */
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Ollama Advanced Test Suite');
        console.log('==================================================');
        
        this.testStartTime = new Date();
        
        const testSuites = [
            { name: 'Basic Integration Tests', method: this.runBasicIntegrationTests },
            { name: 'Multi-Command Orchestration Tests', method: this.runOrchestrationTests },
            { name: 'Script Generation Tests', method: this.runScriptGenerationTests },
            { name: 'Command Parsing Tests', method: this.runCommandParsingTests },
            { name: 'Command Validation Tests', method: this.runValidationTests },
            { name: 'Queue Management Tests', method: this.runQueueManagementTests },
            { name: 'Result Aggregation Tests', method: this.runResultAggregationTests },
            { name: 'Specialized Prompt Tests', method: this.runPromptTests },
            { name: 'Template System Tests', method: this.runTemplateTests },
            { name: 'Performance Tests', method: this.runPerformanceTests },
            { name: 'Error Handling Tests', method: this.runErrorHandlingTests },
            { name: 'End-to-End Integration Tests', method: this.runEndToEndTests }
        ];

        for (const suite of testSuites) {
            console.log(`\n📋 Running ${suite.name}...`);
            try {
                const results = await suite.method.call(this);
                this.testResults.push({
                    suite: suite.name,
                    results: results,
                    success: results.every(test => test.success),
                    timestamp: new Date().toISOString()
                });
                console.log(`✅ ${suite.name} completed: ${results.filter(r => r.success).length}/${results.length} tests passed`);
            } catch (error) {
                console.error(`❌ ${suite.name} failed:`, error.message);
                this.testResults.push({
                    suite: suite.name,
                    results: [],
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.testEndTime = new Date();
        this.generateTestReport();
        
        return this.testResults;
    }

    /**
     * Basic integration tests
     */
    async runBasicIntegrationTests() {
        const tests = [
            {
                name: 'Ollama Connection Test',
                test: async () => {
                    const isConnected = await this.processor.testConnection();
                    return { success: isConnected, result: isConnected ? 'Connected' : 'Not connected' };
                }
            },
            {
                name: 'Model Availability Test',
                test: async () => {
                    const stats = this.processor.getAIStatistics();
                    return { success: stats.modelsAvailable > 0, result: `${stats.modelsAvailable} models available` };
                }
            },
            {
                name: 'Basic Command Processing Test',
                test: async () => {
                    const result = await this.processor.processCommandWithAI(
                        'Get-Process | Select-Object Name, CPU',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'general', action: 'execute' }
                    );
                    return { success: result.success, result: result.success ? 'Command processed' : result.error };
                }
            },
            {
                name: 'Advanced Statistics Test',
                test: async () => {
                    const stats = this.processor.getAdvancedStatistics();
                    return { success: stats.basic.available, result: 'Advanced statistics available' };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Multi-command orchestration tests
     */
    async runOrchestrationTests() {
        const tests = [
            {
                name: 'Simple Multi-Command Test',
                test: async () => {
                    const result = await this.orchestrator.parseComplexCommand(
                        'download chrome, install it silently, then open it',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'automation' }
                    );
                    return { success: result.success, result: result.success ? `${result.totalSteps} steps parsed` : result.error };
                }
            },
            {
                name: 'Sequential Script Generation Test',
                test: async () => {
                    const parseResult = await this.orchestrator.parseComplexCommand(
                        'check disk space, then clean temp files, then restart service',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'maintenance' }
                    );
                    
                    if (!parseResult.success) {
                        return { success: false, result: parseResult.error };
                    }
                    
                    const scriptResult = await this.orchestrator.generateSequentialScript(parseResult.chainId);
                    return { success: scriptResult.success, result: scriptResult.success ? 'Script generated' : scriptResult.error };
                }
            },
            {
                name: 'Dependency Graph Test',
                test: async () => {
                    const parseResult = await this.orchestrator.parseComplexCommand(
                        'backup files, then compress backup, then verify backup',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'backup' }
                    );
                    
                    if (!parseResult.success) {
                        return { success: false, result: parseResult.error };
                    }
                    
                    const dependencies = parseResult.dependencies;
                    return { success: Object.keys(dependencies).length > 0, result: `${Object.keys(dependencies).length} dependencies mapped` };
                }
            },
            {
                name: 'Orchestrator Statistics Test',
                test: async () => {
                    const stats = this.orchestrator.getStatistics();
                    return { success: stats.activeChains >= 0, result: `${stats.activeChains} active chains` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Script generation tests
     */
    async runScriptGenerationTests() {
        const tests = [
            {
                name: 'Basic Script Generation Test',
                test: async () => {
                    const steps = [
                        { action: 'test', description: 'Test step', command: 'Write-Host "Test"' },
                        { action: 'verify', description: 'Verify step', command: 'Write-Host "Verified"' }
                    ];
                    
                    const result = await this.scriptGenerator.generateScript(steps, {
                        template: 'custom',
                        logLevel: 'INFO'
                    });
                    
                    return { success: result.success, result: result.success ? 'Script generated' : result.error };
                }
            },
            {
                name: 'Template Script Generation Test',
                test: async () => {
                    const result = await this.scriptGenerator.generateFromTemplate(
                        'software_installation',
                        {
                            downloadUrl: 'https://example.com/test.exe',
                            installerName: 'test.exe',
                            installArgs: '/S'
                        },
                        { logLevel: 'INFO' }
                    );
                    
                    return { success: result.success, result: result.success ? 'Template script generated' : result.error };
                }
            },
            {
                name: 'Script Validation Test',
                test: async () => {
                    const steps = [
                        { action: 'safe_command', description: 'Safe command', command: 'Get-Process' }
                    ];
                    
                    const scriptResult = await this.scriptGenerator.generateScript(steps);
                    
                    if (!scriptResult.success) {
                        return { success: false, result: scriptResult.error };
                    }
                    
                    const validationResult = await this.commandValidator.validateCommand(scriptResult.script);
                    return { success: validationResult.success, result: validationResult.success ? 'Script validated' : validationResult.error };
                }
            },
            {
                name: 'Script Generator Statistics Test',
                test: async () => {
                    const stats = this.scriptGenerator.getStatistics();
                    return { success: stats.templatesAvailable > 0, result: `${stats.templatesAvailable} templates available` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Command parsing tests
     */
    async runCommandParsingTests() {
        const tests = [
            {
                name: 'Intent Extraction Test',
                test: async () => {
                    const result = await this.commandParser.extractIntent(
                        'I need to backup all PDF files from the Documents folder',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'backup' }
                    );
                    
                    return { success: result.success, result: result.success ? `Intent: ${result.intent.action}` : result.error };
                }
            },
            {
                name: 'Parameter Identification Test',
                test: async () => {
                    const intent = { action: 'backup_files', category: 'backup' };
                    const result = await this.commandParser.identifyParameters(
                        'backup all PDF files from C:\\Documents to D:\\Backup',
                        intent,
                        { category: 'backup' }
                    );
                    
                    return { success: result.success, result: result.success ? 'Parameters identified' : result.error };
                }
            },
            {
                name: 'Sequence Detection Test',
                test: async () => {
                    const intent = { action: 'multi_step', category: 'automation' };
                    const result = await this.commandParser.detectSequences(
                        'first download the file, then install it, then configure it',
                        intent,
                        { category: 'automation' }
                    );
                    
                    return { success: result.success, result: result.success ? 'Sequences detected' : result.error };
                }
            },
            {
                name: 'Complex Input Parsing Test',
                test: async () => {
                    const result = await this.commandParser.parseComplexInput(
                        'download chrome installer, verify the download, install it silently, then open google.com',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'automation' }
                    );
                    
                    return { success: result.success, result: result.success ? `Complexity: ${result.complexity}` : result.error };
                }
            },
            {
                name: 'Parser Statistics Test',
                test: async () => {
                    const stats = this.commandParser.getStatistics();
                    return { success: stats.patternsLoaded > 0, result: `${stats.patternsLoaded} patterns loaded` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Command validation tests
     */
    async runValidationTests() {
        const tests = [
            {
                name: 'Safe Command Validation Test',
                test: async () => {
                    const result = await this.commandValidator.validateCommand(
                        'Get-Process | Select-Object Name, CPU',
                        { category: 'diagnostics' }
                    );
                    
                    return { success: result.success, result: result.success ? `Safety: ${result.validation.overall.level}` : result.error };
                }
            },
            {
                name: 'Dangerous Command Detection Test',
                test: async () => {
                    const result = await this.commandValidator.validateCommand(
                        'Format-Volume -DriveLetter C -Force',
                        { category: 'system' }
                    );
                    
                    return { 
                        success: result.success && result.validation.destructive.detected, 
                        result: result.validation.destructive.detected ? 'Dangerous operation detected' : 'Dangerous operation not detected'
                    };
                }
            },
            {
                name: 'Syntax Validation Test',
                test: async () => {
                    const result = await this.commandValidator.validateCommand(
                        'Get-Process | Select-Object Name CPU', // Missing comma
                        { category: 'general' }
                    );
                    
                    return { success: result.success, result: result.success ? 'Syntax validated' : result.error };
                }
            },
            {
                name: 'Permission Check Test',
                test: async () => {
                    const result = await this.commandValidator.validateCommand(
                        'New-LocalUser -Name TestUser -Password (ConvertTo-SecureString "Test123!" -AsPlainText -Force)',
                        { category: 'administration' }
                    );
                    
                    return { 
                        success: result.success, 
                        result: result.validation.permissions.elevated ? 'Admin permissions required' : 'No admin permissions required'
                    };
                }
            },
            {
                name: 'Validator Statistics Test',
                test: async () => {
                    const stats = this.commandValidator.getStatistics();
                    return { success: stats.totalValidations >= 0, result: `${stats.totalValidations} validations performed` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Queue management tests
     */
    async runQueueManagementTests() {
        const tests = [
            {
                name: 'Queue Creation Test',
                test: async () => {
                    const commands = [
                        { id: 'cmd1', action: 'test1', command: 'Write-Host "Test 1"' },
                        { id: 'cmd2', action: 'test2', command: 'Write-Host "Test 2"', dependsOn: ['cmd1'] }
                    ];
                    
                    const result = await this.queueManager.createQueue('test_queue_1', commands, {
                        maxConcurrent: 1,
                        priority: 'normal'
                    });
                    
                    return { success: result.success, result: result.success ? 'Queue created' : result.error };
                }
            },
            {
                name: 'Queue Execution Test',
                test: async () => {
                    const commands = [
                        { id: 'cmd1', action: 'test1', command: 'Write-Host "Test 1"' }
                    ];
                    
                    const createResult = await this.queueManager.createQueue('test_queue_2', commands);
                    
                    if (!createResult.success) {
                        return { success: false, result: createResult.error };
                    }
                    
                    const executeResult = await this.queueManager.executeQueue(createResult.queueId, { platform: 'Win32NT' });
                    return { success: executeResult.success, result: executeResult.success ? 'Queue executed' : executeResult.error };
                }
            },
            {
                name: 'Queue Status Test',
                test: async () => {
                    const commands = [
                        { id: 'cmd1', action: 'test1', command: 'Write-Host "Test 1"' }
                    ];
                    
                    const createResult = await this.queueManager.createQueue('test_queue_3', commands);
                    
                    if (!createResult.success) {
                        return { success: false, result: createResult.error };
                    }
                    
                    const statusResult = this.queueManager.getQueueStatus(createResult.queueId);
                    return { success: statusResult.success, result: statusResult.success ? `Status: ${statusResult.status}` : statusResult.error };
                }
            },
            {
                name: 'Queue Management Statistics Test',
                test: async () => {
                    const stats = this.queueManager.getStatistics();
                    return { success: stats.totalQueues >= 0, result: `${stats.totalQueues} queues managed` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Result aggregation tests
     */
    async runResultAggregationTests() {
        const tests = [
            {
                name: 'Result Collection Test',
                test: async () => {
                    const commandResults = [
                        { success: true, executionTime: 1000, output: 'Command 1 completed' },
                        { success: true, executionTime: 1500, output: 'Command 2 completed' },
                        { success: false, executionTime: 500, error: 'Command 3 failed' }
                    ];
                    
                    const result = await this.resultAggregator.collectResults('test_execution_1', commandResults, {
                        executionType: 'test'
                    });
                    
                    return { success: result.success, result: result.success ? 'Results collected' : result.error };
                }
            },
            {
                name: 'Pattern Detection Test',
                test: async () => {
                    const commandResults = [
                        { success: true, executionTime: 1000, output: 'Success message' },
                        { success: true, executionTime: 1200, output: 'Another success' },
                        { success: true, executionTime: 1100, output: 'Third success' }
                    ];
                    
                    const result = await this.resultAggregator.collectResults('test_execution_2', commandResults);
                    
                    if (!result.success) {
                        return { success: false, result: result.error };
                    }
                    
                    const aggregatedResult = this.resultAggregator.getAggregatedResult('test_execution_2');
                    const hasPatterns = aggregatedResult && aggregatedResult.patterns && Object.keys(aggregatedResult.patterns).length > 0;
                    
                    return { success: hasPatterns, result: hasPatterns ? 'Patterns detected' : 'No patterns detected' };
                }
            },
            {
                name: 'Anomaly Detection Test',
                test: async () => {
                    const commandResults = [
                        { success: true, executionTime: 1000, output: 'Normal execution' },
                        { success: true, executionTime: 10000, output: 'Very slow execution' }, // Anomaly
                        { success: true, executionTime: 1200, output: 'Normal execution' }
                    ];
                    
                    const result = await this.resultAggregator.collectResults('test_execution_3', commandResults);
                    
                    if (!result.success) {
                        return { success: false, result: result.error };
                    }
                    
                    const aggregatedResult = this.resultAggregator.getAggregatedResult('test_execution_3');
                    const hasAnomalies = aggregatedResult && aggregatedResult.anomalies && aggregatedResult.anomalies.length > 0;
                    
                    return { success: hasAnomalies, result: hasAnomalies ? 'Anomalies detected' : 'No anomalies detected' };
                }
            },
            {
                name: 'Result Aggregator Statistics Test',
                test: async () => {
                    const stats = this.resultAggregator.getStatistics();
                    return { success: stats.totalExecutions >= 0, result: `${stats.totalExecutions} executions processed` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Specialized prompt tests
     */
    async runPromptTests() {
        const tests = [
            {
                name: 'Default Prompt Test',
                test: async () => {
                    const prompt = this.prompts.getPrompt('default', { clientInfo: 'test' });
                    return { success: prompt.length > 0, result: `Prompt length: ${prompt.length} characters` };
                }
            },
            {
                name: 'Pentest Prompt Test',
                test: async () => {
                    const prompt = this.prompts.getPrompt('pentest', { 
                        clientInfo: 'test',
                        targetEnvironment: 'Windows 10'
                    });
                    return { success: prompt.includes('penetration tester'), result: 'Pentest prompt generated' };
                }
            },
            {
                name: 'Automation Prompt Test',
                test: async () => {
                    const prompt = this.prompts.getPrompt('automation', { 
                        clientInfo: 'test',
                        scope: 'system-wide'
                    });
                    return { success: prompt.includes('automation'), result: 'Automation prompt generated' };
                }
            },
            {
                name: 'Model-Specific Prompt Test',
                test: async () => {
                    const prompt = this.prompts.getModelSpecificPrompt('qwen2.5-coder:1.5b', 'default', { clientInfo: 'test' });
                    return { success: prompt.includes('code generation'), result: 'Model-specific prompt generated' };
                }
            },
            {
                name: 'Prompt Statistics Test',
                test: async () => {
                    const stats = this.prompts.getStatistics();
                    return { success: stats.totalPrompts > 0, result: `${stats.totalPrompts} prompts available` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Template system tests
     */
    async runTemplateTests() {
        const tests = [
            {
                name: 'Template Loading Test',
                test: async () => {
                    const templates = this.processor.getAvailableTemplates();
                    return { success: Object.keys(templates).length > 0, result: `${Object.keys(templates).length} templates loaded` };
                }
            },
            {
                name: 'Software Installation Template Test',
                test: async () => {
                    const result = await this.processor.generateScriptFromTemplate(
                        'software_installation',
                        {
                            downloadUrl: 'https://example.com/test.exe',
                            installerName: 'test.exe',
                            installArgs: '/S'
                        }
                    );
                    
                    return { success: result.success, result: result.success ? 'Template script generated' : result.error };
                }
            },
            {
                name: 'System Diagnostics Template Test',
                test: async () => {
                    const result = await this.processor.generateScriptFromTemplate(
                        'system_diagnostics',
                        {
                            reportPath: 'C:\\temp\\test_report.txt',
                            includeEventLogs: true
                        }
                    );
                    
                    return { success: result.success, result: result.success ? 'Diagnostics template generated' : result.error };
                }
            },
            {
                name: 'Template Validation Test',
                test: async () => {
                    const result = await this.processor.generateScriptFromTemplate(
                        'security_audit',
                        {
                            reportPath: 'C:\\temp\\security_report.txt'
                        }
                    );
                    
                    if (!result.success) {
                        return { success: false, result: result.error };
                    }
                    
                    const validationResult = await this.processor.validateCommand(result.data.script);
                    return { success: validationResult.success, result: validationResult.success ? 'Template validated' : validationResult.error };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Performance tests
     */
    async runPerformanceTests() {
        const tests = [
            {
                name: 'Command Processing Speed Test',
                test: async () => {
                    const startTime = Date.now();
                    
                    const result = await this.processor.processCommandWithAI(
                        'Get-Process | Select-Object Name',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'general', action: 'execute' }
                    );
                    
                    const endTime = Date.now();
                    const processingTime = endTime - startTime;
                    
                    return { 
                        success: result.success && processingTime < 5000, 
                        result: `Processing time: ${processingTime}ms` 
                    };
                }
            },
            {
                name: 'Script Generation Speed Test',
                test: async () => {
                    const startTime = Date.now();
                    
                    const steps = [
                        { action: 'test1', description: 'Test 1', command: 'Write-Host "Test 1"' },
                        { action: 'test2', description: 'Test 2', command: 'Write-Host "Test 2"' },
                        { action: 'test3', description: 'Test 3', command: 'Write-Host "Test 3"' }
                    ];
                    
                    const result = await this.scriptGenerator.generateScript(steps);
                    
                    const endTime = Date.now();
                    const generationTime = endTime - startTime;
                    
                    return { 
                        success: result.success && generationTime < 2000, 
                        result: `Generation time: ${generationTime}ms` 
                    };
                }
            },
            {
                name: 'Validation Speed Test',
                test: async () => {
                    const startTime = Date.now();
                    
                    const result = await this.commandValidator.validateCommand(
                        'Get-Process | Select-Object Name, CPU, WorkingSet',
                        { category: 'diagnostics' }
                    );
                    
                    const endTime = Date.now();
                    const validationTime = endTime - startTime;
                    
                    return { 
                        success: result.success && validationTime < 1000, 
                        result: `Validation time: ${validationTime}ms` 
                    };
                }
            },
            {
                name: 'Memory Usage Test',
                test: async () => {
                    const initialMemory = process.memoryUsage();
                    
                    // Perform multiple operations
                    for (let i = 0; i < 10; i++) {
                        await this.processor.processCommandWithAI(
                            `Write-Host "Test ${i}"`,
                            { platform: 'Win32NT 10.0.26100.0' },
                            { category: 'general', action: 'execute' }
                        );
                    }
                    
                    const finalMemory = process.memoryUsage();
                    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
                    
                    return { 
                        success: memoryIncrease < 50 * 1024 * 1024, // Less than 50MB increase
                        result: `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB` 
                    };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Error handling tests
     */
    async runErrorHandlingTests() {
        const tests = [
            {
                name: 'Invalid Command Handling Test',
                test: async () => {
                    const result = await this.processor.processCommandWithAI(
                        'Invalid-PowerShell-Command-That-Does-Not-Exist',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'general', action: 'execute' }
                    );
                    
                    return { success: result.success !== undefined, result: 'Error handled gracefully' };
                }
            },
            {
                name: 'Empty Input Handling Test',
                test: async () => {
                    const result = await this.commandParser.parseComplexInput('', { platform: 'Win32NT' });
                    return { success: result.success !== undefined, result: 'Empty input handled' };
                }
            },
            {
                name: 'Malformed JSON Handling Test',
                test: async () => {
                    // This should trigger JSON parsing error in parser
                    const result = await this.commandParser.parseAIResponse('Invalid JSON response');
                    return { success: Array.isArray(result), result: 'Malformed JSON handled' };
                }
            },
            {
                name: 'Network Error Simulation Test',
                test: async () => {
                    // Test with invalid Ollama URL to simulate network error
                    const originalAPI = this.processor.ollamaAPI;
                    this.processor.ollamaAPI = 'http://invalid-url:9999/api/generate';
                    
                    const result = await this.processor.processCommandWithAI(
                        'Write-Host "Test"',
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'general', action: 'execute' }
                    );
                    
                    // Restore original API
                    this.processor.ollamaAPI = originalAPI;
                    
                    return { success: result.success !== undefined, result: 'Network error handled' };
                }
            },
            {
                name: 'Timeout Handling Test',
                test: async () => {
                    const result = await this.processor.processCommandWithAI(
                        'Start-Sleep -Seconds 10', // Long running command
                        { platform: 'Win32NT 10.0.26100.0' },
                        { category: 'general', action: 'execute', timeout: 1000 } // 1 second timeout
                    );
                    
                    return { success: result.success !== undefined, result: 'Timeout handled' };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * End-to-end integration tests
     */
    async runEndToEndTests() {
        const tests = [
            {
                name: 'Complete Workflow Test',
                test: async () => {
                    // Test complete workflow: parse -> orchestrate -> generate -> validate -> execute
                    const userInput = 'download chrome, install it silently, then open google.com';
                    
                    // Step 1: Parse complex input
                    const parseResult = await this.commandParser.parseComplexInput(userInput, { platform: 'Win32NT' });
                    if (!parseResult.success) {
                        return { success: false, result: 'Parse failed: ' + parseResult.error };
                    }
                    
                    // Step 2: Create orchestration
                    const orchestrateResult = await this.orchestrator.parseComplexCommand(userInput, { platform: 'Win32NT' });
                    if (!orchestrateResult.success) {
                        return { success: false, result: 'Orchestration failed: ' + orchestrateResult.error };
                    }
                    
                    // Step 3: Generate script
                    const scriptResult = await this.orchestrator.generateSequentialScript(orchestrateResult.chainId);
                    if (!scriptResult.success) {
                        return { success: false, result: 'Script generation failed: ' + scriptResult.error };
                    }
                    
                    // Step 4: Validate script
                    const validationResult = await this.commandValidator.validateCommand(scriptResult.script);
                    if (!validationResult.success) {
                        return { success: false, result: 'Validation failed: ' + validationResult.error };
                    }
                    
                    return { success: true, result: 'Complete workflow successful' };
                }
            },
            {
                name: 'Template to Execution Test',
                test: async () => {
                    // Test template -> script -> validation -> queue -> execution
                    const templateResult = await this.processor.generateScriptFromTemplate(
                        'software_installation',
                        {
                            downloadUrl: 'https://example.com/test.exe',
                            installerName: 'test.exe',
                            installArgs: '/S'
                        }
                    );
                    
                    if (!templateResult.success) {
                        return { success: false, result: 'Template generation failed: ' + templateResult.error };
                    }
                    
                    // Create queue with generated script
                    const commands = [
                        { id: 'install', action: 'install', command: templateResult.data.script }
                    ];
                    
                    const queueResult = await this.queueManager.createQueue('template_test_queue', commands);
                    if (!queueResult.success) {
                        return { success: false, result: 'Queue creation failed: ' + queueResult.error };
                    }
                    
                    return { success: true, result: 'Template to execution successful' };
                }
            },
            {
                name: 'Learning Integration Test',
                test: async () => {
                    // Test learning from execution results
                    const command = 'Write-Host "Learning test"';
                    const result = { success: true, output: 'Command executed successfully' };
                    const executionTime = 1000;
                    
                    const learnResult = await this.processor.learnFromExecution(command, result, executionTime, { category: 'test' });
                    if (!learnResult.success) {
                        return { success: false, result: 'Learning failed: ' + learnResult.error };
                    }
                    
                    // Check if learning data was stored
                    const stats = this.processor.getAdvancedStatistics();
                    const hasLearningData = stats.learningData.totalEntries > 0;
                    
                    return { success: hasLearningData, result: 'Learning integration successful' };
                }
            },
            {
                name: 'Multi-Model Selection Test',
                test: async () => {
                    // Test different models for different task types
                    const taskTypes = ['pentest', 'automation', 'diagnostics', 'security'];
                    let successCount = 0;
                    
                    for (const taskType of taskTypes) {
                        const result = await this.processor.processWithSpecializedPrompt(
                            'Test command',
                            taskType,
                            { platform: 'Win32NT' }
                        );
                        
                        if (result.success) {
                            successCount++;
                        }
                    }
                    
                    return { success: successCount === taskTypes.length, result: `${successCount}/${taskTypes.length} models worked` };
                }
            }
        ];

        return await this.runTestBatch(tests);
    }

    /**
     * Run a batch of tests
     */
    async runTestBatch(tests) {
        const results = [];
        
        for (const test of tests) {
            try {
                const startTime = Date.now();
                const result = await test.test();
                const endTime = Date.now();
                
                results.push({
                    name: test.name,
                    success: result.success,
                    result: result.result,
                    executionTime: endTime - startTime,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`  ${result.success ? '✅' : '❌'} ${test.name}: ${result.result}`);
                
            } catch (error) {
                results.push({
                    name: test.name,
                    success: false,
                    result: error.message,
                    executionTime: 0,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`  ❌ ${test.name}: ${error.message}`);
            }
        }
        
        return results;
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const totalTests = this.testResults.reduce((sum, suite) => sum + suite.results.length, 0);
        const passedTests = this.testResults.reduce((sum, suite) => 
            sum + suite.results.filter(test => test.success).length, 0
        );
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        const totalExecutionTime = this.testEndTime - this.testStartTime;
        
        console.log('\n📊 COMPREHENSIVE TEST REPORT');
        console.log('============================');
        console.log(`Total Test Suites: ${this.testResults.length}`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed Tests: ${passedTests}`);
        console.log(`Failed Tests: ${failedTests}`);
        console.log(`Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`Total Execution Time: ${totalExecutionTime}ms`);
        console.log(`Average Test Time: ${totalTests > 0 ? (totalExecutionTime / totalTests).toFixed(2) : 0}ms`);
        
        console.log('\n📋 Test Suite Results:');
        for (const suite of this.testResults) {
            const suitePassed = suite.results.filter(test => test.success).length;
            const suiteTotal = suite.results.length;
            const suiteSuccessRate = suiteTotal > 0 ? (suitePassed / suiteTotal) * 100 : 0;
            
            console.log(`  ${suite.success ? '✅' : '❌'} ${suite.suite}: ${suitePassed}/${suiteTotal} (${suiteSuccessRate.toFixed(1)}%)`);
            
            if (!suite.success && suite.error) {
                console.log(`    Error: ${suite.error}`);
            }
        }
        
        // Save detailed report to file
        const detailedReport = {
            summary: {
                totalTestSuites: this.testResults.length,
                totalTests: totalTests,
                passedTests: passedTests,
                failedTests: failedTests,
                successRate: successRate,
                totalExecutionTime: totalExecutionTime,
                averageTestTime: totalTests > 0 ? totalExecutionTime / totalTests : 0,
                testStartTime: this.testStartTime,
                testEndTime: this.testEndTime
            },
            testSuites: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        const fs = require('fs');
        const reportPath = `ollama-advanced-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return detailedReport;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new OllamaAdvancedTestSuite();
    testSuite.runAllTests().then(results => {
        console.log('\n🎉 Test suite completed!');
        process.exit(results.every(suite => suite.success) ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = OllamaAdvancedTestSuite;
