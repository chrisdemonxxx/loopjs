const express = require('express');
const router = express.Router();
const AICommandProcessor = require('../services/aiCommandProcessor');
const TrueAICommandProcessor = require('../services/trueAICommandProcessor');
const GeminiAICommandProcessor = require('../services/geminiAICommandProcessor');
const HuggingFaceAICommandProcessor = require('../services/huggingFaceAICommandProcessor');
const OllamaAICommandProcessor = require('../services/ollamaAICommandProcessor');
const SmartErrorHandler = require('../services/smartErrorHandler');
const CommandOptimizer = require('../services/commandOptimizer');

// Initialize AI Services
const aiProcessor = new AICommandProcessor();
const trueAIProcessor = new TrueAICommandProcessor();
const geminiAIProcessor = new GeminiAICommandProcessor();
const huggingFaceAIProcessor = new HuggingFaceAICommandProcessor();
const ollamaAIProcessor = new OllamaAICommandProcessor();
const errorHandler = new SmartErrorHandler();
const commandOptimizer = new CommandOptimizer();

// Check AI availability
const isOpenAIAvailable = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
const isGeminiAvailable = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
const isHuggingFaceAvailable = process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your-huggingface-api-key-here';
let isOllamaAvailable = false;

// Initialize Ollama availability check
(async () => {
    try {
        isOllamaAvailable = await ollamaAIProcessor.testConnection();
        console.log(`[AI API] Ollama availability: ${isOllamaAvailable}`);
    } catch (error) {
        console.log('[AI API] Ollama initialization failed:', error.message);
        isOllamaAvailable = false;
    }
})();

// Determine primary AI provider (prioritize local/free options)
const getPrimaryAI = () => {
    if (isOllamaAvailable) return 'ollama';  // LOCAL, FREE, FAST - HIGHEST PRIORITY
    if (isHuggingFaceAvailable) return 'huggingface';
    if (isGeminiAvailable) return 'gemini';
    if (isOpenAIAvailable) return 'openai';
    return 'rule-based';
};

/**
 * POST /api/ai/process-command
 * Process a command using the best available AI provider
 */
router.post('/process-command', async (req, res) => {
    try {
        const { category, action, params, clientInfo, userInput } = req.body;
        
        console.log('[AI API] Processing command:', { category, action, params, userInput });
        
        const primaryAI = getPrimaryAI();
        console.log('[AI API] Using AI provider:', primaryAI);
        
        // Handle natural language processing
        if (category === 'natural_language' && userInput) {
            let result;
            
            if (isOllamaAvailable) {
                console.log('[AI API] Using Ollama AI for natural language processing');
                result = await ollamaAIProcessor.processCommandWithAI(
                    userInput, 
                    clientInfo || {}, 
                    { category, action, params }
                );
            } else if (isHuggingFaceAvailable) {
                console.log('[AI API] Using Hugging Face AI for natural language processing');
                result = await huggingFaceAIProcessor.processCommandWithAI(
                    userInput, 
                    clientInfo || {}, 
                    { category, action, params }
                );
            } else if (isGeminiAvailable) {
                console.log('[AI API] Using Gemini AI for natural language processing');
                result = await geminiAIProcessor.processCommandWithAI(
                    userInput, 
                    clientInfo || {}, 
                    { category, action, params }
                );
            } else if (isOpenAIAvailable) {
                console.log('[AI API] Using OpenAI for natural language processing');
                result = await trueAIProcessor.processCommandWithAI(
                    userInput, 
                    clientInfo || {}, 
                    { category, action, params }
                );
            }
            
            if (result) {
                res.json(result);
                return;
            }
        }
        
        // Handle power command optimization
        if (category === 'power_command' && action === 'optimize') {
            console.log('[AI API] Processing power command optimization');
            
            let result;
            
            // Try Hugging Face AI first for power command optimization
            if (isHuggingFaceAvailable) {
                console.log('[AI API] Using Hugging Face AI for power command optimization');
                try {
                    result = await huggingFaceAIProcessor.processCommandWithAI(
                        `Optimize this power command: ${params.originalCommand} for ${params.commandName} in ${params.commandType} category`,
                        clientInfo || {},
                        { category, action, ...params }
                    );
                } catch (error) {
                    console.log('[AI API] Hugging Face failed, falling back to rule-based:', error.message);
                }
            }
            
            // Fallback to rule-based AI if Hugging Face fails or is unavailable
            if (!result) {
                console.log('[AI API] Using rule-based AI for power command optimization');
                result = await aiProcessor.processCommand(
                    { category, action, ...params },
                    clientInfo || {}
                );
            }
            
            if (result) {
                res.json(result);
                return;
            }
        }
        
        // Fallback to rule-based AI
        console.log('[AI API] Using rule-based AI (fallback)');
        
        if (!category || !action) {
            return res.status(400).json({
                success: false,
                error: 'Category and action are required for rule-based processing'
            });
        }
        
        // Process command with rule-based AI
        const result = await aiProcessor.processCommand(
            { category, action, ...params },
            clientInfo || {}
        );
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('[AI API] Error processing command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/handle-error
 * Handle command errors with True AI or fallback to rule-based AI
 */
router.post('/handle-error', async (req, res) => {
    try {
        const { error, originalCommand, clientInfo, retryCount } = req.body;
        
        console.log('[AI API] Handling error:', { error: error.message, retryCount });
        
        if (!error || !originalCommand) {
            return res.status(400).json({
                success: false,
                error: 'Error and originalCommand are required'
            });
        }
        
        // Create error object
        const errorObj = new Error(error.message || error);
        
        // If OpenAI is available, use True AI for error handling
        if (isOpenAIAvailable) {
            console.log('[AI API] Using True AI for error handling');
            
            const result = await trueAIProcessor.handleErrorWithAI(
                errorObj,
                originalCommand,
                clientInfo || {},
                retryCount || 0
            );
            
            res.json(result);
            return;
        }
        
        // Fallback to rule-based error handling
        console.log('[AI API] Using rule-based error handling');
        
        const retryCommand = await errorHandler.handleError(
            errorObj,
            originalCommand,
            clientInfo || {},
            retryCount || 0
        );
        
        if (retryCommand) {
            res.json({
                success: true,
                data: {
                    retryCommand: retryCommand,
                    shouldRetry: true,
                    fixApplied: retryCommand.fixApplied,
                    errorReason: retryCommand.errorReason,
                    aiType: 'rule-based'
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    shouldRetry: false,
                    message: 'No retry strategy available',
                    aiType: 'rule-based'
                }
            });
        }
        
    } catch (error) {
        console.error('[AI API] Error handling error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/optimize-command
 * Optimize a command for better performance
 */
router.post('/optimize-command', async (req, res) => {
    try {
        const { command, clientInfo } = req.body;
        
        console.log('[AI API] Optimizing command:', command);
        
        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'Command is required'
            });
        }
        
        // Optimize command
        const optimizedCommand = await commandOptimizer.optimizeCommand(command, clientInfo || {});
        
        res.json({
            success: true,
            data: {
                originalCommand: command,
                optimizedCommand: optimizedCommand,
                optimizationsApplied: commandOptimizer.countOptimizations(command.command, optimizedCommand.command)
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error optimizing command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/statistics
 * Get AI system statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const errorStats = errorHandler.getErrorStatistics();
        const optimizationStats = commandOptimizer.getOptimizationStatistics();
        const trueAIStats = isOpenAIAvailable ? trueAIProcessor.getAIStatistics() : null;
        const ollamaStats = ollamaAIProcessor.getAIStatistics();
        
        res.json({
            success: true,
            data: {
                errorStatistics: errorStats,
                optimizationStatistics: optimizationStats,
                trueAIStatistics: trueAIStats,
                ollamaStatistics: ollamaStats,
                openAIAvailable: isOpenAIAvailable,
                ollamaAvailable: isOllamaAvailable,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error getting statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/natural-language
 * Process natural language commands with intelligent agent system
 */
router.post('/natural-language', async (req, res) => {
    try {
        const { userInput, clientInfo, context, useIntelligentAgent = true } = req.body;
        
        console.log('[AI API] Processing natural language with intelligent agent:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'User input is required'
            });
        }
        
        const primaryAI = getPrimaryAI();
        
        if (primaryAI === 'rule-based') {
            return res.status(400).json({
                success: false,
                error: 'No AI provider configured. Please ensure Ollama is running or set HUGGINGFACE_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY environment variable.'
            });
        }
        
        let result;
        
        // Use intelligent agent system if enabled and Ollama is available
        if (useIntelligentAgent && primaryAI === 'ollama' && isOllamaAvailable) {
            console.log('[AI API] Using intelligent agent system');
            result = await ollamaAIProcessor.executeWithIntelligentFallback(
                userInput,
                clientInfo || {}
            );
        } else {
            // Fallback to traditional AI processing
            console.log(`[AI API] Using traditional AI processing with ${primaryAI}`);
            
            if (primaryAI === 'ollama') {
                result = await ollamaAIProcessor.processCommandWithAI(
                    userInput,
                    clientInfo || {},
                    context || {}
                );
            } else if (primaryAI === 'huggingface') {
                result = await huggingFaceAIProcessor.processCommandWithAI(
                    userInput,
                    clientInfo || {},
                    context || {}
                );
            } else if (primaryAI === 'gemini') {
                result = await geminiAIProcessor.processCommandWithAI(
                    userInput,
                    clientInfo || {},
                    context || {}
                );
            } else if (primaryAI === 'openai') {
                result = await trueAIProcessor.processCommandWithAI(
                    userInput,
                    clientInfo || {},
                    context || {}
                );
            }
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error processing natural language:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/test-connection
 * Test AI connection for all available providers
 */
router.get('/test-connection', async (req, res) => {
    try {
        const ruleBasedWorking = true; // Rule-based always works
        const ollamaWorking = await ollamaAIProcessor.testAIConnection();
        const openAIWorking = isOpenAIAvailable ? await trueAIProcessor.testAIConnection() : false;
        const geminiWorking = isGeminiAvailable ? await geminiAIProcessor.testAIConnection() : false;
        const huggingFaceWorking = isHuggingFaceAvailable ? await huggingFaceAIProcessor.testAIConnection() : false;
        
        const primaryAI = getPrimaryAI();
        
        res.json({
            success: true,
            data: {
                primaryAI: primaryAI,
                ruleBasedAI: ruleBasedWorking,
                ollama: {
                    available: ollamaWorking,
                    working: ollamaWorking,
                    models: ollamaAIProcessor.getAIStatistics().modelsAvailable,
                    primaryModel: ollamaAIProcessor.getAIStatistics().primaryModel
                },
                openAI: {
                    available: isOpenAIAvailable,
                    working: openAIWorking
                },
                gemini: {
                    available: isGeminiAvailable,
                    working: geminiWorking
                },
                huggingFace: {
                    available: isHuggingFaceAvailable,
                    working: huggingFaceWorking
                },
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error testing connection:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/command-templates
 * Get available command templates
 */
router.get('/command-templates', async (req, res) => {
    try {
        const templates = {
            download_exec: {
                name: 'Download & Execute',
                description: 'Download and optionally execute files',
                parameters: {
                    url: { type: 'string', required: true, description: 'File URL to download' },
                    savePath: { type: 'string', required: false, description: 'Local path to save file' },
                    execute: { type: 'boolean', required: false, description: 'Execute file after download' },
                    runAsAdmin: { type: 'boolean', required: false, description: 'Run as administrator' },
                    runHidden: { type: 'boolean', required: false, description: 'Run hidden' },
                    timeout: { type: 'number', required: false, description: 'Timeout in seconds' }
                },
                examples: [
                    {
                        name: 'Download PuTTY',
                        params: {
                            url: 'https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe',
                            savePath: 'C:\\temp\\putty.exe',
                            execute: true
                        }
                    }
                ]
            },
            system_info: {
                name: 'System Information',
                description: 'Get system information',
                parameters: {
                    action: { 
                        type: 'string', 
                        required: true, 
                        description: 'Type of system info',
                        options: ['computer', 'memory', 'cpu', 'disk', 'network', 'users', 'processes', 'services']
                    }
                },
                examples: [
                    { name: 'Get Computer Info', params: { action: 'computer' } },
                    { name: 'Get Memory Info', params: { action: 'memory' } },
                    { name: 'Get CPU Info', params: { action: 'cpu' } }
                ]
            },
            file_ops: {
                name: 'File Operations',
                description: 'Perform file operations',
                parameters: {
                    action: {
                        type: 'string',
                        required: true,
                        description: 'File operation type',
                        options: ['list_files', 'copy_file', 'delete_file', 'search_files']
                    },
                    sourcePath: { type: 'string', required: false, description: 'Source file path' },
                    destPath: { type: 'string', required: false, description: 'Destination file path' },
                    filePath: { type: 'string', required: false, description: 'File path for delete operation' },
                    searchPattern: { type: 'string', required: false, description: 'Search pattern for file search' }
                },
                examples: [
                    { name: 'List Files', params: { action: 'list_files', sourcePath: 'C:\\' } },
                    { name: 'Search Files', params: { action: 'search_files', sourcePath: 'C:\\', searchPattern: '*.txt' } }
                ]
            },
            network: {
                name: 'Network Operations',
                description: 'Perform network operations',
                parameters: {
                    action: {
                        type: 'string',
                        required: true,
                        description: 'Network operation type',
                        options: ['ping', 'port_scan', 'network_info']
                    },
                    target: { type: 'string', required: false, description: 'Target host or IP' },
                    port: { type: 'number', required: false, description: 'Port number for port scan' },
                    count: { type: 'number', required: false, description: 'Number of ping packets' }
                },
                examples: [
                    { name: 'Ping Google', params: { action: 'ping', target: 'google.com', count: 4 } },
                    { name: 'Port Scan', params: { action: 'port_scan', target: '192.168.1.1', port: 80 } }
                ]
            },
            security: {
                name: 'Security & Access',
                description: 'Check security settings',
                parameters: {
                    action: {
                        type: 'string',
                        required: true,
                        description: 'Security check type',
                        options: ['firewall_status', 'antivirus_status']
                    }
                },
                examples: [
                    { name: 'Check Firewall', params: { action: 'firewall_status' } },
                    { name: 'Check Antivirus', params: { action: 'antivirus_status' } }
                ]
            },
            system_mgmt: {
                name: 'System Management',
                description: 'Manage system services and processes',
                parameters: {
                    action: {
                        type: 'string',
                        required: true,
                        description: 'Management operation type',
                        options: ['restart_service', 'kill_process']
                    },
                    serviceName: { type: 'string', required: false, description: 'Service name to restart' },
                    processName: { type: 'string', required: false, description: 'Process name to kill' }
                },
                examples: [
                    { name: 'Restart Service', params: { action: 'restart_service', serviceName: 'Spooler' } },
                    { name: 'Kill Process', params: { action: 'kill_process', processName: 'notepad' } }
                ]
            }
        };
        
        res.json({
            success: true,
            data: {
                templates: templates,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error getting templates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/learn-from-result
 * Learn from command execution results
 */
router.post('/learn-from-result', async (req, res) => {
    try {
        const { commandId, success, error, clientInfo } = req.body;
        
        console.log('[AI API] Learning from result:', { commandId, success });
        
        if (!commandId || success === undefined) {
            return res.status(400).json({
                success: false,
                error: 'commandId and success are required'
            });
        }
        
        // Learn from result
        aiProcessor.learnFromResult(commandId, success, error, clientInfo || {});
        
        res.json({
            success: true,
            message: 'Learning data recorded successfully'
        });
        
    } catch (error) {
        console.error('[AI API] Error learning from result:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// ADVANCED OLLAMA FEATURES API ENDPOINTS
// ===========================================

/**
 * POST /api/ai/generate-script
 * Generate complete PowerShell script from template or custom steps
 */
router.post('/generate-script', async (req, res) => {
    try {
        const { templateName, parameters, steps, options = {} } = req.body;
        
        console.log('[AI API] Generating script:', { templateName, hasSteps: !!steps });
        
        let result;
        
        if (templateName) {
            // Generate from template
            result = await ollamaAIProcessor.generateScriptFromTemplate(templateName, parameters, options);
        } else if (steps && Array.isArray(steps)) {
            // Generate from custom steps
            const scriptGenerator = require('../services/ollamaPowerShellGenerator');
            const generator = new scriptGenerator();
            result = await generator.generateScript(steps, options);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Either templateName or steps array is required'
            });
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error generating script:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/parse-complex-command
 * Parse complex natural language command into structured steps
 */
router.post('/parse-complex-command', async (req, res) => {
    try {
        const { userInput, clientInfo, context = {} } = req.body;
        
        console.log('[AI API] Parsing complex command:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'userInput is required'
            });
        }
        
        const result = await ollamaAIProcessor.processComplexCommand(userInput, clientInfo || {}, context);
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error parsing complex command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/validate-command
 * Validate command before execution
 */
router.post('/validate-command', async (req, res) => {
    try {
        const { command, context = {} } = req.body;
        
        console.log('[AI API] Validating command:', command.substring(0, 100) + '...');
        
        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'command is required'
            });
        }
        
        const result = await ollamaAIProcessor.validateCommand(command, context);
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error validating command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/explain-command
 * Explain what a command does
 */
router.post('/explain-command', async (req, res) => {
    try {
        const { command, context = {} } = req.body;
        
        console.log('[AI API] Explaining command:', command.substring(0, 100) + '...');
        
        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'command is required'
            });
        }
        
        const result = await ollamaAIProcessor.processCommandWithAI(
            `Explain what this PowerShell command does: ${command}`,
            { platform: 'Win32NT 10.0.26100.0' },
            { category: 'explanation', action: 'explain' }
        );
        
        res.json({
            success: result.success,
            data: {
                command: command,
                explanation: result.data?.explanation || result.data?.command || 'Unable to explain command',
                aiModel: result.data?.aiModel || 'ollama',
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error explaining command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/command-templates
 * Get available command templates
 */
router.get('/command-templates', async (req, res) => {
    try {
        console.log('[AI API] Getting command templates');
        
        const templates = ollamaAIProcessor.getAvailableTemplates();
        
        res.json({
            success: true,
            data: {
                templates: templates,
                categories: Object.keys(templates).reduce((cats, templateName) => {
                    const template = templates[templateName];
                    if (!cats[template.category]) {
                        cats[template.category] = [];
                    }
                    cats[template.category].push(templateName);
                    return cats;
                }, {}),
                totalTemplates: Object.keys(templates).length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error getting command templates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/save-template
 * Save custom command template
 */
router.post('/save-template', async (req, res) => {
    try {
        const { templateName, template } = req.body;
        
        console.log('[AI API] Saving custom template:', templateName);
        
        if (!templateName || !template) {
            return res.status(400).json({
                success: false,
                error: 'templateName and template are required'
            });
        }
        
        // This would typically save to a database or file system
        // For now, we'll just validate the template structure
        if (!template.name || !template.steps || !Array.isArray(template.steps)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid template structure'
            });
        }
        
        res.json({
            success: true,
            message: 'Template saved successfully',
            templateName: templateName
        });
        
    } catch (error) {
        console.error('[AI API] Error saving template:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/learning-stats
 * Get learning system statistics
 */
router.get('/learning-stats', async (req, res) => {
    try {
        console.log('[AI API] Getting learning statistics');
        
        const stats = ollamaAIProcessor.getAdvancedStatistics();
        
        res.json({
            success: true,
            data: {
                learningData: stats.learningData,
                performanceMetrics: stats.performanceMetrics,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[AI API] Error getting learning stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/execute-queue
 * Execute a command queue
 */
router.post('/execute-queue', async (req, res) => {
    try {
        const { queueId, clientInfo } = req.body;
        
        console.log('[AI API] Executing command queue:', queueId);
        
        if (!queueId) {
            return res.status(400).json({
                success: false,
                error: 'queueId is required'
            });
        }
        
        const result = await ollamaAIProcessor.executeCommandQueue(queueId, clientInfo || {});
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error executing queue:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/queue-status/:queueId
 * Get status of a command queue
 */
router.get('/queue-status/:queueId', async (req, res) => {
    try {
        const { queueId } = req.params;
        
        console.log('[AI API] Getting queue status:', queueId);
        
        const result = ollamaAIProcessor.getQueueStatus(queueId);
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error getting queue status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/queues
 * Get all command queues
 */
router.get('/queues', async (req, res) => {
    try {
        console.log('[AI API] Getting all queues');
        
        const result = ollamaAIProcessor.getAllQueues();
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error getting queues:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/aggregated-results/:executionId
 * Get aggregated results for an execution
 */
router.get('/aggregated-results/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;
        
        console.log('[AI API] Getting aggregated results:', executionId);
        
        const result = ollamaAIProcessor.getAggregatedResults(executionId);
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error getting aggregated results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/specialized-prompt
 * Process command with specialized prompt
 */
router.post('/specialized-prompt', async (req, res) => {
    try {
        const { userInput, taskType, clientInfo, context = {} } = req.body;
        
        console.log('[AI API] Processing with specialized prompt:', taskType);
        
        if (!userInput || !taskType) {
            return res.status(400).json({
                success: false,
                error: 'userInput and taskType are required'
            });
        }
        
        const result = await ollamaAIProcessor.processWithSpecializedPrompt(
            userInput,
            taskType,
            clientInfo || {},
            context
        );
        
        res.json(result);
        
    } catch (error) {
        console.error('[AI API] Error processing with specialized prompt:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/advanced-statistics
 * Get comprehensive advanced statistics
 */
router.get('/advanced-statistics', async (req, res) => {
    try {
        console.log('[AI API] Getting advanced statistics');
        
        const stats = ollamaAIProcessor.getAdvancedStatistics();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error getting advanced statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/run-advanced-tests
 * Run comprehensive advanced test suite
 */
router.post('/run-advanced-tests', async (req, res) => {
    try {
        console.log('[AI API] Running advanced test suite');
        
        const OllamaAdvancedTestSuite = require('../test-ollama-advanced');
        const testSuite = new OllamaAdvancedTestSuite();
        
        // Run tests asynchronously
        testSuite.runAllTests().then(results => {
            console.log('[AI API] Advanced tests completed');
        }).catch(error => {
            console.error('[AI API] Advanced tests failed:', error);
        });
        
        res.json({
            success: true,
            message: 'Advanced test suite started',
            note: 'Tests are running in background. Check logs for results.',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error running advanced tests:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// INTELLIGENT AGENT API ENDPOINTS
// ========================================

/**
 * POST /api/ai/analyze-intent
 * Analyze command intent using intelligent analyzer
 */
router.post('/analyze-intent', async (req, res) => {
    try {
        const { userInput, clientInfo } = req.body;
        
        console.log('[AI API] Analyzing command intent:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'User input is required'
            });
        }
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for intelligent analysis'
            });
        }
        
        const analysis = await ollamaAIProcessor.analyzeCommandIntent(userInput, clientInfo || {});
        
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error analyzing intent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/generate-strategies
 * Generate fallback strategies based on analysis
 */
router.post('/generate-strategies', async (req, res) => {
    try {
        const { analysis } = req.body;
        
        console.log('[AI API] Generating strategies for intent:', analysis?.intent);
        
        if (!analysis) {
            return res.status(400).json({
                success: false,
                error: 'Analysis object is required'
            });
        }
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for strategy generation'
            });
        }
        
        const strategies = await ollamaAIProcessor.generateFallbackStrategies(analysis);
        
        res.json({
            success: true,
            data: {
                strategies: strategies,
                count: strategies.length,
                analysis: analysis
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error generating strategies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/research-solution
 * Research solution using AI and web resources
 */
router.post('/research-solution', async (req, res) => {
    try {
        const { problem, failedAttempts = [] } = req.body;
        
        console.log('[AI API] Researching solution for:', problem);
        
        if (!problem) {
            return res.status(400).json({
                success: false,
                error: 'Problem description is required'
            });
        }
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for research'
            });
        }
        
        const researchResult = await ollamaAIProcessor.researchSolution(problem, failedAttempts);
        
        res.json({
            success: true,
            data: researchResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error researching solution:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/intelligent-agent-stats
 * Get intelligent agent statistics
 */
router.get('/intelligent-agent-stats', async (req, res) => {
    try {
        console.log('[AI API] Getting intelligent agent statistics');
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for intelligent agent statistics'
            });
        }
        
        const stats = ollamaAIProcessor.getIntelligentAgentStatistics();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error getting intelligent agent statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/adapt-strategy
 * Adapt strategy based on error context
 */
router.post('/adapt-strategy', async (req, res) => {
    try {
        const { currentStrategy, errorContext } = req.body;
        
        console.log('[AI API] Adapting strategy based on error:', errorContext?.category);
        
        if (!currentStrategy || !errorContext) {
            return res.status(400).json({
                success: false,
                error: 'Current strategy and error context are required'
            });
        }
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for strategy adaptation'
            });
        }
        
        const adaptedStrategy = await ollamaAIProcessor.adaptStrategy(currentStrategy, errorContext);
        
        res.json({
            success: true,
            data: {
                originalStrategy: currentStrategy,
                adaptedStrategy: adaptedStrategy,
                errorContext: errorContext
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error adapting strategy:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/privilege-status
 * Check current system privileges
 */
router.get('/privilege-status', async (req, res) => {
    try {
        console.log('[AI API] Checking privilege status');
        
        // This would integrate with the privilege detector service
        // For now, return a placeholder
        const privilegeStatus = {
            isAdmin: false,
            canInstallSilently: false,
            canModifySystem: false,
            uacEnabled: true,
            pythonInstalled: false,
            canInstallPython: false
        };
        
        res.json({
            success: true,
            data: privilegeStatus,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error checking privilege status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/execute-intelligent
 * Execute command with full intelligent agent system
 */
router.post('/execute-intelligent', async (req, res) => {
    try {
        const { userInput, clientInfo, options = {} } = req.body;
        
        console.log('[AI API] Executing with intelligent agent:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'User input is required'
            });
        }
        
        if (!isOllamaAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Ollama is not available for intelligent execution'
            });
        }
        
        const result = await ollamaAIProcessor.executeWithIntelligentFallback(
            userInput,
            clientInfo || {}
        );
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error executing with intelligent agent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
